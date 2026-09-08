package com.nh.canvas.project;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.nh.canvas.auth.AuthenticatedUser;
import com.nh.canvas.common.error.ApiException;
import com.nh.canvas.common.error.ErrorCode;
import java.time.OffsetDateTime;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.jdbc.JdbcTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

/**
 * 인가 단일 지점의 회귀 방지 (SECURITY_CHECKLIST 3절 A01 · FR-01).
 *
 * <p><b>왜 진짜 PostgreSQL 위에서 도는가</b>: 이 클래스에서 실제로 위험한 것은 역할 비교가 아니라
 * <b>리소스 → 프로젝트 역추적 SQL 이 틀리는 것</b>이다. 예를 들어 {@code requireForExport} 의
 * {@code exports → versions} 조인이 어긋나면 남의 프로젝트 Export 가 통과한다. JdbcClient 를
 * 대역으로 두면 SQL 이 실행되지 않아 그 어긋남을 잡지 못한다. 그래서 운영과 같은 스키마
 * (V1__init.sql 을 Flyway 가 그대로 적용)를 띄우고 그 위에서 검증한다.
 *
 * <p>{@code dave} 는 <b>다른 프로젝트의 정상 멤버</b>다. 인증은 통과하고 인가만 막혀야 하는
 * 사람이라, IDOR 이 뚫렸는지 확인하는 데 쓴다. 아무 데도 속하지 않은 사람으로는 같은 것을
 * 확인할 수 없다.
 */
@JdbcTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Import(ProjectAccessGuard.class)
@Testcontainers
class ProjectAccessGuardTest {

    @Container
    @ServiceConnection
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:17-alpine");

    @Autowired JdbcClient db;

    @Autowired ProjectAccessGuard guard;

    private AuthenticatedUser alice; // 프로젝트 A 의 OWNER
    private AuthenticatedUser bob; // 프로젝트 A 의 EDITOR
    private AuthenticatedUser carol; // 프로젝트 A 의 VIEWER
    private AuthenticatedUser dave; // 프로젝트 B 의 OWNER — A 에는 아무 권한이 없다

    private UUID projectA;
    private UUID deletedProject;
    private UUID versionA;
    private UUID screenA;
    private UUID fileA;
    private UUID deletedFile;
    private UUID commentA;
    private UUID deletedComment;
    private UUID jobA;
    private UUID exportA;

    @BeforeEach
    void setUp() {
        alice = insertUser("alice");
        bob = insertUser("bob");
        carol = insertUser("carol");
        dave = insertUser("dave");

        projectA = insertProject("A", "ACTIVE", alice);
        UUID projectB = insertProject("B", "ACTIVE", dave);
        deletedProject = insertProject("삭제됨", "DELETED", alice);

        insertMember(projectA, alice, ProjectRole.OWNER);
        insertMember(projectA, bob, ProjectRole.EDITOR);
        insertMember(projectA, carol, ProjectRole.VIEWER);
        insertMember(projectB, dave, ProjectRole.OWNER);
        insertMember(deletedProject, alice, ProjectRole.OWNER);

        versionA = insertVersion(projectA, alice);
        screenA = insertScreen(versionA);
        fileA = insertFile(projectA, alice);
        deletedFile = softDelete("files", insertFile(projectA, alice));
        commentA = insertComment(projectA, alice);
        deletedComment = softDelete("comments", insertComment(projectA, alice));
        jobA = insertJob(projectA, alice);
        exportA = insertExport(versionA, alice);
    }

    // --- require(projectId, ...) --------------------------------------------------------------

    @Test
    @DisplayName("없는 프로젝트는 404 다")
    void should_reject_as_not_found_when_project_absent() {
        assertRejectedWith(() -> guard.require(UUID.randomUUID(), alice, ProjectRole.VIEWER))
                .isEqualTo(ErrorCode.NOT_FOUND);
    }

    @Test
    @DisplayName("삭제된 프로젝트는 OWNER 에게도 404 다")
    void should_reject_as_not_found_when_project_deleted() {
        assertRejectedWith(() -> guard.require(deletedProject, alice, ProjectRole.VIEWER))
                .isEqualTo(ErrorCode.NOT_FOUND);
    }

    @Test
    @DisplayName("다른 프로젝트의 멤버는 403 이다")
    void should_reject_as_forbidden_when_not_a_member() {
        assertRejectedWith(() -> guard.require(projectA, dave, ProjectRole.VIEWER))
                .isEqualTo(ErrorCode.FORBIDDEN);
    }

    @Test
    @DisplayName("뷰어는 편집 권한을 요구하는 작업에서 막힌다")
    void should_reject_when_role_below_minimum() {
        assertRejectedWith(() -> guard.require(projectA, carol, ProjectRole.EDITOR))
                .isEqualTo(ErrorCode.FORBIDDEN);
    }

    @Test
    @DisplayName("통과하면 요구한 최소 단계가 아니라 실제 보유 역할을 돌려준다")
    void should_return_actual_role_when_allowed() {
        assertThat(guard.require(projectA, bob, ProjectRole.REVIEWER)).isEqualTo(ProjectRole.EDITOR);
    }

    @Test
    @DisplayName("소유자는 소유자 권한을 요구하는 작업을 통과한다")
    void should_allow_when_owner_asked_for_owner() {
        assertThat(guard.require(projectA, alice, ProjectRole.OWNER)).isEqualTo(ProjectRole.OWNER);
    }

    // --- requireForVersion --------------------------------------------------------------------

    @Test
    @DisplayName("Version: 다른 프로젝트 멤버는 막힌다")
    void should_reject_version_when_from_another_project() {
        assertRejectedWith(() -> guard.requireForVersion(versionA, dave, ProjectRole.VIEWER))
                .isEqualTo(ErrorCode.FORBIDDEN);
    }

    @Test
    @DisplayName("Version: 없는 id 는 404 다")
    void should_reject_version_when_absent() {
        assertRejectedWith(() -> guard.requireForVersion(UUID.randomUUID(), alice, ProjectRole.VIEWER))
                .isEqualTo(ErrorCode.NOT_FOUND);
    }

    @Test
    @DisplayName("Version: 소속 프로젝트를 정확히 돌려준다")
    void should_resolve_project_when_version_allowed() {
        assertThat(guard.requireForVersion(versionA, bob, ProjectRole.EDITOR)).isEqualTo(projectA);
    }

    // --- requireForScreen ---------------------------------------------------------------------

    @Test
    @DisplayName("Screen: 다른 프로젝트 멤버는 막힌다 — screens→versions 조인")
    void should_reject_screen_when_from_another_project() {
        assertRejectedWith(() -> guard.requireForScreen(screenA, dave, ProjectRole.VIEWER))
                .isEqualTo(ErrorCode.FORBIDDEN);
    }

    @Test
    @DisplayName("Screen: 두 단계를 거슬러 소속 프로젝트를 돌려준다")
    void should_resolve_project_when_screen_allowed() {
        assertThat(guard.requireForScreen(screenA, carol, ProjectRole.VIEWER)).isEqualTo(projectA);
    }

    // --- requireForFile -----------------------------------------------------------------------

    @Test
    @DisplayName("File: 다른 프로젝트 멤버는 막힌다")
    void should_reject_file_when_from_another_project() {
        assertRejectedWith(() -> guard.requireForFile(fileA, dave, ProjectRole.VIEWER))
                .isEqualTo(ErrorCode.FORBIDDEN);
    }

    @Test
    @DisplayName("File: 삭제된 파일은 멤버에게도 404 다")
    void should_reject_file_when_soft_deleted() {
        assertRejectedWith(() -> guard.requireForFile(deletedFile, alice, ProjectRole.VIEWER))
                .isEqualTo(ErrorCode.NOT_FOUND);
    }

    @Test
    @DisplayName("File: 소속 프로젝트를 정확히 돌려준다")
    void should_resolve_project_when_file_allowed() {
        assertThat(guard.requireForFile(fileA, carol, ProjectRole.VIEWER)).isEqualTo(projectA);
    }

    // --- requireForComment --------------------------------------------------------------------

    @Test
    @DisplayName("Comment: 다른 프로젝트 멤버는 막힌다")
    void should_reject_comment_when_from_another_project() {
        assertRejectedWith(() -> guard.requireForComment(commentA, dave, ProjectRole.VIEWER))
                .isEqualTo(ErrorCode.FORBIDDEN);
    }

    @Test
    @DisplayName("Comment: 삭제된 의견은 404 다")
    void should_reject_comment_when_soft_deleted() {
        assertRejectedWith(() -> guard.requireForComment(deletedComment, alice, ProjectRole.VIEWER))
                .isEqualTo(ErrorCode.NOT_FOUND);
    }

    // --- requireForJob ------------------------------------------------------------------------

    @Test
    @DisplayName("AI Job: 다른 프로젝트 멤버는 막힌다")
    void should_reject_job_when_from_another_project() {
        assertRejectedWith(() -> guard.requireForJob(jobA, dave, ProjectRole.VIEWER))
                .isEqualTo(ErrorCode.FORBIDDEN);
    }

    @Test
    @DisplayName("AI Job: 소속 프로젝트를 정확히 돌려준다")
    void should_resolve_project_when_job_allowed() {
        assertThat(guard.requireForJob(jobA, bob, ProjectRole.EDITOR)).isEqualTo(projectA);
    }

    // --- requireForExport ---------------------------------------------------------------------

    @Test
    @DisplayName("Export: 다른 프로젝트 멤버는 막힌다 — exports→versions 조인")
    void should_reject_export_when_from_another_project() {
        assertRejectedWith(() -> guard.requireForExport(exportA, dave, ProjectRole.VIEWER))
                .isEqualTo(ErrorCode.FORBIDDEN);
    }

    @Test
    @DisplayName("Export: 두 단계를 거슬러 소속 프로젝트를 돌려준다")
    void should_resolve_project_when_export_allowed() {
        assertThat(guard.requireForExport(exportA, bob, ProjectRole.EDITOR)).isEqualTo(projectA);
    }

    // --- helpers ------------------------------------------------------------------------------

    /** 거부는 언제나 ApiException 이어야 하고, 그 안의 ErrorCode 로 404/403 이 갈린다. */
    private static org.assertj.core.api.AbstractObjectAssert<?, ?> assertRejectedWith(
            org.junit.jupiter.api.function.Executable call) {
        return assertThatThrownBy(call::execute)
                .isInstanceOf(ApiException.class)
                .extracting(thrown -> ((ApiException) thrown).code());
    }

    private AuthenticatedUser insertUser(String loginId) {
        UUID id = UUID.randomUUID();
        db.sql("INSERT INTO users (id, sso_subject, login_id, name) VALUES (?, ?, ?, ?)")
                .params(id, "sso-" + loginId, loginId, loginId)
                .update();
        return new AuthenticatedUser(id, loginId, loginId, "테스트부", loginId + "@example.com");
    }

    private UUID insertProject(String name, String status, AuthenticatedUser createdBy) {
        UUID id = UUID.randomUUID();
        db.sql("INSERT INTO projects (id, name, status, created_by) VALUES (?, ?, ?, ?)")
                .params(id, name, status, createdBy.id())
                .update();
        return id;
    }

    private void insertMember(UUID projectId, AuthenticatedUser user, ProjectRole role) {
        db.sql("INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)")
                .params(projectId, user.id(), role.name())
                .update();
    }

    private UUID insertVersion(UUID projectId, AuthenticatedUser createdBy) {
        UUID id = UUID.randomUUID();
        db.sql(
                        """
                        INSERT INTO versions (id, project_id, version_no, source_type, created_by)
                        VALUES (?, ?, 1, 'AI_GENERATION', ?)
                        """)
                .params(id, projectId, createdBy.id())
                .update();
        return id;
    }

    private UUID insertScreen(UUID versionId) {
        UUID id = UUID.randomUUID();
        db.sql("INSERT INTO screens (id, version_id, screen_key, name) VALUES (?, ?, 'S01', '첫 화면')")
                .params(id, versionId)
                .update();
        return id;
    }

    private UUID insertFile(UUID projectId, AuthenticatedUser uploadedBy) {
        UUID id = UUID.randomUUID();
        db.sql(
                        """
                        INSERT INTO files (id, project_id, original_name, content_type, byte_size,
                                           checksum_sha256, storage_key, uploaded_by)
                        VALUES (?, ?, '참고.pdf', 'application/pdf', 1, 'sha', ?, ?)
                        """)
                .params(id, projectId, "key/" + id, uploadedBy.id())
                .update();
        return id;
    }

    private UUID insertComment(UUID projectId, AuthenticatedUser author) {
        UUID id = UUID.randomUUID();
        db.sql(
                        """
                        INSERT INTO comments (id, project_id, body, author_id)
                        VALUES (?, ?, '의견', ?)
                        """)
                .params(id, projectId, author.id())
                .update();
        return id;
    }

    private UUID insertJob(UUID projectId, AuthenticatedUser requestedBy) {
        UUID id = UUID.randomUUID();
        db.sql(
                        """
                        INSERT INTO ai_jobs (id, project_id, job_type, request_payload, requested_by)
                        VALUES (?, ?, 'DOC_DRAFT', CAST('{}' AS JSONB), ?)
                        """)
                .params(id, projectId, requestedBy.id())
                .update();
        return id;
    }

    private UUID insertExport(UUID versionId, AuthenticatedUser requestedBy) {
        UUID id = UUID.randomUUID();
        db.sql("INSERT INTO exports (id, version_id, format, requested_by) VALUES (?, ?, 'ZIP', ?)")
                .params(id, versionId, requestedBy.id())
                .update();
        return id;
    }

    /** 소프트 삭제는 INSERT 후에 세운다. 타입 없는 null 을 바인딩하지 않기 위해서다. */
    private UUID softDelete(String table, UUID id) {
        db.sql("UPDATE " + table + " SET deleted_at = ? WHERE id = ?")
                .params(OffsetDateTime.now(), id)
                .update();
        return id;
    }
}

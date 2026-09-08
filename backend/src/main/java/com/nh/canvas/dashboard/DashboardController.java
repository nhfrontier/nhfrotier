package com.nh.canvas.dashboard;

import com.nh.canvas.auth.AuthenticatedUser;
import com.nh.canvas.auth.CurrentUser;
import com.nh.canvas.project.ProjectRepository;
import com.nh.canvas.project.ProjectRepository.ProjectSummaryRow;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * S01 대시보드 (05_API_DB_SPEC 2절).
 *
 * <p>화면 하나에 API 를 여러 번 부르지 않도록 <b>한 번의 호출로 집계를 모두 돌려준다.</b>
 * 프론트가 카드마다 따로 부르면 화면 진입이 그만큼 느려진다.
 */
@RestController
@RequestMapping("/api/v1")
public class DashboardController {

    private static final int RECENT_LIMIT = 5;

    private final JdbcClient db;
    private final ProjectRepository projects;

    public DashboardController(JdbcClient db, ProjectRepository projects) {
        this.db = db;
        this.projects = projects;
    }

    public record PendingReviewRow(UUID versionId, UUID projectId, String projectName,
                                   int versionNo, long openFindingCount) {}

    public record RecentVersionRow(UUID id, UUID projectId, String projectName, int versionNo,
                                   String summary, String status, Instant createdAt) {}

    public record RecentActivityRow(UUID id, UUID projectId, String projectName, String actorType,
                                    String actorName, String actionType, String targetType,
                                    Instant createdAt) {}

    public record MyJobRow(UUID id, UUID projectId, String projectName, String jobType,
                           String status, Instant createdAt) {}

    public record Dashboard(List<ProjectSummaryRow> recentProjects, List<MyJobRow> myJobs,
                            List<PendingReviewRow> pendingReviews, List<RecentVersionRow> recentVersions,
                            List<RecentActivityRow> recentActivity) {}

    @GetMapping("/dashboard")
    public Dashboard get(@CurrentUser AuthenticatedUser user) {
        return new Dashboard(
                projects.recentForUser(user.id(), RECENT_LIMIT),
                myJobs(user.id()),
                pendingReviews(user.id()),
                recentVersions(user.id()),
                recentActivity(user.id()));
    }

    private List<MyJobRow> myJobs(UUID userId) {
        return db.sql("""
                SELECT j.id, j.project_id, p.name AS project_name, j.job_type, j.status, j.created_at
                  FROM ai_jobs j
                  JOIN projects p ON p.id = j.project_id
                 WHERE j.requested_by = ?
                 ORDER BY j.created_at DESC
                 LIMIT ?
                """)
                .params(userId, RECENT_LIMIT)
                .query(MyJobRow.class)
                .list();
    }

    /** 내가 멤버인 프로젝트에서 아직 결정되지 않은 지적이 남은 Version. */
    private List<PendingReviewRow> pendingReviews(UUID userId) {
        return db.sql("""
                SELECT v.id AS version_id, v.project_id, p.name AS project_name, v.version_no,
                       (
                         (SELECT count(*) FROM responsibility_findings rf
                            JOIN responsibility_reviews rr ON rr.id = rf.review_id
                           WHERE rr.version_id = v.id AND rf.decision IS NULL)
                       + (SELECT count(*) FROM usability_findings uf
                            JOIN usability_reviews ur ON ur.id = uf.review_id
                           WHERE ur.version_id = v.id AND uf.decision IS NULL)
                       ) AS open_finding_count
                  FROM versions v
                  JOIN projects p ON p.id = v.project_id
                  JOIN project_members m ON m.project_id = v.project_id AND m.user_id = ?
                 WHERE p.status <> 'DELETED'
                 ORDER BY open_finding_count DESC, v.created_at DESC
                 LIMIT ?
                """)
                .params(userId, RECENT_LIMIT)
                .query(PendingReviewRow.class)
                .list()
                .stream()
                .filter(row -> row.openFindingCount() > 0)
                .toList();
    }

    private List<RecentVersionRow> recentVersions(UUID userId) {
        return db.sql("""
                SELECT v.id, v.project_id, p.name AS project_name, v.version_no, v.summary,
                       v.status, v.created_at
                  FROM versions v
                  JOIN projects p ON p.id = v.project_id
                  JOIN project_members m ON m.project_id = v.project_id AND m.user_id = ?
                 WHERE p.status <> 'DELETED'
                 ORDER BY v.created_at DESC
                 LIMIT ?
                """)
                .params(userId, RECENT_LIMIT)
                .query(RecentVersionRow.class)
                .list();
    }

    private List<RecentActivityRow> recentActivity(UUID userId) {
        return db.sql("""
                SELECT h.id, h.project_id, p.name AS project_name, h.actor_type,
                       u.name AS actor_name, h.action_type, h.target_type, h.created_at
                  FROM history_events h
                  JOIN projects p ON p.id = h.project_id
                  JOIN project_members m ON m.project_id = h.project_id AND m.user_id = ?
                  LEFT JOIN users u ON u.id = h.actor_id
                 WHERE p.status <> 'DELETED'
                 ORDER BY h.created_at DESC
                 LIMIT ?
                """)
                .params(userId, RECENT_LIMIT * 2)
                .query(RecentActivityRow.class)
                .list();
    }
}

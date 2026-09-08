package com.nh.canvas.project;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class ProjectRoleTest {

    @Test
    @DisplayName("상위 단계는 하위 단계를 포함한다")
    void should_include_lower_roles_when_higher() {
        assertThat(ProjectRole.OWNER.atLeast(ProjectRole.EDITOR)).isTrue();
        assertThat(ProjectRole.EDITOR.atLeast(ProjectRole.REVIEWER)).isTrue();
        assertThat(ProjectRole.REVIEWER.atLeast(ProjectRole.VIEWER)).isTrue();
    }

    @Test
    @DisplayName("검토자는 반영 결정 권한을 갖지 않는다 — FR-08 이 전제하는 구분이다")
    void should_reject_when_reviewer_asked_for_editor() {
        assertThat(ProjectRole.REVIEWER.atLeast(ProjectRole.EDITOR)).isFalse();
    }

    @Test
    @DisplayName("뷰어는 의견도 남기지 못한다")
    void should_reject_when_viewer_asked_for_reviewer() {
        assertThat(ProjectRole.VIEWER.atLeast(ProjectRole.REVIEWER)).isFalse();
    }

    @Test
    @DisplayName("편집자는 멤버를 관리하지 못한다")
    void should_reject_when_editor_asked_for_owner() {
        assertThat(ProjectRole.EDITOR.atLeast(ProjectRole.OWNER)).isFalse();
    }
}

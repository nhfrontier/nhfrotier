package com.nh.canvas.project;

/**
 * 프로젝트 권한 (08_DECISIONS 1절, 2026-09-08 확정 · FR-01 2절).
 *
 * <p>상위 단계는 하위 단계를 포함한다. 판정은 항상 "이 작업에 필요한 최소 단계 이상인가"로 한다.
 *
 * <ul>
 *   <li>{@code VIEWER}   읽기 · 다운로드
 *   <li>{@code REVIEWER} + 의견 등록 · 검토 요청
 *   <li>{@code EDITOR}   + AI 생성 · 편집 · 반영 결정 · Export
 *   <li>{@code OWNER}    + 프로젝트 설정 · 멤버 관리 · 삭제
 * </ul>
 */
public enum ProjectRole {

    VIEWER(1),
    REVIEWER(2),
    EDITOR(3),
    OWNER(4);

    private final int rank;

    ProjectRole(int rank) {
        this.rank = rank;
    }

    public boolean atLeast(ProjectRole required) {
        return this.rank >= required.rank;
    }
}

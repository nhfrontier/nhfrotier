package com.nh.canvas.ai;

import com.nh.canvas.ai.AiJobRepository.JobRow;

/**
 * Job 종류별 처리기. {@code job_type} 하나에 구현체 하나가 대응한다.
 *
 * <p>워커는 종류를 몰라도 되고, 새 산출물 유형을 추가할 때 워커를 고치지 않는다
 * (05_API_DB_SPEC 8절 — 새 테이블·엔드포인트 대신 구분 필드로 확장한다).
 */
public interface AiJobHandler {

    String jobType();

    /**
     * @return 사용한 모델 식별자. 사용량 메타데이터로 Job 에 남는다
     */
    String handle(JobRow job);
}

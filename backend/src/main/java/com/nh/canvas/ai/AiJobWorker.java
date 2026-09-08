package com.nh.canvas.ai;

import com.nh.canvas.ai.AiJobRepository.JobRow;
import com.nh.canvas.common.error.ApiException;
import com.nh.canvas.common.error.ErrorCode;
import com.nh.canvas.history.HistoryRecorder;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Async Worker (ARCHITECTURE 4절 · 04_SYSTEM_ARCHITECTURE 3절).
 *
 * <p>Redis 를 쓰지 않는다. Redis 의 운영 용도가 미결이고, 초기 규모에서는 DB 테이블 자체가
 * 큐로 충분하다 — {@code claimNext()} 가 {@code FOR UPDATE SKIP LOCKED} 로 소유권을 정하므로
 * 컨테이너를 늘려도 한 Job 이 두 번 실행되지 않는다. 큐를 밖으로 뺄 필요가 생기면
 * 이 클래스만 바꾸면 된다.
 */
@Component
@ConditionalOnProperty(name = "canvas.worker.enabled", havingValue = "true", matchIfMissing = true)
public class AiJobWorker {

    private static final Logger log = LoggerFactory.getLogger(AiJobWorker.class);

    private final AiJobRepository jobs;
    private final HistoryRecorder history;
    private final Map<String, AiJobHandler> handlers;

    public AiJobWorker(AiJobRepository jobs, HistoryRecorder history, List<AiJobHandler> handlers) {
        this.jobs = jobs;
        this.history = history;
        this.handlers = handlers.stream()
                .collect(Collectors.toMap(AiJobHandler::jobType, Function.identity()));
        log.info("AI Job 워커 기동. 처리 가능한 job_type={}", this.handlers.keySet());
    }

    @Scheduled(fixedDelayString = "${canvas.worker.poll-interval-ms:2000}")
    public void pollOnce() {
        Optional<JobRow> claimed;
        try {
            claimed = jobs.claimNext();
        } catch (RuntimeException ex) {
            // DB 장애로 폴링이 죽으면 이후 Job 이 영영 처리되지 않는다. 다음 주기에 다시 시도한다
            log.warn("Job 큐 조회 실패", ex);
            return;
        }
        claimed.ifPresent(this::process);
    }

    private void process(JobRow job) {
        AiJobHandler handler = handlers.get(job.jobType());
        if (handler == null) {
            jobs.markFailed(job.id(), ErrorCode.RULE_VIOLATION.name(),
                    "처리기가 없는 작업 종류입니다: " + job.jobType());
            return;
        }
        try {
            String model = handler.handle(job);
            jobs.markCompleted(job.id(), model);
            history.ai(job.projectId(), "AI_JOB_COMPLETED", "AI_JOB", job.id(),
                    Map.of("jobType", job.jobType(), "model", model == null ? "" : model));
        } catch (ApiException ex) {
            fail(job, ex.code(), ex.getMessage(), ex);
        } catch (RuntimeException ex) {
            fail(job, ErrorCode.INTERNAL_ERROR, ErrorCode.INTERNAL_ERROR.defaultMessage(), ex);
        }
    }

    /**
     * 실패해도 Job 행은 남는다. 상태가 남아야 재시도와 감사가 가능하다는 것이
     * Job 리소스를 둔 이유다.
     */
    private void fail(JobRow job, ErrorCode code, String message, Exception cause) {
        log.warn("AI Job 실패 jobId={} type={} code={}", job.id(), job.jobType(), code, cause);
        jobs.markFailed(job.id(), code.name(), message);
        history.system(job.projectId(), "AI_JOB_FAILED", "AI_JOB", job.id(),
                Map.of("jobType", job.jobType(), "code", code.name()));
    }
}

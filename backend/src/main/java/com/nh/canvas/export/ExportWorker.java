package com.nh.canvas.export;

import com.nh.canvas.export.ExportRepository.ExportRow;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Export 변환 워커. AI Job 워커와 같은 방식으로 큐를 돈다.
 *
 * <p>따로 둔 이유는 Export 가 LLM 을 부르지 않기 때문이다 — LLM 장애로 AI Job 이 막혀도
 * 이미 만들어진 결과물의 반출은 계속돼야 한다 (DEPLOYMENT 6절 장애 대응 우선순위).
 */
@Component
@ConditionalOnProperty(name = "canvas.worker.enabled", havingValue = "true", matchIfMissing = true)
public class ExportWorker {

    private static final Logger log = LoggerFactory.getLogger(ExportWorker.class);

    private final ExportRepository exports;
    private final ExportService service;

    public ExportWorker(ExportRepository exports, ExportService service) {
        this.exports = exports;
        this.service = service;
    }

    @Scheduled(fixedDelayString = "${canvas.worker.poll-interval-ms:2000}")
    public void pollOnce() {
        Optional<ExportRow> claimed;
        try {
            claimed = exports.claimNext();
        } catch (RuntimeException ex) {
            log.warn("Export 큐 조회 실패", ex);
            return;
        }
        claimed.ifPresent(this::process);
    }

    private void process(ExportRow export) {
        try {
            service.process(export);
        } catch (RuntimeException ex) {
            log.warn("Export 실패 exportId={}", export.id(), ex);
            exports.markFailed(export.id(), "반출 처리 중 오류가 발생했습니다.");
        }
    }
}

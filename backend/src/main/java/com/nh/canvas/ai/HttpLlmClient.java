package com.nh.canvas.ai;

import com.nh.canvas.common.Json;
import com.nh.canvas.common.error.ApiException;
import com.nh.canvas.common.error.ErrorCode;
import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.net.http.HttpTimeoutException;
import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

/**
 * 승인 LLM API Gateway 호출 구현.
 *
 * <p><b>행내 Gateway 의 요청·응답 형식이 미결이라 이 클래스가 그 유일한 적응 지점이다</b>
 * (08_DECISIONS 2절 AI). 형식이 확정되면 {@link #buildBody}·{@link #extractText} 두 곳만 고친다.
 *
 * <p>오류는 여기서 {@link ErrorCode} 로 정규화한다. LLM 별 상이한 오류 형식을 도메인 계층까지
 * 흘려보내지 않기 위한 것이다 (ARCHITECTURE 9절).
 */
@Component
@ConditionalOnProperty(name = "canvas.llm.enabled", havingValue = "true")
public class HttpLlmClient implements LlmClient {

    private static final Logger log = LoggerFactory.getLogger(HttpLlmClient.class);

    private final LlmProperties properties;
    private final Json json;
    private final HttpClient http;

    public HttpLlmClient(LlmProperties properties, Json json) {
        if (properties.getEndpoint().isBlank()) {
            throw new IllegalStateException("canvas.llm.enabled=true 인데 LLM_API_ENDPOINT 가 비어 있습니다.");
        }
        this.properties = properties;
        this.json = json;
        this.http = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();
        log.info("LLM 연계 활성화: {}", properties);
    }

    @Override
    public LlmResponse complete(LlmRequest request) {
        int inputSize = request.systemPrompt().length() + request.userPrompt().length();
        if (inputSize > properties.getMaxInputChars()) {
            // 잘라내면 잘린 뒷부분의 문제를 못 봐서 결과가 조용히 틀린다. 거절이 낫다
            throw new ApiException(ErrorCode.PAYLOAD_TOO_LARGE,
                    "AI 입력이 허용 크기를 초과했습니다. 대상 범위를 줄여 주세요.");
        }

        HttpRequest httpRequest = HttpRequest.newBuilder(URI.create(properties.getEndpoint()))
                .timeout(Duration.ofSeconds(properties.getTimeoutSeconds()))
                .header("Content-Type", "application/json")
                .header("Authorization", "Bearer " + properties.getCredential())
                .POST(HttpRequest.BodyPublishers.ofString(json.write(buildBody(request))))
                .build();

        try {
            HttpResponse<String> response = http.send(httpRequest, HttpResponse.BodyHandlers.ofString());
            return handle(response);
        } catch (HttpTimeoutException ex) {
            throw new ApiException(ErrorCode.LLM_TIMEOUT, ErrorCode.LLM_TIMEOUT.defaultMessage(), ex);
        } catch (IOException ex) {
            throw new ApiException(ErrorCode.LLM_ERROR, ErrorCode.LLM_ERROR.defaultMessage(), ex);
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            throw new ApiException(ErrorCode.LLM_ERROR, ErrorCode.LLM_ERROR.defaultMessage(), ex);
        }
    }

    private Map<String, Object> buildBody(LlmRequest request) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("model", properties.getModel());
        body.put("system", request.systemPrompt());
        body.put("input", request.userPrompt());
        body.put("max_output_tokens", request.maxOutputTokens());
        return body;
    }

    private LlmResponse handle(HttpResponse<String> response) {
        int status = response.statusCode();
        if (status == 429) {
            throw new ApiException(ErrorCode.AI_RATE_LIMITED);
        }
        if (status == 504 || status == 408) {
            throw new ApiException(ErrorCode.LLM_TIMEOUT);
        }
        if (status >= 400) {
            // 게이트웨이 응답 본문에는 내부 경로·모델 정보가 섞여 있다. 로그에만 남긴다
            log.warn("LLM 호출 실패 status={} body={}", status, truncate(response.body()));
            throw new ApiException(ErrorCode.LLM_ERROR);
        }

        Map<String, Object> parsed = json.readMap(response.body());
        String text = extractText(parsed);
        if (text == null || text.isBlank()) {
            throw new ApiException(ErrorCode.LLM_ERROR, "AI 응답이 비어 있습니다.");
        }
        return new LlmResponse(text,
                String.valueOf(parsed.getOrDefault("model", properties.getModel())),
                asInt(parsed.get("input_tokens")), asInt(parsed.get("output_tokens")));
    }

    private String extractText(Map<String, Object> parsed) {
        Object direct = parsed.get("output_text");
        if (direct instanceof String value) {
            return value;
        }
        Object text = parsed.get("text");
        return text instanceof String value ? value : null;
    }

    private static Integer asInt(Object value) {
        return value instanceof Number number ? number.intValue() : null;
    }

    private static String truncate(String value) {
        if (value == null) {
            return "";
        }
        return value.length() > 500 ? value.substring(0, 500) + "..." : value;
    }
}

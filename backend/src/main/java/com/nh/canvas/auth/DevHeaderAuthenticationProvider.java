package com.nh.canvas.auth;

import jakarta.servlet.http.HttpServletRequest;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

/**
 * 개발용 인증. 요청 헤더의 사용자 식별자를 그대로 믿는다.
 *
 * <p><b>운영에서 쓰면 안 된다.</b> 헤더는 누구나 위조할 수 있어 인증이 아니다.
 * SSO 방식이 확정되기 전까지 도메인·인가 코드를 진행하기 위한 자리채움이며,
 * {@code canvas.auth.provider=dev} 일 때만 등록된다. 기동 시 경고를 남긴다.
 */
@Component
@ConditionalOnProperty(name = "canvas.auth.provider", havingValue = "dev", matchIfMissing = true)
public class DevHeaderAuthenticationProvider implements AuthenticationProvider {

    public static final String HEADER_LOGIN_ID = "X-Dev-Login-Id";
    public static final String HEADER_NAME = "X-Dev-Name";

    private static final Logger log = LoggerFactory.getLogger(DevHeaderAuthenticationProvider.class);

    public DevHeaderAuthenticationProvider() {
        log.warn("개발용 헤더 인증이 활성화되었습니다. 운영 환경에서는 canvas.auth.provider 를 sso 로 두십시오.");
    }

    @Override
    public Optional<SsoPrincipal> resolve(HttpServletRequest request) {
        String loginId = trimToNull(request.getHeader(HEADER_LOGIN_ID));
        if (loginId == null) {
            return Optional.empty();
        }
        String name = Optional.ofNullable(trimToNull(request.getHeader(HEADER_NAME))).orElse(loginId);
        return Optional.of(new SsoPrincipal("dev:" + loginId, loginId, name, null, null));
    }

    private static String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}

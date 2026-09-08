package com.nh.canvas.auth;

import jakarta.servlet.http.HttpServletRequest;
import java.util.Optional;

/**
 * 인증 어댑터. 사내 SSO 연계 방식이 미결이라 구현체를 갈아끼울 수 있게 분리한다
 * (08_DECISIONS 2절 · FR-01).
 *
 * <p>여기서 하는 일은 "이 요청이 누구인가"를 판정하는 것까지다.
 * 계정 생성·조회는 {@link UserDirectory} 가, 권한 판정은 프로젝트 멤버십이 담당한다.
 */
public interface AuthenticationProvider {

    /**
     * @return 인증되지 않은 요청이면 {@link Optional#empty()}
     */
    Optional<SsoPrincipal> resolve(HttpServletRequest request);

    /** SSO 가 알려주는 사용자 정보. {@code subject} 는 재발급되지 않는 불변 식별자여야 한다. */
    record SsoPrincipal(String subject, String loginId, String name, String department, String email) {}
}

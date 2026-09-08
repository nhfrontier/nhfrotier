package com.nh.canvas.auth;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.List;
import java.util.Optional;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * 매 요청마다 세션을 검증한다 (FR-01 2절 · AC-1).
 *
 * <p>인증되지 않은 요청은 도메인 코드에 닿기 전에 401 로 끊는다. 예외는 health probe 뿐이다.
 * 인가(프로젝트 멤버십)는 여기서 하지 않는다 — 리소스를 알아야 판단할 수 있어
 * {@code ProjectAccessGuard} 가 맡는다.
 */
@Component
public class AuthenticationFilter extends OncePerRequestFilter {

    public static final String ATTRIBUTE = "canvas.currentUser";

    private static final List<String> PUBLIC_PATHS = List.of("/actuator/health", "/actuator/info");

    private final AuthenticationProvider provider;
    private final UserDirectory users;

    public AuthenticationFilter(AuthenticationProvider provider, UserDirectory users) {
        this.provider = provider;
        this.users = users;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        return PUBLIC_PATHS.stream().anyMatch(path::startsWith);
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {

        Optional<AuthenticationProvider.SsoPrincipal> principal = provider.resolve(request);
        if (principal.isEmpty()) {
            writeUnauthenticated(response);
            return;
        }

        request.setAttribute(ATTRIBUTE, users.upsert(principal.get()));
        chain.doFilter(request, response);
    }

    private void writeUnauthenticated(HttpServletResponse response) throws IOException {
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType("application/json;charset=UTF-8");
        response.getWriter().write("{\"code\":\"UNAUTHENTICATED\",\"message\":\"인증이 필요합니다.\"}");
    }
}

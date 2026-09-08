package com.nh.canvas.auth;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * FR-01 {@code GET /api/v1/me}.
 *
 * <p>여기서 내려주는 것은 화면 표시에 필요한 신원뿐이다. LLM credential 이나 내부 설정을
 * 응답에 담지 않는다 (SECURITY 7절).
 */
@RestController
@RequestMapping("/api/v1")
public class MeController {

    @GetMapping("/me")
    public AuthenticatedUser me(@CurrentUser AuthenticatedUser user) {
        return user;
    }
}

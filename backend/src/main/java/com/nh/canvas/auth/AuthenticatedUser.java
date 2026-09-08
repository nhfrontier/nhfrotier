package com.nh.canvas.auth;

import java.util.UUID;

/** 인증이 끝난 요청자. 컨트롤러·서비스는 이 값만 보고 동작한다. */
public record AuthenticatedUser(UUID id, String loginId, String name, String department, String email) {}

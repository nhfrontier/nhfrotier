package com.nh.canvas.common.config;

import com.nh.canvas.auth.AuthenticatedUser;
import com.nh.canvas.auth.AuthenticationFilter;
import com.nh.canvas.auth.CurrentUser;
import com.nh.canvas.common.error.ApiException;
import com.nh.canvas.common.error.ErrorCode;
import java.util.List;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.MethodParameter;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.context.request.RequestAttributes;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addArgumentResolvers(List<HandlerMethodArgumentResolver> resolvers) {
        resolvers.add(new CurrentUserArgumentResolver());
    }

    static class CurrentUserArgumentResolver implements HandlerMethodArgumentResolver {

        @Override
        public boolean supportsParameter(MethodParameter parameter) {
            return parameter.hasParameterAnnotation(CurrentUser.class)
                    && AuthenticatedUser.class.isAssignableFrom(parameter.getParameterType());
        }

        @Override
        public Object resolveArgument(MethodParameter parameter, ModelAndViewContainer mav,
                                      NativeWebRequest request, WebDataBinderFactory binderFactory) {
            Object user = request.getAttribute(AuthenticationFilter.ATTRIBUTE, RequestAttributes.SCOPE_REQUEST);
            if (user == null) {
                // 필터가 401 로 끊었어야 하는 경로다. 여기까지 왔다면 필터 설정이 잘못된 것이므로 막는다
                throw new ApiException(ErrorCode.UNAUTHENTICATED);
            }
            return user;
        }
    }
}

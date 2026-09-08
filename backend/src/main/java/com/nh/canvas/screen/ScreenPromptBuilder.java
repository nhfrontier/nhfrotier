package com.nh.canvas.screen;

import com.nh.canvas.auth.AuthenticatedUser;
import com.nh.canvas.responsibility.ResponsibilityRules;
import com.nh.canvas.template.TemplateService;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.stereotype.Component;

/**
 * 화면 생성 프롬프트를 만든다.
 *
 * <p>가드레일은 {@link ResponsibilityRules} 에서 <b>생성</b>한다. 프롬프트에 규칙을 손으로 적으면
 * 규칙을 고쳐도 프롬프트가 따라오지 않아 둘이 어긋난다 (ARCHITECTURE 11절).
 *
 * <p>디자인 토큰은 {@code templates}({@code BRAND_ASSET}) 의 payload 에서 읽는다. 값이 없으면
 * 그 절만 빠지고 생성은 그대로 된다 — 디자인 시스템이 없다고 기능이 멈추지는 않는다.
 */
@Component
public class ScreenPromptBuilder {

    private final ResponsibilityRules rules;
    private final TemplateService templates;

    public ScreenPromptBuilder(ResponsibilityRules rules, TemplateService templates) {
        this.rules = rules;
        this.templates = templates;
    }

    public record ScreenPlanContext(String screenKey, String name, String role, List<String> linksTo) {}

    // ------------------------------------------------------------------ 1단계: 화면 계획

    public String planSystemPrompt(UUID designSystemId, AuthenticatedUser user) {
        return """
                당신은 업무 화면 설계자다.
                전달받은 기획안을 읽고, 사용자가 실제로 거치게 될 화면들의 흐름으로 쪼갠다.

                ## 출력 형식

                아래 형태의 JSON 만 출력한다. 설명 문장을 덧붙이지 않는다.

                {"screens":[{"screenKey":"home","name":"홈","role":"...","linksTo":["account-detail"]}]}

                ## 규칙

                - 화면은 3~6개로 만든다. 억지로 늘리지 말고, 기획안이 한 화면이면 1개로 보고한다.
                - 첫 번째 화면이 진입 화면이다. 사용자가 처음 보는 것을 맨 앞에 둔다.
                - linksTo 에는 반드시 같은 목록 안에 있는 screenKey 만 넣는다.
                - 어디서도 갈 수 없는 고아 화면을 만들지 않는다.
                - screenKey 는 영문 소문자·숫자·하이픈만 쓴다. 한글·공백·대문자 금지.
                - role 에는 그 화면에 무엇이 보여야 하는지를 적는다. 디자인 지시가 아니라 내용을 적는다.

                ## 하지 말 것

                - 기획안에 없는 기능을 지어내지 않는다.
                - 로그인·설정처럼 기획안이 요구하지 않은 곁가지 화면을 끼워 넣지 않는다.
                """ + surfaceHint(designSystemId, user);
    }

    public String planUserPrompt(String proposal) {
        return "아래 기획안을 화면 흐름으로 쪼개어 JSON 으로 출력하라.\n\n## 기획안\n\n" + proposal;
    }

    // ------------------------------------------------------------------ 2단계: 화면 HTML

    public String generateSystemPrompt(List<ScreenPlanContext> allScreens, UUID designSystemId,
                                       AuthenticatedUser user) {
        String list = allScreens.stream()
                .map(screen -> "- `" + screen.screenKey() + "` — " + screen.name())
                .reduce((a, b) -> a + "\n" + b)
                .orElse("- (없음)");

        return """
                당신은 업무 화면 목업을 만드는 UI 디자이너다.
                요청받은 화면 한 장을 완결된 HTML 문서로 만든다.

                ## 출력 형식

                - <html>·<head>·<body> 를 포함한 완전한 HTML 문서만 출력한다. 설명 문장을 덧붙이지 않는다.
                - 스타일은 전부 인라인 style 속성 또는 <head> 의 <style> 로 넣는다. 외부 스타일시트 금지.
                - JavaScript 를 쓰지 않는다. 정적 목업이다.
                - 외부 이미지·폰트·스크립트를 불러오지 않는다. 아이콘이 필요하면 인라인 SVG 나 문자로 대신한다.
                - 한국어 화면이다. 현실적인 더미 데이터를 넣는다.

                ## 화면 이동

                다른 화면으로 가는 버튼·링크·목록 항목에는 data-goto="화면key" 속성을 단다.
                쓸 수 있는 화면key 는 아래가 전부다. 여기 없는 값을 쓰면 그 링크는 버려진다.

                %s

                자기 자신으로 가는 링크는 만들지 않는다.

                ## 요소 이름표 (선택)

                의미가 분명한 주요 요소에는 data-nh-key="primary-cta" 처럼 짧은 영문 이름표를 달아도 좋다.
                협업자가 남긴 메모가 화면을 다시 만들어도 붙어 있게 하는 데 쓰인다.
                data-nh-id 는 직접 달지 않는다. 서버가 부여한다.
                """.formatted(list)
                + designTokenSection(designSystemId, user)
                + "\n## 지켜야 할 것\n\n" + rules.guardrailPrompt();
    }

    public String generateUserPrompt(String proposal, ScreenPlanContext screen,
                                     List<ScreenPlanContext> allScreens) {
        String links = screen.linksTo().isEmpty()
                ? "- (이 화면에서 이동할 곳 없음)"
                : screen.linksTo().stream()
                        .map(key -> "- `" + key + "` (" + nameOf(allScreens, key) + ")")
                        .reduce((a, b) -> a + "\n" + b)
                        .orElse("");

        return """
                ## 전체 기획안

                %s

                ## 지금 만들 화면

                이름: %s
                key: %s
                역할: %s

                이 화면에서 이동할 수 있는 곳:
                %s

                이 화면 한 장의 완전한 HTML 문서를 출력하라.
                """.formatted(proposal, screen.name(), screen.screenKey(), screen.role(), links);
    }

    // ------------------------------------------------------------------ 요소 AI 편집

    public String elementEditSystemPrompt(UUID designSystemId, AuthenticatedUser user) {
        return """
                당신은 화면의 요소 하나를 고치는 UI 디자이너다.

                ## 출력 형식

                - 고친 요소의 HTML 조각만 출력한다. 설명 문장·코드펜스·문서 골격을 붙이지 않는다.
                - 바깥 태그의 종류를 바꾸지 않는다. 안의 내용과 스타일만 고친다.
                - JavaScript·외부 리소스를 쓰지 않는다.
                - data-nh-id 속성은 쓰지 않는다. 서버가 다시 부여한다.
                - data-goto 는 원래 값이 있었다면 유지한다.
                """
                + designTokenSection(designSystemId, user)
                + "\n## 지켜야 할 것\n\n" + rules.guardrailPrompt();
    }

    public String elementEditUserPrompt(String outerHtml, String instruction) {
        return """
                ## 고칠 요소

                %s

                ## 요청

                %s

                고친 요소의 HTML 조각만 출력하라.
                """.formatted(outerHtml, instruction);
    }

    // ------------------------------------------------------------------ 디자인 시스템

    private String designTokenSection(UUID designSystemId, AuthenticatedUser user) {
        Map<String, Object> payload = designSystemPayload(designSystemId, user);
        if (payload.isEmpty()) {
            return "";
        }
        Object tokens = payload.get("tokens");
        if (!(tokens instanceof List<?> list) || list.isEmpty()) {
            return "";
        }
        StringBuilder text = new StringBuilder("\n## 디자인 토큰\n\n아래 값만 쓴다. 임의의 색·간격을 만들지 않는다.\n\n");
        for (Object entry : list) {
            if (entry instanceof Map<?, ?> token) {
                text.append("- ").append(token.get("name")).append(": ").append(token.get("value"));
                Object kind = token.get("kind");
                if (kind != null) {
                    text.append(" (").append(kind).append(')');
                }
                text.append('\n');
            }
        }
        return text.toString();
    }

    /** 모바일 앱(360×780·하단 내비)과 기업 웹(1200px·GNB)은 표면이 다르다 (08_DECISIONS). */
    private String surfaceHint(UUID designSystemId, AuthenticatedUser user) {
        Map<String, Object> payload = designSystemPayload(designSystemId, user);
        Object surface = payload.get("surface");
        if (surface == null) {
            return "";
        }
        return "\n## 표면\n\n만들 화면은 " + surface + " 이다. 그에 맞는 화면 분할을 전제로 쪼갠다.\n";
    }

    private Map<String, Object> designSystemPayload(UUID designSystemId, AuthenticatedUser user) {
        if (designSystemId == null) {
            return Map.of();
        }
        try {
            return templates.get(user, designSystemId).payload();
        } catch (RuntimeException ex) {
            // 디자인 시스템을 못 읽어도 생성은 계속된다. 토큰 절만 빠진다
            return Map.of();
        }
    }

    private String nameOf(List<ScreenPlanContext> screens, String key) {
        return screens.stream()
                .filter(screen -> screen.screenKey().equals(key))
                .findFirst()
                .map(ScreenPlanContext::name)
                .orElse(key);
    }
}

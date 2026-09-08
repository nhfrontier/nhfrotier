package com.nh.canvas.screen;

import com.nh.canvas.common.error.ApiException;
import com.nh.canvas.common.error.ErrorCode;
import com.nh.canvas.screen.EditProtocol.PatchOp;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HexFormat;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Attribute;
import org.jsoup.nodes.Comment;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.nodes.Node;
import org.jsoup.nodes.TextNode;
import org.springframework.stereotype.Component;

/**
 * AI 생성 HTML 을 저장 가능한 형태로 만든다 (SECURITY_CHECKLIST 4절).
 *
 * <p>프로토타입의 {@code lib/canvas/htmlPipeline.ts}(parse5) 를 jsoup 으로 옮긴 것이다.
 * 한 번의 파싱 안에서 <b>정제 → data-goto 검증 → 식별자 부여</b>를 순서대로 수행한다.
 * 순서가 중요하다 — 정제가 먼저 돌아야 제거될 요소에 ID 를 낭비하지 않는다.
 *
 * <p>정규식으로 HTML 을 다루지 않는 이유는 그것이 정제 우회의 고전적 원천이기 때문이다.
 * 정제를 겸하는 파서에서는 <b>스펙 준수가 곧 보안</b>이다.
 *
 * <p>런타임 스크립트는 여기서 주입하지 않는다. 저장본을 script-free 로 유지해야
 * HTML 다운로드가 안전하다.
 */
@Component
public class HtmlPipeline {

    /** 통째로 걷어내는 태그. 내용까지 함께 사라진다. */
    private static final Set<String> DROP_TAGS = Set.of(
            "script", "iframe", "object", "embed", "base", "link", "noscript",
            "template", "applet", "frame", "frameset", "foreignobject");

    /** 값이 URL 로 해석되는 속성. 허용 형태가 아니면 속성을 지운다. */
    private static final Set<String> URL_ATTRS = Set.of(
            "href", "src", "action", "poster", "background", "data", "srcset");

    /** 이름만으로 무조건 지우는 속성. on* 은 따로 처리한다. */
    private static final Set<String> DROP_ATTRS = Set.of(
            "srcdoc", "ping", "formaction", "xlink:href",
            // AI 가 붙인 식별자는 신뢰하지 않는다. 부여 권한은 이 파이프라인에만 있다
            "data-nh-id");

    /** 주소를 지정할 이유가 없는 태그. ID 를 부여하지 않는다. */
    private static final Set<String> NO_ID_TAGS = Set.of(
            "html", "head", "body", "meta", "title", "style", "br", "wbr", "col", "colgroup",
            "source", "track");

    /** data:image/svg+xml 은 허용하지 않는다. SVG 는 스크립트를 운반할 수 있다. */
    private static final Pattern ALLOWED_DATA_IMAGE =
            Pattern.compile("^data:image/(png|jpe?g|gif|webp);base64,", Pattern.CASE_INSENSITIVE);

    private static final Pattern CSS_IMPORT = Pattern.compile("@import[^;]*;?", Pattern.CASE_INSENSITIVE);
    private static final Pattern CSS_EXPRESSION = Pattern.compile("expression\\s*\\(", Pattern.CASE_INSENSITIVE);
    private static final Pattern CSS_JAVASCRIPT = Pattern.compile("javascript\\s*:", Pattern.CASE_INSENSITIVE);
    private static final Pattern CSS_URL =
            Pattern.compile("url\\(\\s*(['\"]?)([^)'\"]*)\\1\\s*\\)", Pattern.CASE_INSENSITIVE);

    /**
     * 선언을 쪼갤 수 있는 문자. baking 은 문자열을 이어 붙이므로
     * {@code red; background-image: url(...)} 같은 값이 선언 둘로 갈라진다.
     */
    private static final Pattern UNSAFE_STYLE_VALUE =
            Pattern.compile("[;{}<>]|url\\s*\\(|expression\\s*\\(|javascript:|@import", Pattern.CASE_INSENSITIVE);

    private static final Pattern NUMERIC_RUN = Pattern.compile("\\d[\\d,.\\s]*");
    private static final Pattern WHITESPACE_RUN = Pattern.compile("\\s+");

    /** 요소를 재생성 이후에도 다시 찾기 위한 지문. {@code screen_elements} 에 그대로 적재된다. */
    public record ElementFingerprint(String nhId, String tag, int docOrder, String pathSig, String textSig) {}

    public record PipelineResult(String html, List<ElementFingerprint> elements, List<String> warnings) {}

    public record FragmentResult(String html, List<String> warnings) {}

    // ------------------------------------------------------------------ 생성 HTML 처리

    /**
     * @param knownScreenKeys {@code data-goto} 가 가리킬 수 있는 화면 key.
     *                        여기 없는 값은 제거한다 — 존재하지 않는 화면을 가리키면
     *                        "눌러도 반응 없는 버튼"이 된다
     */
    public PipelineResult process(String raw, Collection<String> knownScreenKeys) {
        List<String> warnings = new ArrayList<>();
        Document doc = Jsoup.parse(raw == null ? "" : raw);
        doc.outputSettings().prettyPrint(false);

        sanitize(doc, warnings);
        normalizeGoto(doc, knownScreenKeys, warnings);

        List<ElementFingerprint> elements = new ArrayList<>();
        assignIds(doc, elements);

        return new PipelineResult(doc.html(), elements, dedupe(warnings));
    }

    /**
     * AI 가 돌려준 요소 조각을 정제한다. 전체 문서와 같은 규칙을 쓰되 문서 골격을 만들지 않는다.
     * {@code data-nh-id} 는 여기서도 전부 지운다 — 교체된 요소의 식별자는 부모가 다시 붙인다.
     */
    public FragmentResult sanitizeFragment(String raw, Collection<String> knownScreenKeys) {
        List<String> warnings = new ArrayList<>();
        Document fragment = Jsoup.parseBodyFragment(raw == null ? "" : raw);
        fragment.outputSettings().prettyPrint(false);

        sanitize(fragment.body(), warnings);
        normalizeGoto(fragment.body(), knownScreenKeys, warnings);

        return new FragmentResult(fragment.body().html(), dedupe(warnings));
    }

    /** 저장된 화면에서 요소 하나의 outerHTML 을 꺼낸다. AI 에게 "이걸 고쳐라"고 줄 때 쓴다. */
    public String extractOuterHtml(String html, String nhId) {
        Document doc = Jsoup.parse(html);
        doc.outputSettings().prettyPrint(false);
        Element found = findByNhId(doc, nhId);
        return found == null ? null : found.outerHtml();
    }

    // ------------------------------------------------------------------ 편집 반영(baking)

    /**
     * 저장된 화면 HTML 에 편집 패치를 실제로 반영한다.
     *
     * <p>화면에 보이는 것은 프레임이 얹은 결과지만, HTML 다운로드·AI 검토·다음 버전 생성은
     * 서버에서 저장본을 읽는다. 이 함수가 없으면 그쪽은 전부 <b>편집 이전 상태</b>를 본다.
     * 저장본은 그대로 두고 사본만 만든다.
     */
    public FragmentResult applyPatches(String html, List<PatchOp> ops) {
        if (ops.isEmpty()) {
            return new FragmentResult(html, List.of());
        }
        List<String> warnings = new ArrayList<>();
        Document doc = Jsoup.parse(html);
        doc.outputSettings().prettyPrint(false);

        for (PatchOp op : ops) {
            // 교체가 지나가면 그 아래 요소는 사라지므로 매번 새로 찾는다
            Element element = findByNhId(doc, op.nhId());
            if (element == null) {
                warnings.add("편집 대상 요소를 찾지 못해 건너뜀: " + op.nhId());
                continue;
            }
            switch (op) {
                case PatchOp.Text text -> {
                    element.empty();
                    element.appendChild(new TextNode(text.value()));
                }
                case PatchOp.Style style -> applyStyle(element, style, warnings);
                case PatchOp.Attr attr -> {
                    if (EditProtocol.EDITABLE_ATTRS.contains(attr.name())) {
                        element.attr(attr.name(), attr.value());
                    }
                }
                case PatchOp.Replace replace -> replaceWithFragment(element, replace.html(), warnings);
            }
        }
        // 교체 조각의 자손은 식별자가 없다. 붙여 주지 않으면 그 요소들은 다시 고를 수 없고,
        // 편집 요청은 받아 놓고 여기서 조용히 건너뛰게 된다. 걷는 순서가 고정이라 매번 같은 값이 나온다
        assignIds(doc, new ArrayList<>());
        return new FragmentResult(doc.html(), dedupe(warnings));
    }

    private void applyStyle(Element element, PatchOp.Style style, List<String> warnings) {
        if (!EditProtocol.EDITABLE_STYLE_PROPS.contains(style.prop())) {
            return;
        }
        String merged = mergeStyleDeclaration(element.attr("style"), style.prop(), style.value());
        if (merged == null) {
            warnings.add("안전하지 않은 스타일 값이라 반영하지 않음: " + style.prop());
            return;
        }
        element.attr("style", merged);
    }

    /**
     * style 속성 한 줄에 선언 하나를 덮어쓴다.
     *
     * <p>프레임에서는 {@code el.style.setProperty} 를 쓰므로 브라우저가 값을 검사하고
     * 값 하나로 선언을 여러 개 만들 수 없다. baking 은 문자열을 이어 붙이므로 그 보호가 없다.
     * 다운로드한 HTML 은 CSP 밖에서 열리므로, 쪼갤 수 있는 값은 <b>적용하지 않고 버린다.</b>
     */
    private String mergeStyleDeclaration(String existing, String prop, String value) {
        if (value == null || UNSAFE_STYLE_VALUE.matcher(value).find()) {
            return null;
        }
        Map<String, String> declarations = new LinkedHashMap<>();
        for (String part : existing.split(";")) {
            int colon = part.indexOf(':');
            if (colon < 0) {
                continue;
            }
            String key = part.substring(0, colon).trim().toLowerCase();
            if (!key.isEmpty()) {
                declarations.put(key, part.substring(colon + 1).trim());
            }
        }
        declarations.put(prop, value.trim());
        return declarations.entrySet().stream()
                .map(entry -> entry.getKey() + ": " + entry.getValue())
                .reduce((a, b) -> a + "; " + b)
                .orElse("");
    }

    /**
     * 삽입 시점에 이미 정제된 값이지만 다시 통과시킨다.
     * 이 HTML 은 DB 에 있던 값이고, <b>DB 에 무엇이 들어 있든 나가는 것은 정제된 것이어야 한다.</b>
     */
    private void replaceWithFragment(Element element, String html, List<String> warnings) {
        Document fragment = Jsoup.parseBodyFragment(html);
        fragment.outputSettings().prettyPrint(false);
        sanitize(fragment.body(), warnings);

        List<Node> incoming = new ArrayList<>(fragment.body().childNodes());
        if (incoming.isEmpty()) {
            element.remove();
            return;
        }
        // 조각의 첫 요소가 원래 식별자를 잇는다. 그래야 같은 요소에 편집·AI 수정·의견을 이어 갈 수 있다
        Element root = fragment.body().children().first();
        if (root != null) {
            root.attr("data-nh-id", element.attr("data-nh-id"));
        }
        for (Node node : incoming) {
            node.remove();
            element.before(node);
        }
        element.remove();
    }

    // ------------------------------------------------------------------ 내부 단계

    /** 1단계: 신뢰할 수 없는 것을 제거한다. 가장 먼저 돌아야 한다. */
    private void sanitize(Element root, List<String> warnings) {
        for (Node child : new ArrayList<>(root.childNodes())) {
            // 주석은 남길 이유가 없고 조건부 주석이라는 통로만 만든다
            if (child instanceof Comment) {
                child.remove();
                continue;
            }
            if (!(child instanceof Element element)) {
                continue;
            }
            String tag = element.normalName();

            if (DROP_TAGS.contains(tag)) {
                warnings.add("<" + tag + "> 요소를 제거했습니다.");
                element.remove();
                continue;
            }
            // <meta http-equiv="refresh"> 같은 지시는 제거하되 charset meta 는 남긴다
            if ("meta".equals(tag) && element.hasAttr("http-equiv")) {
                warnings.add("<meta http-equiv> 를 제거했습니다.");
                element.remove();
                continue;
            }

            sanitizeAttributes(element, warnings);

            if ("style".equals(tag)) {
                for (Node textNode : new ArrayList<>(element.childNodes())) {
                    if (textNode instanceof org.jsoup.nodes.DataNode data) {
                        data.setWholeData(sanitizeCss(data.getWholeData(), warnings));
                    } else if (textNode instanceof TextNode text) {
                        text.text(sanitizeCss(text.getWholeText(), warnings));
                    }
                }
            }

            sanitize(element, warnings);
        }
    }

    private void sanitizeAttributes(Element element, List<String> warnings) {
        for (Attribute attribute : new ArrayList<>(element.attributes().asList())) {
            String name = attribute.getKey().toLowerCase();

            if (name.startsWith("on")) {
                warnings.add("인라인 이벤트 핸들러 " + attribute.getKey() + " 를 제거했습니다.");
                element.removeAttr(attribute.getKey());
                continue;
            }
            if (DROP_ATTRS.contains(name)) {
                element.removeAttr(attribute.getKey());
                continue;
            }
            if (URL_ATTRS.contains(name)) {
                String value = attribute.getValue().trim();
                if (!value.startsWith("#") && !ALLOWED_DATA_IMAGE.matcher(value).find()) {
                    warnings.add(name + " 속성을 제거했습니다 (허용되지 않는 URL).");
                    element.removeAttr(attribute.getKey());
                }
                continue;
            }
            if ("style".equals(name)) {
                element.attr(attribute.getKey(), sanitizeCss(attribute.getValue(), warnings));
            }
        }
    }

    /** CSS 는 선언 전체를 지우면 레이아웃이 무너지므로 값만 무력화한다. */
    private String sanitizeCss(String css, List<String> warnings) {
        String before = css;
        String out = CSS_IMPORT.matcher(css).replaceAll("");
        out = CSS_EXPRESSION.matcher(out).replaceAll("void(");
        out = CSS_JAVASCRIPT.matcher(out).replaceAll("");

        Matcher matcher = CSS_URL.matcher(out);
        StringBuilder rebuilt = new StringBuilder();
        while (matcher.find()) {
            String url = matcher.group(2).trim();
            String replacement = ALLOWED_DATA_IMAGE.matcher(url).find() ? matcher.group() : "none";
            matcher.appendReplacement(rebuilt, Matcher.quoteReplacement(replacement));
        }
        matcher.appendTail(rebuilt);
        out = rebuilt.toString();

        if (!out.equals(before)) {
            warnings.add("CSS 에서 외부 리소스 참조 또는 실행 가능한 표현식을 제거했습니다.");
        }
        return out;
    }

    /** 2단계: 존재하지 않는 화면을 가리키는 data-goto 를 끊는다. */
    private void normalizeGoto(Element root, Collection<String> knownScreenKeys, List<String> warnings) {
        for (Element element : root.getElementsByAttribute("data-goto")) {
            String target = element.attr("data-goto");
            if (!knownScreenKeys.contains(target)) {
                warnings.add("data-goto=\"" + target + "\" 는 존재하지 않는 화면이라 제거했습니다.");
                element.removeAttr("data-goto");
            }
        }
    }

    /** 3단계: 안정적인 식별자를 부여하고 지문을 수집한다. */
    /**
     * 식별자가 없는 요소에만 붙인다. 생성 직후에는 정제가 AI 의 것을 다 지워 전부 대상이고,
     * baking 뒤에는 교체 조각의 자손만 대상이다. 이미 있는 값은 먼저 예약해 새 값과 겹치지 않게 한다.
     */
    private void assignIds(Document doc, List<ElementFingerprint> elements) {
        Set<String> used = new LinkedHashSet<>();
        for (Element tagged : doc.getElementsByAttribute("data-nh-id")) {
            used.add(tagged.attr("data-nh-id"));
        }
        walkAssign(doc, "", used, elements, new int[]{0});
    }

    private void walkAssign(Element node, String path, Set<String> used,
                            List<ElementFingerprint> elements, int[] order) {
        Map<String, Integer> sameTagCount = new LinkedHashMap<>();

        for (Element child : node.children()) {
            String tag = child.normalName();
            int index = sameTagCount.merge(tag, 1, Integer::sum) - 1;
            String pathSig = path.isEmpty() ? tag + ":" + index : path + ">" + tag + ":" + index;

            if (!NO_ID_TAGS.contains(tag) && !child.hasAttr("data-nh-id")) {
                String text = normalizeText(directText(child));
                String textSig = text.isEmpty() ? null : text;
                // AI 가 의미 키를 달아줬으면 그게 가장 안정적이다. 없으면 텍스트, 그것도 없으면 구조
                String semanticKey = child.hasAttr("data-nh-key") ? child.attr("data-nh-key")
                        : (textSig != null ? textSig : pathSig);
                String base = sha1Prefix(tag + "|" + child.attr("role") + "|" + semanticKey);

                String nhId = base;
                int duplicate = 1;
                while (used.contains(nhId)) {
                    nhId = base + "-" + duplicate++;
                }
                used.add(nhId);

                child.attr("data-nh-id", nhId);
                elements.add(new ElementFingerprint(nhId, tag, order[0]++, pathSig, textSig));
            }
            walkAssign(child, pathSig, used, elements, order);
        }
    }

    /** 직계 텍스트 자식만 모은다. 자손 텍스트까지 끌어오면 컨테이너끼리 지문이 충돌한다. */
    private String directText(Element element) {
        StringBuilder text = new StringBuilder();
        for (Node child : element.childNodes()) {
            if (child instanceof TextNode textNode) {
                text.append(textNode.getWholeText());
            }
        }
        return text.toString();
    }

    /**
     * 공백을 접고 숫자열을 #으로 치환한다. 목업의 더미 데이터(금액·건수·날짜)는 재생성마다
     * 달라지므로 숫자를 지워야 같은 요소가 같은 키를 갖는다. 예: "12,400P" -> "#P"
     */
    private String normalizeText(String raw) {
        String collapsed = WHITESPACE_RUN.matcher(raw).replaceAll(" ").trim();
        String masked = NUMERIC_RUN.matcher(collapsed).replaceAll("#");
        return masked.length() > 64 ? masked.substring(0, 64) : masked;
    }

    /**
     * nhId 는 요청 본문으로 들어오는 값이다. 셀렉터 문자열로 조립하면 셀렉터 주입이 되므로
     * 값 비교 API 를 쓴다.
     */
    private Element findByNhId(Element root, String nhId) {
        if (nhId == null || nhId.isBlank()) {
            return null;
        }
        return root.getElementsByAttributeValue("data-nh-id", nhId).first();
    }

    private String sha1Prefix(String value) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-1");
            byte[] hash = digest.digest(value.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash).substring(0, 8);
        } catch (NoSuchAlgorithmException ex) {
            throw new ApiException(ErrorCode.INTERNAL_ERROR, "식별자 생성에 실패했습니다.", ex);
        }
    }

    private List<String> dedupe(List<String> warnings) {
        return List.copyOf(new LinkedHashSet<>(warnings));
    }
}

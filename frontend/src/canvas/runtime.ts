import { EDITABLE_ATTRS, EDITABLE_STYLE_PROPS } from "./protocol";

/**
 * 프레임 안에서 도는 스크립트.
 *
 * **AI 생성물이 아니다.** 저장소가 통제하는 코드이며 srcdoc 조립 시점에만 주입한다.
 * DB 에 저장되지 않으므로 저장본과 HTML 다운로드는 script-free 로 유지된다.
 * (SECURITY_CHECKLIST 4절)
 *
 * 프레임은 allow-scripts 만 받아 불투명 오리진이다. 부모 DOM·쿠키·localStorage 에
 * 접근할 수 없고, 자기 sandbox 속성을 지워 무력화하는 경로도 막혀 있다.
 */
export function buildRuntime(): string {
  const styleProps = JSON.stringify(EDITABLE_STYLE_PROPS);
  const attrs = JSON.stringify(EDITABLE_ATTRS);

  return `(function () {
  var STYLE_PROPS = ${styleProps};
  var ATTRS = ${attrs};
  var mode = "view";
  var selected = null;

  function post(message) { parent.postMessage(message, "*"); }

  function findTarget(node) {
    while (node && node !== document.documentElement) {
      if (node.nodeType === 1 && node.hasAttribute("data-nh-id")) return node;
      node = node.parentNode;
    }
    return null;
  }

  function byId(nhId) {
    return document.querySelector('[data-nh-id="' + String(nhId).replace(/"/g, '') + '"]');
  }

  function paint() {
    var previous = document.querySelector(".nh-selected");
    if (previous) previous.classList.remove("nh-selected");
    if (selected) selected.classList.add("nh-selected");
  }

  function describe(el) {
    if (!el) return null;
    var styles = {}, computed = getComputedStyle(el);
    STYLE_PROPS.forEach(function (p) { styles[p] = computed.getPropertyValue(p).trim(); });
    var values = {};
    ATTRS.forEach(function (a) { values[a] = el.getAttribute(a) || ""; });
    return {
      nhId: el.getAttribute("data-nh-id"),
      tag: el.tagName.toLowerCase(),
      text: (el.textContent || "").trim().slice(0, 200),
      attrs: values,
      styles: styles
    };
  }

  // 편집 모드에서는 링크·폼이 프레임을 실제로 이동시키면 안 된다. 화면 이동은 부모가 판단한다.
  document.addEventListener("click", function (event) {
    var goto = event.target && event.target.closest && event.target.closest("[data-goto]");
    if (goto) {
      event.preventDefault();
      post({ type: "navigate", screenKey: goto.getAttribute("data-goto") });
      return;
    }
    if (event.target && event.target.closest && event.target.closest("a,button,input,select,textarea,form")) {
      event.preventDefault();
    }
    if (mode !== "edit") return;
    event.stopPropagation();
    selected = findTarget(event.target);
    paint();
    post({ type: "select", element: describe(selected) });
  }, true);

  document.addEventListener("submit", function (event) { event.preventDefault(); }, true);

  window.addEventListener("message", function (event) {
    // 부모가 보낸 것만 받는다. 프레임 안에 다른 창은 없다.
    if (event.source !== parent) return;
    var data = event.data;
    if (!data || typeof data !== "object") return;

    if (data.type === "setMode") {
      mode = data.mode;
      document.documentElement.setAttribute("data-nh-mode", mode);
      if (mode !== "edit") { selected = null; paint(); }
      return;
    }

    if (data.type === "selectById") {
      selected = data.nhId ? byId(data.nhId) : null;
      paint();
      post({ type: "select", element: describe(selected) });
      return;
    }

    if (data.type === "applyOps" && Array.isArray(data.ops)) {
      data.ops.forEach(function (op) {
        var el = byId(op.nhId);
        if (!el) return;
        if (op.kind === "text") el.textContent = op.value;
        else if (op.kind === "style" && STYLE_PROPS.indexOf(op.prop) >= 0) el.style.setProperty(op.prop, op.value);
        else if (op.kind === "attr" && ATTRS.indexOf(op.name) >= 0) el.setAttribute(op.name, op.value);
        else if (op.kind === "replace") el.outerHTML = op.html;
      });
      if (selected && !selected.isConnected) { selected = null; paint(); }
    }
  });

  post({ type: "ready" });
})();`;
}

/** 선택 표시. 목업 HTML 의 스타일과 겹치지 않게 접두사를 붙인다. */
const RUNTIME_STYLE = `
  html[data-nh-mode="edit"] * { cursor: crosshair !important; }
  .nh-selected { outline: 2px solid #00a04b !important; outline-offset: 1px !important; }
`;

/**
 * 정제가 뚫렸을 때의 2차 방어선.
 * script-src 에 'unsafe-inline' 이 필요한 이유는 위 런타임이 인라인 스크립트이기 때문이다.
 * img-src 를 data: 로 묶어 프레임이 바깥으로 요청을 내지 못하게 한다.
 */
const CSP =
  "default-src 'none'; style-src 'unsafe-inline'; img-src data:; font-src data:; " +
  "script-src 'unsafe-inline'; form-action 'none'; base-uri 'none'";

/** 저장본(script-free)에 런타임과 CSP 를 얹어 srcdoc 을 만든다. 저장본은 건드리지 않는다. */
export function buildSrcDoc(sanitizedHtml: string): string {
  const head =
    `<meta http-equiv="Content-Security-Policy" content="${CSP}">` +
    `<style>${RUNTIME_STYLE}</style>`;
  const tail = `<script>${buildRuntime()}<\/script>`;

  const withHead = /<head(\s[^>]*)?>/i.test(sanitizedHtml)
    ? sanitizedHtml.replace(/<head(\s[^>]*)?>/i, (m) => m + head)
    : head + sanitizedHtml;

  return /<\/body>/i.test(withHead)
    ? withHead.replace(/<\/body>/i, tail + "</body>")
    : withHead + tail;
}

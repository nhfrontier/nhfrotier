/**
 * 캔버스 프레임과 부모가 주고받는 계약.
 *
 * 정본은 backend 의 `screen/EditProtocol.java` 다. 여기 있는 화이트리스트는 사본이며,
 * 서버가 저장 시점과 반영 시점 양쪽에서 다시 검사한다. 화면에서 거르는 것은 편의일 뿐
 * 통제가 아니다 — 서버 검사를 없애도 되는 근거로 쓰지 말 것.
 */

export const EDITABLE_STYLE_PROPS = [
  "color",
  "background-color",
  "font-size",
  "font-weight",
  "text-align",
  "border-radius",
  "border-color",
  "padding",
  "margin",
  "opacity",
  "display",
] as const;

export const EDITABLE_ATTRS = ["placeholder", "alt", "title", "aria-label", "data-goto"] as const;

export type EditableStyleProp = (typeof EDITABLE_STYLE_PROPS)[number];
export type EditableAttr = (typeof EDITABLE_ATTRS)[number];

/** 프레임이 부모에게 올리는 것. */
export type FrameMessage =
  | { type: "ready" }
  | { type: "select"; element: ElementMeta | null }
  | { type: "navigate"; screenKey: string };

/** 선택된 요소에 대해 프레임이 읽어 온 정보. */
export interface ElementMeta {
  nhId: string;
  tag: string;
  text: string;
  /** 화이트리스트 속성의 현재 값. 없는 것은 빈 문자열. */
  attrs: Record<string, string>;
  /** 화이트리스트 스타일의 계산된 현재 값. */
  styles: Record<string, string>;
}

/**
 * 부모가 프레임에 내리는 것.
 *
 * 프레임은 불투명(opaque) 오리진이라 targetOrigin 에 '*' 밖에 쓸 수 없다.
 * 그러므로 **이 방향의 페이로드에 사용자 식별자·세션·토큰·타 프로젝트 정보를 절대 넣지 않는다.**
 * 화면에 그리기 위한 표현 데이터만 보낸다. (SECURITY_CHECKLIST 4절)
 */
export type HostMessage =
  | { type: "setMode"; mode: CanvasMode }
  | { type: "applyOps"; ops: PatchOp[] }
  | { type: "selectById"; nhId: string | null };

export type CanvasMode = "view" | "edit";

/** 프레임 안에서 즉시 반영해 보여 주는 연산. 저장은 서버가 한다. */
export type PatchOp =
  | { kind: "text"; nhId: string; value: string }
  | { kind: "style"; nhId: string; prop: EditableStyleProp; value: string }
  | { kind: "attr"; nhId: string; name: EditableAttr; value: string }
  | { kind: "replace"; nhId: string; html: string };

/**
 * 프레임에서 온 메시지인지 판정한다.
 *
 * **origin 검증은 성립하지 않는다.** sandbox 에 allow-same-origin 을 주지 않았으므로
 * 프레임은 불투명 오리진이고, 부모가 받는 event.origin 은 항상 문자열 "null" 이다.
 * 대신 event.source 를 그 iframe 의 contentWindow 와 대조한다 — 이 값은 브라우저가
 * 채우므로 위조할 수 없다.
 */
export function isTrustedFrameMessage(
  event: MessageEvent,
  frame: HTMLIFrameElement | null
): event is MessageEvent<FrameMessage> {
  if (!frame || event.source !== frame.contentWindow) return false;
  const data = event.data as Partial<FrameMessage> | null;
  return !!data && typeof data === "object" && typeof data.type === "string";
}

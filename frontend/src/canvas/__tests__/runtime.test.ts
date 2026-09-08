import { describe, expect, it } from "vitest";
import { buildSrcDoc } from "../runtime";

/**
 * 여기서 지키려는 것은 렌더링 모양이 아니라 **보안 불변식**이다.
 * 이 파일이 깨지면 목업 미리보기가 부모 페이지를 건드릴 수 있는 상태가 된 것이므로,
 * 실패를 회피하려고 기대값을 낮추지 말 것.
 */

const STORED = `<html><head><title>t</title></head><body><h1 data-nh-id="a1">제목</h1></body></html>`;

describe("buildSrcDoc", () => {
  it("정제된 저장본에 CSP meta 를 넣는다", () => {
    const doc = buildSrcDoc(STORED);
    expect(doc).toContain('http-equiv="Content-Security-Policy"');
    expect(doc).toContain("default-src 'none'");
  });

  it("프레임이 바깥으로 요청을 내지 못하게 img-src 를 data: 로 묶는다", () => {
    const doc = buildSrcDoc(STORED);
    expect(doc).toMatch(/img-src\s+data:/);
    expect(doc).not.toMatch(/img-src[^;]*https?:/);
  });

  it("form-action 과 base-uri 를 막는다", () => {
    const doc = buildSrcDoc(STORED);
    expect(doc).toContain("form-action 'none'");
    expect(doc).toContain("base-uri 'none'");
  });

  it("런타임 스크립트를 body 안에 넣는다", () => {
    const doc = buildSrcDoc(STORED);
    expect(doc).toContain("<script>");
    expect(doc.indexOf("<script>")).toBeLessThan(doc.indexOf("</body>"));
  });

  it("저장본 자체는 건드리지 않는다 — 저장·다운로드 경로는 script-free 로 남아야 한다", () => {
    buildSrcDoc(STORED);
    expect(STORED).not.toContain("<script");
    expect(STORED).not.toContain("Content-Security-Policy");
  });

  it("head 가 없는 조각에도 CSP 를 붙인다", () => {
    const doc = buildSrcDoc(`<div data-nh-id="a1">조각</div>`);
    expect(doc).toContain('http-equiv="Content-Security-Policy"');
    expect(doc.indexOf("Content-Security-Policy")).toBeLessThan(doc.indexOf("<div"));
  });

  it("body 가 없어도 런타임이 빠지지 않는다", () => {
    const doc = buildSrcDoc(`<div data-nh-id="a1">조각</div>`);
    expect(doc).toContain("<script>");
  });

  it("런타임은 부모가 보낸 메시지만 받는다", () => {
    // 프레임 안에는 부모 말고 다른 창이 없다. 이 검사가 빠지면 아무 창이나 편집을 지시할 수 있다.
    expect(buildSrcDoc(STORED)).toContain("event.source !== parent");
  });

  it("런타임은 스스로 data-nh-id 를 만들지 않는다 — 부여 권한은 서버에만 있다", () => {
    const doc = buildSrcDoc(STORED);
    expect(doc).not.toMatch(/setAttribute\(\s*["']data-nh-id["']/);
  });
});

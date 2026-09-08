/**
 * UX 리스크 검토(FR-15)의 근거 대조.
 *
 * 렌즈는 RR 규칙보다 느슨해서 지어낸 근거가 통과할 여지가 크다.
 * 그래서 모델이 낸 인용 조각이 원문에 글자 그대로 있는지 대조하고,
 * 살아남은 것이 없으면 그 지적을 통째로 버린다.
 *
 * LLM SDK를 부르지 않는 순수 함수로 떼어 둔다 — 이 판정이 뚫리면
 * 검증할 수 없는 지적이 의견 패널에 쌓이므로, 따로 돌려볼 수 있어야 한다.
 */

/** 인용이 우연히 맞는 것을 막는 최소 길이 */
export const MIN_QUOTE_LENGTH = 6;

/** 대조를 위해 공백을 한 칸으로 줄이고 소문자화한다 */
export function canonical(text: string): string {
  return text.replace(/\s+/g, ' ').trim().toLowerCase();
}

function isNonEmptyString(v: unknown): v is string {
  return typeof v === 'string' && v.trim().length > 0;
}

/**
 * 원문에 실제로 존재하는 인용만 남긴다.
 * 요약·의역은 여기서 탈락한다. 빈 배열이 나오면 호출부가 그 지적을 버려야 한다.
 */
export function verifyQuotes(quotes: unknown, corpus: string): string[] {
  if (!Array.isArray(quotes)) return [];

  const haystack = canonical(corpus);

  return quotes
    .filter(isNonEmptyString)
    .map((q) => q.trim())
    .filter((q) => {
      const needle = canonical(q);
      return needle.length >= MIN_QUOTE_LENGTH && haystack.includes(needle);
    });
}

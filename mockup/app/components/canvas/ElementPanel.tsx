'use client';

import { useState } from 'react';
import { EDITABLE_STYLE_PROPS, type EditableStyleProp, type ElementMeta } from '@/lib/canvas/protocol';

/** 사람이 읽는 이름. 키는 CSS 속성 그대로 둔다. */
const PROP_LABELS: Record<string, string> = {
  color: '글자색',
  'background-color': '배경색',
  'font-size': '글자 크기',
  'font-weight': '글자 굵기',
  'text-align': '정렬',
  'border-radius': '모서리',
  'border-color': '테두리색',
  padding: '안쪽 여백',
  margin: '바깥 여백',
  opacity: '투명도',
  display: '표시',
};

/** 색 선택기를 붙일 속성. 나머지는 자유 입력이다. */
const COLOR_PROPS = new Set<EditableStyleProp>(['color', 'background-color', 'border-color']);

/** rgb(11, 132, 120) -> #0b8478. <input type="color">는 hex만 받는다. */
function toHex(value: string): string {
  const m = value.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
  if (m) {
    return (
      '#' +
      [m[1], m[2], m[3]]
        .map((n) => Number(n).toString(16).padStart(2, '0'))
        .join('')
    );
  }
  return /^#[0-9a-f]{6}$/i.test(value.trim()) ? value.trim() : '#000000';
}

export interface ElementPanelProps {
  meta: ElementMeta | null;
  /** 편집 가능 여부. 사용자가 없거나 proto처럼 읽기 전용이면 false. */
  editable?: boolean;
  /** 저장 성공 시 true를 돌려주면 패널이 값을 확정한다. */
  onPatchText?(nhId: string, value: string): Promise<boolean>;
  onPatchStyle?(nhId: string, prop: EditableStyleProp, value: string): Promise<boolean>;
  /** 선택한 요소만 AI에게 다시 만들게 한다. 실패 시 사람이 읽을 이유를 돌려준다. */
  onAiEdit?(nhId: string, prompt: string): Promise<string | null>;
}

export function ElementPanel({ meta, editable = false, onPatchText, onPatchStyle, onAiEdit }: ElementPanelProps) {
  if (!meta) {
    return (
      <div className="p-6 text-center">
        <p className="text-sm text-slate-500">화면에서 요소를 클릭하세요.</p>
        <p className="mt-1 text-xs text-slate-400">버튼·입력창·카드 등 무엇이든 고를 수 있습니다.</p>
      </div>
    );
  }

  // 다른 요소를 고르면 편집 중이던 값이 남지 않도록 통째로 새로 마운트한다.
  return (
    <ElementEditor
      key={`${meta.nhId}:${meta.text ?? ''}`}
      meta={meta}
      editable={editable}
      onPatchText={onPatchText}
      onPatchStyle={onPatchStyle}
      onAiEdit={onAiEdit}
    />
  );
}

function ElementEditor({
  meta,
  editable,
  onPatchText,
  onPatchStyle,
  onAiEdit,
}: ElementPanelProps & { meta: ElementMeta }) {
  const [textDraft, setTextDraft] = useState(meta.text ?? '');
  const [styleDrafts, setStyleDrafts] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiRunning, setAiRunning] = useState(false);

  const runAiEdit = async () => {
    if (!onAiEdit || !aiPrompt.trim()) return;
    setAiRunning(true);
    setError('');
    const failure = await onAiEdit(meta.nhId, aiPrompt.trim());
    if (failure) setError(failure);
    else setAiPrompt('');
    setAiRunning(false);
  };

  const commitText = async () => {
    if (!onPatchText || textDraft === (meta.text ?? '')) return;
    setSaving('text');
    setError('');
    const ok = await onPatchText(meta.nhId, textDraft);
    if (!ok) {
      setError('수정 내용을 저장하지 못했습니다.');
      setTextDraft(meta.text ?? '');
    }
    setSaving(null);
  };

  const commitStyle = async (prop: EditableStyleProp, value: string) => {
    if (!onPatchStyle || value === (styleDrafts[prop] ?? meta.computed[prop])) return;
    setSaving(prop);
    setError('');
    const ok = await onPatchStyle(meta.nhId, prop, value);
    if (ok) {
      setStyleDrafts((prev) => ({ ...prev, [prop]: value }));
    } else {
      setError('수정 내용을 저장하지 못했습니다.');
    }
    setSaving(null);
  };

  const valueOf = (prop: EditableStyleProp) => styleDrafts[prop] ?? meta.computed[prop] ?? '';

  return (
    <div className="space-y-4 p-4">
      <div>
        <div className="flex items-center gap-2">
          <span className="rounded bg-slate-800 px-2 py-0.5 font-mono text-[11px] text-white">
            &lt;{meta.tag}&gt;
          </span>
          <span className="font-mono text-[11px] text-slate-400">{meta.nhId}</span>
        </div>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-[11px] text-red-600">{error}</p>
      )}

      {/* 텍스트 */}
      {(meta.text !== null || textDraft) && (
        <div>
          <h4 className="mb-1.5 text-[11px] font-semibold tracking-wide text-slate-400">텍스트</h4>
          {editable ? (
            <textarea
              value={textDraft}
              onChange={(e) => setTextDraft(e.target.value)}
              onBlur={commitText}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  (e.target as HTMLTextAreaElement).blur();
                }
              }}
              rows={2}
              disabled={saving === 'text'}
              className="w-full resize-none rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
            />
          ) : (
            <p className="text-sm text-slate-700">{meta.text}</p>
          )}
        </div>
      )}

      {Object.keys(meta.attrs).length > 0 && (
        <div>
          <h4 className="mb-1.5 text-[11px] font-semibold tracking-wide text-slate-400">속성</h4>
          <dl className="space-y-1">
            {Object.entries(meta.attrs).map(([name, value]) => (
              <div key={name} className="flex gap-2 text-xs">
                <dt className="w-24 shrink-0 truncate font-mono text-slate-400">{name}</dt>
                <dd className="truncate text-slate-700">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      <div>
        <h4 className="mb-1.5 text-[11px] font-semibold tracking-wide text-slate-400">스타일</h4>
        <div className="space-y-1.5">
          {EDITABLE_STYLE_PROPS.map((prop) => {
            const value = valueOf(prop);
            if (!value) return null;
            const isColor = COLOR_PROPS.has(prop);

            return (
              <div key={prop} className="flex items-center gap-2 text-xs">
                <span className="w-20 shrink-0 text-slate-400">{PROP_LABELS[prop] ?? prop}</span>
                {editable ? (
                  <div className="flex min-w-0 flex-1 items-center gap-1.5">
                    {isColor && (
                      <input
                        type="color"
                        value={toHex(value)}
                        onChange={(e) => commitStyle(prop, e.target.value)}
                        disabled={saving === prop}
                        className="h-6 w-7 shrink-0 cursor-pointer rounded border border-slate-300 bg-white p-0.5"
                        aria-label={`${PROP_LABELS[prop] ?? prop} 선택`}
                      />
                    )}
                    <input
                      type="text"
                      defaultValue={value}
                      key={`${meta.nhId}:${prop}:${value}`}
                      onBlur={(e) => commitStyle(prop, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                      }}
                      disabled={saving === prop}
                      className="min-w-0 flex-1 rounded border border-slate-200 px-1.5 py-1 font-mono text-[11px] focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                    />
                  </div>
                ) : (
                  <span className="flex min-w-0 items-center gap-1.5 text-slate-700">
                    {isColor && (
                      <span
                        className="h-3 w-3 shrink-0 rounded border border-slate-300"
                        style={{ backgroundColor: value }}
                      />
                    )}
                    <span className="truncate font-mono">{value}</span>
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {editable && onAiEdit && (
        <div>
          <h4 className="mb-1.5 text-[11px] font-semibold tracking-wide text-slate-400">
            AI에게 맡기기
          </h4>
          <textarea
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                runAiEdit();
              }
            }}
            placeholder="예: 이 버튼을 리스트 형태로 바꿔줘"
            rows={2}
            disabled={aiRunning}
            className="w-full resize-none rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
          />
          <button
            type="button"
            onClick={runAiEdit}
            disabled={aiRunning || !aiPrompt.trim()}
            className="mt-1.5 w-full rounded-lg bg-indigo-600 py-1.5 text-xs font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
          >
            {aiRunning ? '다시 만드는 중...' : '이 요소만 다시 만들기'}
          </button>
          <p className="mt-1 text-[10px] leading-relaxed text-slate-400">
            선택한 요소 하나만 바뀝니다. 결과는 검토 후 되돌릴 수 있습니다.
          </p>
        </div>
      )}

      <div className="rounded-lg bg-slate-50 p-3 text-[11px] leading-relaxed text-slate-500">
        크기 {Math.round(meta.rect.w)} × {Math.round(meta.rect.h)}
        <br />
        위치 {Math.round(meta.rect.x)}, {Math.round(meta.rect.y)}
        {editable && (
          <>
            <br />
            수정은 원본을 덮어쓰지 않고 편집 이력으로 쌓입니다.
          </>
        )}
      </div>
    </div>
  );
}

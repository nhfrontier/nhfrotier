'use client';

import { Avatar } from './Avatar';

export interface UsabilityFinding {
  id: string;
  lens_id: string;
  severity: string;
  title: string;
  evidence: string;
  evidence_source: string;
  why: string;
  suggestion: string;
  decision: string | null;
  decision_by: string | null;
  decided_at: string | null;
  created_at: string;
  decided_by_name?: string;
  decided_by_color?: string;
}

export type UsabilityDecision = 'ACCEPTED' | 'DEFERRED' | 'REJECTED';

// Tailwind가 클래스명을 정적으로 스캔하므로 전체 문자열을 그대로 둔다
const LENS_LABEL: Record<string, string> = {
  'UR-01': '누적과 반복',
  'UR-02': '흐름 중단',
  'UR-03': '예외 상황',
  'UR-04': '되돌리기·오조작',
  'UR-05': '사용 맥락',
  'UR-06': '빠진 이해관계자',
};

const SEVERITY_STYLE: Record<string, { label: string; badge: string }> = {
  HIGH: { label: '높음', badge: 'bg-red-100 text-red-700' },
  MEDIUM: { label: '보통', badge: 'bg-amber-100 text-amber-700' },
  LOW: { label: '낮음', badge: 'bg-slate-100 text-slate-600' },
};

const SOURCE_LABEL: Record<string, string> = {
  PROPOSAL: '기획안에서',
  SCREEN: '화면에서',
  DISCUSSION: '의견에서',
};

const DECISION_LABEL: Record<string, string> = {
  ACCEPTED: '반영',
  DEFERRED: '보류',
  REJECTED: '반려',
};

const DECISION_BADGE: Record<string, string> = {
  ACCEPTED: 'bg-green-50 text-green-700',
  DEFERRED: 'bg-amber-50 text-amber-700',
  REJECTED: 'bg-red-50 text-red-700',
};

interface Props {
  finding: UsabilityFinding;
  deciding: boolean;
  canDecide: boolean;
  onDecide: (findingId: string, decision: UsabilityDecision) => void;
}

/**
 * 의견 목록 안에 사람 댓글과 나란히 놓이는 AI 카드.
 *
 * ReviewPanel의 책임성 카드와 마크업이 비슷하지만 공통 컴포넌트로 묶지 않는다 —
 * 필드(카테고리 vs 렌즈, needs_compliance_review 유무)와 결정 버튼 수가 달라
 * 지금 추출하면 조건 분기만 늘어난다.
 */
export function UsabilityCard({ finding: f, deciding, canDecide, onDecide }: Props) {
  const sev = SEVERITY_STYLE[f.severity] ?? SEVERITY_STYLE.MEDIUM;

  return (
    <div className="border border-slate-200 border-l-4 border-l-teal-400 rounded-lg px-3 py-2.5 bg-white">
      <div className="flex items-center gap-1 mb-1.5 flex-wrap">
        <span className="text-[9px] text-slate-500" title="AI 제안">
          AI
        </span>
        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-teal-50 text-teal-700">
          {LENS_LABEL[f.lens_id] ?? 'UX 리스크'}
        </span>
        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${sev.badge}`}>
          {sev.label}
        </span>
        <span className="text-[9px] text-slate-300 ml-auto">{f.lens_id}</span>
      </div>

      <p className="text-xs font-semibold text-slate-800 mb-1.5">{f.title}</p>

      <p className="text-[9px] text-slate-400 mb-0.5">
        {SOURCE_LABEL[f.evidence_source] ?? '근거'}
      </p>
      <p className="text-[11px] text-slate-600 bg-slate-50 border border-slate-100 rounded px-2 py-1.5 mb-1.5 font-mono break-words whitespace-pre-line">
        {f.evidence}
      </p>

      <p className="text-[11px] text-slate-500 leading-relaxed mb-1">{f.why}</p>
      <p className="text-[11px] text-slate-700 leading-relaxed mb-2">
        <span className="text-slate-400">제안 </span>
        {f.suggestion}
      </p>

      {f.decision ? (
        <div className="flex items-center gap-1.5">
          <span
            className={`text-[11px] font-semibold px-2 py-1 rounded-md ${DECISION_BADGE[f.decision] ?? 'bg-slate-100 text-slate-600'}`}
          >
            {DECISION_LABEL[f.decision] ?? f.decision}
          </span>
          {f.decided_by_name && (
            <>
              <Avatar name={f.decided_by_name} color={f.decided_by_color ?? 'indigo'} size="sm" />
              <span className="text-[10px] text-slate-400">{f.decided_by_name}</span>
            </>
          )}
          {f.decided_at && (
            <span className="text-[10px] text-slate-300 ml-auto">
              {new Date(f.decided_at).toLocaleTimeString('ko-KR', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          )}
        </div>
      ) : !canDecide ? (
        <p className="text-[10px] text-slate-400">결정하려면 상단에서 사용자를 선택하세요.</p>
      ) : (
        <div className="flex gap-1 flex-wrap">
          <button
            onClick={() => onDecide(f.id, 'ACCEPTED')}
            disabled={deciding}
            className="px-2 py-1 rounded-md text-[11px] font-semibold border border-green-200 text-green-700 hover:bg-green-50 disabled:opacity-50 transition-colors"
          >
            반영
          </button>
          <button
            onClick={() => onDecide(f.id, 'DEFERRED')}
            disabled={deciding}
            className="px-2 py-1 rounded-md text-[11px] font-semibold border border-amber-200 text-amber-700 hover:bg-amber-50 disabled:opacity-50 transition-colors"
          >
            보류
          </button>
          <button
            onClick={() => onDecide(f.id, 'REJECTED')}
            disabled={deciding}
            className="px-2 py-1 rounded-md text-[11px] font-semibold border border-red-200 text-red-700 hover:bg-red-50 disabled:opacity-50 transition-colors"
          >
            반려
          </button>
        </div>
      )}
    </div>
  );
}

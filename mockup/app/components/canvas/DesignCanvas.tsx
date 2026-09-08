'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  CANVAS_PROTOCOL,
  isTrustedFrameMessage,
  type CanvasMode,
  type ElementMeta,
  type PatchOp,
  type Rect,
  type ToFrame,
  type ToFramePayload,
} from '@/lib/canvas/protocol';
import { buildSrcDoc } from '@/lib/canvas/runtime';

export interface CanvasScreen {
  screenKey: string;
  name: string;
  /** 정제된 HTML. 아직 생성되지 않았으면 null. */
  html: string | null;
  status: 'pending' | 'generating' | 'ready' | 'failed';
  errorMessage?: string | null;
}

export interface CanvasPin {
  commentId: string;
  nhId: string;
  label: string;
  userName: string;
  userColor: string;
  resolved: boolean;
}

export interface DesignCanvasProps {
  screens: CanvasScreen[];
  activeScreenKey: string;
  selectedNhId: string | null;
  pins?: CanvasPin[];
  mode: CanvasMode;
  viewMode: 'desktop' | 'mobile';
  /** 프레임이 준비된 뒤 적용할 편집 패치. */
  patches?: PatchOp[];
  /**
   * 특정 요소로 스크롤하고 고른 상태로 만든다. 메모 핀을 눌렀을 때 쓴다.
   * 같은 요소를 다시 눌러도 동작해야 하므로 nhId만으로는 부족하다 —
   * token이 바뀔 때마다 한 번 보낸다.
   */
  focusRequest?: { nhId: string; token: number } | null;
  onSelect(nhId: string | null, meta: ElementMeta | null): void;
  onNavigate(screenKey: string): void;
  onPinClick?(commentId: string): void;
}

const MIN_HEIGHT = 600;

/** 문서 내용이 바뀌면 프레임을 통째로 새로 마운트하기 위한 키. 암호용이 아니다. */
function contentKey(screenKey: string, html: string): string {
  let h = 5381;
  for (let i = 0; i < html.length; i++) h = ((h << 5) + h + html.charCodeAt(i)) | 0;
  return `${screenKey}:${(h >>> 0).toString(36)}`;
}

/**
 * 목업을 격리해 띄우고, 그 안의 요소 선택과 화면 전환을 부모로 올려보낸다.
 *
 * fetch를 하지 않는다 — 데이터는 전부 props로 받는다. 그래서 실제 DB를 쓰는
 * 작업공간과 하드코딩 데이터를 쓰는 proto가 같은 컴포넌트를 공유할 수 있다.
 */
export default function DesignCanvas(props: DesignCanvasProps) {
  const { screens, activeScreenKey, viewMode } = props;
  const screen = screens.find((s) => s.screenKey === activeScreenKey) ?? screens[0] ?? null;
  const frameWidth = viewMode === 'mobile' ? 'w-[390px]' : 'w-full max-w-5xl';

  if (!screen) {
    return (
      <div className="flex h-96 items-center justify-center text-sm text-gray-400">
        표시할 화면이 없습니다.
      </div>
    );
  }

  if (screen.status !== 'ready' || !screen.html) {
    return (
      <div
        className={`${frameWidth} mx-auto flex h-96 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 bg-white`}
      >
        <p className="text-sm text-gray-500">
          {screen.status === 'failed'
            ? '이 화면을 만들지 못했습니다.'
            : screen.status === 'generating'
              ? '화면을 만드는 중입니다...'
              : '아직 만들어지지 않은 화면입니다.'}
        </p>
        {screen.errorMessage && (
          <p className="max-w-md px-6 text-center text-xs text-red-500">{screen.errorMessage}</p>
        )}
      </div>
    );
  }

  // 문서가 바뀌면 키가 바뀌어 프레임이 새로 마운트된다.
  // 덕분에 높이·선택 상태가 effect 없이 자연스럽게 초기화된다.
  const key = contentKey(screen.screenKey, screen.html);

  return (
    <CanvasFrame
      key={key}
      {...props}
      screen={screen}
      html={screen.html}
      nonce={key}
      frameWidth={frameWidth}
    />
  );
}

type CanvasFrameProps = DesignCanvasProps & {
  screen: CanvasScreen;
  html: string;
  /**
   * 세대 구분자. 문서 내용에서 결정적으로 파생된다.
   *
   * 난수를 쓰면 서버와 클라이언트의 srcDoc이 달라져 하이드레이션이 깨진다.
   * 목적이 "srcDoc이 교체됐을 때 낡은 문서의 메시지를 버리는 것"이므로,
   * 내용이 바뀔 때만 값이 바뀌는 해시가 오히려 정확하다.
   * 보안 경계는 이 값이 아니라 event.source 대조다 — 예측 가능해도 무방하다.
   */
  nonce: string;
  frameWidth: string;
};

function CanvasFrame({
  screen,
  html,
  nonce,
  frameWidth,
  selectedNhId,
  pins = [],
  mode,
  patches = [],
  focusRequest = null,
  onSelect,
  onNavigate,
  onPinClick,
}: CanvasFrameProps) {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(MIN_HEIGHT);
  const [ready, setReady] = useState(false);
  const [rects, setRects] = useState<Record<string, Rect>>({});

  const srcDoc = useMemo(
    () => buildSrcDoc(html, nonce, screen.screenKey),
    [html, nonce, screen.screenKey]
  );

  const post = useCallback(
    (payload: ToFramePayload) => {
      const win = frameRef.current?.contentWindow;
      if (!win) return;
      // 불투명 오리진에는 targetOrigin을 지정할 수 없다.
      // 그래서 이 방향으로는 표현 데이터만 보낸다 (사용자 식별자·토큰 금지).
      const message: ToFrame = { ...payload, __nh: CANVAS_PROTOCOL, nonce };
      win.postMessage(message, '*');
    },
    [nonce]
  );

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (!isTrustedFrameMessage(event, frameRef.current, nonce)) return;
      const msg = event.data;

      switch (msg.type) {
        case 'ready':
          setReady(true);
          setHeight(Math.max(msg.docHeight, MIN_HEIGHT));
          break;
        case 'resize':
          setHeight(Math.max(msg.docHeight, MIN_HEIGHT));
          break;
        case 'select':
          onSelect(msg.meta?.nhId ?? null, msg.meta);
          break;
        case 'navigate':
          onNavigate(msg.toScreenKey);
          break;
        case 'rects':
          setRects((prev) => {
            const next = { ...prev };
            for (const item of msg.items) next[item.nhId] = item.rect;
            return next;
          });
          break;
        case 'error':
          console.warn('[canvas] 목업 내부 오류:', msg.message);
          break;
      }
    };

    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [nonce, onSelect, onNavigate]);

  useEffect(() => {
    if (ready) post({ type: 'setMode', mode });
  }, [ready, mode, post]);

  useEffect(() => {
    if (ready) post({ type: 'highlight', nhIds: selectedNhId ? [selectedNhId] : [] });
  }, [ready, selectedNhId, post]);

  useEffect(() => {
    if (ready && patches.length > 0) post({ type: 'applyPatch', ops: patches });
  }, [ready, patches, post]);

  // token이 바뀐 순간에만 보낸다. 프레임은 select를 되돌려 보내고,
  // 부모는 그것을 사람이 직접 누른 것과 똑같이 처리한다.
  const focusToken = focusRequest?.token ?? null;
  const focusNhId = focusRequest?.nhId ?? null;
  useEffect(() => {
    if (ready && focusNhId) post({ type: 'focusElement', nhId: focusNhId });
    // focusNhId가 아니라 token이 방아쇠다 — 같은 요소를 다시 눌러도 동작해야 한다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, focusToken, post]);

  const pinIds = useMemo(() => pins.map((p) => p.nhId).join(','), [pins]);
  useEffect(() => {
    if (!ready || pinIds.length === 0) return;
    post({ type: 'requestRects', nhIds: pinIds.split(',') });
  }, [ready, pinIds, height, post]);

  return (
    <div className={`${frameWidth} relative mx-auto bg-white shadow-sm`}>
      <iframe
        ref={frameRef}
        srcDoc={srcDoc}
        title={`${screen.name} 목업`}
        className="block w-full border-0"
        style={{ height }}
        /**
         * 준비 완료 판정을 프레임이 보내는 ready 메시지에 걸지 않는다.
         * srcDoc 문서는 React가 message 리스너를 붙이기 전에 로드를 마칠 수 있고,
         * 그러면 ready가 유실되어 setMode·highlight·patch가 영영 전송되지 않는다.
         * onLoad는 엘리먼트 생성 시점에 붙으므로 놓칠 수 없다.
         */
        onLoad={() => setReady(true)}
        // allow-same-origin을 주지 않는다. 프레임은 불투명 오리진이 되어
        // 부모 DOM·쿠키·스토리지에 접근할 수 없고, 통신은 postMessage로만 이뤄진다.
        sandbox="allow-scripts"
      />

      {pins.length > 0 && (
        <div className="pointer-events-none absolute inset-0">
          {pins.map((pin) => {
            const rect = rects[pin.nhId];
            if (!rect) return null;
            return (
              <button
                key={pin.commentId}
                type="button"
                onClick={() => onPinClick?.(pin.commentId)}
                title={`${pin.userName}: ${pin.label}`}
                className={`pointer-events-auto absolute flex h-6 w-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white text-[10px] font-bold text-white shadow ${
                  pin.resolved ? 'bg-gray-400' : 'bg-indigo-600'
                }`}
                style={{ left: rect.x + rect.w, top: rect.y }}
              >
                {pin.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

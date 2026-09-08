'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Header } from '@/app/components/Header';
import { Avatar } from '@/app/components/Avatar';
import { useUser } from '@/app/contexts/UserContext';
import { ReviewPanel, type Finding, type ReviewMeta, type Decision } from '@/app/components/ReviewPanel';
import { UsabilityCard, type UsabilityFinding, type UsabilityDecision } from '@/app/components/UsabilityCard';
import DesignCanvas, { type CanvasScreen, type CanvasPin } from '@/app/components/canvas/DesignCanvas';
import { ElementPanel } from '@/app/components/canvas/ElementPanel';
import { ScreenFlow } from '@/app/components/canvas/ScreenFlow';
import type { CanvasMode, EditableStyleProp, ElementMeta, PatchOp } from '@/lib/canvas/protocol';

interface Project { id: string; name: string; description: string | null; created_at: string; }
interface RefScreen { id: string; name: string; mime_type: string; }
interface MockupSummary { id: string; version: number; proposal_content: string; description: string | null; created_at: string; design_system_id: string | null; }
/** GET /api/design-systems. 정본은 저장소 루트 design-systems/registry.json이다. */
interface DesignSystemOption { id: string; label: string; surface: 'mobile' | 'web'; canvas: string; note: string; templates: string[]; }
/** GET /api/mockups/[id]가 내려주는 화면 행. legacy 목업도 여기 1행으로 정규화되어 온다. */
interface ScreenRow {
  id: string;
  screen_key: string;
  name: string;
  sort_order: number;
  html_content: string | null;
  status: CanvasScreen['status'];
  error_message: string | null;
  /** 이 화면에 쌓인 활성 편집. html_content에는 반영되어 있지 않다. */
  patches: PatchOp[];
}
interface MockupDetail extends MockupSummary { html_content: string; screens: ScreenRow[]; }
interface Member { id: string; user_id: string; user_name: string; user_color: string; user_role: string; role: string; }
interface Comment {
  id: string; user_id: string; user_name: string; user_color: string;
  content: string; created_at: string;
  /** 요소를 지목한 의견이면 채워진다. anchor_status가 'none'이면 일반 의견. */
  screen_key: string | null;
  nh_id: string | null;
  anchor_status: 'none' | 'anchored' | 'orphaned';
  resolved_at: string | null;
  /** 답글이면 뿌리 의견의 id. 답글은 자기 앵커를 갖지 않는다 — 핀은 뿌리에만 붙는다. */
  parent_id: string | null;
}
/**
 * GET /api/mockups/[id]/patches. 편집 이력 한 줄, 그리고 의견 스레드에 끼는
 * "AI가 반영했습니다" 카드의 원본이다. payload는 목록에 쓰이지 않아 내려오지 않는다.
 */
interface PatchRow {
  id: string;
  screen_id: string;
  screen_key: string;
  nh_id: string;
  op: 'setText' | 'setStyle' | 'setAttr' | 'aiRewrite';
  reason: string | null;
  source: 'manual' | 'ai';
  reverted_at: string | null;
  created_at: string;
  comment_id: string | null;
  user_name: string;
  user_color: string;
}
interface ChatMsg { id: string; user_id: string; user_name: string; user_color: string; content: string; created_at: string; }

type LeftTab = 'generate' | 'history' | 'members' | 'refs';
type RightTab = 'element' | 'comments' | 'review' | 'chat';

/** 편집 이력 한 줄의 머리말. */
const PATCH_LABEL: Record<PatchRow['op'], string> = {
  setText: '텍스트 수정',
  setStyle: '스타일 수정',
  setAttr: '속성 수정',
  aiRewrite: 'AI 재생성',
};

export default function ProjectPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { currentUser, allUsers, refreshUsers } = useUser();

  // Project data
  const [project, setProject] = useState<Project | null>(null);
  const [refScreens, setRefScreens] = useState<RefScreen[]>([]);
  const [mockups, setMockups] = useState<MockupSummary[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedMockup, setSelectedMockup] = useState<MockupDetail | null>(null);
  const [loading, setLoading] = useState(true);

  // UI state
  const [leftTab, setLeftTab] = useState<LeftTab>('generate');
  const [rightTab, setRightTab] = useState<RightTab>('comments');
  const [rightOpen, setRightOpen] = useState(true);
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');

  // Canvas
  const [canvasMode, setCanvasMode] = useState<CanvasMode>('select');
  const [activeScreenKey, setActiveScreenKey] = useState('');
  const [selectedElement, setSelectedElement] = useState<ElementMeta | null>(null);
  const [highlightedCommentId, setHighlightedCommentId] = useState<string | null>(null);
  /** 핀을 눌렀을 때 프레임에 보낼 요청. token이 바뀔 때마다 한 번 나간다. */
  const [focusRequest, setFocusRequest] = useState<{ nhId: string; token: number } | null>(null);
  /** 화면 id -> 이번 세션에서 만든 패치. 다시 읽지 않고 프레임에 바로 적용한다. */
  const [pendingPatches, setPendingPatches] = useState<Record<string, PatchOp[]>>({});
  /** 화면 id -> 생성 진행 상태. 서버 status가 갱신되기 전 화면에 즉시 보여주기 위한 것. */
  const [screenProgress, setScreenProgress] = useState<Record<string, ScreenRow['status']>>({});
  const [showFlow, setShowFlow] = useState(false);

  // Generate
  const [proposalContent, setProposalContent] = useState('');
  const [description, setDescription] = useState('');
  const [designSystems, setDesignSystems] = useState<DesignSystemOption[]>([]);
  const [designSystemId, setDesignSystemId] = useState('');

  /** 옛 버전은 design_system_id가 null이다. 그 경우 배지를 그리지 않는다. */
  const designSystemLabel = (dsId: string | null) =>
    designSystems.find((ds) => ds.id === dsId)?.label ?? '';
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState('');

  // Upload
  const [uploadingScreen, setUploadingScreen] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [screenName, setScreenName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Members
  const [addingMember, setAddingMember] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');

  // Comments
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [postingComment, setPostingComment] = useState(false);
  /** 답글을 달 뿌리 의견. null이면 새 스레드를 연다. */
  const [replyTo, setReplyTo] = useState<string | null>(null);
  /** 의견을 AI에게 보내는 중. 버튼 두 개를 함께 잠근다. */
  const [askingAi, setAskingAi] = useState(false);
  const [commentError, setCommentError] = useState('');

  // Patches — 편집 이력과 스레드 안의 AI 반영 카드가 함께 읽는다
  const [patchRows, setPatchRows] = useState<PatchRow[]>([]);
  const [revertingId, setRevertingId] = useState<string | null>(null);
  /**
   * 되돌리기는 프레임을 다시 만들어야 한다.
   * 패치 적용이 누적식(applyPatch)이라 이미 적용된 것을 빼는 연산이 없다.
   * 이 값이 바뀌면 DesignCanvas가 통째로 remount되어 서버의 활성 패치만 다시 얹힌다.
   */
  const [canvasEpoch, setCanvasEpoch] = useState(0);

  // Responsibility review (FR-14)
  const [review, setReview] = useState<ReviewMeta | null>(null);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [reviewing, setReviewing] = useState(false);
  const [decidingId, setDecidingId] = useState<string | null>(null);

  // UX risk review (FR-15) — 의견 탭에 섞여 표시된다
  const [uxReview, setUxReview] = useState<ReviewMeta | null>(null);
  const [uxFindings, setUxFindings] = useState<UsabilityFinding[]>([]);
  const [uxRunning, setUxRunning] = useState(false);
  const [uxError, setUxError] = useState('');
  const [decidingUxId, setDecidingUxId] = useState<string | null>(null);

  // Chat
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([]);
  const [chatText, setChatText] = useState('');
  const [sendingChat, setSendingChat] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const lastChatTime = useRef<string | null>(null);

  const fetchProject = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${id}`);
      if (!res.ok) { router.push('/'); return; }
      const data = await res.json();
      setProject(data.project);
      setRefScreens(data.refScreens);
      setMockups(data.mockups);
    } catch { router.push('/'); }
    finally { setLoading(false); }
  }, [id, router]);

  const fetchMembers = useCallback(async () => {
    const res = await fetch(`/api/projects/${id}/members`);
    if (res.ok) setMembers(await res.json());
  }, [id]);

  const fetchComments = useCallback(async (mockupId: string) => {
    const res = await fetch(`/api/mockups/${mockupId}/comments`);
    if (res.ok) setComments(await res.json());
  }, []);

  const fetchPatches = useCallback(async (mockupId: string) => {
    const res = await fetch(`/api/mockups/${mockupId}/patches`);
    if (res.ok) setPatchRows(await res.json());
  }, []);

  const fetchReview = useCallback(async (mockupId: string) => {
    const res = await fetch(`/api/mockups/${mockupId}/responsibility-review`);
    if (!res.ok) return;
    const data = await res.json();
    setReview(data.review);
    setFindings(data.findings);
  }, []);

  const runReview = useCallback(async (mockupId: string) => {
    setReviewing(true);
    try {
      const res = await fetch(`/api/mockups/${mockupId}/responsibility-review`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setReview(data.review);
        setFindings(data.findings);
      } else {
        setReview({ id: '', status: 'FAILED', created_at: new Date().toISOString() });
        setFindings([]);
      }
    } catch {
      setReview({ id: '', status: 'FAILED', created_at: new Date().toISOString() });
      setFindings([]);
    } finally {
      setReviewing(false);
    }
  }, []);

  const fetchUxReview = useCallback(async (mockupId: string) => {
    const res = await fetch(`/api/mockups/${mockupId}/usability-review`);
    if (!res.ok) return;
    const data = await res.json();
    setUxReview(data.review);
    setUxFindings(data.findings);
  }, []);

  /** FR-15는 자동 실행되지 않는다. 담당자가 이 함수를 부를 때만 돈다. */
  const runUxReview = useCallback(async (mockupId: string, userId?: string) => {
    setUxRunning(true);
    setUxError('');
    try {
      const res = await fetch(`/api/mockups/${mockupId}/usability-review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: userId ?? null }),
      });
      const data = await res.json();
      if (res.ok) {
        setUxReview(data.review);
        setUxFindings(data.findings);
      } else {
        setUxError(data.error ?? 'UX 리스크 검토에 실패했습니다.');
      }
    } catch {
      setUxError('UX 리스크 검토에 실패했습니다.');
    } finally {
      setUxRunning(false);
    }
  }, []);

  const fetchChat = useCallback(async (initial = false) => {
    const url = initial || !lastChatTime.current
      ? `/api/projects/${id}/chat`
      : `/api/projects/${id}/chat?since=${encodeURIComponent(lastChatTime.current)}`;
    const res = await fetch(url);
    if (!res.ok) return;
    const msgs: ChatMsg[] = await res.json();
    if (msgs.length === 0) return;
    if (initial) {
      setChatMessages(msgs);
    } else {
      setChatMessages((prev) => [...prev, ...msgs]);
    }
    lastChatTime.current = msgs[msgs.length - 1].created_at;
  }, [id]);

  useEffect(() => { fetchProject(); fetchMembers(); }, [fetchProject, fetchMembers]);

  // 디자인 시스템 목록. 못 읽어도 생성은 그대로 되므로 오류를 표시하지 않는다.
  useEffect(() => {
    fetch('/api/design-systems')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data?.systems?.length) return;
        setDesignSystems(data.systems);
        setDesignSystemId((prev) => prev || data.systems[0].id);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchChat(true);
    const interval = setInterval(() => fetchChat(false), 3000);
    return () => clearInterval(interval);
  }, [fetchChat]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  useEffect(() => {
    if (selectedMockup) fetchComments(selectedMockup.id);
  }, [selectedMockup, fetchComments]);

  async function loadMockupDetail(mockupId: string) {
    const res = await fetch(`/api/mockups/${mockupId}`);
    if (res.ok) {
      const data: MockupDetail = await res.json();
      setSelectedMockup(data);
      setActiveScreenKey(data.screens[0]?.screen_key ?? '');
      setSelectedElement(null);
      setReview(null);
      setFindings([]);
      setUxReview(null);
      setUxFindings([]);
      setUxError('');
      setReplyTo(null);
      setCommentError('');
      fetchComments(data.id);
      fetchPatches(data.id);
      fetchReview(data.id);
      fetchUxReview(data.id);
    }
  }

  /**
   * 화면과 패치만 다시 읽는다.
   * loadMockupDetail과 달리 고른 화면·요소·검토 결과를 건드리지 않는다 —
   * 되돌리기처럼 "화면만 바뀌는" 동작에서 작업 맥락을 날리지 않기 위해서다.
   */
  async function refreshScreens(mockupId: string) {
    const res = await fetch(`/api/mockups/${mockupId}`);
    if (!res.ok) return;
    const data: MockupDetail = await res.json();
    setSelectedMockup(data);
    // 서버 응답이 활성 패치를 전부 담고 있으므로 세션 캐시는 비운다.
    setPendingPatches({});
    setCanvasEpoch((n) => n + 1);
  }

  /**
   * 요소를 고르면 속성 패널을 바로 보여준다. 두 번 클릭하게 만들지 않는다.
   *
   * 단 메모 핀에서 시작된 선택은 예외다. 핀을 누른 사람은 의견을 보고 있으므로
   * 탭을 속성으로 옮기면 방금 누른 의견이 눈앞에서 사라진다.
   */
  const fromPinRef = useRef(false);
  const handleSelectElement = useCallback((_nhId: string | null, meta: ElementMeta | null) => {
    setSelectedElement(meta);
    const fromPin = fromPinRef.current;
    fromPinRef.current = false;
    if (meta && !fromPin) {
      setRightOpen(true);
      setRightTab('element');
    }
  }, []);

  const handleNavigate = useCallback((screenKey: string) => {
    setActiveScreenKey(screenKey);
    setSelectedElement(null);
  }, []);

  const canvasScreens: CanvasScreen[] = (selectedMockup?.screens ?? []).map((s) => ({
    screenKey: s.screen_key,
    name: s.name,
    html: s.html_content,
    // 서버 status가 아직 갱신되지 않았어도 진행 중인 것을 즉시 보여준다.
    status: screenProgress[s.id] ?? s.status,
    errorMessage: s.error_message,
  }));

  /** 화면 사이의 이동 관계. data-goto 속성에서 읽어내므로 별도 테이블이 없다. */
  const screenLinks: Array<{ from: string; to: string }> = (selectedMockup?.screens ?? []).flatMap(
    (s) => {
      if (!s.html_content) return [];
      const targets = new Set(
        [...s.html_content.matchAll(/data-goto="([^"]+)"/g)].map((m) => m[1])
      );
      return [...targets].map((to) => ({ from: s.screen_key, to }));
    }
  );

  /**
   * 핀 번호. 앵커가 살아 있는 **뿌리 의견만** 작성순으로 1..N 을 받는다.
   * 답글은 앵커가 없으므로 번호도 핀도 없다 — 스레드가 가리키는 요소는 뿌리의 것이다.
   */
  const anchorNo = new Map<string, number>();
  for (const c of comments) {
    if (!c.parent_id && c.anchor_status === 'anchored') anchorNo.set(c.id, anchorNo.size + 1);
  }

  /** 지금 보는 화면에 앵커된 의견만 핀으로 그린다. */
  const pins: CanvasPin[] = comments
    .filter((c) => anchorNo.has(c.id) && c.screen_key === activeScreenKey && c.nh_id)
    .map((comment) => ({
      commentId: comment.id,
      nhId: comment.nh_id as string,
      label: String(anchorNo.get(comment.id)),
      userName: comment.user_name,
      userColor: comment.user_color,
      resolved: !!comment.resolved_at,
    }));

  const orphanedComments = comments.filter((c) => c.anchor_status === 'orphaned');

  const activeScreen = selectedMockup?.screens.find((s) => s.screen_key === activeScreenKey) ?? null;
  /**
   * 서버에 저장된 패치 + 이번 세션에서 방금 만든 패치.
   * 새로 만든 것을 서버에서 다시 읽지 않는 이유는, 다시 읽으면 화면 HTML까지 갈아끼워져
   * iframe이 재마운트되고 고른 요소와 스크롤이 날아가기 때문이다.
   */
  const canvasPatches: PatchOp[] = [
    ...(activeScreen?.patches ?? []),
    ...(pendingPatches[activeScreen?.id ?? ''] ?? []),
  ];

  async function savePatch(
    op: 'setText' | 'setStyle',
    nhId: string,
    payload: Record<string, unknown>,
    localOp: PatchOp
  ): Promise<boolean> {
    if (!currentUser || !activeScreen) return false;
    const res = await fetch(`/api/screens/${activeScreen.id}/patches`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: currentUser.id, nhId, op, payload }),
    });
    if (!res.ok) return false;

    const screenId = activeScreen.id;
    setPendingPatches((prev) => ({ ...prev, [screenId]: [...(prev[screenId] ?? []), localOp] }));
    // 편집 이력에 바로 보이게 한다. 화면은 이미 세션 캐시로 갱신됐다.
    if (selectedMockup) fetchPatches(selectedMockup.id);
    return true;
  }

  const handlePatchText = useCallback(
    (nhId: string, value: string) =>
      savePatch('setText', nhId, { value }, { nhId, kind: 'text', value }),
    // savePatch는 렌더마다 새로 만들어지지만 읽는 값이 최신이어야 한다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentUser?.id, activeScreen?.id]
  );

  const handlePatchStyle = useCallback(
    (nhId: string, prop: EditableStyleProp, value: string) =>
      savePatch('setStyle', nhId, { prop, value }, { nhId, kind: 'style', prop, value }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentUser?.id, activeScreen?.id]
  );

  /** 선택한 요소만 AI가 다시 만든다. 실패하면 사람이 읽을 이유를 돌려준다. */
  const handleAiEdit = useCallback(
    async (nhId: string, prompt: string): Promise<string | null> => {
      if (!currentUser || !activeScreen) return '사용자와 화면을 먼저 선택해주세요.';
      try {
        const res = await fetch(`/api/screens/${activeScreen.id}/ai-edit`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: currentUser.id, nhId, prompt }),
        });
        const data = await res.json();
        if (!res.ok) return data.error ?? '요소를 다시 만들지 못했습니다.';

        const screenId = activeScreen.id;
        setPendingPatches((prev) => ({
          ...prev,
          [screenId]: [...(prev[screenId] ?? []), { nhId, kind: 'replace', html: data.html }],
        }));
        if (selectedMockup) fetchPatches(selectedMockup.id);
        return null;
      } catch {
        return '네트워크 오류가 발생했습니다.';
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentUser?.id, activeScreen?.id]
  );

  /**
   * 핀을 누르면 그 요소를 고른 상태로 만들어 의견과 화면이 같이 움직이게 한다.
   *
   * 부모는 요소의 meta를 만들 수 없으므로 프레임에 focusElement를 보내고,
   * 프레임이 되돌려 보내는 select를 사람이 직접 누른 것과 똑같이 처리한다.
   */
  const handlePinClick = useCallback(
    (commentId: string) => {
      const target = comments.find((c) => c.id === commentId);
      if (!target?.nh_id) return;
      setRightOpen(true);
      setRightTab('comments');
      setHighlightedCommentId(commentId);
      if (target.screen_key && target.screen_key !== activeScreenKey) {
        setActiveScreenKey(target.screen_key);
      }
      fromPinRef.current = true;
      setFocusRequest({ nhId: target.nh_id, token: Date.now() });
    },
    [comments, activeScreenKey]
  );

  /** 하이라이트는 잠깐만 둔다. 계속 켜져 있으면 다음에 어느 것을 눌렀는지 알 수 없다. */
  useEffect(() => {
    if (!highlightedCommentId) return;
    const timer = setTimeout(() => setHighlightedCommentId(null), 2600);
    return () => clearTimeout(timer);
  }, [highlightedCommentId]);

  async function handleResolveComment(commentId: string, resolved: boolean) {
    if (!selectedMockup) return;
    const res = await fetch(`/api/comments/${commentId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resolved }),
    });
    if (res.ok) fetchComments(selectedMockup.id);
  }

  /** 앵커가 끊긴 의견을 지금 고른 요소에 다시 붙인다. */
  async function handleReattach(commentId: string) {
    if (!selectedMockup || !selectedElement) return;
    const res = await fetch(`/api/comments/${commentId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ screenKey: activeScreenKey, nhId: selectedElement.nhId }),
    });
    if (res.ok) fetchComments(selectedMockup.id);
  }

  async function handleDecide(findingId: string, decision: Decision) {
    if (!currentUser) return;
    setDecidingId(findingId);
    try {
      const res = await fetch(`/api/findings/${findingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, decision }),
      });
      if (res.ok) {
        const updated: Finding = await res.json();
        setFindings((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
      }
    } finally {
      setDecidingId(null);
    }
  }

  async function handleDecideUx(findingId: string, decision: UsabilityDecision) {
    if (!currentUser) return;
    setDecidingUxId(findingId);
    try {
      const res = await fetch(`/api/usability-findings/${findingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, decision }),
      });
      if (res.ok) {
        const updated: UsabilityFinding = await res.json();
        setUxFindings((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
      }
    } finally {
      setDecidingUxId(null);
    }
  }

  /**
   * 화면 생성은 2단계다.
   * 1단계로 화면 목록을 받고, 2단계로 화면마다 따로 HTML을 만든다.
   *
   * 팬아웃을 서버가 아니라 여기서 하는 이유:
   * 서버가 한 요청에서 N개를 만들면 타임아웃에 걸리고, 어느 화면이 실패했는지도 보이지 않는다.
   * 동시에 2개씩만 던져 API rate limit도 피한다.
   */
  async function generateScreensFor(mockupId: string, screenIds: string[]) {
    const CONCURRENCY = 2;
    const queue = [...screenIds];

    const worker = async () => {
      while (queue.length > 0) {
        const screenId = queue.shift();
        if (!screenId) break;
        setScreenProgress((prev) => ({ ...prev, [screenId]: 'generating' }));
        try {
          const res = await fetch(`/api/screens/${screenId}/generate`, { method: 'POST' });
          setScreenProgress((prev) => ({ ...prev, [screenId]: res.ok ? 'ready' : 'failed' }));
        } catch {
          setScreenProgress((prev) => ({ ...prev, [screenId]: 'failed' }));
        }
        // 한 장이 끝날 때마다 다시 읽어, 먼저 끝난 화면부터 눈에 보이게 한다.
        await loadMockupDetail(mockupId);
      }
    };

    await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  }

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setGenerateError('');
    if (!proposalContent.trim()) { setGenerateError('기획안 내용을 입력해주세요.'); return; }
    setGenerating(true);
    setScreenProgress({});
    try {
      const res = await fetch(`/api/projects/${id}/plan-screens`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proposalContent, description, designSystemId }),
      });
      const data = await res.json();
      if (!res.ok) { setGenerateError(data.error || '화면 목록을 만들지 못했습니다.'); return; }

      setProposalContent('');
      setDescription('');
      fetchProject();
      setLeftTab('history');
      await loadMockupDetail(data.id);

      await generateScreensFor(data.id, (data.screens as ScreenRow[]).map((s) => s.id));

      // 1차 방지(생성 가드레일)를 통과한 결과를 2차로 검토한다
      runReview(data.id);
    } catch { setGenerateError('네트워크 오류가 발생했습니다.'); }
    finally { setGenerating(false); }
  }

  /** 실패한 화면만 다시 만든다. */
  async function handleRetryScreen(screenId: string) {
    if (!selectedMockup) return;
    await generateScreensFor(selectedMockup.id, [screenId]);
  }

  async function handleUploadScreen(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError('');
    setUploadingScreen(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('name', screenName || file.name);
      const res = await fetch(`/api/projects/${id}/reference-screens`, { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) { setUploadError(data.error || '업로드 실패'); return; }
      setScreenName('');
      fetchProject();
    } catch { setUploadError('업로드 중 오류가 발생했습니다.'); }
    finally { setUploadingScreen(false); if (fileInputRef.current) fileInputRef.current.value = ''; }
  }

  async function handleDeleteScreen(screenId: string) {
    if (!confirm('이 참조 화면을 삭제하시겠습니까?')) return;
    await fetch(`/api/projects/${id}/reference-screens`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ screenId }) });
    fetchProject();
  }

  async function handleDeleteMockup(mockupId: string) {
    if (!confirm('이 목업 버전을 삭제하시겠습니까?')) return;
    await fetch(`/api/mockups/${mockupId}`, { method: 'DELETE' });
    if (selectedMockup?.id === mockupId) { setSelectedMockup(null); setComments([]); }
    fetchProject();
  }

  async function handleAddMember() {
    if (!selectedUserId) return;
    setAddingMember(true);
    try {
      const res = await fetch(`/api/projects/${id}/members`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: selectedUserId }) });
      if (res.ok) { setSelectedUserId(''); fetchMembers(); }
    } finally { setAddingMember(false); }
  }

  async function handleRemoveMember(userId: string) {
    if (!confirm('이 담당자를 프로젝트에서 제거하시겠습니까?')) return;
    await fetch(`/api/projects/${id}/members`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId }) });
    fetchMembers();
  }

  /**
   * 이 의견이 가리키는 요소. AI에게 보낼 수 있는지를 이 값이 정한다.
   *
   * 답글이면 뿌리 의견의 앵커를 쓴다 — 답글은 자기 앵커를 갖지 않는다.
   * 새 스레드면 지금 고른 요소를 쓴다. 둘 다 없으면 AI는 무엇을 고칠지 알 수 없다.
   */
  const aiTarget: { screenId: string; nhId: string } | null = (() => {
    if (!selectedMockup) return null;
    if (replyTo) {
      const root = comments.find((c) => c.id === replyTo);
      if (!root?.nh_id || root.anchor_status !== 'anchored') return null;
      const screen = selectedMockup.screens.find((s) => s.screen_key === root.screen_key);
      return screen ? { screenId: screen.id, nhId: root.nh_id } : null;
    }
    if (selectedElement && activeScreen) {
      return { screenId: activeScreen.id, nhId: selectedElement.nhId };
    }
    return null;
  })();

  /**
   * 의견을 남긴다. `askAi`가 참이면 그 의견을 그대로 AI에게 넘겨 요소를 다시 만들게 한다.
   *
   * 의견을 먼저 저장하는 이유는, AI 호출이 실패해도 사람이 쓴 말은 남아야 하기 때문이다.
   * 편집은 그 의견에 연결되어(comment_id) 스레드 안에 결과 카드로 되돌아온다.
   */
  async function submitComment(askAi: boolean) {
    if (!currentUser || !commentText.trim() || !selectedMockup) return;
    if (askAi && !aiTarget) return;

    const text = commentText.trim();
    setCommentError('');
    if (askAi) setAskingAi(true);
    else setPostingComment(true);

    try {
      // 답글이면 앵커를 보내지 않는다. 스레드가 가리키는 요소는 뿌리의 것이다.
      const anchor =
        !replyTo && selectedElement
          ? { screenKey: activeScreenKey, nhId: selectedElement.nhId }
          : {};
      const res = await fetch(`/api/mockups/${selectedMockup.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          content: text,
          parentId: replyTo,
          ...anchor,
        }),
      });
      const created = await res.json();
      if (!res.ok) {
        setCommentError(created.error ?? '의견을 남기지 못했습니다.');
        return;
      }

      setCommentText('');
      setReplyTo(null);

      if (!askAi || !aiTarget) {
        await fetchComments(selectedMockup.id);
        return;
      }

      const aiRes = await fetch(`/api/screens/${aiTarget.screenId}/ai-edit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          nhId: aiTarget.nhId,
          prompt: text,
          commentId: created.id,
        }),
      });
      const aiData = await aiRes.json();
      if (!aiRes.ok) {
        // 의견은 이미 저장됐다. 편집만 실패했다고 정확히 알린다.
        setCommentError(aiData.error ?? 'AI가 요소를 다시 만들지 못했습니다. 의견은 저장됐습니다.');
        await fetchComments(selectedMockup.id);
        return;
      }

      // 서버를 다시 읽으면 iframe이 재마운트되어 고른 요소와 스크롤이 날아간다.
      // 방금 만든 패치만 세션 캐시에 얹어 즉시 반영한다.
      setPendingPatches((prev) => ({
        ...prev,
        [aiTarget.screenId]: [
          ...(prev[aiTarget.screenId] ?? []),
          { nhId: aiTarget.nhId, kind: 'replace', html: aiData.html },
        ],
      }));
      await Promise.all([fetchComments(selectedMockup.id), fetchPatches(selectedMockup.id)]);
    } catch {
      setCommentError('네트워크 오류가 발생했습니다.');
    } finally {
      setPostingComment(false);
      setAskingAi(false);
    }
  }

  /**
   * 지금 보고 있는 화면을 내려받는다.
   *
   * 저장본을 그대로 Blob으로 만들면 **편집이 빠진 파일**이 저장된다 —
   * 편집은 원본을 덮어쓰지 않고 patch로 쌓이기 때문이다. 서버가 얹어 준 것을 받는다.
   * (예전에는 버전의 html_content를 썼는데, 그건 첫 화면 한 장뿐이었다.)
   */
  async function handleDownloadHtml() {
    if (!selectedMockup || !activeScreen?.html_content) return;
    const res = await fetch(`/api/screens/${activeScreen.id}/html`);
    if (!res.ok) {
      setCommentError('HTML을 내려받지 못했습니다.');
      return;
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mockup-v${selectedMockup.version}-${activeScreen.screen_key}.html`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleDeleteComment(commentId: string) {
    await fetch(`/api/comments/${commentId}`, { method: 'DELETE' });
    if (selectedMockup) {
      fetchComments(selectedMockup.id);
      fetchPatches(selectedMockup.id);
    }
  }

  /**
   * 편집을 되돌린다. 행은 지우지 않고 reverted_at만 채워지므로 이력에는 남는다.
   * 화면은 서버에서 다시 읽어 새로 그린다 — 패치 적용이 누적식이라 뺄 수가 없다.
   */
  async function handleRevertPatch(patchId: string) {
    if (!selectedMockup) return;
    setRevertingId(patchId);
    try {
      const res = await fetch(`/api/patches/${patchId}`, { method: 'DELETE' });
      if (!res.ok) {
        setCommentError('되돌리지 못했습니다.');
        return;
      }
      await Promise.all([refreshScreens(selectedMockup.id), fetchPatches(selectedMockup.id)]);
    } finally {
      setRevertingId(null);
    }
  }

  async function handleSendChat(e: React.FormEvent) {
    e.preventDefault();
    if (!currentUser || !chatText.trim()) return;
    setSendingChat(true);
    try {
      const res = await fetch(`/api/projects/${id}/chat`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: currentUser.id, content: chatText }) });
      if (res.ok) { setChatText(''); fetchChat(false); }
    } finally { setSendingChat(false); }
  }

  const availableToAdd = allUsers.filter((u) => !members.some((m) => m.user_id === u.id));
  const hasHighSeverity = findings.some((f) => f.severity === 'HIGH' && !f.decision);
  const hasUndecidedUx = uxFindings.some((f) => !f.decision);

  /**
   * 의견 패널에 그릴 하나의 피드. 사람 댓글과 AI 지적(FR-15)을 시간순으로 합친다.
   *
   * 핀 번호는 **사람 댓글만 세어** 매긴다. 피드 인덱스를 쓰면 AI 카드가 번호를 밀어
   * 캔버스 위의 핀과 목록이 어긋난다.
   */
  /**
   * 의견 스레드.
   *
   * 뿌리 의견 하나가 [답글 · AI가 반영한 편집] 을 시간순으로 품는다.
   * AI의 답을 comments 행으로 만들지 않았기 때문에(ARCHITECTURE.md 12절) 여기서 합친다 —
   * 저장은 element_patches에 분리된 채로 두고 합치는 것은 화면에서만 한다.
   * comment_id가 없는 편집(속성 패널에서 직접 고친 것)은 스레드에 끼지 않고
   * 편집 이력에만 남는다. 어떤 논의에서 나온 것이 아니기 때문이다.
   */
  type ThreadEntry =
    | { kind: 'reply'; at: string; comment: Comment }
    | { kind: 'patch'; at: string; patch: PatchRow };

  const commentById = new Map(comments.map((c) => [c.id, c]));
  const entriesByRoot = new Map<string, ThreadEntry[]>();
  const pushEntry = (rootId: string, entry: ThreadEntry) => {
    const list = entriesByRoot.get(rootId);
    if (list) list.push(entry);
    else entriesByRoot.set(rootId, [entry]);
  };

  for (const c of comments) {
    if (c.parent_id) pushEntry(c.parent_id, { kind: 'reply', at: c.created_at, comment: c });
  }
  for (const p of patchRows) {
    if (!p.comment_id) continue;
    const source = commentById.get(p.comment_id);
    if (!source) continue;
    pushEntry(source.parent_id ?? source.id, { kind: 'patch', at: p.created_at, patch: p });
  }
  for (const list of entriesByRoot.values()) list.sort((a, b) => a.at.localeCompare(b.at));

  const commentFeed: Array<
    | { kind: 'thread'; at: string; root: Comment; no?: number; entries: ThreadEntry[] }
    | { kind: 'ai'; at: string; finding: UsabilityFinding }
  > = [
    ...comments
      .filter((c) => !c.parent_id)
      .map((c) => ({
        kind: 'thread' as const,
        at: c.created_at,
        root: c,
        no: anchorNo.get(c.id),
        entries: entriesByRoot.get(c.id) ?? [],
      })),
    ...uxFindings.map((f) => ({ kind: 'ai' as const, at: f.created_at, finding: f })),
  ].sort((a, b) => a.at.localeCompare(b.at));

  /** 편집 이력. 되돌린 것도 남긴다 — 무엇을 왜 되돌렸는지가 이력의 일부다. */
  const editHistory = [...patchRows].reverse();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }
  if (!project) return null;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header breadcrumb={[{ label: project.name }]} />

      <div className="flex flex-1 overflow-hidden" style={{ height: 'calc(100vh - 56px)' }}>

        {/* ── LEFT SIDEBAR ── */}
        <aside className="w-72 bg-white border-r border-slate-200 flex flex-col overflow-hidden shrink-0">

          {/* Tab bar */}
          <div className="flex border-b border-slate-100 shrink-0">
            {(['refs', 'generate', 'history', 'members'] as LeftTab[]).map((tab) => {
              const labels: Record<LeftTab, string> = { refs: '참조', generate: '생성', history: '히스토리', members: '담당자' };
              return (
                <button
                  key={tab}
                  onClick={() => setLeftTab(tab)}
                  className={`flex-1 py-2.5 text-[11px] font-medium transition-colors ${leftTab === tab ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  {labels[tab]}
                  {tab === 'history' && mockups.length > 0 && (
                    <span className="ml-1 text-[10px] bg-slate-100 text-slate-500 rounded-full px-1">{mockups.length}</span>
                  )}
                  {tab === 'members' && members.length > 0 && (
                    <span className="ml-1 text-[10px] bg-indigo-100 text-indigo-600 rounded-full px-1">{members.length}</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* ── REFS TAB ── */}
          {leftTab === 'refs' && (
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              <p className="text-xs text-slate-500">
                기존 화면 최대 3개를 등록하면 AI가 스타일을 참고해 목업을 생성합니다.
              </p>
              {refScreens.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {refScreens.map((screen) => (
                    <div key={screen.id} className="relative group aspect-square rounded-lg overflow-hidden bg-slate-100 border border-slate-200">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={`/api/reference-screens/${screen.id}`} alt={screen.name} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors flex items-center justify-center">
                        <button onClick={() => handleDeleteScreen(screen.id)} className="opacity-0 group-hover:opacity-100 p-1 bg-red-500 text-white rounded-full transition-opacity">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 bg-black/50 px-1.5 py-0.5">
                        <p className="text-white text-[10px] truncate">{screen.name}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {refScreens.length < 3 && (
                <div className="space-y-2">
                  {uploadError && <p className="text-xs text-red-600">{uploadError}</p>}
                  <input
                    type="text"
                    value={screenName}
                    onChange={(e) => setScreenName(e.target.value)}
                    placeholder="화면 이름 (선택)"
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <label className={`flex items-center justify-center gap-2 w-full py-2 border-2 border-dashed rounded-lg cursor-pointer text-xs transition-colors ${uploadingScreen ? 'border-slate-200 text-slate-300' : 'border-slate-300 text-slate-500 hover:border-indigo-400 hover:text-indigo-600'}`}>
                    {uploadingScreen ? (
                      <><div className="w-3 h-3 border border-indigo-600 border-t-transparent rounded-full animate-spin" />업로드 중...</>
                    ) : (
                      <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>화면 추가 ({refScreens.length}/3)</>
                    )}
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handleUploadScreen} className="hidden" disabled={uploadingScreen} />
                  </label>
                </div>
              )}
              {refScreens.length === 3 && (
                <p className="text-xs text-indigo-600 text-center">참조 화면 3개가 모두 등록되었습니다.</p>
              )}
            </div>
          )}

          {/* ── GENERATE TAB ── */}
          {leftTab === 'generate' && (
            <div className="flex-1 overflow-y-auto p-4">
              <form onSubmit={handleGenerate} className="space-y-3">
                {designSystems.length > 0 && (
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">디자인 시스템</label>
                    <select
                      value={designSystemId}
                      onChange={(e) => setDesignSystemId(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    >
                      {designSystems.map((ds) => (
                        <option key={ds.id} value={ds.id}>{ds.label}</option>
                      ))}
                    </select>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                      {designSystems.find((ds) => ds.id === designSystemId)?.note}
                    </p>
                  </div>
                )}
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">버전 메모 (선택)</label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="예: 로그인 화면 v1"
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    기획안 내용 <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={proposalContent}
                    onChange={(e) => setProposalContent(e.target.value)}
                    placeholder={`화면에 대한 기획안을 입력하세요.\n\n예시:\n- 화면명: 고객 대시보드\n- 목적: 구매내역, 포인트, 배송현황 한눈에 보기\n- 구성:\n  1) 상단: 환영 메시지 + 포인트\n  2) 중단: 최근 주문 목록\n  3) 하단: 배송 추적`}
                    rows={14}
                    className="w-full px-2.5 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  />
                </div>
                {generateError && <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{generateError}</p>}
                <button
                  type="submit"
                  disabled={generating}
                  className={`w-full py-2.5 text-sm font-medium rounded-lg transition-all ${generating ? 'bg-indigo-400 text-white cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
                >
                  {generating ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      생성 중...
                    </span>
                  ) : '목업 생성하기'}
                </button>
                {refScreens.length > 0 && (
                  <p className="text-xs text-indigo-500 text-center">참조 화면 {refScreens.length}개 스타일 반영</p>
                )}
              </form>
            </div>
          )}

          {/* ── HISTORY TAB ── */}
          {leftTab === 'history' && (
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
              {mockups.length === 0 ? (
                <p className="p-5 text-center text-xs text-slate-400">아직 생성된 목업이 없습니다.</p>
              ) : (
                mockups.map((mockup) => (
                  <div
                    key={mockup.id}
                    onClick={() => loadMockupDetail(mockup.id)}
                    className={`p-4 cursor-pointer hover:bg-slate-50 transition-colors ${selectedMockup?.id === mockup.id ? 'bg-indigo-50 border-l-2 border-indigo-600' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-xs font-bold text-indigo-600">v{mockup.version}</span>
                          {designSystemLabel(mockup.design_system_id) && (
                            <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded shrink-0">
                              {designSystemLabel(mockup.design_system_id)}
                            </span>
                          )}
                          {mockup.description && <span className="text-xs text-slate-700 truncate">{mockup.description}</span>}
                        </div>
                        <p className="text-xs text-slate-500 line-clamp-2">{mockup.proposal_content}</p>
                        <p className="text-[10px] text-slate-400 mt-1">{new Date(mockup.created_at).toLocaleString('ko-KR')}</p>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteMockup(mockup.id); }}
                        className="p-1 text-slate-300 hover:text-red-500 transition-colors shrink-0"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* ── MEMBERS TAB ── */}
          {leftTab === 'members' && (
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div>
                <h3 className="text-xs font-semibold text-slate-700 mb-2">프로젝트 담당자</h3>
                {members.length === 0 ? (
                  <p className="text-xs text-slate-400">아직 담당자가 없습니다.</p>
                ) : (
                  <div className="space-y-2">
                    {members.map((member) => (
                      <div key={member.id} className="flex items-center gap-2.5 p-2 bg-slate-50 rounded-lg">
                        <Avatar name={member.user_name} color={member.user_color} size="sm" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-slate-800 truncate">{member.user_name}</p>
                          {member.user_role && member.user_role !== 'member' && (
                            <p className="text-[10px] text-slate-400 truncate">{member.user_role}</p>
                          )}
                        </div>
                        <button
                          onClick={() => handleRemoveMember(member.user_id)}
                          className="p-1 text-slate-300 hover:text-red-500 transition-colors"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="border-t border-slate-100 pt-4">
                <h3 className="text-xs font-semibold text-slate-700 mb-2">담당자 추가</h3>
                {availableToAdd.length === 0 ? (
                  <p className="text-xs text-slate-400">추가할 수 있는 사용자가 없습니다. 헤더에서 새 사용자를 먼저 만드세요.</p>
                ) : (
                  <div className="flex gap-2">
                    <select
                      value={selectedUserId}
                      onChange={(e) => setSelectedUserId(e.target.value)}
                      className="flex-1 px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    >
                      <option value="">사용자 선택...</option>
                      {availableToAdd.map((u) => (
                        <option key={u.id} value={u.id}>{u.name}{u.role && u.role !== 'member' ? ` (${u.role})` : ''}</option>
                      ))}
                    </select>
                    <button
                      onClick={handleAddMember}
                      disabled={!selectedUserId || addingMember}
                      className="px-3 py-1.5 text-xs bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                    >
                      추가
                    </button>
                  </div>
                )}
              </div>

              <div className="border-t border-slate-100 pt-4">
                <p className="text-xs text-slate-400">
                  새 사용자는 상단 헤더의 사용자 선택 메뉴에서 추가할 수 있습니다.
                </p>
              </div>
            </div>
          )}
        </aside>

        {/* ── MAIN CONTENT ── */}
        <main className="flex-1 flex flex-col overflow-hidden bg-slate-100 min-w-0">
          {generating ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4" />
                <p className="text-slate-600 font-medium">AI가 목업을 생성하고 있습니다...</p>
                <p className="text-slate-400 text-sm mt-1">
                  {refScreens.length > 0 ? `참조 화면 ${refScreens.length}개의 스타일을 분석 중입니다.` : '잠시만 기다려주세요.'}
                </p>
              </div>
            </div>
          ) : selectedMockup ? (
            <>
              <div className="bg-white border-b border-slate-200 px-4 py-2 flex items-center gap-3 shrink-0">
                <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">v{selectedMockup.version}</span>
                {designSystemLabel(selectedMockup.design_system_id) && (
                  <span className="text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                    {designSystemLabel(selectedMockup.design_system_id)}
                  </span>
                )}
                {selectedMockup.description && <span className="text-sm font-medium text-slate-700">{selectedMockup.description}</span>}
                <div className="ml-auto flex items-center gap-2">
                  <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
                    {(['select', 'preview'] as const).map((m) => (
                      <button
                        key={m}
                        onClick={() => { setCanvasMode(m); if (m === 'preview') setSelectedElement(null); }}
                        title={m === 'select' ? '요소를 눌러 고릅니다' : '목업을 실제처럼 눌러봅니다'}
                        className={`px-3 py-1 text-xs rounded-md transition-colors ${canvasMode === m ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
                      >
                        {m === 'select' ? '선택' : '미리보기'}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
                    {(['desktop', 'mobile'] as const).map((m) => (
                      <button
                        key={m}
                        onClick={() => setViewMode(m)}
                        className={`px-3 py-1 text-xs rounded-md transition-colors ${viewMode === m ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
                      >
                        {m === 'desktop' ? '데스크톱' : '모바일'}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={handleDownloadHtml}
                    disabled={!activeScreen?.html_content}
                    title={
                      activeScreen?.html_content
                        ? '지금 보고 있는 화면을 편집이 반영된 상태로 내려받습니다'
                        : '아직 만들어지지 않은 화면입니다'
                    }
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    HTML
                  </button>
                  <button
                    onClick={() => setRightOpen(!rightOpen)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${rightOpen ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                    {rightOpen ? '패널 닫기' : '의견/채팅'}
                  </button>
                </div>
              </div>
              {canvasScreens.length > 1 && (
                <div className="bg-white border-b border-slate-200 px-4 py-2 flex items-center gap-2 overflow-x-auto shrink-0">
                  {(selectedMockup?.screens ?? []).map((row, i) => {
                    const s = canvasScreens[i];
                    return (
                      <span key={s.screenKey} className="shrink-0 inline-flex items-center">
                        <button
                          onClick={() => handleNavigate(s.screenKey)}
                          className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${activeScreenKey === s.screenKey ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-medium' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                        >
                          {i + 1}. {s.name}
                          {s.status !== 'ready' && (
                            <span className={`ml-1.5 text-[10px] ${s.status === 'failed' ? 'text-red-500' : 'text-slate-400'}`}>
                              {s.status === 'failed' ? '실패' : s.status === 'generating' ? '생성중' : '대기'}
                            </span>
                          )}
                        </button>
                        {s.status === 'failed' && (
                          <button
                            onClick={() => handleRetryScreen(row.id)}
                            className="ml-1 px-2 py-1.5 text-[10px] font-medium text-indigo-600 hover:text-indigo-800"
                          >
                            다시 시도
                          </button>
                        )}
                      </span>
                    );
                  })}
                  <span className="ml-auto shrink-0 pl-2">
                    <button
                      onClick={() => setShowFlow(!showFlow)}
                      className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${showFlow ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-medium' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                    >
                      {showFlow ? '캔버스' : '흐름 보기'}
                    </button>
                  </span>
                </div>
              )}
              {showFlow && canvasScreens.length > 1 && (
                <ScreenFlow
                  screens={canvasScreens.map((s) => ({ screenKey: s.screenKey, name: s.name, status: s.status }))}
                  links={screenLinks}
                  activeScreenKey={activeScreenKey}
                  onSelect={handleNavigate}
                />
              )}
              <div className={`flex-1 overflow-auto flex items-start justify-center p-6 ${showFlow && canvasScreens.length > 1 ? 'hidden' : ''}`}>
                <DesignCanvas
                  /* 되돌리기는 프레임을 새로 만들어야 한다 — 패치 적용에 취소 연산이 없다. */
                  key={canvasEpoch}
                  screens={canvasScreens}
                  activeScreenKey={activeScreenKey}
                  selectedNhId={selectedElement?.nhId ?? null}
                  pins={pins}
                  patches={canvasPatches}
                  focusRequest={focusRequest}
                  mode={canvasMode}
                  viewMode={viewMode}
                  onSelect={handleSelectElement}
                  onNavigate={handleNavigate}
                  onPinClick={handlePinClick}
                />
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center max-w-sm">
                <div className="w-20 h-20 bg-slate-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-slate-700 mb-2">목업 미리보기</h3>
                <p className="text-sm text-slate-400">
                  왼쪽 &apos;생성&apos; 탭에서 기획안을 입력하거나<br />
                  &apos;히스토리&apos; 탭에서 기존 버전을 선택하세요.
                </p>
              </div>
            </div>
          )}
        </main>

        {/* ── RIGHT PANEL (Comments + Chat) ── */}
        {rightOpen && (
          <aside className="w-80 bg-white border-l border-slate-200 flex flex-col overflow-hidden shrink-0">
            {/* Right Tab bar */}
            <div className="flex border-b border-slate-100 shrink-0">
              {(['element', 'comments', 'review', 'chat'] as RightTab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setRightTab(tab)}
                  className={`flex-1 py-3 text-xs font-medium transition-colors ${rightTab === tab ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  {tab === 'element' && (
                    <span className="inline-flex items-center gap-1">
                      속성
                      {selectedElement && <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />}
                    </span>
                  )}
                  {tab === 'comments' && (
                    <span className="inline-flex items-center gap-1">
                      {/* 숫자는 사람 댓글 수다. AI 지적을 합쳐 세면 "댓글이 몇 개인지"가 안 읽힌다 */}
                      의견 {selectedMockup ? `(${comments.length})` : ''}
                      {uxRunning && <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />}
                      {!uxRunning && hasUndecidedUx && <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />}
                    </span>
                  )}
                  {tab === 'review' && (
                    <span className="inline-flex items-center gap-1">
                      AI 검토 {selectedMockup && !reviewing ? `(${findings.length})` : ''}
                      {reviewing && <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />}
                      {!reviewing && hasHighSeverity && <span className="w-1.5 h-1.5 rounded-full bg-red-500" />}
                    </span>
                  )}
                  {tab === 'chat' && '채팅'}
                </button>
              ))}
            </div>

            {/* ── ELEMENT ── */}
            {rightTab === 'element' && (
              <div className="flex-1 overflow-y-auto">
                <ElementPanel
                  meta={selectedElement}
                  editable={!!currentUser && !!activeScreen}
                  onPatchText={handlePatchText}
                  onPatchStyle={handlePatchStyle}
                  onAiEdit={handleAiEdit}
                />
              </div>
            )}

            {/* ── COMMENTS ── */}
            {rightTab === 'comments' && (
              <div className="flex-1 flex flex-col overflow-hidden">
                {!selectedMockup ? (
                  <div className="flex-1 flex items-center justify-center p-4">
                    <p className="text-xs text-slate-400 text-center">목업 버전을 선택하면<br />의견을 작성할 수 있습니다.</p>
                  </div>
                ) : (
                  <>
                    {/* FR-15 — 담당자가 부를 때만 돈다. 댓글마다 자동 실행하지 않는다 */}
                    <div className="px-3 py-2 border-b border-slate-100 shrink-0 flex items-center justify-between gap-2">
                      <p className="text-[10px] text-slate-400 leading-tight">
                        AI가 제안합니다. 반영 여부는 담당자가 결정합니다.
                      </p>
                      <button
                        onClick={() => selectedMockup && runUxReview(selectedMockup.id, currentUser?.id)}
                        disabled={uxRunning}
                        className="shrink-0 px-2 py-1 text-[11px] font-medium border border-slate-200 text-slate-600 rounded-md hover:bg-slate-50 disabled:opacity-50 transition-colors"
                      >
                        {uxRunning ? '검토 중...' : uxReview ? 'AI에게 다시 검토 요청' : 'AI에게 검토 요청'}
                      </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-3 space-y-3">
                      {uxRunning && (
                        <div className="rounded-lg border border-teal-200 bg-teal-50 px-3 py-2">
                          <p className="text-[11px] text-teal-800">
                            화면과 의견을 함께 읽고 있습니다... 30초 정도 걸립니다.
                          </p>
                        </div>
                      )}
                      {!uxRunning && uxError && (
                        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2">
                          <p className="text-[11px] text-red-700">{uxError}</p>
                        </div>
                      )}
                      {!uxRunning && !uxError && uxReview?.status === 'DONE' && uxFindings.length === 0 && (
                        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                          <p className="text-[11px] text-slate-500">
                            AI가 검토했지만 지적할 항목이 없습니다.
                          </p>
                        </div>
                      )}
                      {orphanedComments.length > 0 && (
                        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
                          <p className="text-[11px] font-medium text-amber-800">
                            위치를 잃은 의견 {orphanedComments.length}건
                          </p>
                          <p className="mt-0.5 text-[10px] leading-relaxed text-amber-700">
                            화면이 다시 만들어지면서 가리키던 요소가 사라졌습니다.
                            {selectedElement ? ' 아래 “여기에 붙이기”를 누르세요.' : ' 화면에서 요소를 고른 뒤 다시 붙일 수 있습니다.'}
                          </p>
                        </div>
                      )}
                      {commentFeed.length === 0 ? (
                        <div className="flex items-center justify-center py-8">
                          <p className="text-xs text-slate-400">아직 의견이 없습니다.<br />첫 번째 의견을 남겨보세요!</p>
                        </div>
                      ) : (
                        commentFeed.map((item) => {
                          if (item.kind === 'ai') {
                            return (
                              <UsabilityCard
                                key={item.finding.id}
                                finding={item.finding}
                                deciding={decidingUxId === item.finding.id}
                                canDecide={!!currentUser}
                                onDecide={handleDecideUx}
                              />
                            );
                          }
                          const comment = item.root;
                          return (
                          <div
                            key={comment.id}
                            className={`rounded-lg transition-colors ${highlightedCommentId === comment.id ? 'bg-indigo-50 -mx-1 px-1 py-1' : ''}`}
                          >
                            <div className="flex gap-2.5">
                            <Avatar name={comment.user_name} color={comment.user_color} size="sm" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-0.5">
                                <span className="flex items-center gap-1.5 min-w-0">
                                  <span className="text-xs font-semibold text-slate-800 truncate">{comment.user_name}</span>
                                  {comment.anchor_status === 'anchored' && (
                                    <span className="shrink-0 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-indigo-600 px-1 text-[9px] font-bold text-white">
                                      {item.no}
                                    </span>
                                  )}
                                  {comment.anchor_status === 'orphaned' && (
                                    <span className="shrink-0 rounded bg-amber-100 px-1 text-[9px] font-medium text-amber-700">위치 없음</span>
                                  )}
                                </span>
                                <div className="flex items-center gap-1">
                                  <span className="text-[10px] text-slate-400">{new Date(comment.created_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}</span>
                                  {currentUser?.id === comment.user_id && (
                                    <button onClick={() => handleDeleteComment(comment.id)} className="p-0.5 text-slate-300 hover:text-red-500 transition-colors">
                                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                    </button>
                                  )}
                                </div>
                              </div>
                              <p className={`text-xs rounded-lg px-3 py-2 ${comment.resolved_at ? 'bg-slate-100 text-slate-400 line-through' : 'bg-slate-50 text-slate-700'}`}>
                                {comment.content}
                              </p>
                              <div className="mt-1 flex items-center gap-2">
                                <button
                                  onClick={() => handleResolveComment(comment.id, !comment.resolved_at)}
                                  className="text-[10px] text-slate-400 hover:text-indigo-600 transition-colors"
                                >
                                  {comment.resolved_at ? '되돌리기' : '해결됨으로 표시'}
                                </button>
                                {currentUser && (
                                  <button
                                    onClick={() => { setReplyTo(comment.id); setCommentError(''); }}
                                    className="text-[10px] font-medium text-slate-400 hover:text-indigo-600 transition-colors"
                                  >
                                    답글
                                  </button>
                                )}
                                {comment.anchor_status === 'orphaned' && selectedElement && (
                                  <button
                                    onClick={() => handleReattach(comment.id)}
                                    className="text-[10px] font-medium text-amber-700 hover:text-amber-900 transition-colors"
                                  >
                                    여기에 붙이기
                                  </button>
                                )}
                              </div>
                            </div>
                            </div>

                            {/* 답글과, 이 스레드에서 나온 편집. 시간순으로 섞인다. */}
                            {item.entries.length > 0 && (
                              <div className="mt-2 ml-3 space-y-2 border-l-2 border-slate-100 pl-3">
                                {item.entries.map((entry) =>
                                  entry.kind === 'reply' ? (
                                    <div key={entry.comment.id} className="flex gap-2">
                                      <Avatar name={entry.comment.user_name} color={entry.comment.user_color} size="sm" />
                                      <div className="min-w-0 flex-1">
                                        <div className="mb-0.5 flex items-center justify-between">
                                          <span className="truncate text-[11px] font-semibold text-slate-800">{entry.comment.user_name}</span>
                                          <div className="flex items-center gap-1">
                                            <span className="text-[10px] text-slate-400">{new Date(entry.comment.created_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}</span>
                                            {currentUser?.id === entry.comment.user_id && (
                                              <button onClick={() => handleDeleteComment(entry.comment.id)} className="p-0.5 text-slate-300 transition-colors hover:text-red-500">
                                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                              </button>
                                            )}
                                          </div>
                                        </div>
                                        <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-700">{entry.comment.content}</p>
                                      </div>
                                    </div>
                                  ) : (
                                    <div
                                      key={entry.patch.id}
                                      className={`rounded-lg border px-3 py-2 ${entry.patch.reverted_at ? 'border-slate-200 bg-slate-50' : 'border-indigo-100 bg-indigo-50'}`}
                                    >
                                      <div className="flex items-center gap-1.5">
                                        <svg className={`h-3 w-3 ${entry.patch.reverted_at ? 'text-slate-400' : 'text-indigo-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M13 3l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                                        </svg>
                                        <span className={`text-[11px] font-bold ${entry.patch.reverted_at ? 'text-slate-500' : 'text-indigo-700'}`}>
                                          {entry.patch.reverted_at ? 'AI 반영을 되돌렸습니다' : 'AI가 반영했습니다'}
                                        </span>
                                        <span className="ml-auto text-[10px] text-slate-400">
                                          {new Date(entry.patch.created_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                      </div>
                                      <p className={`mt-1 text-[11px] leading-relaxed ${entry.patch.reverted_at ? 'text-slate-400 line-through' : 'text-indigo-900'}`}>
                                        &lt;{entry.patch.nh_id}&gt; 요소를 다시 만들었습니다.
                                      </p>
                                      {!entry.patch.reverted_at && (
                                        <button
                                          onClick={() => handleRevertPatch(entry.patch.id)}
                                          disabled={revertingId === entry.patch.id}
                                          className="mt-1.5 rounded-md border border-indigo-200 bg-white px-2 py-1 text-[10px] font-medium text-indigo-700 transition-colors hover:bg-indigo-50 disabled:opacity-50"
                                        >
                                          {revertingId === entry.patch.id ? '되돌리는 중...' : '되돌리기'}
                                        </button>
                                      )}
                                    </div>
                                  )
                                )}
                              </div>
                            )}
                          </div>
                          );
                        })
                      )}
                    </div>
                    <div className="p-3 border-t border-slate-100 shrink-0">
                      {!currentUser ? (
                        <p className="text-xs text-slate-400 text-center">의견을 남기려면 상단에서 사용자를 선택하세요.</p>
                      ) : (
                        <form
                          onSubmit={(e) => { e.preventDefault(); submitComment(false); }}
                          className="space-y-2"
                        >
                          <div className="flex items-center gap-1.5 text-[10px]">
                            {replyTo ? (
                              <>
                                <span className="rounded bg-slate-700 px-1.5 py-0.5 font-medium text-white">답글</span>
                                <span className="min-w-0 truncate text-slate-500">
                                  {comments.find((c) => c.id === replyTo)?.user_name ?? '의견'}의 의견에 답합니다
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setReplyTo(null)}
                                  className="ml-auto shrink-0 text-slate-400 hover:text-slate-600"
                                >
                                  취소
                                </button>
                              </>
                            ) : selectedElement ? (
                              <>
                                <span className="rounded bg-indigo-600 px-1.5 py-0.5 font-mono text-white">
                                  &lt;{selectedElement.tag}&gt;
                                </span>
                                <span className="min-w-0 truncate text-slate-500">
                                  {selectedElement.text ?? '이 요소'}에 대한 의견
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setSelectedElement(null)}
                                  className="ml-auto shrink-0 text-slate-400 hover:text-slate-600"
                                >
                                  전체 의견으로
                                </button>
                              </>
                            ) : (
                              <span className="text-slate-400">
                                화면에서 요소를 클릭하면 그 자리에 의견을 답니다.
                              </span>
                            )}
                          </div>
                          <div className="flex gap-2 items-start">
                            <Avatar name={currentUser.name} color={currentUser.color} size="sm" />
                            <textarea
                              value={commentText}
                              onChange={(e) => setCommentText(e.target.value)}
                              placeholder={aiTarget ? '고쳤으면 하는 점을 적으세요...' : '의견을 입력하세요...'}
                              rows={2}
                              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitComment(false); } }}
                              className="flex-1 px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                            />
                          </div>
                          {commentError && (
                            <p className="rounded-lg bg-red-50 px-2.5 py-1.5 text-[11px] text-red-600">{commentError}</p>
                          )}
                          <div className="flex gap-1.5">
                            <button
                              type="button"
                              onClick={() => submitComment(true)}
                              disabled={!aiTarget || askingAi || postingComment || !commentText.trim()}
                              title={aiTarget ? '이 의견대로 AI가 요소를 다시 만듭니다' : '먼저 화면에서 요소를 고르세요'}
                              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-indigo-600 py-1.5 text-xs font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
                            >
                              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13 3l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                              </svg>
                              {askingAi ? '고치는 중...' : 'AI에게 보내기'}
                            </button>
                            <button
                              type="submit"
                              disabled={postingComment || askingAi || !commentText.trim()}
                              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-50"
                            >
                              {postingComment ? '작성 중...' : '의견만'}
                            </button>
                          </div>
                          {!aiTarget && (
                            <p className="text-[10px] leading-relaxed text-slate-400">
                              AI에게 보내려면 화면에서 요소를 고르거나, 요소를 가리키는 의견에 답글로 다세요.
                            </p>
                          )}
                        </form>
                      )}
                    </div>

                    {/* 편집 이력. 의견에서 나온 것과 속성 패널에서 직접 고친 것이 함께 쌓인다. */}
                    {editHistory.length > 0 && (
                      <div className="shrink-0 border-t border-slate-100 px-3 pb-3 pt-2">
                        <div className="mb-1 flex items-center gap-1.5">
                          <span className="text-[10px] font-semibold tracking-wide text-slate-400">
                            편집 이력 {editHistory.length}
                          </span>
                        </div>
                        <div className="max-h-32 overflow-y-auto">
                          {editHistory.map((p) => (
                            <div key={p.id} className="flex items-center gap-2 py-1">
                              <span
                                className={`h-1.5 w-1.5 shrink-0 rounded-full ${p.reverted_at ? 'bg-slate-300' : p.source === 'ai' ? 'bg-indigo-500' : 'bg-slate-400'}`}
                              />
                              <div className="min-w-0 flex-1">
                                <p
                                  className={`truncate text-[11px] ${p.reverted_at ? 'text-slate-400 line-through' : 'text-slate-600'}`}
                                >
                                  {PATCH_LABEL[p.op]}
                                  {p.reason ? ` — ${p.reason}` : ''}
                                </p>
                                <p className="text-[9px] text-slate-400">
                                  {p.source === 'ai' ? 'AI' : p.user_name} · {p.screen_key} · {p.nh_id}
                                </p>
                              </div>
                              {p.reverted_at ? (
                                <span className="shrink-0 text-[10px] text-slate-400">되돌림</span>
                              ) : (
                                <button
                                  onClick={() => handleRevertPatch(p.id)}
                                  disabled={revertingId === p.id}
                                  className="shrink-0 text-[10px] font-medium text-slate-400 transition-colors hover:text-indigo-600 disabled:opacity-50"
                                >
                                  {revertingId === p.id ? '...' : '되돌리기'}
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* ── AI RESPONSIBILITY REVIEW (FR-14) ── */}
            {rightTab === 'review' && (
              <ReviewPanel
                hasMockup={!!selectedMockup}
                review={review}
                findings={findings}
                reviewing={reviewing}
                decidingId={decidingId}
                canDecide={!!currentUser}
                onRun={() => selectedMockup && runReview(selectedMockup.id)}
                onDecide={handleDecide}
              />
            )}

            {/* ── CHAT ── */}
            {rightTab === 'chat' && (
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto p-3 space-y-3">
                  {chatMessages.length === 0 ? (
                    <div className="flex items-center justify-center py-8">
                      <p className="text-xs text-slate-400 text-center">채팅을 시작해보세요!</p>
                    </div>
                  ) : (
                    chatMessages.map((msg) => {
                      const isMe = currentUser?.id === msg.user_id;
                      return (
                        <div key={msg.id} className={`flex gap-2 ${isMe ? 'flex-row-reverse' : ''}`}>
                          <Avatar name={msg.user_name} color={msg.user_color} size="sm" />
                          <div className={`max-w-[75%] ${isMe ? 'items-end' : 'items-start'} flex flex-col gap-0.5`}>
                            {!isMe && <span className="text-[10px] text-slate-500 px-1">{msg.user_name}</span>}
                            <div className={`px-3 py-2 rounded-2xl text-xs ${isMe ? 'bg-indigo-600 text-white rounded-tr-sm' : 'bg-slate-100 text-slate-800 rounded-tl-sm'}`}>
                              {msg.content}
                            </div>
                            <span className="text-[10px] text-slate-400 px-1">
                              {new Date(msg.created_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={chatEndRef} />
                </div>
                <div className="p-3 border-t border-slate-100 shrink-0">
                  {!currentUser ? (
                    <p className="text-xs text-slate-400 text-center">채팅하려면 상단에서 사용자를 선택하세요.</p>
                  ) : (
                    <form onSubmit={handleSendChat} className="flex gap-2">
                      <input
                        type="text"
                        value={chatText}
                        onChange={(e) => setChatText(e.target.value)}
                        placeholder="메시지 입력..."
                        className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <button
                        type="submit"
                        disabled={sendingChat || !chatText.trim()}
                        className="p-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                      </button>
                    </form>
                  )}
                </div>
              </div>
            )}
          </aside>
        )}
      </div>
    </div>
  );
}

/**
 * 백엔드 응답 타입. 정본은 backend/src/main/java/com/nh/canvas 의 record 들이다.
 * 여기 있는 것은 그 사본이므로, 백엔드 record 가 바뀌면 이 파일도 함께 고쳐야 한다.
 */

/** 모든 목록 API 의 공통 형태 (ARCHITECTURE 8절 — 커서 기반 페이지네이션). */
export interface CursorPage<T> {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

/** GET /api/v1/me — 화면 표시에 필요한 신원만 내려온다. */
export interface Me {
  id: string;
  loginId: string;
  name: string;
  department: string | null;
  email: string | null;
}

export type ProjectRole = "OWNER" | "EDITOR" | "REVIEWER" | "VIEWER";

/** GET /api/v1/projects 의 항목. 목록 화면용 집계가 함께 온다(N+1 방지). */
export interface ProjectSummary {
  id: string;
  name: string;
  purpose: string | null;
  status: string;
  lastActivityAt: string | null;
  createdAt: string;
  myRole: ProjectRole;
  memberCount: number;
  pendingReviewCount: number;
}

export interface Project {
  id: string;
  name: string;
  purpose: string | null;
  description: string | null;
  status: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string | null;
  lastActivityAt: string | null;
}

/** GET /projects/{id} 는 프로젝트만 주지 않는다. 내 권한과 멤버가 함께 온다(N+1 방지). */
export interface ProjectDetail {
  project: Project;
  myRole: ProjectRole;
  members: Member[];
}

export interface Member {
  userId: string;
  loginId: string;
  name: string;
  department: string | null;
  role: ProjectRole;
  createdAt: string;
}

/** 오류 응답 (ARCHITECTURE 9절). 내부 정보는 담기지 않는다. */
export interface ApiErrorBody {
  code: string;
  message: string;
  traceId: string | null;
}

// ---------------------------------------------------------------- 화면 생성 · Version

/** 디자인 시스템은 별도 리소스가 아니라 template_type = BRAND_ASSET 레코드다 (05 9-1절). */
export interface Template {
  id: string;
  code: string;
  name: string;
  description: string | null;
  templateType: "DOCUMENT" | "BRAND_ASSET";
  scope: string;
  status: string;
  updatedAt: string | null;
}

/** V1__init.sql 의 screens.status CHECK 제약과 같아야 한다. */
export type ScreenStatus = "PLANNED" | "GENERATING" | "READY" | "FAILED";

/** 목록용. html_content 가 빠져 있어 화면 여러 장을 한 번에 실어도 응답이 커지지 않는다. */
export interface ScreenSummary {
  id: string;
  versionId: string;
  screenKey: string;
  name: string;
  role: string | null;
  sortOrder: number;
  status: ScreenStatus;
  errorMessage: string | null;
}

export interface Version {
  id: string;
  projectId: string;
  parentVersionId: string | null;
  versionNo: number;
  sourceType: string;
  sourceJobId: string | null;
  designSystemId: string | null;
  proposal: string | null;
  summary: string | null;
  status: string;
  createdBy: string;
  createdByName: string | null;
  createdAt: string;
  screenCount: number;
  openFindingCount: number;
}

export interface VersionDetail {
  version: Version;
  screens: ScreenSummary[];
  files: unknown[];
}

/** POST /projects/{id}/plan-screens — 1단계. 화면 목록만 만들고 HTML 은 만들지 않는다. */
export interface PlanResult {
  version: Version;
  screens: ScreenSummary[];
}

/** POST /screens/{id}/generate — 2단계. 화면 한 장. 팬아웃은 클라이언트가 한다. */
export interface ScreenHtml {
  screenId: string;
  screenKey: string;
  html: string;
  warnings: string[];
}

// ---------------------------------------------------------------- 협업 캔버스

/** 편집 하나. payload 는 서버가 JSON 문자열로 내려준다(목록에서는 빠질 수 있다). */
export interface Patch {
  id: string;
  screenId: string;
  screenKey: string | null;
  nhId: string;
  userId: string;
  userName: string | null;
  op: "setText" | "setStyle" | "setAttr" | "aiRewrite";
  payload: string | null;
  reason: string | null;
  source: string;
  seq: number;
  commentId: string | null;
  createdAt: string;
  /** 되돌린 편집은 이 값이 채워진다. 행은 지우지 않는다(soft revert). */
  revertedAt: string | null;
}

// ---------------------------------------------------------------- 의견

/** 앵커 상태. 화면을 다시 만들면 요소 id 가 바뀌어 orphaned 가 될 수 있다. */
export type AnchorStatus = "none" | "anchored" | "orphaned";

export interface Comment {
  id: string;
  projectId: string;
  versionId: string | null;
  screenId: string | null;
  /** 답글이면 뿌리 의견의 id. 답글은 자기 앵커를 갖지 않는다. */
  parentId: string | null;
  nhId: string | null;
  anchorStatus: AnchorStatus;
  body: string;
  authorId: string;
  authorName: string | null;
  createdAt: string;
  updatedAt: string | null;
  resolvedAt: string | null;
}

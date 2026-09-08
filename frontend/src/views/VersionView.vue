<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { api, ApiError } from "@/api/client";
import DesignCanvas from "@/components/DesignCanvas.vue";
import ElementPanel from "@/components/ElementPanel.vue";
import CommentThread from "@/components/CommentThread.vue";
import ReviewPanel from "@/components/ReviewPanel.vue";
import type {
  Comment,
  Patch,
  ResponsibilityFinding,
  ReviewView,
  ScreenHtml,
  ScreenSummary,
  UsabilityFinding,
  VersionDetail,
} from "@/api/types";
import type { CanvasMode, EditableAttr, EditableStyleProp, ElementMeta } from "@/canvas/protocol";

const props = defineProps<{ versionId: string }>();

const detail = ref<VersionDetail | null>(null);
const error = ref<string | null>(null);

/** 화면별 HTML 은 목록 응답에 없다(응답이 커지지 않게 뺐다). 필요할 때 따로 받는다. */
const html = ref<Record<string, string>>({});
const busy = ref<Set<string>>(new Set());
const failures = ref<Record<string, string>>({});
const selected = ref<string | null>(null);

const mode = ref<CanvasMode>("view");
const canvas = ref<InstanceType<typeof DesignCanvas> | null>(null);
const picked = ref<ElementMeta | null>(null);
const patches = ref<Patch[]>([]);
const comments = ref<Comment[]>([]);
const editing = ref(false);
const commenting = ref(false);

const responsibility = ref<ReviewView<ResponsibilityFinding> | null>(null);
const usability = ref<ReviewView<UsabilityFinding> | null>(null);
const reviewing = ref<string | null>(null);
const deciding = ref(false);

/**
 * AI 가 교체한 요소는 서버가 식별자를 다시 붙이기 전까지 편집이 조용히 무시된다
 * (교체된 서브트리에 data-nh-id 가 없고 screen_elements 도 갱신되지 않는다).
 * 201 을 받고도 baking 에서 "요소를 찾지 못해 건너뜀"이 되므로, 사용자가 헛수고하지
 * 않도록 화면에서 먼저 막는다. 백엔드가 고쳐지면 이 잠금은 지운다.
 */
const aiRewrittenIds = computed(
  () => new Set(patches.value.filter((p) => p.op === "aiRewrite" && !p.revertedAt).map((p) => p.nhId))
);

const pickedLocked = computed(() => !!picked.value && aiRewrittenIds.value.has(picked.value.nhId));

const screens = computed(() => detail.value?.screens ?? []);
const current = computed(() => screens.value.find((s) => s.id === selected.value) ?? null);
const generating = computed(() => busy.value.size > 0);

async function load() {
  try {
    detail.value = await api.get<VersionDetail>(`/versions/${props.versionId}`);
    selected.value = detail.value.screens[0]?.id ?? null;
    await Promise.all([loadPatches(), loadComments(), loadReviews()]);
    // 이미 만들어진 화면은 바로 보여준다.
    await Promise.all(detail.value.screens.filter((s) => s.status === "READY").map(fetchHtml));
  } catch (e) {
    error.value = e instanceof ApiError ? e.message : "버전을 불러오지 못했습니다.";
  }
}

/**
 * 검토는 Version 단위다(화면 단위가 아니다). 책임성은 생성 직후 돌 수 있고,
 * UX 리스크는 논의가 쌓인 뒤 담당자가 부를 때만 돈다 (ARCHITECTURE 12절).
 * 여기서는 이미 돌아 있는 최신 결과만 읽는다 — 실행은 사용자가 누를 때만 한다.
 */
async function loadReviews() {
  const paths = [
    ["responsibility", `/versions/${props.versionId}/responsibility-review`] as const,
    ["usability", `/versions/${props.versionId}/usability-review`] as const,
  ];
  for (const [kind, path] of paths) {
    try {
      const view = await api.get<ReviewView<never>>(path);
      if (kind === "responsibility") responsibility.value = view as ReviewView<ResponsibilityFinding>;
      else usability.value = view as ReviewView<UsabilityFinding>;
    } catch {
      // 아직 한 번도 돌지 않았으면 없는 게 정상이다. 오류로 시끄럽게 하지 않는다.
    }
  }
}

async function runReview(kind: "responsibility" | "usability") {
  reviewing.value = kind;
  error.value = null;
  try {
    const path = `/versions/${props.versionId}/${kind === "responsibility" ? "responsibility" : "usability"}-review`;
    const view = await api.post<ReviewView<never>>(path);
    if (kind === "responsibility") responsibility.value = view as ReviewView<ResponsibilityFinding>;
    else usability.value = view as ReviewView<UsabilityFinding>;
  } catch (e) {
    error.value = e instanceof ApiError ? e.message : "검토를 실행하지 못했습니다.";
  } finally {
    reviewing.value = null;
  }
}

/** 결정이 Version 의 근거로 남는다. 그래서 이유를 함께 보낸다. */
async function decide(kind: "responsibility" | "usability", findingId: string, decision: string, reason: string) {
  deciding.value = true;
  try {
    const base = kind === "responsibility" ? "responsibility-findings" : "usability-findings";
    await api.patch(`/${base}/${findingId}`, { decision, reason: reason || null });
    await loadReviews();
  } catch (e) {
    error.value = e instanceof ApiError ? e.message : "결정을 저장하지 못했습니다.";
  } finally {
    deciding.value = false;
  }
}

async function loadComments() {
  if (!current.value) return;
  try {
    comments.value = await api.get<Comment[]>(`/screens/${current.value.id}/comments`);
  } catch {
    // 의견을 못 읽어도 캔버스는 쓸 수 있어야 한다.
  }
}

/** 새 의견은 지금 고른 요소에 붙는다. 답글은 자기 앵커를 갖지 않는다(핀은 뿌리에만). */
async function addComment(body: string, nhId: string | null, parentId: string | null) {
  if (!current.value) return;
  commenting.value = true;
  try {
    await api.post<Comment>(`/screens/${current.value.id}/comments`, { body, nhId, parentId });
    await loadComments();
  } catch (e) {
    error.value = e instanceof ApiError ? e.message : "의견을 남기지 못했습니다.";
  } finally {
    commenting.value = false;
  }
}

async function toggleResolved(comment: Comment) {
  try {
    await api.patch<Comment>(`/comments/${comment.id}`, { resolved: !comment.resolvedAt });
    await loadComments();
  } catch (e) {
    error.value = e instanceof ApiError ? e.message : "상태를 바꾸지 못했습니다.";
  }
}

/** 의견의 앵커를 캔버스에서 다시 짚는다. 편집 모드가 아니어도 어디를 가리키는지는 보여야 한다. */
function focusAnchor(nhId: string) {
  canvas.value?.select(nhId);
}

async function loadPatches() {
  try {
    patches.value = await api.get<Patch[]>(`/versions/${props.versionId}/patches`);
  } catch {
    // 편집 이력을 못 읽어도 캔버스 자체는 쓸 수 있어야 한다.
  }
}

/**
 * 편집을 서버에 남기고 화면에 즉시 반영한다.
 *
 * 저장본을 다시 받아오지 않고 프레임에만 연산을 보낸다 — 편집 한 번마다 화면 HTML을
 * 통째로 다시 받으면 스크롤과 선택이 매번 초기화된다. 저장본과 화면이 어긋나는 것은
 * 다음 로드에서 baked HTML 이 맞춰 준다.
 */
async function commit(op: string, payload: Record<string, string>, apply: () => void) {
  if (!picked.value || !current.value) return;
  editing.value = true;
  try {
    await api.post<Patch>(`/screens/${current.value.id}/patches`, {
      nhId: picked.value.nhId,
      op,
      payload,
    });
    apply();
    await loadPatches();
  } catch (e) {
    error.value = e instanceof ApiError ? e.message : "편집을 저장하지 못했습니다.";
  } finally {
    editing.value = false;
  }
}

function setText(value: string) {
  const nhId = picked.value!.nhId;
  commit("setText", { value }, () => canvas.value?.apply([{ kind: "text", nhId, value }]));
}

function setStyle(prop: EditableStyleProp, value: string) {
  const nhId = picked.value!.nhId;
  commit("setStyle", { prop, value }, () => canvas.value?.apply([{ kind: "style", nhId, prop, value }]));
}

function setAttr(name: EditableAttr, value: string) {
  const nhId = picked.value!.nhId;
  commit("setAttr", { name, value }, () => canvas.value?.apply([{ kind: "attr", nhId, name, value }]));
}

/** AI 편집만은 결과 HTML 을 서버가 만들므로, 반영된 화면을 다시 받아야 한다. */
async function aiEdit(instruction: string) {
  if (!picked.value || !current.value) return;
  editing.value = true;
  error.value = null;
  try {
    await api.post<Patch>(`/screens/${current.value.id}/ai-edit`, {
      nhId: picked.value.nhId,
      instruction,
    });
    await fetchHtml(current.value);
    await loadPatches();
    picked.value = null;
  } catch (e) {
    error.value = e instanceof ApiError ? e.message : "AI 편집에 실패했습니다.";
  } finally {
    editing.value = false;
  }
}

async function revert(patch: Patch) {
  try {
    await api.delete(`/patches/${patch.id}`);
    await loadPatches();
    if (current.value) await fetchHtml(current.value);
  } catch (e) {
    error.value = e instanceof ApiError ? e.message : "되돌리지 못했습니다.";
  }
}

/** 프레임 안에서 data-goto 를 누르면 그 화면으로 옮긴다. 이동 판단은 부모가 한다. */
function goToScreen(screenKey: string) {
  const target = screens.value.find((s) => s.screenKey === screenKey);
  if (target) {
    selected.value = target.id;
    picked.value = null;
  }
}

async function fetchHtml(screen: ScreenSummary) {
  try {
    const body = await api.get<ScreenHtml>(`/screens/${screen.id}/html`);
    html.value[screen.id] = body.html;
  } catch {
    // 아직 없는 화면일 수 있다. 미리보기가 비는 것으로 충분하고 오류로 시끄럽게 하지 않는다.
  }
}

async function generate(screen: ScreenSummary) {
  busy.value = new Set(busy.value).add(screen.id);
  delete failures.value[screen.id];
  try {
    const body = await api.post<ScreenHtml>(`/screens/${screen.id}/generate`);
    html.value[screen.id] = body.html;
    screen.status = "READY";
  } catch (e) {
    const message = e instanceof ApiError ? e.message : "화면을 만들지 못했습니다.";
    failures.value[screen.id] = message;
    screen.status = "FAILED";
  } finally {
    const next = new Set(busy.value);
    next.delete(screen.id);
    busy.value = next;
  }
}

/**
 * 팬아웃은 클라이언트 몫이다 (04_SYSTEM_ARCHITECTURE 4절 — 동기 단건 경로).
 * 한꺼번에 다 던지지 않고 2장씩 흘린다. LLM 동시 호출 한도가 아직 미결이라,
 * 한도를 모르는 상태에서 화면 수만큼 동시에 던지는 것은 위험하다.
 */
async function generateAll() {
  const queue = screens.value.filter((s) => s.status !== "READY");
  const CONCURRENCY = 2;
  const workers = Array.from({ length: Math.min(CONCURRENCY, queue.length) }, async () => {
    for (let next = queue.shift(); next; next = queue.shift()) {
      await generate(next);
    }
  });
  await Promise.all(workers);
}

function label(status: ScreenSummary["status"]): string {
  return { PLANNED: "대기", GENERATING: "생성 중", READY: "완료", FAILED: "실패" }[status] ?? status;
}

// 화면을 바꾸면 의견도 그 화면 것으로 바꾼다.
watch(selected, () => {
  comments.value = [];
  loadComments();
});

onMounted(load);
</script>

<template>
  <p v-if="error" class="error">{{ error }}</p>

  <template v-if="detail">
    <header class="head">
      <div>
        <h1>v{{ detail.version.versionNo }}</h1>
        <p class="muted">
          화면 {{ detail.version.screenCount }}장
          <template v-if="detail.version.createdByName"> · {{ detail.version.createdByName }}</template>
        </p>
      </div>
      <button class="primary" :disabled="generating" @click="generateAll">
        {{ generating ? `만드는 중… (${busy.size})` : "전부 만들기" }}
      </button>
    </header>

    <div class="split">
      <ul class="list">
        <li v-for="s in screens" :key="s.id">
          <button class="screen" :class="{ on: s.id === selected }" @click="selected = s.id; picked = null">
            <span class="name">{{ s.name }}</span>
            <span class="badge" :class="s.status.toLowerCase()">{{ label(s.status) }}</span>
            <span v-if="s.role" class="muted role">{{ s.role }}</span>
          </button>
        </li>
      </ul>

      <section v-if="current">
        <div class="bar">
          <strong>{{ current.name }}</strong>
          <button :class="{ primary: mode === 'edit' }" :disabled="!html[current.id]" @click="mode = mode === 'edit' ? 'view' : 'edit'">
            {{ mode === "edit" ? "편집 끝내기" : "편집하기" }}
          </button>
          <button :disabled="busy.has(current.id)" @click="generate(current)">
            {{ busy.has(current.id) ? "만드는 중…" : html[current.id] ? "다시 만들기" : "만들기" }}
          </button>
        </div>
        <p v-if="failures[current.id]" class="error">{{ failures[current.id] }}</p>

        <div class="stage" :class="{ editing: mode === 'edit' }">
          <DesignCanvas
            ref="canvas"
            :html="html[current.id] ?? null"
            :mode="mode"
            :name="current.name"
            @select="picked = $event"
            @navigate="goToScreen"
          />
          <ElementPanel
            v-if="mode === 'edit'"
            :element="picked"
            :busy="editing"
            :locked="pickedLocked"
            @set-text="setText"
            @set-style="setStyle"
            @set-attr="setAttr"
            @ai-edit="aiEdit"
          />
        </div>

        <ReviewPanel
          class="reviews"
          :responsibility="responsibility"
          :usability="usability"
          :busy="reviewing"
          :deciding="deciding"
          @run="runReview"
          @decide-responsibility="(id, d, r) => decide('responsibility', id, d, r)"
          @decide-usability="(id, d, r) => decide('usability', id, d, r)"
        />

        <CommentThread
          class="comments"
          :comments="comments"
          :anchor-nh-id="picked?.nhId ?? null"
          :busy="commenting"
          @create="addComment"
          @toggle-resolved="toggleResolved"
          @focus-anchor="focusAnchor"
        />

        <section v-if="patches.length" class="card history">
          <h2>편집 이력</h2>
          <ul class="list">
            <li v-for="p in patches" :key="p.id" :class="{ reverted: p.revertedAt }">
              <span class="badge">{{ p.op }}</span>
              <span class="muted mono">{{ p.nhId }}</span>
              <span v-if="p.screenKey" class="muted">· {{ p.screenKey }}</span>
              <span class="muted">· {{ p.userName ?? "" }}</span>
              <span v-if="p.source === 'AI'" class="badge">AI</span>
              <button v-if="!p.revertedAt" class="tiny" @click="revert(p)">되돌리기</button>
              <span v-else class="muted">되돌림</span>
            </li>
          </ul>
        </section>
      </section>
    </div>
  </template>
</template>

<style scoped>
.head { display: flex; align-items: flex-start; gap: 12px; }
.head h1 { margin: 0 0 4px; }
.head button { margin-left: auto; }
.split { display: grid; grid-template-columns: 220px 1fr; gap: 16px; margin-top: 16px; }
.list { list-style: none; padding: 0; margin: 0; display: grid; gap: 6px; align-content: start; }
.screen { width: 100%; text-align: left; display: grid; gap: 4px; justify-items: start; }
.screen.on { border-color: var(--nh-green); }
.name { font-weight: 600; }
.role { font-size: 12px; }
.bar { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
.bar button { margin-left: auto; }
.badge.ready { border-color: var(--nh-green); color: var(--nh-green); }
.stage { display: grid; gap: 12px; }
.stage.editing { grid-template-columns: 1fr 300px; }
.reviews { margin-top: 14px; }
.comments { margin-top: 14px; }
.history { margin-top: 14px; }
.history h2 { font-size: 14px; margin: 0 0 10px; }
.history li { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; font-size: 13px; }
.history li.reverted { opacity: 0.5; }
.mono { font-family: ui-monospace, monospace; font-size: 12px; }
.tiny { padding: 2px 8px; font-size: 12px; margin-left: auto; }
.badge.failed { border-color: #fca5a5; color: #991b1b; }

@media (max-width: 1100px) {
  .stage.editing { grid-template-columns: 1fr; }
}

@media (max-width: 720px) {
  .split { grid-template-columns: 1fr; }
}
</style>

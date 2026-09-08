<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { api, ApiError } from "@/api/client";
import ScreenPreview from "@/components/ScreenPreview.vue";
import type { ScreenHtml, ScreenSummary, VersionDetail } from "@/api/types";

const props = defineProps<{ versionId: string }>();

const detail = ref<VersionDetail | null>(null);
const error = ref<string | null>(null);

/** 화면별 HTML 은 목록 응답에 없다(응답이 커지지 않게 뺐다). 필요할 때 따로 받는다. */
const html = ref<Record<string, string>>({});
const busy = ref<Set<string>>(new Set());
const failures = ref<Record<string, string>>({});
const selected = ref<string | null>(null);

const screens = computed(() => detail.value?.screens ?? []);
const current = computed(() => screens.value.find((s) => s.id === selected.value) ?? null);
const generating = computed(() => busy.value.size > 0);

async function load() {
  try {
    detail.value = await api.get<VersionDetail>(`/versions/${props.versionId}`);
    selected.value = detail.value.screens[0]?.id ?? null;
    // 이미 만들어진 화면은 바로 보여준다.
    await Promise.all(detail.value.screens.filter((s) => s.status === "READY").map(fetchHtml));
  } catch (e) {
    error.value = e instanceof ApiError ? e.message : "버전을 불러오지 못했습니다.";
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
          <button class="screen" :class="{ on: s.id === selected }" @click="selected = s.id">
            <span class="name">{{ s.name }}</span>
            <span class="badge" :class="s.status.toLowerCase()">{{ label(s.status) }}</span>
            <span v-if="s.role" class="muted role">{{ s.role }}</span>
          </button>
        </li>
      </ul>

      <section v-if="current">
        <div class="bar">
          <strong>{{ current.name }}</strong>
          <button :disabled="busy.has(current.id)" @click="generate(current)">
            {{ busy.has(current.id) ? "만드는 중…" : html[current.id] ? "다시 만들기" : "만들기" }}
          </button>
        </div>
        <p v-if="failures[current.id]" class="error">{{ failures[current.id] }}</p>
        <ScreenPreview :html="html[current.id] ?? null" :name="current.name" />
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
.badge.failed { border-color: #fca5a5; color: #991b1b; }

@media (max-width: 720px) {
  .split { grid-template-columns: 1fr; }
}
</style>

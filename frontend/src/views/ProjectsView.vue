<script setup lang="ts">
import { onMounted, ref } from "vue";
import { api, ApiError } from "@/api/client";
import type { CursorPage, ProjectSummary } from "@/api/types";

const items = ref<ProjectSummary[]>([]);
const nextCursor = ref<string | null>(null);
const loading = ref(false);
const error = ref<string | null>(null);

const newName = ref("");
const creating = ref(false);

/** 커서 기반이라 append 로 이어 붙인다. 전체를 다시 받지 않는다 (ARCHITECTURE 8절). */
async function loadMore(reset = false) {
  loading.value = true;
  error.value = null;
  try {
    const query = reset || !nextCursor.value ? "" : `?cursor=${encodeURIComponent(nextCursor.value)}`;
    const page = await api.get<CursorPage<ProjectSummary>>(`/projects${query}`);
    items.value = reset ? page.items : [...items.value, ...page.items];
    nextCursor.value = page.hasMore ? page.nextCursor : null;
  } catch (e) {
    error.value = e instanceof ApiError ? e.message : "프로젝트 목록을 불러오지 못했습니다.";
  } finally {
    loading.value = false;
  }
}

async function create() {
  const name = newName.value.trim();
  if (!name) return;
  creating.value = true;
  error.value = null;
  try {
    await api.post("/projects", { name });
    newName.value = "";
    await loadMore(true);
  } catch (e) {
    error.value = e instanceof ApiError ? e.message : "프로젝트를 만들지 못했습니다.";
  } finally {
    creating.value = false;
  }
}

function when(value: string | null): string {
  return value ? new Date(value).toLocaleDateString("ko-KR") : "-";
}

onMounted(() => loadMore(true));
</script>

<template>
  <h1>프로젝트</h1>

  <form class="card row" @submit.prevent="create">
    <input v-model="newName" placeholder="새 프로젝트 이름" :disabled="creating" />
    <button class="primary" type="submit" :disabled="creating || !newName.trim()">만들기</button>
  </form>

  <p v-if="error" class="error">{{ error }}</p>

  <p v-if="!loading && items.length === 0" class="muted">아직 프로젝트가 없습니다.</p>

  <ul class="list">
    <li v-for="p in items" :key="p.id" class="card">
      <RouterLink :to="`/projects/${p.id}`" class="title">{{ p.name }}</RouterLink>
      <span class="badge">{{ p.myRole }}</span>
      <p class="muted meta">
        멤버 {{ p.memberCount }}명
        <template v-if="p.pendingReviewCount > 0"> · 미처리 검토 {{ p.pendingReviewCount }}건</template>
        · 최근 활동 {{ when(p.lastActivityAt) }}
      </p>
      <p v-if="p.purpose" class="muted">{{ p.purpose }}</p>
    </li>
  </ul>

  <button v-if="nextCursor" :disabled="loading" @click="loadMore()">
    {{ loading ? "불러오는 중…" : "더 보기" }}
  </button>
</template>

<style scoped>
.row { display: flex; gap: 8px; margin-bottom: 16px; }
.row input { flex: 1; }
.list { list-style: none; padding: 0; margin: 0 0 16px; display: grid; gap: 10px; }
.title { font-weight: 600; text-decoration: none; margin-right: 8px; }
.meta { margin: 6px 0 0; font-size: 13px; }
</style>

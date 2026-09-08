<script setup lang="ts">
import { onMounted, ref } from "vue";
import { api, ApiError } from "@/api/client";
import type { CursorPage, ProjectDetail, Version } from "@/api/types";

const props = defineProps<{ projectId: string }>();

const detail = ref<ProjectDetail | null>(null);
const versions = ref<Version[]>([]);
const error = ref<string | null>(null);

onMounted(async () => {
  try {
    // 멤버는 상세 응답에 이미 들어 있다. 따로 부르지 않는다.
    detail.value = await api.get<ProjectDetail>(`/projects/${props.projectId}`);
    const versionPage = await api.get<CursorPage<Version>>(`/projects/${props.projectId}/versions`);
    versions.value = versionPage.items;
  } catch (e) {
    // 멤버가 아니면 403 이 온다. 그 구분이 사용자에게 보여야 한다 (ARCHITECTURE 9절).
    error.value = e instanceof ApiError ? e.message : "프로젝트를 불러오지 못했습니다.";
  }
});
</script>

<template>
  <p v-if="error" class="error">{{ error }}</p>

  <template v-if="detail">
    <h1>{{ detail.project.name }}</h1>
    <p v-if="detail.project.purpose" class="muted">{{ detail.project.purpose }}</p>

    <section class="card">
      <h2>멤버 <span class="badge">내 권한 {{ detail.myRole }}</span></h2>
      <ul class="list">
        <li v-for="m in detail.members" :key="m.userId">
          {{ m.name }} <span class="badge">{{ m.role }}</span>
          <span class="muted"> {{ m.department ?? m.loginId }}</span>
        </li>
      </ul>
    </section>

    <section class="card">
      <div class="bar">
        <h2>버전</h2>
        <RouterLink :to="`/projects/${projectId}/generate`">
          <button class="primary">화면 만들기</button>
        </RouterLink>
      </div>

      <p v-if="versions.length === 0" class="muted">아직 만든 화면이 없습니다.</p>
      <ul v-else class="list">
        <li v-for="v in versions" :key="v.id">
          <RouterLink :to="`/versions/${v.id}`">v{{ v.versionNo }}</RouterLink>
          <span class="muted"> 화면 {{ v.screenCount }}장</span>
          <span v-if="v.openFindingCount > 0" class="badge">미처리 지적 {{ v.openFindingCount }}건</span>
        </li>
      </ul>
    </section>

    <p class="muted note">협업 캔버스와 검토는 아직 붙이지 않았습니다.</p>
  </template>
</template>

<style scoped>
h2 { font-size: 15px; margin: 0; }
section.card { margin-top: 14px; }
.bar { display: flex; align-items: center; margin-bottom: 10px; }
.bar a { margin-left: auto; }
.list { list-style: none; padding: 0; margin: 0; display: grid; gap: 6px; }
.note { margin-top: 16px; }
</style>

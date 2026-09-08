<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { api, ApiError } from "@/api/client";
import type { PlanResult, Template } from "@/api/types";

const props = defineProps<{ projectId: string }>();
const router = useRouter();

const proposal = ref("");
const designSystemId = ref<string>("");
const systems = ref<Template[]>([]);
const planning = ref(false);
const error = ref<string | null>(null);

onMounted(async () => {
  try {
    // 디자인 시스템은 별도 리소스가 아니라 BRAND_ASSET 템플릿이다 (05 9-1절).
    systems.value = await api.get<Template[]>("/templates?type=BRAND_ASSET");
  } catch (e) {
    error.value = e instanceof ApiError ? e.message : "디자인 시스템 목록을 불러오지 못했습니다.";
  }
});

/**
 * 1단계만 여기서 한다. 화면 목록·역할만 만들고 HTML 은 만들지 않는다.
 * 화면별 생성은 Version 화면에서 팬아웃한다 — 한 장이 실패해도 나머지는 살아야 하고,
 * 어디까지 됐는지가 화면에 보여야 하기 때문이다.
 */
async function plan() {
  const text = proposal.value.trim();
  if (!text) return;
  planning.value = true;
  error.value = null;
  try {
    const result = await api.post<PlanResult>(`/projects/${props.projectId}/plan-screens`, {
      proposal: text,
      designSystemId: designSystemId.value || null,
    });
    router.push(`/versions/${result.version.id}`);
  } catch (e) {
    error.value = e instanceof ApiError ? e.message : "화면을 계획하지 못했습니다.";
  } finally {
    planning.value = false;
  }
}
</script>

<template>
  <h1>화면 만들기</h1>
  <p class="muted">기획안을 넣으면 AI 가 필요한 화면을 먼저 나열합니다. 그림은 그다음 단계입니다.</p>

  <p v-if="error" class="error">{{ error }}</p>

  <form class="card" @submit.prevent="plan">
    <label>
      <span>기획안</span>
      <textarea
        v-model="proposal"
        rows="10"
        placeholder="어떤 업무의, 어떤 화면이 필요한지 적어주세요."
        :disabled="planning"
        required
      ></textarea>
    </label>

    <label>
      <span>디자인 시스템</span>
      <select v-model="designSystemId" :disabled="planning">
        <option value="">고르지 않음</option>
        <option v-for="s in systems" :key="s.id" :value="s.id">{{ s.name }}</option>
      </select>
      <small class="muted">
        모바일 앱과 기업 웹은 화면 폭·내비게이션이 달라 하나로 통일할 수 없습니다.
      </small>
    </label>

    <div class="actions">
      <button type="button" @click="router.back()">취소</button>
      <button class="primary" type="submit" :disabled="planning || !proposal.trim()">
        {{ planning ? "화면을 나열하는 중…" : "화면 나열하기" }}
      </button>
    </div>
  </form>
</template>

<style scoped>
form { display: grid; gap: 18px; }
label { display: grid; gap: 6px; }
label > span { font-weight: 600; }
textarea, select { font: inherit; padding: 9px 11px; border: 1px solid var(--line); border-radius: 8px; }
textarea { resize: vertical; }
.actions { display: flex; gap: 8px; justify-content: flex-end; }
small { font-size: 12px; }
</style>

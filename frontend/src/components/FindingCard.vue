<script setup lang="ts">
import { ref } from "vue";

/**
 * AI 지적 하나. 책임성(FR-14)과 UX 리스크(FR-15)가 같은 카드를 쓴다.
 *
 * 두 검토는 입력·기준·실행 시점이 다르지만(08_DECISIONS 1절), **담당자가 하는 일은 같다** —
 * 근거를 보고 반영/보류/반려를 고른다. 그래서 카드는 하나로 두고 결정 선택지만 다르게 받는다.
 *
 * `준법 검토 요청`은 책임성 고유다. UX 검토에는 준법 축이 없다.
 */
// 템플릿에서만 쓰므로 변수에 담지 않는다.
defineProps<{
  kind: "책임성" | "UX";
  /** 규칙 ID(FR-14) 또는 렌즈 ID(FR-15). 어느 기준에 걸렸는지 보여 준다. */
  basis: string;
  severity: string;
  title: string;
  evidence: string;
  why: string;
  suggestion: string;
  decision: string | null;
  decisionByName: string | null;
  decisionReason: string | null;
  decisions: readonly string[];
  /** 근거 출처(FR-15만). 기획안·화면·의견 중 어디서 인용했는지. */
  evidenceSource?: string;
  busy: boolean;
}>();

const emit = defineEmits<{ decide: [decision: string, reason: string] }>();

const open = ref(false);
const chosen = ref("");
const reason = ref("");

const LABEL: Record<string, string> = {
  ACCEPTED: "반영",
  DEFERRED: "보류",
  REJECTED: "반려",
  COMPLIANCE_REQUESTED: "준법 검토 요청",
};

/** 서버는 코드값을 준다. 그대로 노출하면 화면에 "DISCUSSION" 이 뜬다. */
const SOURCE_LABEL: Record<string, string> = {
  PROPOSAL: "기획안에서 인용",
  SCREEN: "화면에서 인용",
  DISCUSSION: "의견에서 인용",
};

function submit() {
  if (!chosen.value) return;
  emit("decide", chosen.value, reason.value.trim());
  open.value = false;
  reason.value = "";
}
</script>

<template>
  <li class="finding" :class="{ decided: decision }">
    <div class="head">
      <span class="badge kind">{{ kind }}</span>
      <span class="badge">{{ severity }}</span>
      <span class="muted mono">{{ basis }}</span>
      <span v-if="decision" class="badge done">{{ LABEL[decision] ?? decision }}</span>
    </div>

    <p class="title">{{ title }}</p>

    <!-- 근거 없는 지적은 서버가 버린다. 남은 것은 반드시 원문에서 인용된 조각이다. -->
    <blockquote class="evidence">
      {{ evidence }}
      <span v-if="evidenceSource" class="muted src">— {{ SOURCE_LABEL[evidenceSource] ?? evidenceSource }}</span>
    </blockquote>

    <p class="muted why">{{ why }}</p>
    <p class="suggestion">제안: {{ suggestion }}</p>

    <p v-if="decision" class="muted decided-by">
      {{ decisionByName ?? "" }} 결정<template v-if="decisionReason">: {{ decisionReason }}</template>
    </p>

    <template v-else>
      <button v-if="!open" class="tiny" :disabled="busy" @click="open = true">결정하기</button>
      <form v-else class="decide" @submit.prevent="submit">
        <div class="choices">
          <label v-for="d in decisions" :key="d">
            <input v-model="chosen" type="radio" :value="d" />
            {{ LABEL[d] ?? d }}
          </label>
        </div>
        <input v-model="reason" placeholder="이유 (선택)" :disabled="busy" />
        <button type="submit" :disabled="busy || !chosen">확정</button>
        <button type="button" @click="open = false">취소</button>
      </form>
    </template>
  </li>
</template>

<style scoped>
.finding { border-top: 1px solid var(--line); padding: 12px 0; }
.finding.decided { opacity: 0.62; }
.head { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.badge.kind { border-color: var(--nh-green); color: var(--nh-green); }
.badge.done { border-color: #6b7280; }
.mono { font-family: ui-monospace, monospace; font-size: 12px; }
.title { font-weight: 600; margin: 8px 0 6px; }
.evidence {
  margin: 0 0 8px;
  padding: 8px 10px;
  border-left: 3px solid var(--line);
  background: #f9fafb;
  font-size: 13px;
  white-space: pre-wrap;
}
.src { font-size: 12px; }
.why, .suggestion { margin: 0 0 6px; font-size: 13px; }
.decided-by { font-size: 12px; margin: 6px 0 0; }
.decide { display: grid; gap: 8px; margin-top: 8px; }
.choices { display: flex; gap: 12px; flex-wrap: wrap; font-size: 13px; }
.decide input[type="text"], .decide input:not([type]) {
  font: inherit; padding: 6px 9px; border: 1px solid var(--line); border-radius: 8px;
}
.tiny { padding: 2px 8px; font-size: 12px; }
</style>

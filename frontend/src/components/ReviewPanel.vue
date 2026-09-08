<script setup lang="ts">
import { computed } from "vue";
import FindingCard from "./FindingCard.vue";
import type { ResponsibilityFinding, ReviewView, UsabilityFinding } from "@/api/types";

/**
 * 두 검토 결과를 한 자리에 놓는다.
 *
 * 별도 탭으로 가르지 않는 이유: 담당자는 "이 화면에 어떤 지적이 있는가"를 한 번에 봐야 한다.
 * 다만 **어느 검토에서 나온 것인지는 카드마다 표시**한다 — 기준이 다르므로 근거를 읽는 눈도 다르다.
 *
 * 실행 시점이 다르다는 것도 화면에 드러낸다. 책임성은 생성 직후 돌 수 있고,
 * UX 리스크는 논의가 쌓인 뒤 담당자가 부를 때 돈다 (ARCHITECTURE 12절).
 */
const props = defineProps<{
  responsibility: ReviewView<ResponsibilityFinding> | null;
  usability: ReviewView<UsabilityFinding> | null;
  busy: string | null;
  deciding: boolean;
}>();

const emit = defineEmits<{
  run: [kind: "responsibility" | "usability"];
  decideResponsibility: [findingId: string, decision: string, reason: string];
  decideUsability: [findingId: string, decision: string, reason: string];
}>();

const RESPONSIBILITY_DECISIONS = ["ACCEPTED", "DEFERRED", "REJECTED", "COMPLIANCE_REQUESTED"] as const;
const USABILITY_DECISIONS = ["ACCEPTED", "DEFERRED", "REJECTED"] as const;

/** 버려진 지적 수를 합쳐 보여 준다. 0 이 아니면 "왜 적게 나왔는지"의 답이 된다. */
const discarded = computed(
  () => (props.responsibility?.discardedCount ?? 0) + (props.usability?.discardedCount ?? 0)
);

const undecided = computed(
  () =>
    (props.responsibility?.findings.filter((f) => !f.decision).length ?? 0) +
    (props.usability?.findings.filter((f) => !f.decision).length ?? 0)
);
</script>

<template>
  <section class="card">
    <div class="bar">
      <h2>AI 검토</h2>
      <span v-if="undecided > 0" class="badge">미처리 {{ undecided }}건</span>
      <button class="tiny" :disabled="busy === 'responsibility'" @click="emit('run', 'responsibility')">
        {{ busy === "responsibility" ? "검토 중…" : "책임성 검토" }}
      </button>
      <button class="tiny" :disabled="busy === 'usability'" @click="emit('run', 'usability')">
        {{ busy === "usability" ? "검토 중…" : "UX 리스크 검토" }}
      </button>
    </div>

    <p class="muted small">
      AI 는 검토가 필요한 지점을 제시할 뿐 적법성을 판정하지 않습니다. 반영 여부는 담당자가 정합니다.
    </p>

    <p v-if="discarded > 0" class="muted small">
      근거를 원문과 대조하지 못한 지적 {{ discarded }}건은 저장하지 않았습니다.
    </p>

    <p v-if="responsibility?.review?.status === 'FAILED'" class="error">
      책임성 검토가 실패했습니다. {{ responsibility.review.error }}
    </p>
    <p v-if="usability?.review?.status === 'FAILED'" class="error">
      UX 리스크 검토가 실패했습니다. {{ usability.review.error }}
    </p>

    <ul class="list">
      <FindingCard
        v-for="f in responsibility?.findings ?? []"
        :key="f.id"
        kind="책임성"
        :basis="f.ruleId"
        :severity="f.severity"
        :title="f.title"
        :evidence="f.evidence"
        :why="f.why"
        :suggestion="f.suggestion"
        :decision="f.decision"
        :decision-by-name="f.decisionByName"
        :decision-reason="f.decisionReason"
        :decisions="RESPONSIBILITY_DECISIONS"
        :busy="deciding"
        @decide="(d, r) => emit('decideResponsibility', f.id, d, r)"
      />
      <FindingCard
        v-for="f in usability?.findings ?? []"
        :key="f.id"
        kind="UX"
        :basis="f.lensId"
        :severity="f.severity"
        :title="f.title"
        :evidence="f.evidence"
        :evidence-source="f.evidenceSource"
        :why="f.why"
        :suggestion="f.suggestion"
        :decision="f.decision"
        :decision-by-name="f.decisionByName"
        :decision-reason="f.decisionReason"
        :decisions="USABILITY_DECISIONS"
        :busy="deciding"
        @decide="(d, r) => emit('decideUsability', f.id, d, r)"
      />
    </ul>

    <p
      v-if="(responsibility?.findings.length ?? 0) + (usability?.findings.length ?? 0) === 0"
      class="muted"
    >
      아직 검토 결과가 없습니다.
    </p>
  </section>
</template>

<style scoped>
h2 { font-size: 14px; margin: 0; }
.bar { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 8px; }
.bar .tiny:first-of-type { margin-left: auto; }
.small { font-size: 12px; margin: 0 0 6px; }
.list { list-style: none; padding: 0; margin: 10px 0 0; }
.tiny { padding: 3px 10px; font-size: 12px; }
</style>

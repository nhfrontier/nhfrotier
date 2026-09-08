<script setup lang="ts">
import { computed, ref, watch } from "vue";
import {
  EDITABLE_ATTRS,
  EDITABLE_STYLE_PROPS,
  isSafeStyleValue,
  type EditableAttr,
  type EditableStyleProp,
  type ElementMeta,
} from "@/canvas/protocol";

const props = defineProps<{ element: ElementMeta | null; busy: boolean }>();
const emit = defineEmits<{
  setText: [value: string];
  setStyle: [prop: EditableStyleProp, value: string];
  setAttr: [name: EditableAttr, value: string];
  aiEdit: [instruction: string];
}>();

const text = ref("");
const styleProp = ref<EditableStyleProp>("color");
const styleValue = ref("");
const attrName = ref<EditableAttr>("placeholder");
const attrValue = ref("");
const instruction = ref("");

/**
 * 서버는 이 값을 201 로 저장하지만 baking 에서 버린다. 미리 막지 않으면
 * 프레임에는 반영돼 보이는데 다운로드에는 없다.
 */
const styleRejected = computed(() => styleValue.value.trim() !== "" && !isSafeStyleValue(styleValue.value));

// 다른 요소를 고르면 입력칸이 이전 요소의 값을 들고 있으면 안 된다.
watch(
  () => props.element?.nhId,
  () => {
    text.value = props.element?.text ?? "";
    styleValue.value = props.element?.styles[styleProp.value] ?? "";
    attrValue.value = props.element?.attrs[attrName.value] ?? "";
    instruction.value = "";
  }
);

watch(styleProp, (prop) => (styleValue.value = props.element?.styles[prop] ?? ""));
watch(attrName, (name) => (attrValue.value = props.element?.attrs[name] ?? ""));
</script>

<template>
  <aside class="panel card">
    <p v-if="!element" class="muted">캔버스에서 요소를 클릭하세요.</p>

    <template v-else>
      <header>
        <strong>&lt;{{ element.tag }}&gt;</strong>
        <span class="muted mono">{{ element.nhId }}</span>
      </header>

      <label>
        <span>텍스트</span>
        <textarea v-model="text" rows="2" :disabled="busy"></textarea>
        <button :disabled="busy || !text.trim()" @click="emit('setText', text)">텍스트 반영</button>
      </label>

      <label>
        <span>스타일</span>
        <select v-model="styleProp" :disabled="busy">
          <option v-for="p in EDITABLE_STYLE_PROPS" :key="p" :value="p">{{ p }}</option>
        </select>
        <input v-model="styleValue" placeholder="예: #00a04b" :disabled="busy" />
        <p v-if="styleRejected" class="warn">
          <code>; {{ "{ } < >" }} url( expression( javascript: @import</code> 가 들어간 값은
          저장되어도 화면에 반영되지 않습니다.
        </p>
        <button
          :disabled="busy || styleRejected || !styleValue.trim()"
          @click="emit('setStyle', styleProp, styleValue)"
        >
          스타일 반영
        </button>
      </label>

      <label>
        <span>속성</span>
        <select v-model="attrName" :disabled="busy">
          <option v-for="a in EDITABLE_ATTRS" :key="a" :value="a">{{ a }}</option>
        </select>
        <input v-model="attrValue" :disabled="busy" />
        <button :disabled="busy || !attrValue.trim()" @click="emit('setAttr', attrName, attrValue)">
          속성 반영
        </button>
      </label>

      <label class="ai">
        <span>AI 로 이 요소만 다시 만들기</span>
        <textarea v-model="instruction" rows="3" placeholder="어떻게 바꿀지 적어주세요." :disabled="busy"></textarea>
        <button class="primary" :disabled="busy || !instruction.trim()" @click="emit('aiEdit', instruction)">
          {{ busy ? "요청 중…" : "AI 편집" }}
        </button>
      </label>

      <p class="muted note">
        편집은 저장본을 덮어쓰지 않고 patch 로 쌓입니다. 누가 왜 바꿨는지가 남습니다.
      </p>
    </template>
  </aside>
</template>

<style scoped>
.panel { display: grid; gap: 14px; align-content: start; }
header { display: flex; align-items: baseline; gap: 8px; }
.mono { font-family: ui-monospace, monospace; font-size: 12px; }
label { display: grid; gap: 6px; }
label > span { font-weight: 600; font-size: 13px; }
textarea, select, input { font: inherit; padding: 7px 9px; border: 1px solid var(--line); border-radius: 8px; }
textarea { resize: vertical; }
.ai { border-top: 1px solid var(--line); padding-top: 14px; }
.note { font-size: 12px; margin: 0; }
.warn {
  margin: 0;
  font-size: 12px;
  border: 1px solid #fcd34d;
  background: #fffbeb;
  color: #92400e;
  border-radius: 8px;
  padding: 8px 10px;
}
.warn code { font-family: ui-monospace, monospace; }
</style>

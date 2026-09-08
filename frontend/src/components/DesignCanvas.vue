<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { buildSrcDoc } from "@/canvas/runtime";
import { isTrustedFrameMessage, type CanvasMode, type ElementMeta, type HostMessage, type PatchOp } from "@/canvas/protocol";

const props = defineProps<{ html: string | null; mode: CanvasMode; name: string }>();
const emit = defineEmits<{
  select: [element: ElementMeta | null];
  navigate: [screenKey: string];
}>();

const frame = ref<HTMLIFrameElement | null>(null);
const ready = ref(false);

const srcdoc = computed(() => (props.html ? buildSrcDoc(props.html) : ""));

/**
 * 프레임에는 표현 데이터만 보낸다.
 * 불투명 오리진이라 targetOrigin 을 '*' 로 쓸 수밖에 없으므로,
 * 사용자 식별자·세션·토큰을 이 경로에 절대 싣지 않는다 (SECURITY_CHECKLIST 4절).
 */
function send(message: HostMessage) {
  frame.value?.contentWindow?.postMessage(message, "*");
}

function onMessage(event: MessageEvent) {
  // origin 은 항상 "null" 이라 검증에 쓸 수 없다. source 대조만이 유효하다.
  if (!isTrustedFrameMessage(event, frame.value)) return;
  const data = event.data;

  if (data.type === "ready") {
    ready.value = true;
    send({ type: "setMode", mode: props.mode });
    return;
  }
  if (data.type === "select") emit("select", data.element);
  if (data.type === "navigate") emit("navigate", data.screenKey);
}

/** 화면에만 즉시 반영한다. 저장은 호출자가 서버에 맡긴다. */
function apply(ops: PatchOp[]) {
  send({ type: "applyOps", ops });
}

function select(nhId: string | null) {
  send({ type: "selectById", nhId });
}

defineExpose({ apply, select });

watch(() => props.mode, (mode) => ready.value && send({ type: "setMode", mode }));
// srcdoc 이 바뀌면 프레임이 새로 뜬다. ready 를 내려 두지 않으면 옛 프레임 기준으로 보낸다.
watch(srcdoc, () => (ready.value = false));

onMounted(() => window.addEventListener("message", onMessage));
onBeforeUnmount(() => window.removeEventListener("message", onMessage));
</script>

<template>
  <div class="frame" :class="{ editing: mode === 'edit' }">
    <!--
      sandbox 는 allow-scripts 만 준다. allow-same-origin 을 함께 주면 프레임이 부모 DOM·쿠키에
      접근할 수 있게 되어 금지 조합이 된다 (SECURITY_CHECKLIST 4절). 둘 다 필요해 보이더라도
      추가하지 말 것 — 선택·편집은 postMessage 로 충분하다.
    -->
    <iframe
      v-if="html"
      ref="frame"
      :srcdoc="srcdoc"
      sandbox="allow-scripts"
      :title="`${name} 캔버스`"
    ></iframe>
    <p v-else class="empty muted">아직 만들어지지 않았습니다.</p>
  </div>
</template>

<style scoped>
.frame {
  border: 1px solid var(--line);
  border-radius: 10px;
  overflow: hidden;
  background: #fff;
  height: 520px;
}

.frame.editing { border-color: var(--nh-green); }

iframe { width: 100%; height: 100%; border: 0; display: block; }

.empty { height: 100%; display: grid; place-items: center; margin: 0; font-size: 13px; }
</style>

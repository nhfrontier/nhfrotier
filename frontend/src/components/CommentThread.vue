<script setup lang="ts">
import { computed, ref } from "vue";
import type { AnchorStatus, Comment } from "@/api/types";

const props = defineProps<{
  comments: Comment[];
  /** 지금 캔버스에서 고른 요소. 새 의견은 여기에 붙는다. */
  anchorNhId: string | null;
  busy: boolean;
}>();

const emit = defineEmits<{
  create: [body: string, nhId: string | null, parentId: string | null];
  toggleResolved: [comment: Comment];
  focusAnchor: [nhId: string];
}>();

const draft = ref("");
const replyTo = ref<string | null>(null);
const replyDraft = ref("");

/** 뿌리 의견만 목록에 세우고 답글은 그 아래로 접어 넣는다. 핀은 뿌리에만 붙는다. */
const threads = computed(() => {
  const roots = props.comments.filter((c) => !c.parentId);
  const replies = new Map<string, Comment[]>();
  for (const c of props.comments) {
    if (!c.parentId) continue;
    const list = replies.get(c.parentId) ?? [];
    list.push(c);
    replies.set(c.parentId, list);
  }
  return roots.map((root) => ({ root, replies: replies.get(root.id) ?? [] }));
});

const anchorLabel: Record<AnchorStatus, string> = {
  none: "화면 전체",
  anchored: "요소에 붙음",
  orphaned: "위치를 잃음",
};

function submit() {
  const body = draft.value.trim();
  if (!body) return;
  emit("create", body, props.anchorNhId, null);
  draft.value = "";
}

function submitReply(parentId: string) {
  const body = replyDraft.value.trim();
  if (!body) return;
  emit("create", body, null, parentId);
  replyDraft.value = "";
  replyTo.value = null;
}
</script>

<template>
  <section class="card">
    <h2>의견</h2>

    <form class="new" @submit.prevent="submit">
      <textarea
        v-model="draft"
        rows="2"
        :placeholder="anchorNhId ? '고른 요소에 의견을 남깁니다.' : '화면 전체에 의견을 남깁니다.'"
        :disabled="busy"
      ></textarea>
      <div class="row">
        <span class="muted small">
          {{ anchorNhId ? `대상: ${anchorNhId}` : "캔버스에서 요소를 고르면 그 요소에 붙습니다." }}
        </span>
        <button class="primary" type="submit" :disabled="busy || !draft.trim()">남기기</button>
      </div>
    </form>

    <p v-if="threads.length === 0" class="muted">아직 의견이 없습니다.</p>

    <ul class="list">
      <li v-for="{ root, replies } in threads" :key="root.id" :class="{ resolved: root.resolvedAt }">
        <div class="head">
          <strong>{{ root.authorName ?? "" }}</strong>
          <button
            v-if="root.nhId"
            class="badge link"
            :title="anchorLabel[root.anchorStatus]"
            @click="emit('focusAnchor', root.nhId)"
          >
            {{ root.anchorStatus === "orphaned" ? "위치를 잃음" : root.nhId }}
          </button>
          <span v-else class="badge">화면 전체</span>
          <button class="tiny" @click="emit('toggleResolved', root)">
            {{ root.resolvedAt ? "다시 열기" : "해결" }}
          </button>
        </div>

        <p class="body">{{ root.body }}</p>

        <ul v-if="replies.length" class="replies">
          <li v-for="r in replies" :key="r.id">
            <strong>{{ r.authorName ?? "" }}</strong>
            <span class="body">{{ r.body }}</span>
          </li>
        </ul>

        <form v-if="replyTo === root.id" class="reply" @submit.prevent="submitReply(root.id)">
          <input v-model="replyDraft" placeholder="답글" :disabled="busy" />
          <button type="submit" :disabled="busy || !replyDraft.trim()">등록</button>
          <button type="button" @click="replyTo = null">취소</button>
        </form>
        <button v-else class="tiny" @click="replyTo = root.id; replyDraft = ''">답글</button>
      </li>
    </ul>
  </section>
</template>

<style scoped>
h2 { font-size: 14px; margin: 0 0 10px; }
.new { display: grid; gap: 6px; margin-bottom: 14px; }
.new textarea, .reply input { font: inherit; padding: 7px 9px; border: 1px solid var(--line); border-radius: 8px; }
.new textarea { resize: vertical; }
.row { display: flex; align-items: center; gap: 8px; }
.row button { margin-left: auto; }
.small { font-size: 12px; }
.list { list-style: none; padding: 0; margin: 0; display: grid; gap: 12px; }
.list > li { border-top: 1px solid var(--line); padding-top: 10px; }
.list > li.resolved { opacity: 0.55; }
.head { display: flex; align-items: center; gap: 6px; }
.head .tiny { margin-left: auto; }
.body { margin: 6px 0; white-space: pre-wrap; }
.replies { list-style: none; padding: 0 0 0 12px; margin: 6px 0; border-left: 2px solid var(--line); display: grid; gap: 4px; }
.replies .body { margin: 0 0 0 6px; display: inline; }
.reply { display: flex; gap: 6px; }
.reply input { flex: 1; }
.tiny { padding: 2px 8px; font-size: 12px; }
.link { cursor: pointer; background: none; }
</style>

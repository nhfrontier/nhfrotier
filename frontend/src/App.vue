<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { api, ApiError, devIdentity, isHeaderSafe, setDevIdentity } from "./api/client";
import type { Me } from "./api/types";

const me = ref<Me | null>(null);
const error = ref<string | null>(null);
const loginId = ref(devIdentity().loginId);
const name = ref(devIdentity().name);

/**
 * HTTP 헤더는 ISO-8859-1 만 담는다. 한글 이름은 실어 보낼 수 없어 백엔드가 loginId 를 이름으로 쓴다.
 * 조용히 무시하면 "왜 내 이름이 안 나오지"가 되므로 입력 시점에 알린다. dev 전용 편의 기능이다.
 */
const nameNotSent = computed(() => name.value.trim() !== "" && !isHeaderSafe(name.value));

async function load() {
  error.value = null;
  try {
    me.value = await api.get<Me>("/me");
  } catch (e) {
    me.value = null;
    error.value = e instanceof ApiError ? e.message : "서버에 연결할 수 없습니다.";
  }
}

function signIn() {
  setDevIdentity(loginId.value.trim(), name.value.trim());
  load().then(() => {
    // 신원이 바뀌면 보이는 프로젝트가 달라진다. 현재 화면을 다시 그린다.
    if (me.value) window.location.reload();
  });
}

onMounted(load);
</script>

<template>
  <header>
    <div class="bar">
      <RouterLink to="/projects" class="brand">NH위드캔버스</RouterLink>

      <div v-if="me" class="who">
        <span>{{ me.name }}</span>
        <span class="muted">{{ me.department ?? me.loginId }}</span>
      </div>

      <!-- AUTH_PROVIDER=dev 전용. 운영에서는 SSO 가 대신하므로 이 입력은 나타나지 않아야 한다. -->
      <form v-else class="who" @submit.prevent="signIn">
        <input v-model="loginId" placeholder="로그인 ID" required />
        <input v-model="name" placeholder="이름" />
        <button class="primary" type="submit">확인</button>
      </form>
    </div>

    <p v-if="!me && nameNotSent" class="hint muted">
      한글 이름은 HTTP 헤더로 보낼 수 없어 전달되지 않습니다. 로그인 ID 가 이름으로 표시됩니다.
    </p>
  </header>

  <main class="container">
    <p v-if="error" class="error">{{ error }}</p>
    <RouterView v-if="me" />
    <p v-else-if="!error" class="muted">확인 중…</p>
  </main>
</template>

<style scoped>
header {
  background: #fff;
  border-bottom: 1px solid var(--line);
}

.bar {
  max-width: 960px;
  margin: 0 auto;
  padding: 12px 20px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.brand {
  font-weight: 700;
  text-decoration: none;
  color: var(--nh-green);
  margin-right: auto;
}

.who {
  display: flex;
  align-items: center;
  gap: 8px;
}

.hint {
  max-width: 960px;
  margin: 0 auto;
  padding: 0 20px 10px;
  font-size: 12px;
}
</style>

<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{ html: string | null; name: string }>();

/**
 * AI 가 만든 HTML 은 신뢰할 수 없는 입력이다 (SECURITY_CHECKLIST 4절).
 *
 * 두 겹으로 막는다.
 *  1) sandbox 속성을 값 없이 준다 = 모든 제약이 걸린 상태. 스크립트도, 같은 출처도 아니다.
 *     목업의 협업 캔버스는 프레임 안에서 스크립트가 돌아야 해서 allow-scripts 가 필요했지만,
 *     여기는 보기만 하므로 그 예외가 필요 없다. 필요 없는 권한은 주지 않는다.
 *  2) srcdoc 조립 시점에 CSP meta 를 넣는다. 정제가 뚫렸을 때의 2차 방어선이고,
 *     img-src 를 data: 로 묶어 프레임이 바깥으로 요청을 내지 못하게 한다.
 *
 * 부모 페이지에 innerHTML 로 주입하지 않는다. iframe 격리가 전부다.
 */
const CSP =
  "default-src 'none'; style-src 'unsafe-inline'; img-src data:; font-src data:; " +
  "script-src 'none'; form-action 'none'; base-uri 'none'";

const srcdoc = computed(() => {
  if (!props.html) return "";
  const meta = `<meta http-equiv="Content-Security-Policy" content="${CSP}">`;
  // head 가 없는 조각이 올 수도 있다. 그때는 앞에 붙인다.
  return /<head(\s[^>]*)?>/i.test(props.html)
    ? props.html.replace(/<head(\s[^>]*)?>/i, (head) => `${head}${meta}`)
    : `${meta}${props.html}`;
});
</script>

<template>
  <div class="frame">
    <!-- sandbox="" = 모든 제약. 값을 비워 두는 것이 핵심이므로 지우지 말 것. -->
    <iframe v-if="html" :srcdoc="srcdoc" sandbox="" :title="`${name} 미리보기`" loading="lazy"></iframe>
    <p v-else class="empty muted">아직 만들어지지 않았습니다.</p>
  </div>
</template>

<style scoped>
.frame {
  border: 1px solid var(--line);
  border-radius: 10px;
  overflow: hidden;
  background: #fff;
  height: 460px;
}

iframe { width: 100%; height: 100%; border: 0; display: block; }

.empty { height: 100%; display: grid; place-items: center; margin: 0; font-size: 13px; }
</style>

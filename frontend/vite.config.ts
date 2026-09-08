import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  plugins: [vue()],
  resolve: {
    // Vite 는 루트 기준 경로를 그대로 해석한다. node:url 을 쓰지 않으려고 이 형태를 택했다
    // (@types/node 의존을 만들지 않기 위해서다).
    alias: { "@": "/src" },
  },
  server: {
    // 개발 중에는 Vite 가 백엔드로 넘긴다. 운영 이미지에서는 Nginx 가 같은 일을 한다.
    // 백엔드를 다른 포트로 띄웠다면 여기를 고친다.
    proxy: {
      "/api": { target: "http://localhost:8080", changeOrigin: true },
    },
  },
  build: {
    outDir: "dist",
    // 폐쇄망에서 소스맵은 소스를 그대로 노출한다. 필요해지면 별도 반출 절차를 정한다.
    sourcemap: false,
  },
});

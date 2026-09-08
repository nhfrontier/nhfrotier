import { createRouter, createWebHistory, type RouteRecordRaw } from "vue-router";

/**
 * 화면은 지연 로딩한다. 폐쇄망에서도 첫 화면이 빨리 떠야 하고,
 * 화면이 늘어날수록 초기 번들이 커지는 것을 막는다.
 */
const routes: RouteRecordRaw[] = [
  { path: "/", redirect: "/projects" },
  {
    path: "/projects",
    name: "projects",
    component: () => import("./views/ProjectsView.vue"),
  },
  {
    path: "/projects/:projectId",
    name: "project",
    component: () => import("./views/ProjectView.vue"),
    props: true,
  },
  {
    path: "/projects/:projectId/generate",
    name: "generate",
    component: () => import("./views/GenerateView.vue"),
    props: true,
  },
  {
    path: "/versions/:versionId",
    name: "version",
    component: () => import("./views/VersionView.vue"),
    props: true,
  },
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
});

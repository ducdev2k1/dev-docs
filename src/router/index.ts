import CourseLayout from "@/layouts/CourseLayout.vue";
import DocView from "@/views/DocView.vue";
import HomeView from "@/views/HomeView.vue";
import { createRouter, createWebHistory } from "vue-router";

const routes = [
  {
    path: "/",
    name: "Home",
    component: HomeView,
    meta: { title: "Trang chủ" },
  },
  {
    path: "/course/:courseSlug",
    component: CourseLayout,
    children: [
      {
        path: "",
        redirect: { path: "doc/README" },
      },
      {
        path: "doc/:docSlug?",
        name: "Doc",
        component: DocView,
        meta: { title: "Tài liệu" },
      },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, _from, savedPosition) {
    if (savedPosition) return savedPosition;
    if (to.hash) {
      return { el: to.hash, behavior: "smooth" };
    }
    return { top: 0 };
  },
});

export default router;

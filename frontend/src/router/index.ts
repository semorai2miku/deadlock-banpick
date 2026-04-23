import {
  createRouter,
  createWebHashHistory,
  createWebHistory,
} from "vue-router";
import HomeView from "@/views/HomeView.vue";
import LocalDraftView from "@/views/LocalDraftView.vue";
import RoomView from "@/views/RoomView.vue";

const isStandaloneMode =
  import.meta.env.MODE === "standalone" ||
  (typeof window !== "undefined" && window.location.protocol === "file:");

const router = createRouter({
  history: isStandaloneMode ? createWebHashHistory() : createWebHistory(),
  routes: [
    {
      path: "/",
      name: "home",
      ...(isStandaloneMode
        ? {
            redirect: {
              name: "local-draft",
            },
          }
        : {
            component: HomeView,
          }),
    },
    {
      path: "/room/:roomId",
      name: "room",
      component: RoomView,
      props: true,
    },
    {
      path: "/local-draft",
      name: "local-draft",
      component: LocalDraftView,
      props: {
        mode: "operator",
      },
    },
    {
      path: "/local-cast",
      name: "local-cast",
      component: LocalDraftView,
      props: {
        mode: "spectator",
      },
    },
  ],
});

export default router;

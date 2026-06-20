/** Vue Router 配置。
- /login 公开
- / 其他需要登录 + 路由守卫
- meta.requiresSuperuser(RFC v0.4 §4.8.1)只给超管
*/
import { createRouter, createWebHistory, type RouteRecordRaw } from "vue-router"
import { useUserStore } from "@/stores/user"

const routes: RouteRecordRaw[] = [
  {
    path: "/login",
    name: "login",
    component: () => import("@/views/Login.vue"),
    meta: { public: true, title: "登录" },
  },
  {
    path: "/",
    component: () => import("@/views/Layout.vue"),
    meta: { requiresAuth: true },
    children: [
      {
        path: "",
        name: "dashboard",
        component: () => import("@/views/Dashboard.vue"),
        meta: { title: "驾驶舱" },
      },
      {
        path: "approvals",
        name: "approvals",
        component: () => import("@/views/Approvals.vue"),
        meta: { title: "我的审批" },
      },
      {
        path: "customers",
        name: "customers",
        component: () => import("@/views/Customers.vue"),
        meta: { title: "客户" },
      },
      {
        path: "expenses",
        name: "expenses",
        component: () => import("@/views/Expenses.vue"),
        meta: { title: "报销" },
      },
      {
        path: "workflow-templates",
        name: "workflow-templates",
        component: () => import("@/views/WorkflowTemplates.vue"),
        meta: {
          title: "审批流模板",
          requiresSuperuser: true, // RFC v0.4 §4.8.1
        },
      },
    ],
  },
  { path: "/:pathMatch(.*)*", redirect: "/" },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to, _from, next) => {
  const userStore = useUserStore()
  const isPublic = to.meta.public === true
  if (isPublic) {
    next()
    return
  }
  if (!userStore.isLoggedIn) {
    next({ name: "login", query: { redirect: to.fullPath } })
    return
  }
  if (to.meta.requiresSuperuser && !userStore.isSuperuser) {
    next({ name: "dashboard" })
    return
  }
  next()
})

export default router

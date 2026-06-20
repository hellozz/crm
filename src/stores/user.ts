/** 用户 store (Pinia)。
- isLoggedIn: 是否登录
- isSuperuser: 超管(RFC v0.4 §4.8.1)
- feishu_webhook_url: 全局飞书 webhook(审批通知用,RFC v0.4 §4.11.2 修法 #97)
*/
import { defineStore } from "pinia"
import { ref, computed } from "vue"
import * as authApi from "@/api/auth"
import type { User } from "@/types/user"

export const useUserStore = defineStore("user", () => {
  const user = ref<User | null>(null)
  const isLoggedIn = computed(() => user.value !== null)
  /** RFC v0.4 §4.8.1:超管门,改审批流模板只给超管 */
  const isSuperuser = computed(() => user.value?.is_superuser === true)
  /** RFC v0.4 §4.11.2 修法 #97:不增 API 端点,只从 UserSerializer 读 */
  const feishuWebhookUrl = computed(
    () => user.value?.feishu_webhook_url ?? null,
  )

  async function login(email: string, password: string) {
    const r = await authApi.login(email, password)
    localStorage.setItem("access_token", r.data.access)
    localStorage.setItem("refresh_token", r.data.refresh)
    user.value = r.data.user
  }

  async function fetchCurrentUser() {
    const r = await authApi.getCurrentUser()
    user.value = r.data
    return r.data
  }

  function clear() {
    user.value = null
    authApi.logout()
  }

  return {
    user,
    isLoggedIn,
    isSuperuser,
    feishuWebhookUrl,
    login,
    fetchCurrentUser,
    clear,
  }
})

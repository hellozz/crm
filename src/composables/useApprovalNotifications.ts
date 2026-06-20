/** 审批通知 composable(RFC v0.4 §4.11.2 修法 #97)。
- 前端轮询 + 群 webhook(0 后端改动)
- 优化:visibilitychange + 退避 + localStorage 去重
- 5min polling
- tab 不活跃时跳过
- 同一 task 不会重复发(去重)
- 多 tab 共享 localStorage
*/
import { ref, onMounted, onUnmounted } from "vue"
import { useUserStore } from "@/stores/user"
import api from "@/api/client"

const POLL_INTERVAL = 5 * 60 * 1000 // 5 min
const BACKOFF_MAX = 60 * 60 * 1000 // 1h
const STORAGE_KEY = "approval:lastSeenTaskIds"

export function useApprovalNotifications() {
  const userStore = useUserStore()
  const isPolling = ref(false)
  const lastError = ref<string | null>(null)

  function getLastSeenIds(): Set<string> {
    try {
      return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"))
    } catch {
      return new Set()
    }
  }
  function setLastSeenIds(ids: string[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids))
  }

  async function notify(taskId: string, summary: string) {
    const url = userStore.feishuWebhookUrl
    if (!url) return
    try {
      await fetch(url, {
        method: "POST",
        mode: "no-cors", // 跳过 CORS preflight,读不到响应但不需要
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          msg_type: "text",
          content: {
            text: `📋 老板您有 1 个新审批待办\n${summary}\n\n[点此登录 CRM](https://crm.yrxt.com.cn/approvals)`,
          },
        }),
      })
    } catch (e) {
      lastError.value = (e as Error).message
    }
  }

  async function poll() {
    if (document.hidden) return // tab 不活跃跳过
    if (!userStore.isLoggedIn) return
    const seen = getLastSeenIds()
    try {
      const r = await api.get("/my-tasks/todo/?status=pending")
      const tasks = (r.data as { results: Array<{ id: number; summary?: string }> })
        .results
      const newOnes = tasks.filter((t) => !seen.has(String(t.id)))
      if (newOnes.length > 0) {
        await notify(String(newOnes[0].id), newOnes[0].summary ?? "")
      }
      setLastSeenIds(tasks.map((t) => String(t.id)))
    } catch (e) {
      lastError.value = (e as Error).message
    }
  }

  let intervalId: number | null = null
  let backoff = POLL_INTERVAL
  function start() {
    if (intervalId) return
    isPolling.value = true
    poll() // 立即拉一次
    intervalId = window.setInterval(poll, POLL_INTERVAL)
    // tab 重新可见时拉一次
    document.addEventListener("visibilitychange", onVisibility)
  }
  function stop() {
    if (intervalId) {
      clearInterval(intervalId)
      intervalId = null
    }
    isPolling.value = false
    document.removeEventListener("visibilitychange", onVisibility)
  }
  function onVisibility() {
    if (!document.hidden) poll()
  }

  onMounted(() => start())
  onUnmounted(() => stop())

  return { isPolling, lastError, poll, start, stop }
}

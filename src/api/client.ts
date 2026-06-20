/** Axios 实例 + JWT 拦截器 + 错误处理。 */
import axios, { type AxiosError } from "axios"
import { ElMessage } from "element-plus"

const api = axios.create({
  baseURL: "/api/v1",
  timeout: 30_000,
})

// 请求拦截:加 token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token")
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// 响应拦截:401 自动 refresh;失败弹消息
let refreshing = false
api.interceptors.response.use(
  (resp) => resp,
  async (error: AxiosError) => {
    // _retry 是我们自定义的属性,需要 cast
    const cfg = error.config as (typeof error.config & { _retry?: boolean }) | undefined
    if (error.response?.status === 401 && !cfg?._retry) {
      if (refreshing) {
        return Promise.reject(error)
      }
      const refresh = localStorage.getItem("refresh_token")
      if (!refresh) {
        localStorage.clear()
        window.location.href = "/login"
        return Promise.reject(error)
      }
      refreshing = true
      try {
        const r = await axios.post("/api/v1/auth/token/refresh/", { refresh })
        const newAccess = (r.data as { access: string }).access
        localStorage.setItem("access_token", newAccess)
        if (cfg) {
          cfg._retry = true
          cfg.headers = cfg.headers ?? {}
          cfg.headers.Authorization = `Bearer ${newAccess}`
          return api.request(cfg)
        }
      } catch {
        localStorage.clear()
        window.location.href = "/login"
      } finally {
        refreshing = false
      }
    }
    const msg =
      (error.response?.data as { detail?: string })?.detail ??
      error.message ??
      "请求失败"
    ElMessage.error(msg)
    return Promise.reject(error)
  },
)

export default api

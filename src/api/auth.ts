/** 认证 API。 */
import api from "./client"
import type { User } from "@/types/user"

export interface LoginResponse {
  access: string
  refresh: string
  user: User
}

export function login(email: string, password: string) {
  return api.post<LoginResponse>("/auth/login/", { email, password })
}

export function getCurrentUser() {
  return api.get<User>("/users/me/")
}

export function logout() {
  localStorage.clear()
  window.location.href = "/login"
}

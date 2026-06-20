/** 当前用户类型(RFC v0.4 §5.8 + §4.11)。 */
export interface User {
  id: number
  username: string
  name: string
  display_name: string
  email: string
  is_staff: boolean
  is_superuser: boolean
  roles: Array<{ id: number; code: string; name: string }>
  /** RFC v0.4 §4.11.2 修法 #97:UserSerializer 加的字段 */
  feishu_webhook_url: string | null
}

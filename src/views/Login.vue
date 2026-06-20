<template>
  <div class="login-container">
    <el-card class="login-card">
      <template #header>
        <h2>亿融信通 · CRM</h2>
      </template>
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-position="top"
        @submit.prevent="onSubmit"
      >
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="form.email" placeholder="admin@yrxt.com.cn" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input
            v-model="form.password"
            type="password"
            show-password
            placeholder="请输入密码"
          />
        </el-form-item>
        <el-button
          type="primary"
          :loading="loading"
          native-type="submit"
          style="width: 100%"
        >
          登录
        </el-button>
        <el-divider>或</el-divider>
        <el-button
          :icon="Connection"
          :loading="feishuLoading"
          style="width: 100%"
          @click="onFeishuLogin"
        >
          飞书扫码登录
        </el-button>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted } from "vue"
import { useRouter, useRoute } from "vue-router"
import { ElMessage, type FormInstance, type FormRules } from "element-plus"
import { Connection } from "@element-plus/icons-vue"
import { useUserStore } from "@/stores/user"

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const formRef = ref<FormInstance>()
const loading = ref(false)
const feishuLoading = ref(false)
const form = reactive({ email: "", password: "" })
const rules: FormRules = {
  email: [
    { required: true, message: "请输入邮箱", trigger: "blur" },
    { type: "email", message: "邮箱格式不对", trigger: "blur" },
  ],
  password: [{ required: true, message: "请输入密码", trigger: "blur" }],
}

/** 飞书扫码登录:调后端拿 authorize_url,跳过去。
 * 飞书授权后会跳回 redirect_uri + ?code=xxx &state=xxx。
 * 这个页面会再次 mount,onMounted 处理回调。 */
async function onFeishuLogin() {
  feishuLoading.value = true
  try {
    const redirectUri = `${window.location.origin}/login`
    const r = await fetch(`/api/v1/auth/feishu/login-url/?redirect_uri=${encodeURIComponent(redirectUri)}`)
    const data = await r.json()
    if (!r.ok) {
      ElMessage.error(data.detail ?? "飞书登录未配置")
      return
    }
    if (!data.enabled) {
      ElMessage.error("飞书登录未配置")
      return
    }
    // 跳转到飞书
    window.location.href = data.authorize_url
  } catch (e) {
    ElMessage.error("飞书登录调用失败")
  } finally {
    feishuLoading.value = false
  }
}

/** 处理飞书回调:?feishu_code=xxx &state=yyy */
async function handleFeishuCallback() {
  const code = route.query.feishu_code as string | undefined
  if (!code) return
  feishuLoading.value = true
  try {
    const r = await fetch("/api/v1/auth/feishu/login/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    })
    const data = await r.json()
    if (!r.ok) {
      ElMessage.error(data.detail ?? "飞书登录失败")
      return
    }
    localStorage.setItem("access_token", data.access)
    if (data.refresh) localStorage.setItem("refresh_token", data.refresh)
    if (data.user) {
      // 通过 store 同步用户信息
      userStore.user = data.user
    }
    ElMessage.success("飞书登录成功")
    // 清掉 query 参数,跳到主页
    const redirect = (route.query.redirect as string) || "/"
    router.push(redirect)
  } catch (e) {
    ElMessage.error("飞书登录失败")
  } finally {
    feishuLoading.value = false
  }
}

onMounted(() => {
  handleFeishuCallback()
})

async function onSubmit() {
  if (!formRef.value) return
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  loading.value = true
  try {
    await userStore.login(form.email, form.password)
    ElMessage.success("登录成功")
    const redirect = (route.query.redirect as string) || "/"
    router.push(redirect)
  } catch (e) {
    // axios interceptor 已经弹过错误消息
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-container {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f0f2f5 0%, #d6e4ff 100%);
}
.login-card {
  width: 400px;
}
h2 {
  margin: 0;
  text-align: center;
}
</style>

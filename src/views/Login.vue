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
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from "vue"
import { useRouter, useRoute } from "vue-router"
import { ElMessage, type FormInstance, type FormRules } from "element-plus"
import { useUserStore } from "@/stores/user"

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const formRef = ref<FormInstance>()
const loading = ref(false)
const form = reactive({ email: "", password: "" })
const rules: FormRules = {
  email: [
    { required: true, message: "请输入邮箱", trigger: "blur" },
    { type: "email", message: "邮箱格式不对", trigger: "blur" },
  ],
  password: [{ required: true, message: "请输入密码", trigger: "blur" }],
}

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

<template>
  <el-container class="layout">
    <el-aside width="220px" class="aside">
      <div class="logo">亿融信通 CRM</div>
      <el-menu
        :default-active="route.path"
        router
        class="menu"
        background-color="#001529"
        text-color="#fff"
        active-text-color="#409EFF"
      >
        <el-menu-item index="/">
          <el-icon><DataLine /></el-icon>
          <span>驾驶舱</span>
        </el-menu-item>
        <el-menu-item index="/approvals">
          <el-icon><Document /></el-icon>
          <span>我的审批</span>
        </el-menu-item>
        <el-menu-item index="/customers">
          <el-icon><User /></el-icon>
          <span>客户</span>
        </el-menu-item>
        <el-menu-item index="/contracts">
          <el-icon><Document /></el-icon>
          <span>合同</span>
        </el-menu-item>
        <el-menu-item index="/expenses">
          <el-icon><Money /></el-icon>
          <span>报销</span>
        </el-menu-item>
        <el-menu-item
          v-if="userStore.isSuperuser"
          index="/workflow-templates"
        >
          <el-icon><Setting /></el-icon>
          <span>审批流模板</span>
        </el-menu-item>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header class="header">
        <div class="title">{{ route.meta.title ?? "亿融信通" }}</div>
        <el-dropdown @command="onCommand">
          <span class="user-info">
            <el-icon><Avatar /></el-icon>
            {{ userStore.user?.display_name ?? userStore.user?.email }}
            <el-icon><ArrowDown /></el-icon>
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="logout">退出登录</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </el-header>
      <el-main>
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { onMounted } from "vue"
import { useRoute } from "vue-router"
import { useUserStore } from "@/stores/user"
import { useApprovalNotifications } from "@/composables/useApprovalNotifications"

const route = useRoute()
const userStore = useUserStore()
// RFC v0.4 §4.11.2 修法 #97:启动审批通知 composable
// 5 min 轮询 + visibilitychange + 退避 + localStorage 去重
const { isPolling } = useApprovalNotifications()

onMounted(async () => {
  if (!userStore.user) {
    try {
      await userStore.fetchCurrentUser()
    } catch {
      userStore.clear()
    }
  }
})

function onCommand(cmd: string) {
  if (cmd === "logout") {
    userStore.clear()
  }
}
</script>

<style scoped>
.layout {
  height: 100vh;
}
.aside {
  background: #001529;
}
.logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-weight: 600;
  border-bottom: 1px solid #002140;
}
.menu {
  border-right: 0;
}
.header {
  background: #fff;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
}
.title {
  font-size: 18px;
  font-weight: 500;
}
.user-info {
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
}
.el-main {
  background: #f5f7fa;
  padding: 24px;
}
</style>

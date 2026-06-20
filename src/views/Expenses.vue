<!--
  Expenses 报销管理页面(RFC v0.4 §4.9)
  - 用 ExpenseItemEditor + ExpenseSummary 姐妹组件
  - 新建/编辑/详情 dialog
  - 后端 ExpenseSerializer 嵌套 items(全删重建模式)
-->
<template>
  <div class="expenses">
    <header class="header">
      <h1>报销</h1>
      <el-button type="primary" :icon="Plus" @click="openCreate">新建报销</el-button>
    </header>
    <p class="hint">RFC v0.4 §4.9 - ExpenseItemEditor + ExpenseSummary 演示</p>

    <el-card>
      <el-table v-loading="loading" :data="list" border stripe>
        <el-table-column prop="expense_no" label="单号" width="180" />
        <el-table-column prop="title" label="事由" min-width="180" />
        <el-table-column label="报销人" width="120">
          <template #default="{ row }">
            {{ row.applicant?.display_name ?? row.applicant?.email ?? row.applicant }}
          </template>
        </el-table-column>
        <el-table-column prop="total_amount" label="总金额" width="140" align="right">
          <template #default="{ row }">{{ formatYuan(row.total_amount) }}</template>
        </el-table-column>
        <el-table-column label="明细" width="80" align="center">
          <template #default="{ row }">{{ row.items?.length ?? 0 }} 项</template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusType(row.status)">{{ row.status_display }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="openEdit(row)">编辑</el-button>
            <el-button size="small" type="danger" @click="onDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 新建 / 编辑 dialog -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogMode === 'create' ? '新建报销' : '编辑报销'"
      width="900px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px"
      >
        <el-form-item label="事由" prop="title">
          <el-input v-model="form.title" placeholder="例:6月出差北京" />
        </el-form-item>
        <el-form-item label="关联合同">
          <el-input-number v-model="form.contract" :min="0" placeholder="可选" />
        </el-form-item>

        <el-form-item label="费用明细">
          <ExpenseItemEditor v-model:items="form.items" />
          <ExpenseSummary :items="form.items" />
        </el-form-item>

        <el-form-item label="附件">
          <el-input v-model="form.attachment" placeholder="URL 或留空" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="onSave">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue"
import { ElMessage, type FormInstance, type FormRules } from "element-plus"
import { Plus } from "@element-plus/icons-vue"
import api from "@/api/client"
import ExpenseItemEditor from "@/components/ExpenseItemEditor.vue"
import ExpenseSummary, { type ExpenseItem } from "@/components/ExpenseSummary.vue"
import { useUserStore } from "@/stores/user"

interface Expense {
  id: number
  expense_no: string
  title: string
  applicant: { id: number; email: string; display_name?: string } | number
  contract?: number
  total_amount: string
  status: string
  status_display: string
  items?: ExpenseItem[]
  attachment?: string
}

const userStore = useUserStore()
const loading = ref(false)
const saving = ref(false)
const list = ref<Expense[]>([])
const dialogVisible = ref(false)
const dialogMode = ref<"create" | "edit">("create")
const formRef = ref<FormInstance>()

const form = reactive({
  title: "",
  contract: null as number | null,
  items: [] as ExpenseItem[],
  attachment: "",
})
const rules: FormRules = {
  title: [{ required: true, message: "请输入报销事由", trigger: "blur" }],
}

function formatYuan(s: string | number) {
  const n = Number(s)
  if (!Number.isFinite(n)) return "-"
  return `¥ ${n.toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function statusType(status: string) {
  if (status === "draft") return "info"
  if (status === "pending") return "warning"
  if (status === "approved" || status === "paid") return "success"
  if (status === "rejected") return "danger"
  return ""
}

async function loadList() {
  loading.value = true
  try {
    const r = await api.get("/expenses/", { params: { page_size: 50 } })
    list.value = r.data.results ?? []
  } finally {
    loading.value = false
  }
}

function openCreate() {
  dialogMode.value = "create"
  Object.assign(form, {
    title: "",
    contract: null,
    items: [],
    attachment: "",
  })
  dialogVisible.value = true
}

async function openEdit(row: Expense) {
  dialogMode.value = "edit"
  try {
    const r = await api.get(`/expenses/${row.id}/`)
    const e = r.data
    Object.assign(form, {
      title: e.title,
      contract: e.contract,
      items: e.items ?? [],
      attachment: e.attachment ?? "",
    })
    dialogVisible.value = true
  } catch (e) {
    // interceptor
  }
}

async function onSave() {
  if (!formRef.value) return
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  saving.value = true
  try {
    const payload = {
      title: form.title,
      contract: form.contract,
      items: form.items,
      attachment: form.attachment,
    }
    if (dialogMode.value === "create") {
      await api.post("/expenses/", payload)
      ElMessage.success("已创建")
    } else {
      // 找原 ID
      const cur = list.value.find((x) => x.title === form.title)
      if (cur) {
        await api.patch(`/expenses/${cur.id}/`, payload)
        ElMessage.success("已保存")
      }
    }
    dialogVisible.value = false
    loadList()
  } finally {
    saving.value = false
  }
}

async function onDelete(row: Expense) {
  try {
    await api.delete(`/expenses/${row.id}/`)
    ElMessage.success("已删除")
    loadList()
  } catch (e) {
    // interceptor
  }
}

onMounted(loadList)
</script>

<style scoped>
.expenses h1 {
  margin: 0;
}
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}
.hint {
  color: #909399;
  font-size: 13px;
  margin-bottom: 16px;
}
</style>

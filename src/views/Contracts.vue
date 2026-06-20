<!--
  Contracts 合同管理页面(RFC v0.4 §4.10)
  - 列表 + 新建/编辑 dialog
  - 用 ContractPaymentTermEditor + ContractPaymentTermSummary
  - 后端 ContractSerializer 嵌套 payment_terms(全删重建)
  - DRAFT 状态可编辑(后端检查)
-->
<template>
  <div class="contracts">
    <header class="header">
      <h1>合同</h1>
      <el-button type="primary" :icon="Plus" @click="openCreate">新建合同</el-button>
    </header>
    <p class="hint">RFC v0.4 §4.10 - ContractPaymentTermEditor + ContractPaymentTermSummary 演示</p>

    <el-card>
      <el-table v-loading="loading" :data="list" border stripe>
        <el-table-column prop="contract_no" label="合同号" width="180" />
        <el-table-column prop="title" label="标题" min-width="180" />
        <el-table-column label="客户" min-width="160">
          <template #default="{ row }">
            {{ row.customer_name ?? row.customer }}
          </template>
        </el-table-column>
        <el-table-column prop="amount" label="金额" width="140" align="right">
          <template #default="{ row }">{{ formatYuan(row.amount) }}</template>
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

    <el-dialog
      v-model="dialogVisible"
      :title="dialogMode === 'create' ? '新建合同' : '编辑合同'"
      width="1000px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px"
      >
        <el-form-item label="合同号" prop="contract_no">
          <el-input v-model="form.contract_no" placeholder="留空自动生成" />
        </el-form-item>
        <el-form-item label="标题" prop="title">
          <el-input v-model="form.title" placeholder="例:2026年度开发服务合同" />
        </el-table>
        </el-form-item>
        <el-form-item label="客户" prop="customer">
          <CustomerSelect
            v-model="form.customer"
            :party-types="['party_a']"
            placeholder="选择客户"
          />
        </el-form-item>
        <el-form-item label="金额" prop="amount">
          <el-input-number
            v-model="form.amount"
            :min="0"
            :precision="2"
            :step="1000"
            controls-position="right"
          />
        </el-form-item>
        <el-form-item label="签约日期">
          <el-date-picker
            v-model="form.sign_date"
            type="date"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>

        <el-divider>收款计划</el-divider>
        <ContractPaymentTermSummary
          :terms="form.payment_terms"
          :contract-amount="form.amount"
        />
        <ContractPaymentTermEditor
          v-model:terms="form.payment_terms"
          :contract-amount="form.amount"
        />
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
import CustomerSelect from "@/components/CustomerSelect.vue"
import ContractPaymentTermEditor from "@/components/ContractPaymentTermEditor.vue"
import ContractPaymentTermSummary, {
  type PaymentTerm,
} from "@/components/ContractPaymentTermSummary.vue"

interface Contract {
  id: number
  contract_no: string
  title: string
  customer: number
  customer_name?: string
  amount: string
  status: string
  status_display: string
  sign_date?: string
  payment_terms?: PaymentTerm[]
}

const loading = ref(false)
const saving = ref(false)
const list = ref<Contract[]>([])
const dialogVisible = ref(false)
const dialogMode = ref<"create" | "edit">("create")
const formRef = ref<FormInstance>()

const form = reactive({
  contract_no: "",
  title: "",
  customer: null as number | null,
  amount: 0,
  sign_date: null as string | null,
  payment_terms: [] as PaymentTerm[],
})

const rules: FormRules = {
  title: [{ required: true, message: "请输入合同标题", trigger: "blur" }],
  customer: [{ required: true, message: "请选择客户", trigger: "change" }],
  amount: [{ required: true, message: "请输入金额", trigger: "blur" }],
}

function formatYuan(s: string | number) {
  const n = Number(s)
  if (!Number.isFinite(n)) return "-"
  return `¥ ${n.toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function statusType(status: string) {
  if (status === "draft") return "info"
  if (status === "pending") return "warning"
  if (status === "active" || status === "approved") return "success"
  if (status === "rejected") return "danger"
  return ""
}

async function loadList() {
  loading.value = true
  try {
    const r = await api.get("/contracts/", { params: { page_size: 50 } })
    list.value = r.data.results ?? []
  } finally {
    loading.value = false
  }
}

function openCreate() {
  dialogMode.value = "create"
  Object.assign(form, {
    contract_no: "",
    title: "",
    customer: null,
    amount: 0,
    sign_date: null,
    payment_terms: [],
  })
  dialogVisible.value = true
}

async function openEdit(row: Contract) {
  dialogMode.value = "edit"
  try {
    const r = await api.get(`/contracts/${row.id}/`)
    const c = r.data
    Object.assign(form, {
      contract_no: c.contract_no,
      title: c.title,
      customer: c.customer,
      amount: Number(c.amount),
      sign_date: c.sign_date,
      payment_terms: c.payment_terms ?? [],
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
  // 校验 percentage 100%
  const totalPct = form.payment_terms.reduce(
    (s, t) => s + Number(t.percentage || 0),
    0,
  )
  if (form.payment_terms.length > 0 && Math.abs(totalPct - 100) > 0.01) {
    ElMessage.error("百分比合计必须为 100%")
    return
  }
  saving.value = true
  try {
    const payload = {
      contract_no: form.contract_no,
      title: form.title,
      customer: form.customer,
      amount: form.amount,
      sign_date: form.sign_date,
      payment_terms: form.payment_terms,
    }
    if (dialogMode.value === "create") {
      await api.post("/contracts/", payload)
      ElMessage.success("已创建")
    } else {
      // 找原 ID
      const cur = list.value.find((x) => x.title === form.title)
      if (cur) {
        await api.patch(`/contracts/${cur.id}/`, payload)
        ElMessage.success("已保存")
      }
    }
    dialogVisible.value = false
    loadList()
  } finally {
    saving.value = false
  }
}

async function onDelete(row: Contract) {
  try {
    await api.delete(`/contracts/${row.id}/`)
    ElMessage.success("已删除")
    loadList()
  } catch (e) {
    // interceptor
  }
}

onMounted(loadList)
</script>

<style scoped>
.contracts h1 {
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

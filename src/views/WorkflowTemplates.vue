<!--
  WorkflowTemplates 审批流模板管理(RFC v0.4 §4.8.1)
  - 仅超管可访问(路由 meta.requiresSuperuser + 后端 IsSuperUserOrReadOnly)
  - 基础 CRUD:列表 / 新建 / 详情 / 编辑 / 启用/停用
  - 可视化设计器(node canvas)推后到 v0.5
-->
<template>
  <div class="wf-templates">
    <header class="header">
      <h1>审批流模板</h1>
      <el-button type="primary" :icon="Plus" @click="openCreate">新建模板</el-button>
    </header>
    <p class="hint">RFC v0.4 §4.8.1 - 仅超管可改;可视化设计器(P2 节点画布)推后到 v0.5</p>

    <el-card>
      <div class="filter-bar">
        <el-select
          v-model="filterActive"
          placeholder="状态"
          clearable
          @change="loadList"
          style="width: 140px"
        >
          <el-option label="启用" :value="true" />
          <el-option label="停用" :value="false" />
        </el-select>
        <el-input
          v-model="filterSearch"
          placeholder="搜索 code 或 name"
          clearable
          :prefix-icon="Search"
          @keyup.enter="loadList"
          @clear="loadList"
          style="width: 240px"
        />
        <el-button :icon="Refresh" @click="loadList">刷新</el-button>
      </div>

      <el-table
        v-loading="loading"
        :data="list"
        border
        stripe
        style="width: 100%"
      >
        <el-table-column prop="code" label="编码" width="200" />
        <el-table-column prop="name" label="名称" min-width="180" />
        <el-table-column label="适用对象" width="160">
          <template #default="{ row }">
            <span class="ct">{{ row.content_type_label ?? row.content_type }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="version" label="版本" width="80" align="center" />
        <el-table-column prop="priority" label="优先级" width="80" align="center" />
        <el-table-column label="启用" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="row.is_active ? 'success' : 'info'" size="small">
              {{ row.is_active ? "是" : "否" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="节点" width="80" align="center">
          <template #default="{ row }">
            {{ row.nodes?.length ?? 0 }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="openDetail(row)">查看</el-button>
            <el-button size="small" type="primary" @click="openEdit(row)">编辑</el-button>
            <el-button
              size="small"
              :type="row.is_active ? 'warning' : 'success'"
              @click="toggleActive(row)"
            >
              {{ row.is_active ? "停用" : "启用" }}
            </el-button>
            <el-popconfirm
              :title="`确认删除「${row.name}」?`"
              @confirm="onDelete(row)"
            >
              <template #reference>
                <el-button size="small" type="danger">删除</el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="page"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50]"
        :total="total"
        layout="total, sizes, prev, pager, next, jumper"
        background
        @current-change="loadList"
        @size-change="loadList"
        style="margin-top: 16px; justify-content: flex-end"
      />
    </el-card>

    <!-- 详情 / 编辑 / 新建 dialog -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="640px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px"
        :disabled="dialogMode === 'view'"
      >
        <el-form-item label="编码" prop="code">
          <el-input v-model="form.code" placeholder="例:contract-new-sign-001" />
        </el-form-item>
        <el-form-item label="名称" prop="name">
          <el-input v-model="form.name" placeholder="例:新签合同审批" />
        </el-form-item>
        <el-form-item label="适用对象" prop="content_type">
          <el-input
            v-model="form.content_type"
            placeholder="例: contracts.contract"
            :disabled="dialogMode === 'edit'"
          >
            <template #append>
              <el-tag size="small" type="info">暂只允许文本编辑</el-tag>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item label="优先级" prop="priority">
          <el-input-number v-model="form.priority" :min="0" :max="999" />
        </el-form-item>
        <el-form-item label="启用" prop="is_active">
          <el-switch v-model="form.is_active" />
        </el-form-item>
        <el-form-item label="触发条件" prop="trigger_condition">
          <el-input
            v-model="form.trigger_condition"
            type="textarea"
            :rows="3"
            placeholder='例: {"amount__gte": 100000}(JSON 格式,可选)'
          />
        </el-form-item>

        <template v-if="dialogMode === 'view' && currentTemplate">
          <el-divider>节点 ({{ currentTemplate.nodes?.length ?? 0 }})</el-divider>
          <div v-if="!currentTemplate.nodes?.length" class="empty">无节点</div>
          <div v-else class="nodes">
            <div v-for="(n, i) in currentTemplate.nodes" :key="n.id ?? i" class="node">
              <strong>{{ i + 1 }}.</strong>
              {{ n.name ?? n.code ?? `节点 ${n.id}` }}
              <span v-if="n.approver_strategy" class="strategy">
                ({{ n.approver_strategy }})
              </span>
            </div>
          </div>
        </template>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button
          v-if="dialogMode !== 'view'"
          type="primary"
          :loading="saving"
          @click="onSave"
        >
          保存
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from "vue"
import { ElMessage, type FormInstance, type FormRules } from "element-plus"
import { Plus, Refresh, Search } from "@element-plus/icons-vue"
import api from "@/api/client"

interface WorkflowTemplate {
  id?: number
  code: string
  name: string
  content_type: number | string
  content_type_label?: string
  version?: number
  priority: number
  is_active: boolean
  trigger_condition?: Record<string, unknown>
  nodes?: Array<{ id: number; name?: string; code?: string; approver_strategy?: string }>
}

const loading = ref(false)
const saving = ref(false)
const list = ref<WorkflowTemplate[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const filterActive = ref<boolean | "">("")
const filterSearch = ref("")

// dialog
const dialogVisible = ref(false)
const dialogMode = ref<"create" | "edit" | "view">("view")
const currentTemplate = ref<WorkflowTemplate | null>(null)
const formRef = ref<FormInstance>()
const form = reactive<WorkflowTemplate>({
  code: "",
  name: "",
  content_type: 1,
  priority: 0,
  is_active: true,
  trigger_condition: {},
})
const rules: FormRules = {
  code: [{ required: true, message: "请输入编码", trigger: "blur" }],
  name: [{ required: true, message: "请输入名称", trigger: "blur" }],
  content_type: [{ required: true, message: "请输入适用对象", trigger: "blur" }],
}

const dialogTitle = computed(() => {
  if (dialogMode.value === "create") return "新建审批流模板"
  if (dialogMode.value === "edit") return `编辑: ${currentTemplate.value?.name ?? ""}`
  return `详情: ${currentTemplate.value?.name ?? ""}`
})

async function loadList() {
  loading.value = true
  try {
    const params: Record<string, string | number | boolean> = {
      page: page.value,
      page_size: pageSize.value,
    }
    if (filterActive.value !== "") params.is_active = filterActive.value
    if (filterSearch.value) params.search = filterSearch.value
    const r = await api.get("/workflow-templates/", { params })
    list.value = r.data.results ?? []
    total.value = r.data.count ?? 0
  } catch (e) {
    // interceptor already shows error
  } finally {
    loading.value = false
  }
}

function openCreate() {
  dialogMode.value = "create"
  currentTemplate.value = null
  Object.assign(form, {
    code: "",
    name: "",
    content_type: 1,
    priority: 0,
    is_active: true,
    trigger_condition: {},
  })
  dialogVisible.value = true
}

function openEdit(row: WorkflowTemplate) {
  dialogMode.value = "edit"
  currentTemplate.value = row
  Object.assign(form, {
    code: row.code,
    name: row.name,
    content_type: row.content_type,
    priority: row.priority,
    is_active: row.is_active,
    trigger_condition: row.trigger_condition ?? {},
  })
  dialogVisible.value = true
}

async function openDetail(row: WorkflowTemplate) {
  dialogMode.value = "view"
  try {
    const r = await api.get(`/workflow-templates/${row.id}/`)
    currentTemplate.value = r.data
    Object.assign(form, {
      code: r.data.code,
      name: r.data.name,
      content_type: r.data.content_type,
      priority: r.data.priority,
      is_active: r.data.is_active,
      trigger_condition: r.data.trigger_condition ?? {},
    })
    dialogVisible.value = true
  } catch (e) {
    // interceptor handles
  }
}

async function onSave() {
  if (!formRef.value) return
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  saving.value = true
  try {
    if (dialogMode.value === "create") {
      await api.post("/workflow-templates/", form)
      ElMessage.success("已创建")
    } else if (dialogMode.value === "edit" && currentTemplate.value?.id) {
      await api.patch(`/workflow-templates/${currentTemplate.value.id}/`, form)
      ElMessage.success("已保存")
    }
    dialogVisible.value = false
    loadList()
  } catch (e) {
    // interceptor handles
  } finally {
    saving.value = false
  }
}

async function toggleActive(row: WorkflowTemplate) {
  try {
    await api.patch(`/workflow-templates/${row.id}/`, { is_active: !row.is_active })
    ElMessage.success(row.is_active ? "已停用" : "已启用")
    loadList()
  } catch (e) {
    // interceptor handles
  }
}

async function onDelete(row: WorkflowTemplate) {
  try {
    await api.delete(`/workflow-templates/${row.id}/`)
    ElMessage.success("已删除")
    loadList()
  } catch (e) {
    // interceptor handles
  }
}

onMounted(loadList)
</script>

<style scoped>
.wf-templates h1 {
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
.filter-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}
.ct {
  font-family: monospace;
  color: #606266;
}
.empty {
  text-align: center;
  color: #909399;
  padding: 16px;
}
.nodes {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.node {
  padding: 8px 12px;
  background: #f5f7fa;
  border-radius: 4px;
  font-size: 13px;
}
.strategy {
  color: #909399;
  font-size: 12px;
  margin-left: 4px;
}
</style>

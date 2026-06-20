<!--
  ContractPaymentTermEditor 收款计划行编辑器(RFC v0.4 §4.10)
  - 增/删/改行
  - 每行:sequence(序号) + name(名称) + percentage(%) + amount(金额) + due_date(应收日期)
  - v-model:terms 与父组件双向绑定
  - 后端 save() 自动算 amount = contract.amount × percentage/100
  - 也可手改 amount 覆盖
-->
<template>
  <div class="term-editor">
    <div class="header">
      <span class="title">收款计划</span>
      <el-button type="primary" :icon="Plus" size="small" @click="onAdd">
        添加一期
      </el-button>
    </div>

    <el-table
      :data="terms"
      border
      size="small"
      empty-text="暂无收款计划,点右上角添加"
    >
      <el-table-column label="期次" width="60" align="center">
        <template #default="{ $index }">{{ $index + 1 }}</template>
      </el-table-column>
      <el-table-column label="名称" min-width="140">
        <template #default="{ row }">
          <el-input
            v-model="row.name"
            placeholder="例:首付款"
            size="small"
          />
        </template>
      </el-table-column>
      <el-table-column label="百分比 (%)" min-width="120">
        <template #default="{ row }">
          <el-input-number
            v-model="row.percentage"
            :min="0"
            :max="100"
            :precision="2"
            :step="5"
            size="small"
            controls-position="right"
            style="width: 100%"
            @change="onPercentageChange(row)"
          />
        </template>
      </el-table-column>
      <el-table-column label="金额" min-width="140">
        <template #default="{ row }">
          <el-input-number
            v-model="row.amount"
            :min="0"
            :precision="2"
            :step="100"
            size="small"
            controls-position="right"
            style="width: 100%"
            placeholder="自动算"
          />
        </template>
      </el-table-column>
      <el-table-column label="应收日期" min-width="140">
        <template #default="{ row }">
          <el-date-picker
            v-model="row.due_date"
            type="date"
            value-format="YYYY-MM-DD"
            size="small"
            style="width: 100%"
            placeholder="可选"
          />
        </template>
      </el-table-column>
      <el-table-column label="条件" min-width="120">
        <template #default="{ row }">
          <el-input
            v-model="row.condition"
            placeholder="可选"
            size="small"
          />
        </template>
      </el-table-column>
      <el-table-column label="操作" width="80" align="center" fixed="right">
        <template #default="{ $index }">
          <el-button
            type="danger"
            :icon="Delete"
            size="small"
            link
            @click="onRemove($index)"
          />
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup lang="ts">
import { Plus, Delete } from "@element-plus/icons-vue"
import type { PaymentTerm } from "./ContractPaymentTermSummary.vue"

const props = withDefaults(
  defineProps<{
    terms: PaymentTerm[]
    contractAmount?: number
  }>(),
  { terms: () => [], contractAmount: 0 },
)

const emit = defineEmits<{
  "update:terms": [terms: PaymentTerm[]]
}>()

function onAdd() {
  const newItem: PaymentTerm = {
    name: "",
    percentage: 0,
    amount: 0,
    due_date: undefined,
    condition: "",
  }
  emit("update:terms", [...props.terms, newItem])
}

function onRemove(index: number) {
  emit("update:terms", props.terms.filter((_, i) => i !== index))
}

/** 改 percentage 时,自动算 amount = contract.amount × percentage/100(可手改覆盖) */
function onPercentageChange(row: PaymentTerm) {
  if (props.contractAmount && row.percentage) {
    row.amount = +(props.contractAmount * row.percentage / 100).toFixed(2)
  }
}
</script>

<style scoped>
.term-editor {
  margin-bottom: 16px;
}
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
.title {
  font-weight: 500;
  color: #303133;
}
</style>

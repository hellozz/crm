<!--
  ExpenseSummary 实时总费用卡(RFC v0.4 §4.9.3)
  - 纯前端计算 sum(items.amount)
  - 增/删/改任一行后立即重算(无 API 调用)
  - 提交时后端 save() 兜底重算(RFC v0.4 §4.9.2)
-->
<template>
  <div class="expense-summary">
    <div class="summary-label">报销总费用</div>
    <div class="summary-value">
      <span class="currency">¥</span>
      <span class="amount">{{ formatted }}</span>
    </div>
    <div class="summary-meta">
      <el-tag size="small" type="info">{{ items.length }} 项</el-tag>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue"

export interface ExpenseItem {
  id?: number
  line_no?: number
  category: string
  description?: string
  amount: number
  incurred_on?: string
}

const props = withDefaults(
  defineProps<{
    items: ExpenseItem[]
  }>(),
  { items: () => [] },
)

const total = computed(() =>
  props.items.reduce((sum, it) => sum + Number(it.amount || 0), 0),
)

const formatted = computed(() =>
  total.value.toLocaleString("zh-CN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }),
)
</script>

<style scoped>
.expense-summary {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px 16px;
  background: linear-gradient(135deg, #ecf5ff 0%, #f0f9ff 100%);
  border-radius: 8px;
  margin-bottom: 16px;
}
.summary-label {
  color: #606266;
  font-size: 14px;
  margin-bottom: 8px;
}
.summary-value {
  display: flex;
  align-items: baseline;
  gap: 4px;
  margin-bottom: 8px;
}
.currency {
  color: #409eff;
  font-size: 18px;
}
.amount {
  color: #409eff;
  font-size: 36px;
  font-weight: 600;
  line-height: 1;
}
.summary-meta {
  display: flex;
  gap: 6px;
}
</style>

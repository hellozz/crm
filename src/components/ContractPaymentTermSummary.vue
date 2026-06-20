<!--
  ContractPaymentTermSummary 收款计划总览卡(RFC v0.4 §4.10)
  - 实时显示各期 percentage 之和(应该 100%)
  - 计算:sum(percentage) vs 100%,sum(amount) vs contract.amount
  - 增/删/改任一行后立即重算
  - 校验:sum(percentage) == 100% 才有绿色 ✓
-->
<template>
  <div class="terms-summary">
    <el-row :gutter="16">
      <el-col :span="8">
        <div class="metric">
          <div class="label">总期数</div>
          <div class="value">{{ terms.length }} 期</div>
        </div>
      </el-col>
      <el-col :span="8">
        <div class="metric">
          <div class="label">百分比合计</div>
          <div class="value" :class="pctClass">
            {{ totalPercentage.toFixed(2) }}%
            <el-icon v-if="percentageOk" class="ok"><Check /></el-icon>
          </div>
        </div>
      </el-col>
      <el-col :span="8">
        <div class="metric">
          <div class="label">金额合计</div>
          <div class="value">¥ {{ formatYuan(totalAmount) }}</div>
        </div>
      </el-col>
    </el-row>
    <el-alert
      v-if="terms.length > 0 && !percentageOk"
      title="百分比合计必须为 100%"
      type="warning"
      :closable="false"
      show-icon
      style="margin-top: 8px"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue"
import { Check } from "@element-plus/icons-vue"

export interface PaymentTerm {
  id?: number
  period?: number
  sequence?: number
  name: string
  percentage: number
  amount: number
  due_date?: string
  ratio?: number
  condition?: string
  planned_date?: string
  status?: string
}

const props = withDefaults(
  defineProps<{
    terms: PaymentTerm[]
    contractAmount?: number
  }>(),
  { terms: () => [], contractAmount: 0 },
)

const totalPercentage = computed(() =>
  props.terms.reduce((sum, t) => sum + Number(t.percentage || 0), 0),
)

const totalAmount = computed(() =>
  props.terms.reduce((sum, t) => sum + Number(t.amount || 0), 0),
)

const percentageOk = computed(() => Math.abs(totalPercentage.value - 100) < 0.01)

const pctClass = computed(() =>
  percentageOk.value ? "value-ok" : "value-warn",
)

function formatYuan(n: number) {
  return n.toLocaleString("zh-CN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}
</script>

<style scoped>
.terms-summary {
  padding: 16px;
  background: #f5f7fa;
  border-radius: 8px;
  margin-bottom: 12px;
}
.metric {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.label {
  color: #909399;
  font-size: 12px;
  margin-bottom: 4px;
}
.value {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  display: flex;
  align-items: center;
  gap: 4px;
}
.value-ok {
  color: #67c23a;
}
.value-warn {
  color: #e6a23c;
}
.ok {
  color: #67c23a;
}
</style>

<template>
  <div class="customers">
    <h1>客户</h1>
    <p class="hint">RFC v0.4 §4.6 - CustomerSelect 组件演示</p>

    <el-card class="demo">
      <template #header>
        <span>选客户(party_a,合同下拉用)</span>
      </template>
      <div class="form-row">
        <label>客户:</label>
        <CustomerSelect
          v-model="selectedId"
          :party-types="['party_a']"
          placeholder="选择客户(甲方)"
        />
        <span class="result">已选 ID: {{ selectedId ?? "—" }}</span>
      </div>
    </el-card>

    <el-card class="demo">
      <template #header>
        <span>多选(party_a + party_b 合并去重)</span>
      </template>
      <div class="form-row">
        <label>客户(多):</label>
        <CustomerSelect
          v-model="selectedIds"
          :party-types="['party_a', 'party_b']"
          :multiple="true"
          placeholder="多选客户"
        />
        <span class="result">已选: {{ selectedIds?.join(", ") ?? "—" }}</span>
      </div>
    </el-card>

    <el-card class="demo">
      <template #header>
        <span>只显示乙方(付款方下拉)</span>
      </template>
      <div class="form-row">
        <label>客户:</label>
        <CustomerSelect
          v-model="payeeId"
          :party-types="['party_b']"
          placeholder="选择客户(乙方)"
        />
        <span class="result">已选 ID: {{ payeeId ?? "—" }}</span>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue"
import CustomerSelect from "@/components/CustomerSelect.vue"

const selectedId = ref<number | null>(null)
const selectedIds = ref<number[]>([])
const payeeId = ref<number | null>(null)
</script>

<style scoped>
.customers h1 {
  margin: 0 0 8px 0;
}
.hint {
  color: #909399;
  font-size: 13px;
  margin-bottom: 16px;
}
.demo {
  margin-bottom: 16px;
}
.form-row {
  display: flex;
  align-items: center;
  gap: 12px;
}
.form-row label {
  min-width: 70px;
  color: #606266;
  font-size: 13px;
}
.result {
  color: #909399;
  font-size: 13px;
  margin-left: auto;
}
</style>

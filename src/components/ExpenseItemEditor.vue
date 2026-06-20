<!--
  ExpenseItemEditor 行项目编辑器(RFC v0.4 §4.9.3)
  - 增 / 删 / 改行
  - 每行:line_no + category + description + amount + incurred_on
  - 通过 v-model:items 与父组件双向绑定
  - 序号自动重排(删中间行后,后端 save() 会重新 max+1)
-->
<template>
  <div class="item-editor">
    <div class="header">
      <span class="title">费用明细</span>
      <el-button type="primary" :icon="Plus" size="small" @click="onAdd">
        添加一行
      </el-button>
    </div>

    <el-table :data="items" border size="small" empty-text="暂无费用明细,点右上角添加">
      <el-table-column label="#" width="50" align="center">
        <template #default="{ $index }">{{ $index + 1 }}</template>
      </el-table-column>
      <el-table-column label="类别" min-width="140">
        <template #default="{ row }">
          <el-input
            v-model="row.category"
            placeholder="例:交通 / 餐饮 / 住宿"
            size="small"
          />
        </template>
      </el-table-column>
      <el-table-column label="说明" min-width="160">
        <template #default="{ row }">
          <el-input
            v-model="row.description"
            placeholder="可选"
            size="small"
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
          />
        </template>
      </el-table-column>
      <el-table-column label="发生日期" min-width="140">
        <template #default="{ row }">
          <el-date-picker
            v-model="row.incurred_on"
            type="date"
            value-format="YYYY-MM-DD"
            size="small"
            style="width: 100%"
            placeholder="可选"
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
import type { ExpenseItem } from "./ExpenseSummary.vue"

const props = withDefaults(
  defineProps<{
    items: ExpenseItem[]
  }>(),
  { items: () => [] },
)

const emit = defineEmits<{
  "update:items": [items: ExpenseItem[]]
}>()

function onAdd() {
  const newItem: ExpenseItem = {
    category: "",
    description: "",
    amount: 0,
  }
  emit("update:items", [...props.items, newItem])
}

function onRemove(index: number) {
  const newItems = props.items.filter((_, i) => i !== index)
  emit("update:items", newItems)
}
</script>

<style scoped>
.item-editor {
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

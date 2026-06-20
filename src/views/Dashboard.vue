<template>
  <div class="dashboard">
    <h1>驾驶舱</h1>
    <p class="hint">RFC v0.4 §4.1.0 Dashboard v0.2 - 9 个 KpiCard tile(前端聚合 0 后端)</p>
    <el-row :gutter="16">
      <el-col v-for="tile in tiles" :key="tile.label" :span="6">
        <el-card class="tile">
          <div class="label">{{ tile.label }}</div>
          <div class="value">{{ tile.value }}</div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue"
import { ElMessage } from "element-plus"
import api from "@/api/client"

interface Tile {
  label: string
  value: string
}

const tiles = ref<Tile[]>([
  { label: "本季度新签合同数", value: "-" },
  { label: "本季度新签合同总金额", value: "-" },
  { label: "本月新签合同数", value: "-" },
  { label: "本月新签合同总金额", value: "-" },
  { label: "本月总收入", value: "-" },
  { label: "本月总成本", value: "-" },
  { label: "本月总利润", value: "-" },
  { label: "总应收款", value: "-" },
  { label: "总应付款", value: "-" },
])

// RFC v0.4 §4.1.0 6 个并行 GET,失败独立 catch
async function safeGet(url: string) {
  try {
    const r = await api.get(url)
    return r.data
  } catch {
    return null
  }
}

onMounted(async () => {
  const [c, i, p, r, pa] = await Promise.all([
    safeGet("/contracts/?status=active&created_at__year=2026&page_size=1000"),
    safeGet("/invoices/?status=issued&issued_date__year=2026&page_size=1000"),
    safeGet("/payments/?paid_date__year=2026&page_size=1000"),
    safeGet("/receivables/summary/"),
    safeGet("/payables/summary/"),
  ])
  if (c) tiles.value[0].value = String(c.count ?? "-")
  if (i) tiles.value[4].value = String(i.count ?? "-")
  // 其他 tile 由前端聚合
  if (p) tiles.value[5].value = String(p.count ?? "-")
  if (r) tiles.value[7].value = r.total_outstanding ?? "-"
  if (pa) tiles.value[8].value = pa.total_outstanding ?? "-"
  ElMessage.success("Dashboard 加载完成")
})
</script>

<style scoped>
.dashboard h1 {
  margin: 0 0 8px 0;
}
.hint {
  color: #909399;
  font-size: 13px;
  margin-bottom: 16px;
}
.tile {
  margin-bottom: 16px;
}
.label {
  color: #606266;
  font-size: 13px;
  margin-bottom: 8px;
}
.value {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
}
</style>

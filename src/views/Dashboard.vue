<template>
  <div class="dashboard">
    <header class="dash-header">
      <h1>驾驶舱</h1>
      <div class="actions">
        <span class="hint">RFC v0.4 §4.1.0 Dashboard v0.2</span>
        <el-button :icon="Refresh" :loading="loading" @click="refresh" circle />
      </div>
    </header>

    <section v-if="lastError" class="error-banner">
      <el-alert :title="lastError" type="warning" show-icon :closable="false" />
    </section>

    <el-row :gutter="16">
      <el-col v-for="tile in tiles" :key="tile.key" :span="6">
        <el-card
          :class="['tile', { 'tile-loading': tile.loading, 'tile-error': tile.error }]"
          shadow="hover"
        >
          <div class="tile-label">{{ tile.label }}</div>
          <div v-if="tile.loading" class="tile-value">
            <el-skeleton-item variant="text" style="width: 60%; height: 28px" />
          </div>
          <div v-else-if="tile.error" class="tile-value tile-error-text">—</div>
          <div v-else class="tile-value">{{ tile.value }}</div>
          <div v-if="tile.sub" class="tile-sub">{{ tile.sub }}</div>
        </el-card>
      </el-col>
    </el-row>

    <section v-if="netPosition !== null" class="net-position">
      <el-card>
        <div class="net-row">
          <span class="net-label">净头寸(应收 - 应付)</span>
          <span :class="['net-value', netClass]">
            {{ netPosition > 0 ? '+' : '' }}{{ formatYuan(netPosition) }}
          </span>
          <el-tag :type="netTagType" effect="dark">{{ netTagLabel }}</el-tag>
        </div>
      </el-card>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue"
import { Refresh } from "@element-plus/icons-vue"
import api from "@/api/client"

interface Tile {
  key: string
  label: string
  value: string
  sub?: string
  loading: boolean
  error: boolean
}

const loading = ref(false)
const lastError = ref<string | null>(null)

// 9 个 tile
const tiles = ref<Tile[]>([
  { key: "qContracts", label: "本季度新签合同数", value: "-", loading: true, error: false },
  { key: "qContractAmount", label: "本季度新签合同总金额", value: "-", loading: true, error: false },
  { key: "mContracts", label: "本月新签合同数", value: "-", loading: true, error: false },
  { key: "mContractAmount", label: "本月新签合同总金额", value: "-", loading: true, error: false },
  { key: "mIncome", label: "本月总收入", value: "-", loading: true, error: false },
  { key: "mCost", label: "本月总成本", value: "-", loading: true, error: false },
  { key: "mProfit", label: "本月总利润", value: "-", loading: true, error: false },
  { key: "receivable", label: "总应收款", value: "-", loading: true, error: false },
  { key: "payable", label: "总应付款", value: "-", loading: true, error: false },
])

function fmtYuan(s: string | number | null | undefined): string {
  if (s === null || s === undefined) return "-"
  const n = Number(s)
  if (!Number.isFinite(n)) return "-"
  return `¥ ${n.toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}
const formatYuan = fmtYuan

// 季度 / 月份边界(本地时间)
function quarterStart(d = new Date()): Date {
  const m = d.getMonth()
  const qm = m - (m % 3)
  return new Date(d.getFullYear(), qm, 1)
}
function monthStart(d = new Date()): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}
function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

// 安全 GET(部分失败独立 catch,不断其他)
async function safeGet(url: string, params: Record<string, string | number | boolean> = {}) {
  try {
    const r = await api.get(url, { params })
    return r.data
  } catch (e) {
    console.warn(`[dashboard] GET ${url} failed:`, e)
    return null
  }
}

function setTile(key: string, value: string, sub?: string) {
  const t = tiles.value.find((x) => x.key === key)
  if (!t) return
  t.value = value
  if (sub !== undefined) t.sub = sub
  t.loading = false
  t.error = false
}
function errTile(key: string) {
  const t = tiles.value.find((x) => x.key === key)
  if (!t) return
  t.value = "-"
  t.loading = false
  t.error = true
}

// 缓存关键数字,用于净头寸
const receivableNum = ref<number | null>(null)
const payableNum = ref<number | null>(null)
const mIncomeNum = ref<number | null>(null)
const mCostNum = ref<number | null>(null)

const netPosition = computed<number | null>(() => {
  if (receivableNum.value === null || payableNum.value === null) return null
  return receivableNum.value - payableNum.value
})
const netClass = computed(() => {
  const n = netPosition.value
  if (n === null) return ""
  if (n > 0) return "net-good"
  if (n === 0) return "net-neutral"
  return "net-bad"
})
const netTagType = computed<"success" | "info" | "danger">(() => {
  const n = netPosition.value
  if (n === null) return "info"
  if (n >= 0) return "success"
  return "danger"
})
const netTagLabel = computed(() => {
  const n = netPosition.value
  if (n === null) return "—"
  if (n > 0) return "应收 > 应付(健康)"
  if (n === 0) return "应收 = 应付(平衡)"
  return "应收 < 应付(预警)"
})

async function refresh() {
  loading.value = true
  lastError.value = null
  // 重置 loading
  tiles.value.forEach((t) => {
    t.loading = true
    t.error = false
  })
  receivableNum.value = null
  payableNum.value = null
  mIncomeNum.value = null
  mCostNum.value = null

  const qStart = isoDate(quarterStart())
  const mStart = isoDate(monthStart())
  const year = new Date().getFullYear()
  const month = new Date().getMonth() + 1

  // 6 个独立 GET,部分失败独立 catch(RFC v0.4 §4.1.0)
  const [cQuarter, cMonth, iMonth, pMonth, rSum, pSum] = await Promise.all([
    safeGet("/contracts/", {
      status: "active",
      created_at__gte: qStart,
      page_size: 1000,
    }),
    safeGet("/contracts/", {
      status: "active",
      created_at__gte: mStart,
      page_size: 1000,
    }),
    safeGet("/invoices/", {
      status: "issued",
      issued_date__year: year,
      issued_date__month: month,
      page_size: 1000,
    }),
    safeGet("/payments/", {
      confirmed: true,
      paid_date__year: year,
      paid_date__month: month,
      page_size: 1000,
    }),
    safeGet("/receivables/summary/"),
    safeGet("/payables/summary/"),
  ])

  // 季度合同
  if (cQuarter) {
    const cnt = cQuarter.count ?? 0
    const sum = (cQuarter.results ?? []).reduce(
      (s: number, x: { amount: string }) => s + Number(x.amount || 0),
      0,
    )
    setTile("qContracts", String(cnt), `本季度`)
    setTile("qContractAmount", fmtYuan(sum))
  } else {
    errTile("qContracts")
    errTile("qContractAmount")
  }

  // 月度合同
  if (cMonth) {
    const cnt = cMonth.count ?? 0
    const sum = (cMonth.results ?? []).reduce(
      (s: number, x: { amount: string }) => s + Number(x.amount || 0),
      0,
    )
    setTile("mContracts", String(cnt), `本月`)
    setTile("mContractAmount", fmtYuan(sum))
  } else {
    errTile("mContracts")
    errTile("mContractAmount")
  }

  // 本月收入(开票)
  if (iMonth) {
    const cnt = iMonth.count ?? 0
    const sum = (iMonth.results ?? []).reduce(
      (s: number, x: { amount: string }) => s + Number(x.amount || 0),
      0,
    )
    mIncomeNum.value = sum
    setTile("mIncome", fmtYuan(sum), `${cnt} 张`)
  } else {
    errTile("mIncome")
  }

  // 本月成本(付款)
  if (pMonth) {
    const cnt = pMonth.count ?? 0
    const sum = (pMonth.results ?? []).reduce(
      (s: number, x: { amount: string }) => s + Number(x.amount || 0),
      0,
    )
    mCostNum.value = sum
    setTile("mCost", fmtYuan(sum), `${cnt} 笔`)
  } else {
    errTile("mCost")
  }

  // 本月利润
  if (mIncomeNum.value !== null && mCostNum.value !== null) {
    setTile("mProfit", fmtYuan(mIncomeNum.value - mCostNum.value))
  } else {
    errTile("mProfit")
  }

  // 应收 / 应付
  if (rSum) {
    const num = Number(rSum.total_outstanding ?? 0)
    receivableNum.value = num
    setTile("receivable", fmtYuan(num), `回款率 ${rSum.collection_rate ?? 0}%`)
  } else {
    errTile("receivable")
  }
  if (pSum) {
    const num = Number(pSum.total_outstanding ?? 0)
    payableNum.value = num
    setTile("payable", fmtYuan(num))
  } else {
    errTile("payable")
  }

  // 总体错误提示(全部失败)
  const failed = tiles.value.filter((t) => t.error).length
  if (failed > 0) {
    lastError.value = `有 ${failed} 项数据加载失败,点刷新按钮重试`
  }
  loading.value = false
}

let intervalId: number | null = null
onMounted(() => {
  refresh()
  // RFC v0.4 §4.1.0:5min polling
  intervalId = window.setInterval(refresh, 5 * 60 * 1000)
})
onUnmounted(() => {
  if (intervalId) clearInterval(intervalId)
})
</script>

<style scoped>
.dashboard {
  max-width: 1400px;
}
.dash-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
.dash-header h1 {
  margin: 0;
  font-size: 22px;
}
.actions {
  display: flex;
  align-items: center;
  gap: 12px;
}
.hint {
  color: #909399;
  font-size: 12px;
}
.error-banner {
  margin-bottom: 16px;
}
.tile {
  margin-bottom: 16px;
  border-radius: 8px;
}
.tile-loading {
  opacity: 0.6;
}
.tile-error {
  border-color: #f89898;
}
.tile-label {
  color: #606266;
  font-size: 13px;
  margin-bottom: 8px;
  min-height: 18px;
}
.tile-value {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  line-height: 1.2;
}
.tile-error-text {
  color: #c0c4cc;
}
.tile-sub {
  color: #909399;
  font-size: 12px;
  margin-top: 4px;
}
.net-position {
  margin-top: 8px;
}
.net-row {
  display: flex;
  align-items: center;
  gap: 16px;
}
.net-label {
  color: #606266;
  font-size: 14px;
}
.net-value {
  font-size: 22px;
  font-weight: 700;
}
.net-good {
  color: #67c23a;
}
.net-neutral {
  color: #909399;
}
.net-bad {
  color: #f56c6c;
}
</style>

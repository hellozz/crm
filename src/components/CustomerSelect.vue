<!--
  CustomerSelect 组件(RFC v0.4 §4.6)
  - 用法:<CustomerSelect v-model="customerId" :party-types="['party_a']" />
  - 调 /api/v1/customers/options/?party_type=party_a
  - 选项显示:客户名 + 简称 + 行业
  - 支持搜索(filterable)
  - 支持清空(clearable)
  - 多选 + 单选两种模式
-->
<template>
  <el-select
    :model-value="modelValue"
    :multiple="multiple"
    :filterable="filterable"
    :clearable="clearable"
    :placeholder="placeholder"
    :loading="loading"
    :disabled="disabled"
    :style="{ width: width }"
    @update:model-value="onChange"
    @visible-change="onVisible"
  >
    <el-option
      v-for="c in options"
      :key="c.id"
      :label="labelOf(c)"
      :value="c.id"
    >
      <div class="cust-option">
        <div class="cust-name">{{ c.name }}</div>
        <div v-if="c.short_name" class="cust-meta">
          {{ c.short_name }}<span v-if="c.industry"> · {{ industryLabel(c.industry) }}</span>
        </div>
      </div>
    </el-option>
    <template v-if="!options.length && !loading">
      <div class="empty">无匹配客户</div>
    </template>
  </el-select>
</template>

<script setup lang="ts">
import { ref, watch } from "vue"
import api from "@/api/client"

/** Customer 选项(从 /customers/options/ 返的精简结构) */
export interface CustomerOption {
  id: number
  name: string
  short_name?: string
  industry?: string
  party_type?: string
  is_active?: boolean
}

const props = withDefaults(
  defineProps<{
    modelValue: number | number[] | null | undefined
    /** 过滤 party_type,默认 party_a(合同下拉) */
    partyTypes?: string[]
    /** 多选 */
    multiple?: boolean
    filterable?: boolean
    clearable?: boolean
    placeholder?: string
    disabled?: boolean
    width?: string
  }>(),
  {
    partyTypes: () => ["party_a"],
    multiple: false,
    filterable: true,
    clearable: true,
    placeholder: "选择客户",
    disabled: false,
    width: "100%",
  },
)

const emit = defineEmits<{
  "update:modelValue": [value: number | number[] | null]
  change: [value: number | number[] | null]
}>()

const options = ref<CustomerOption[]>([])
const loading = ref(false)
let loaded = false

const industryLabels: Record<string, string> = {
  soe: "央国企",
  telecom: "运营商",
  media: "传媒",
  education: "教育科研",
  software: "软件开发",
  manufacturing: "制造",
  finance: "金融",
  medical: "医疗",
}
function industryLabel(code: string) {
  return industryLabels[code] ?? code
}

function labelOf(c: CustomerOption) {
  return c.short_name ? `${c.name} (${c.short_name})` : c.name
}

async function load() {
  loading.value = true
  try {
    // 多个 party_type 客户端合并(后端只支持单选过滤)
    const all: CustomerOption[] = []
    for (const t of props.partyTypes) {
      const r = await api.get("/customers/options/", { params: { party_type: t } })
      all.push(...(r.data as CustomerOption[]))
    }
    // 去重(同 ID)
    const seen = new Set<number>()
    options.value = all.filter((c) => {
      if (seen.has(c.id)) return false
      seen.add(c.id)
      return true
    })
    loaded = true
  } finally {
    loading.value = false
  }
}

function onChange(v: number | number[] | null) {
  emit("update:modelValue", v)
  emit("change", v)
}

function onVisible(open: boolean) {
  // 第一次展开时拉数据
  if (open && !loaded) {
    load()
  }
}

// 外部 partyTypes 变了,重拉
watch(
  () => props.partyTypes.join(","),
  () => {
    loaded = false
    if (options.value.length) load()
  },
)
</script>

<style scoped>
.cust-option {
  display: flex;
  flex-direction: column;
}
.cust-name {
  font-weight: 500;
}
.cust-meta {
  font-size: 12px;
  color: #909399;
  margin-top: 2px;
}
.empty {
  padding: 12px;
  text-align: center;
  color: #909399;
  font-size: 13px;
}
</style>

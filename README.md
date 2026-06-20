# 亿融信通 CRM - 新前端(老板 RED LINE:src/ + dist/ 都进 git)

## 老板的 red line
- 任何前端项目必须 `src/` 源码 + `dist/` 构建产物 同步 commit
- 不接受只交 minified/dist(CRM 老前端就吃了这亏,源码丢了改不动)

## 技术栈

- **Vue 3.4** + Composition API
- **Vite 5** + TypeScript 5
- **Element Plus 2.5**(老板熟悉)
- **Pinia 2**(状态管理)
- **Vue Router 4**(路由 + 守卫)
- **Axios 1.6**(HTTP)
- **vite proxy** → `https://crm.yrxt.com.cn/api/v1/`

## 启动

```bash
npm install        # 装依赖
npm run dev        # 起 dev server (http://localhost:5173,proxy → crm.yrxt.com.cn)
npm run build      # 出 dist/ (也进 git)
npm run preview    # 预览 dist
```

## 当前进度(2026-06-20 17:13)

### 已搭脚手架

- [x] package.json + vite + tsconfig
- [x] src/ 目录:App / main / router / stores / api / views / types / composables
- [x] Pinia user store(带 isSuperuser / feishuWebhookUrl)
- [x] Axios + JWT 拦截器 + 401 自动 refresh
- [x] 4 个路由(Login / Dashboard / Approvals / Customers / WorkflowTemplates)
- [x] Layout(侧边栏 + 顶栏,workflow-templates 仅超管可见)
- [x] useApprovalNotifications composable(RFC v0.4 §4.11.2 修法 #97)

### 待办(老板拍优先级)

- [ ] 1.5.6 `<CustomerSelect>` 组件(后端 `?party_type=` 过滤已就位)
- [ ] 1.5.10 审批流超管门(已完成前端 meta.requiresSuperuser 守卫,后端 IsSuperUserOrReadOnly 已就位)
- [ ] 1.5.15 `ExpenseItemEditor` + `ExpenseSummary`
- [ ] 1.5.18 `ContractPaymentTermEditor` + `ContractPaymentTermSummary`
- [ ] 1.5.27 Dashboard v0.2 完整版(9 个 tile 已起骨架,需接真实 API)
- [ ] 1.5.30 Dashboard "本月起草" tile
- [ ] 1.5.26 飞书通知在 Layout.vue 调 useApprovalNotifications
- [ ] 实际 npm install + 跑起来测(需要老板确认依赖 OK)

## 关键文件

- `src/api/client.ts` - Axios + JWT
- `src/stores/user.ts` - Pinia user (isSuperuser / feishuWebhookUrl)
- `src/composables/useApprovalNotifications.ts` - 1.5.26 飞书通知
- `src/router/index.ts` - 路由 + 守卫(meta.requiresSuperuser)
- `vite.config.ts` - proxy `/api` → crm.yrxt.com.cn

# Skills feature module

My Skills v1 业务模块。所有 skill 相关的 UI / 数据流 / 类型定义都在此聚合。

## 职责

- **数据读取**：`queries.ts` 通过 `request<T>()` 调用 `/api/skills*`
- **数据写入**：`mutations.ts` 暴露 `upsertSkillRequest` / `deleteSkillRequest`（未装 TanStack Query，暂用 async 函数 + `router.refresh()`）
- **表单校验**：`schemas.ts` 提供 Zod schema 给表单和 API 复用
- **UI 组件**：`components/*.tsx` 私有原语（不重复实现 `_shared/`）
- **视图**：`views/*.view.tsx` 页面级组件，被 `src/app/[locale]/(hub)/*/page.tsx` 消费
- **弹窗**：`views/dialogs/*.modal.tsx`

## 边界

- **不**直接读 `mocks/fixtures/skills.ts` — v1 后端 seed 在 `src/lib/skills-store.ts`
- **不**引入未装的依赖：TanStack Query / TanStack Form / TanStack Table 均未安装
- 主题 CSS `theme.css` 只在 hub 路由组的 layout 里 import，保持作用域隔离

## 未来演进

引入 `@tanstack/react-query` 时：
1. `queries.ts` 追加 `skillsQueries` 工厂（`queryOptions`）
2. `mutations.ts` 加 `useUpsertSkill` / `useDeleteSkill` hook，`onSuccess` 里 `invalidateQueries`
3. 页面层用 `useSuspenseQuery(skillsQueries.list(params))` 代替直接 fetch
4. 目前的 async 请求函数保留，作为 query fn 的底层

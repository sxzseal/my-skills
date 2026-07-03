---
name: daily-report
displayName: 日报生成器
description: 结构化生成日报 / 周报，可从 git commit、Notion、日历多源汇总
version: 1.1.0
tags:
  - productivity
  - reporting
createdAt: 2026-05-03T10:00:00Z
updatedAt: 2026-06-30T09:12:00Z
---

# Daily Report Skill

生成结构化日报 / 周报，支持从 git commit、Notion 页面、日历事件多源汇总。

## 输出格式

```markdown
## 今日已完成
- [x] xxx（关联 commit/issue）

## 明日计划
- [ ] xxx

## 阻塞点
- xxx
```

## 触发条件

- 每晚 20:00 由 hook 自动触发（可选）
- 用户主动说「写日报」/「生成周报」

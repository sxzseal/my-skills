---
name: file-organizer
displayName: File Organizer
description: 按类型 / 来源 / 时间自动归档桌面和下载目录的散落文件
version: 0.2.0
tags:
  - productivity
  - macos
createdAt: 2026-05-18T16:40:00Z
updatedAt: 2026-06-25T11:30:00Z
---

# File Organizer

帮你把桌面 / Downloads 目录里堆积的文件按类型和用途归档。

## 支持的分类维度

- **类型**：图片 / 视频 / 文档 / 代码 / 压缩包
- **来源**：下载 / 截图 / AirDrop / 邮件附件
- **时间**：最近 7 天 / 30 天 / 90 天

## 安全策略

- 移动前给出预览（源路径 → 目标路径）
- 不删除任何原文件
- 记录归档日志到 `~/.file-organizer/log.jsonl`，支持一键还原

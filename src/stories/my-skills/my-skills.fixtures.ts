export const BRAND = {
  productName: 'My Skills',
  tagline: '个人 Claude Code Skill 云端库',
} as const

export const DEFAULT_UPLOAD_FORM = {
  name: '',
  displayName: '',
  description: '',
  version: '0.1.0',
  tags: '',
} as const

export const SAMPLE_MARKDOWN_PREVIEW = `---
name: sample-skill
displayName: 示例 Skill
description: 这是一个示例说明
version: 0.1.0
tags: [demo]
---

# 示例 Skill

选择或拖入 .md 文件后，这里会显示实际内容预览。
`

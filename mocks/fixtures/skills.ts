export interface SkillSummary {
  name: string
  displayName: string
  description: string
  version: string
  tags: string[]
  createdAt: string
  updatedAt: string
  sha: string
  sizeBytes: number
}

export interface SkillDetail extends SkillSummary {
  content: string
  frontmatterRaw: string
}

const COPYWRITING_MD = `# Copywriting Skill

面向中文互联网产品的文案写作助手，专注在 **短平快** 的场景：产品标语、按钮文案、错误提示、推送通知。

## 触发条件

用户说出下列表达时立即启用：

- 「写文案」/「帮我想 slogan」/「写个推送」
- 需要为界面文案（按钮、错误提示、空状态）润色

## 工作方式

1. 先问三件事：**产品定位、目标用户、想要的调性**
2. 一次给 3 版对比，标注各版的适用场景
3. 用户挑一版后，围绕它做 2-3 轮微调

## 参考规范

- 避免使用互联网黑话（"赋能"「打通」「抓手」）
- 每条文案 ≤ 20 字，除非用户明确要求长文案
- 中英混排时中文与英文/数字之间加半角空格

## 示例

**场景**：用户第一次进入 App，空状态引导

- ✅ 短版："这里空空的，先创建一个吧"
- ❌ 长版："您还没有任何数据，请点击右上角的「新建」按钮来创建你的第一个项目"
`

const DAILY_REPORT_MD = `# Daily Report Skill

生成结构化日报 / 周报，支持从 git commit、Notion 页面、日历事件多源汇总。

## 输出格式

\`\`\`markdown
## 今日已完成
- [x] xxx（关联 commit/issue）

## 明日计划
- [ ] xxx

## 阻塞点
- xxx
\`\`\`

## 触发条件

- 每晚 20:00 由 hook 自动触发（可选）
- 用户主动说「写日报」/「生成周报」
`

const FILE_ORGANIZER_MD = `# File Organizer

帮你把桌面 / Downloads 目录里堆积的文件按类型和用途归档。

## 支持的分类维度

- **类型**：图片 / 视频 / 文档 / 代码 / 压缩包
- **来源**：下载 / 截图 / AirDrop / 邮件附件
- **时间**：最近 7 天 / 30 天 / 90 天

## 安全策略

- 移动前给出预览（源路径 → 目标路径）
- 不删除任何原文件
- 记录归档日志到 \`~/.file-organizer/log.jsonl\`，支持一键还原
`

export const SKILL_LIST: SkillSummary[] = [
  {
    name: 'copywriting',
    displayName: 'Copywriting',
    description: '面向中文互联网产品的文案写作助手（slogan / 按钮 / 空状态 / 推送）',
    version: '0.3.2',
    tags: ['writing', 'content', 'i18n'],
    createdAt: '2026-04-12T09:15:00Z',
    updatedAt: '2026-06-28T14:20:00Z',
    sha: 'a3f8c1e42b90d1f7',
    sizeBytes: 4218,
  },
  {
    name: 'daily-report',
    displayName: '日报生成器',
    description: '结构化生成日报 / 周报，可从 git commit、Notion、日历多源汇总',
    version: '1.1.0',
    tags: ['productivity', 'reporting'],
    createdAt: '2026-05-03T10:00:00Z',
    updatedAt: '2026-06-30T09:12:00Z',
    sha: 'c72b90a1f3e88d2c',
    sizeBytes: 2890,
  },
  {
    name: 'file-organizer',
    displayName: 'File Organizer',
    description: '按类型 / 来源 / 时间自动归档桌面和下载目录的散落文件',
    version: '0.2.0',
    tags: ['productivity', 'macos'],
    createdAt: '2026-05-18T16:40:00Z',
    updatedAt: '2026-06-25T11:30:00Z',
    sha: 'd91e4c2a70f5b183',
    sizeBytes: 3521,
  },
  {
    name: 'seo',
    displayName: 'SEO Assistant',
    description: '给网站页面生成 meta title / description / OG 图文案',
    version: '0.4.1',
    tags: ['marketing', 'seo', 'content'],
    createdAt: '2026-03-22T08:45:00Z',
    updatedAt: '2026-06-18T15:00:00Z',
    sha: 'e17b3d9c50a4f612',
    sizeBytes: 5104,
  },
  {
    name: 'pdf',
    displayName: 'PDF Toolkit',
    description: 'PDF 合并 / 拆分 / 加水印 / 提取文本 / OCR 一体化助手',
    version: '2.0.0',
    tags: ['tools', 'document'],
    createdAt: '2026-02-14T12:00:00Z',
    updatedAt: '2026-06-15T10:45:00Z',
    sha: 'f24a8b0d31c9e708',
    sizeBytes: 7893,
  },
  {
    name: 'reimbursement',
    displayName: '报销助手',
    description: '识别发票信息，自动填写公司报销系统表单',
    version: '0.1.3',
    tags: ['finance', 'automation'],
    createdAt: '2026-05-28T09:30:00Z',
    updatedAt: '2026-06-29T18:15:00Z',
    sha: 'b58c1e4f92d70a36',
    sizeBytes: 3102,
  },
  {
    name: 'design-to-code',
    displayName: 'Design to Code',
    description: '从 Figma / 秒答 设计稿一键生成 React + Tailwind 组件',
    version: '0.5.0',
    tags: ['frontend', 'design', 'react'],
    createdAt: '2026-06-01T11:20:00Z',
    updatedAt: '2026-07-01T16:00:00Z',
    sha: 'a04e7d2f81b5c193',
    sizeBytes: 6547,
  },
  {
    name: 'super-long-name-example-for-boundary-testing-of-card-layout',
    displayName: '这是一个非常非常非常非常非常非常非常非常长的超长测试 skill 名称用来验证卡片布局的边界场景处理',
    description: '这条数据用来测试超长文案、超长名称、超长标签在卡片列表中的显示表现，不应该撑破卡片布局也不应该被完全隐藏',
    version: '99.99.99-beta.超长版本号',
    tags: ['boundary', 'testing', 'long-tag-example', 'another-long-tag', 'yet-another', 'still-more', 'edge-case'],
    createdAt: '2026-06-30T00:00:00Z',
    updatedAt: '2026-07-02T00:00:00Z',
    sha: '0000000000000000',
    sizeBytes: 128,
  },
]

export const SKILL_TAGS: string[] = Array.from(
  new Set(SKILL_LIST.flatMap((s) => s.tags)),
).sort()

export const SKILL_DETAILS: Record<string, SkillDetail> = {
  copywriting: {
    ...SKILL_LIST[0]!,
    content: COPYWRITING_MD,
    frontmatterRaw: `name: copywriting
displayName: Copywriting
description: 面向中文互联网产品的文案写作助手（slogan / 按钮 / 空状态 / 推送）
version: 0.3.2
tags: [writing, content, i18n]
createdAt: 2026-04-12
updatedAt: 2026-06-28`,
  },
  'daily-report': {
    ...SKILL_LIST[1]!,
    content: DAILY_REPORT_MD,
    frontmatterRaw: `name: daily-report
displayName: 日报生成器
description: 结构化生成日报 / 周报
version: 1.1.0
tags: [productivity, reporting]`,
  },
  'file-organizer': {
    ...SKILL_LIST[2]!,
    content: FILE_ORGANIZER_MD,
    frontmatterRaw: `name: file-organizer
displayName: File Organizer
description: 归档桌面和下载目录
version: 0.2.0
tags: [productivity, macos]`,
  },
}

export const SKILL_LIST_EMPTY: SkillSummary[] = []

export type BuildStatus = {
  status: 'queued' | 'building' | 'success' | 'failed'
  startedAt: string
  completedAt?: string
  url?: string
  buildId: string
}

export const BUILD_STATUS_BUILDING: BuildStatus = {
  status: 'building',
  startedAt: '2026-07-02T10:31:00Z',
  buildId: 'build-20260702-001',
}

export const BUILD_STATUS_SUCCESS: BuildStatus = {
  status: 'success',
  startedAt: '2026-07-02T10:31:00Z',
  completedAt: '2026-07-02T10:31:47Z',
  url: 'https://my-skills.pages.dev',
  buildId: 'build-20260702-001',
}

'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { extractHeadings, type HeadingItem } from './toc-sidebar'

interface MarkdownViewProps {
  content: string
}

export function MarkdownView({ content }: MarkdownViewProps) {
  return (
    <div className="cf-md">
      {/*
        SAFE: react-markdown 默认 escape HTML；此处仅启用 remark-gfm。
        不要添加 rehype-raw / dangerouslySetInnerHTML —— 会打开 XSS 面。
        如未来需要允许有限 HTML，请配 rehype-sanitize + 白名单 schema。
      */}
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ node: _node, children, ...props }) => {
            const text = String(children ?? '')
            const id = slugify(text)
            return (
              <h1 id={id} {...props}>
                {children}
              </h1>
            )
          },
          h2: ({ node: _node, children, ...props }) => {
            const text = String(children ?? '')
            const id = slugify(text)
            return (
              <h2 id={id} {...props}>
                {children}
              </h2>
            )
          },
          h3: ({ node: _node, children, ...props }) => {
            const text = String(children ?? '')
            const id = slugify(text)
            return (
              <h3 id={id} {...props}>
                {children}
              </h3>
            )
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-|-$/g, '')
}

export function getHeadings(content: string): HeadingItem[] {
  return extractHeadings(content)
}

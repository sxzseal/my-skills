'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { extractHeadings, type HeadingItem } from './toc-sidebar'
import { slugify, flattenReactText } from '../lib/slug'

interface MarkdownViewProps {
  content: string
}

export function MarkdownView({ content }: MarkdownViewProps) {
  return (
    <div className="cf-md">
      {/*
        SAFE: react-markdown escapes HTML by default; only remark-gfm is enabled.
        Do NOT add rehype-raw / dangerouslySetInnerHTML — it opens an XSS surface.
        If limited HTML is needed later, add rehype-sanitize with an allow-list schema.
      */}
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ node: _node, children, ...props }) => {
            const id = slugify(flattenReactText(children))
            return (
              <h1 id={id} {...props}>
                {children}
              </h1>
            )
          },
          h2: ({ node: _node, children, ...props }) => {
            const id = slugify(flattenReactText(children))
            return (
              <h2 id={id} {...props}>
                {children}
              </h2>
            )
          },
          h3: ({ node: _node, children, ...props }) => {
            const id = slugify(flattenReactText(children))
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

export function getHeadings(content: string): HeadingItem[] {
  return extractHeadings(content)
}

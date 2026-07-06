import type { ReactNode } from 'react'

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-|-$/g, '')
}

interface NodeWithChildren {
  props?: { children?: ReactNode }
}

export function flattenReactText(node: ReactNode): string {
  if (node === null || node === undefined || typeof node === 'boolean') return ''
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  if (Array.isArray(node)) return node.map(flattenReactText).join('')
  const withProps = node as NodeWithChildren
  if (withProps.props && withProps.props.children !== undefined) {
    return flattenReactText(withProps.props.children)
  }
  return ''
}

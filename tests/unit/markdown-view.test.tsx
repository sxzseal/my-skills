import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { MarkdownView } from '@/features/skills/components/markdown-view'
import { slugify, flattenReactText } from '@/features/skills/lib/slug'
import React from 'react'

describe('flattenReactText', () => {
  it('handles a plain string', () => {
    expect(flattenReactText('hello')).toBe('hello')
  })

  it('handles an array of strings', () => {
    expect(flattenReactText(['foo ', 'bar'])).toBe('foo bar')
  })

  it('recursively flattens React elements', () => {
    const node = React.createElement(
      'span',
      null,
      'Getting ',
      React.createElement('strong', null, 'Started'),
    )
    expect(flattenReactText(node)).toBe('Getting Started')
  })

  it('returns empty string for null/undefined/boolean', () => {
    expect(flattenReactText(null)).toBe('')
    expect(flattenReactText(undefined)).toBe('')
    expect(flattenReactText(false)).toBe('')
  })
})

describe('slugify', () => {
  it('lowercases and hyphenates', () => {
    expect(slugify('Getting Started')).toBe('getting-started')
  })

  it('preserves unicode letters/digits', () => {
    expect(slugify('中文 标题 v2')).toBe('中文-标题-v2')
  })

  it('trims leading/trailing hyphens', () => {
    expect(slugify('!!!hello!!!')).toBe('hello')
  })
})

describe('MarkdownView', () => {
  it('assigns matching id to h1 with inline formatting (regression: [object Object])', () => {
    const { container } = render(
      <MarkdownView content={'# Getting **Started**\n\nBody text'} />,
    )
    const h1 = container.querySelector('h1')
    expect(h1).not.toBeNull()
    expect(h1!.id).toBe('getting-started')
    expect(h1!.id).not.toContain('object')
  })

  it('slugifies h2 with inline code', () => {
    const { container } = render(
      <MarkdownView content={'## Using `useEffect` correctly'} />,
    )
    const h2 = container.querySelector('h2')
    expect(h2!.id).toBe('using-useeffect-correctly')
  })

  it('handles CJK headings with inline formatting', () => {
    const { container } = render(
      <MarkdownView content={'# 中文 **标题**\n'} />,
    )
    const h1 = container.querySelector('h1')
    expect(h1!.id).toBe('中文-标题')
  })
})

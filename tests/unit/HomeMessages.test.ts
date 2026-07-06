// Home messages + full i18n contract test.
//
// The real page.tsx is an async server component that requires next-intl
// request context jsdom cannot provide, so this file locks in the messages
// JSON contract instead:
//   • every key the Home page reads exists in every locale
//   • zh-CN and en carry the same shape recursively across all namespaces
//     that pages/APIs rely on (MySkills.* and Errors.*)
// Rendered behavior of `page.tsx` is covered by `tests/e2e/home.spec.ts`.
import { describe, expect, it } from 'vitest'
import zhCN from '../../messages/zh-CN.json'
import en from '../../messages/en.json'

const HOME_KEYS_USED_BY_PAGE = ['title', 'subtitle', 'apiHealth', 'storybook'] as const

describe('Home messages contract', () => {
  it.each(['zh-CN', 'en'] as const)(
    '%s contains every key the page renders',
    (locale) => {
      const messages = locale === 'zh-CN' ? zhCN : en
      for (const key of HOME_KEYS_USED_BY_PAGE) {
        const value = messages.Home[key as keyof typeof messages.Home]
        expect(typeof value, `${locale}.Home.${key} type`).toBe('string')
        expect(
          (value as string).length,
          `${locale}.Home.${key} length`,
        ).toBeGreaterThan(0)
      }
    },
  )
})

function walkKeys(obj: unknown, prefix = ''): string[] {
  if (obj === null || typeof obj !== 'object') return []
  const paths: string[] = []
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    const path = prefix ? `${prefix}.${key}` : key
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      paths.push(...walkKeys(value, path))
    } else {
      paths.push(path)
    }
  }
  return paths.sort()
}

describe('i18n key drift · zh-CN vs en', () => {
  it('MySkills namespace has identical key trees', () => {
    expect(walkKeys(zhCN.MySkills)).toEqual(walkKeys(en.MySkills))
  })

  it('Errors namespace has identical key trees', () => {
    expect(walkKeys(zhCN.Errors)).toEqual(walkKeys(en.Errors))
  })

  it('Home namespace has identical key trees', () => {
    expect(walkKeys(zhCN.Home)).toEqual(walkKeys(en.Home))
  })

  it('every leaf value is a non-empty string in both locales', () => {
    for (const locale of ['zh-CN', 'en'] as const) {
      const messages = locale === 'zh-CN' ? zhCN : en
      const walk = (obj: unknown, path = '') => {
        if (obj === null || typeof obj !== 'object') return
        for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
          const p = path ? `${path}.${key}` : key
          if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
            walk(value, p)
          } else {
            expect(typeof value, `${locale}.${p} type`).toBe('string')
            expect((value as string).length, `${locale}.${p} length`).toBeGreaterThan(0)
          }
        }
      }
      walk(messages)
    }
  })
})

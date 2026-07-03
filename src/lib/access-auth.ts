/**
 * Cloudflare Access defense-in-depth
 *
 * V1 部署在 Cloudflare Access 后面。CFA 已通过时会注入以下 header：
 *   - `Cf-Access-Jwt-Assertion`：JWT，可用 CFA 团队证书验签
 *   - `Cf-Access-Authenticated-User-Email`：解析后的用户邮箱
 *
 * 本工具只做 **presence check**（防止直连绕过 CFA），不做签名验证 —
 * 签名验证需要引入 `jose` 依赖 + 团队域 + 定期拉取 JWK。等后端接入真实
 * GitHub Contents API 时再一并加。
 *
 * 环境变量：
 *   - `ACCESS_AUTH_ENABLED=true`  开启本守卫（生产必须开）
 *   - `ACCESS_AUTH_ENABLED` 未设置 且 `NODE_ENV=production` → 默认开
 *   - 开发环境（`NODE_ENV=development`）默认关，方便本机 curl 调试
 */
import type { NextRequest } from 'next/server'
import { getTranslations } from 'next-intl/server'
import { err } from './api-response'
import { routing } from '@/i18n/routing'

const HEADER_JWT = 'cf-access-jwt-assertion'
const HEADER_EMAIL = 'cf-access-authenticated-user-email'

function isEnabled(): boolean {
  const flag = process.env.ACCESS_AUTH_ENABLED
  if (flag === 'true') return true
  if (flag === 'false') return false
  return process.env.NODE_ENV === 'production'
}

function resolveLocale(request: NextRequest): string {
  const cookieLocale = request.cookies.get('NEXT_LOCALE')?.value
  if (cookieLocale && (routing.locales as readonly string[]).includes(cookieLocale)) {
    return cookieLocale
  }
  const accept = request.headers.get('accept-language') ?? ''
  const preferred = accept.split(',')[0]?.trim().toLowerCase() ?? ''
  const match = (routing.locales as readonly string[]).find(
    (l) => preferred === l.toLowerCase() || preferred.startsWith(l.toLowerCase() + '-'),
  )
  return match ?? routing.defaultLocale
}

/**
 * 若请求缺少 CF Access header，返回 401 响应；否则返回 null（放行）。
 * 主要用于写操作路由（POST/DELETE）—— 读接口可选。
 */
export async function requireAccessAuth(
  request: NextRequest,
): Promise<Response | null> {
  if (!isEnabled()) return null

  const jwt = request.headers.get(HEADER_JWT)
  const email = request.headers.get(HEADER_EMAIL)
  if (jwt || email) return null

  const locale = resolveLocale(request)
  const t = await getTranslations({ locale, namespace: 'Errors.skillApi' })
  return err(401, t('unauthorized'))
}

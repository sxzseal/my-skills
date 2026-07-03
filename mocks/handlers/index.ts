import type { HttpHandler } from 'msw'
import { skillsHandlers } from './skills'

export const handlers: HttpHandler[] = [...skillsHandlers]

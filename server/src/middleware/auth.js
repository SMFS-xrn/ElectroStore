import { userFromRequest } from '../services/auth.js'

export async function attachUser(req, _res, next) {
  try { req.user = await userFromRequest(req); next() } catch (e) { next(e) }
}
export const requireAuth = (req, res, next) =>
  req.user ? next() : res.status(401).json({ error: 'Требуется вход в аккаунт' })

// Защита от CSRF: проверка Origin + обязательный пользовательский заголовок (вызывает CORS preflight)
export function csrfGuard(req, res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next()
  const origin = req.get('origin')
  if (origin && origin !== (process.env.CLIENT_ORIGIN || 'http://localhost:5173')) return res.status(403).json({ error: 'Запрещённый источник запроса' })
  if (req.get('x-requested-with') !== 'ElectroStore') return res.status(403).json({ error: 'Проверка CSRF не пройдена' })
  next()
}

// Админ-доступ проверяется на сервере при КАЖДОМ запросе к /api/admin/*
export function requireAdmin(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Требуется вход в аккаунт' })
  if (req.user.role !== 'ADMIN' || req.user.adminSlot !== 1) return res.status(403).json({ error: 'Доступ запрещён' })
  next()
}

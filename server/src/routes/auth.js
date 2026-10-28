import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { prisma } from '../db.js'
import { registerSchema, loginSchema } from '../validators/index.js'
import { failValidation } from '../services/http.js'
import { hashPassword, verifyPassword, publicUser, startSession, endSession } from '../services/auth.js'

const r = Router()
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: Number(process.env.RATE_LIMIT_MAX) || 10, standardHeaders: true, legacyHeaders: false, message: { error: 'Слишком много попыток. Повторите через 15 минут.' } })
const DUMMY = '$2b$12$C6UzMDM.H6dfI/f/IKcEeO5Yq2z0bE3Z5Yw1nq0n0Yw1nq0n0Yw1n'

r.post('/register', limiter, async (req, res, next) => {
  try {
    const p = registerSchema.safeParse(req.body)
    if (!p.success) return failValidation(res, p)
    const { name, email, password } = p.data
    if (await prisma.user.findUnique({ where: { email } })) return res.status(409).json({ error: 'Этот email уже зарегистрирован' })
    // роль всегда USER; любые поля role/adminSlot из запроса игнорируются
    const user = await prisma.user.create({ data: { name, email, passwordHash: await hashPassword(password), role: 'USER' } })
    await startSession(res, user.id)
    res.status(201).json({ user: publicUser(user) })
  } catch (e) { next(e) }
})
r.post('/login', limiter, async (req, res, next) => {
  try {
    const p = loginSchema.safeParse(req.body)
    if (!p.success) return failValidation(res, p)
    const user = await prisma.user.findUnique({ where: { email: p.data.email } })
    const ok = await verifyPassword(p.data.password, user?.passwordHash || DUMMY)
    if (!user || !ok) return res.status(401).json({ error: 'Неверный email или пароль' })
    await startSession(res, user.id)
    res.json({ user: publicUser(user) })
  } catch (e) { next(e) }
})
r.post('/logout', async (req, res, next) => {
  try { await endSession(req, res); res.json({ ok: true }) } catch (e) { next(e) }
})
r.get('/me', (req, res) => res.json({ user: req.user ? publicUser(req.user) : null }))
export default r

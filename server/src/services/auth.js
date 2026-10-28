import crypto from 'node:crypto'
import bcrypt from 'bcrypt'
import { prisma } from '../db.js'

const COOKIE = 'es_sid'
const DAYS = 7
const hashToken = t => crypto.createHmac('sha256', process.env.SESSION_SECRET || 'dev-secret').update(t).digest('hex')
const cookieOpts = () => ({ httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: DAYS * 864e5 })

export const hashPassword = p => bcrypt.hash(p, 12)
export const verifyPassword = (p, h) => bcrypt.compare(p, h)
export const publicUser = u => ({ id: u.id, name: u.name, email: u.email, role: u.role })

export async function startSession(res, userId) {
  const token = crypto.randomBytes(32).toString('hex')
  await prisma.session.create({ data: { userId, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + DAYS * 864e5) } })
  res.cookie(COOKIE, token, cookieOpts())
}
export async function endSession(req, res) {
  const t = req.cookies?.[COOKIE]
  if (t) await prisma.session.deleteMany({ where: { tokenHash: hashToken(t) } })
  res.clearCookie(COOKIE, { path: '/' })
}
export async function userFromRequest(req) {
  const t = req.cookies?.[COOKIE]
  if (!t) return null
  const s = await prisma.session.findUnique({ where: { tokenHash: hashToken(t) }, include: { user: true } })
  if (!s || s.expiresAt < new Date()) return null
  return s.user
}

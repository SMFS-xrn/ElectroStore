import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { prisma } from '../db.js'
import { PLACEMENTS } from '../validators/admin.js'

const r = Router()
const track = rateLimit({ windowMs: 60 * 1000, max: 120, standardHeaders: true, legacyHeaders: false })
const wrap = fn => (req, res, next) => fn(req, res).catch(next)

// Публичный список: только активные и в пределах дат показа
r.get('/', wrap(async (req, res) => {
  const now = new Date()
  const where = { status: 'ACTIVE', AND: [{ OR: [{ startsAt: null }, { startsAt: { lte: now } }] }, { OR: [{ endsAt: null }, { endsAt: { gte: now } }] }] }
  if (req.query.placement) {
    if (!PLACEMENTS.includes(String(req.query.placement))) return res.status(400).json({ error: 'Неизвестное место рекламы' })
    where.placement = String(req.query.placement)
  }
  if (req.query.category) where.AND.push({ OR: [{ categorySlug: null }, { categorySlug: String(req.query.category) }] })
  res.json(await prisma.advertisement.findMany({
    where, orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
    select: { id: true, title: true, headline: true, description: true, imageUrl: true, buttonText: true, linkUrl: true, placement: true }
  }))
}))
// Статистика без персональных данных: только id баннера и время
for (const [path, model] of [['view', 'bannerView'], ['click', 'bannerClick']]) {
  r.post(`/:id/${path}`, track, wrap(async (req, res) => {
    const adId = Number(req.params.id)
    if (!Number.isInteger(adId) || !(await prisma.advertisement.findUnique({ where: { id: adId }, select: { id: true } }))) return res.status(404).json({ error: 'Баннер не найден' })
    await prisma[model].create({ data: { adId } })
    res.status(204).end()
  }))
}
export default r

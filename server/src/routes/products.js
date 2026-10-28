import { Router } from 'express'
import { prisma } from '../db.js'

const r = Router()
const PER_PAGE = 12
const arr = v => (v === undefined ? [] : [].concat(v)).map(String)
const toInt = v => { const n = parseInt(v, 10); return Number.isFinite(n) && n >= 0 ? n : null }
const withImg = { images: { orderBy: { sortOrder: 'asc' }, take: 1 } }

async function facets(where) {
  const rows = await prisma.product.findMany({ where, select: { brand: true, price: true, specs: { select: { key: true, value: true } } } })
  const specs = {}
  for (const p of rows) for (const s of p.specs) (specs[s.key] ||= new Set()).add(s.value)
  return {
    brands: [...new Set(rows.map(p => p.brand))].sort(),
    minPrice: rows.length ? Math.min(...rows.map(p => p.price)) : 0,
    maxPrice: rows.length ? Math.max(...rows.map(p => p.price)) : 0,
    specs: Object.fromEntries(Object.entries(specs).filter(([, v]) => v.size > 1).map(([k, v]) => [k, [...v].sort()]))
  }
}

async function list(req, res, slug) {
  const q = req.query
  const catSlug = slug || (q.category ? String(q.category) : null)
  const where = {}
  if (catSlug) where.category = { slug: catSlug }
  if (q.q) { const t = String(q.q).slice(0, 80); where.OR = [{ name: { contains: t } }, { brand: { contains: t } }, { model: { contains: t } }] }
  const brands = arr(q.brand)
  if (brands.length) where.brand = { in: brands }
  const min = toInt(q.minPrice), max = toInt(q.maxPrice)
  if (min !== null || max !== null) where.price = { ...(min !== null && { gte: min }), ...(max !== null && { lte: max }) }
  const specs = arr(q.spec).map(s => { const i = s.indexOf(':'); return i > 0 ? { key: s.slice(0, i), value: s.slice(i + 1) } : null }).filter(Boolean)
  if (specs.length) where.AND = specs.map(s => ({ specs: { some: s } }))
  const orderBy = { price_asc: { price: 'asc' }, price_desc: { price: 'desc' }, new: { createdAt: 'desc' }, popular: { popularity: 'desc' } }[q.sort] || { popularity: 'desc' }
  const page = Math.max(1, toInt(q.page) || 1)
  const limit = Math.min(toInt(q.limit) || PER_PAGE, 48)
  const [total, items] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({ where, orderBy, skip: (page - 1) * limit, take: limit, include: withImg })
  ])
  const body = { items, total, page, pages: Math.max(1, Math.ceil(total / limit)) }
  if (catSlug) body.facets = await facets({ category: { slug: catSlug } })
  res.json(body)
}

r.get('/products', (req, res, next) => list(req, res).catch(next))
r.get('/categories/:slug/products', async (req, res, next) => {
  try {
    if (!(await prisma.category.findUnique({ where: { slug: req.params.slug } }))) return res.status(404).json({ error: 'Категория не найдена' })
    await list(req, res, req.params.slug)
  } catch (e) { next(e) }
})
r.get('/products/:slug', async (req, res, next) => {
  try {
    const p = await prisma.product.findUnique({
      where: { slug: req.params.slug },
      include: { images: { orderBy: { sortOrder: 'asc' } }, specs: true, category: true }
    })
    if (!p) return res.status(404).json({ error: 'Товар не найден' })
    const similar = await prisma.product.findMany({ where: { categoryId: p.categoryId, NOT: { id: p.id } }, take: 4, orderBy: { popularity: 'desc' }, include: withImg })
    res.json({ ...p, similar })
  } catch (e) { next(e) }
})
export default r

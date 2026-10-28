import { Router } from 'express'
import multer from 'multer'
import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { prisma } from '../db.js'
import { requireAdmin } from '../middleware/auth.js'
import { failValidation, HttpError } from '../services/http.js'
import { productCreate, productPatch, categoryCreate, categoryPatch, orderStatus, adCreate, adPatch } from '../validators/admin.js'

const r = Router()
r.use(requireAdmin)
const UPLOADS = fileURLToPath(new URL('../../uploads/', import.meta.url))
const wrap = fn => (req, res, next) => fn(req, res).catch(next)
const id = req => Number(req.params.id)

// ---------- Загрузка изображений: тип, размер и содержимое (сигнатура файла) ----------
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024, files: 1 } })
const detect = b =>
  b.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff])) ? 'jpg'
  : b.subarray(0, 4).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47])) ? 'png'
  : b.subarray(0, 4).toString() === 'RIFF' && b.subarray(8, 12).toString() === 'WEBP' ? 'webp'
  : b.subarray(0, 3).toString() === 'GIF' ? 'gif' : null
r.post('/upload/:kind', (req, res, next) => {
  if (!['products', 'banners', 'categories'].includes(req.params.kind)) return res.status(400).json({ error: 'Неизвестный тип загрузки' })
  upload.single('file')(req, res, async err => {
    try {
      if (err) return res.status(400).json({ error: err.code === 'LIMIT_FILE_SIZE' ? 'Файл больше 5 МБ' : 'Ошибка загрузки' })
      if (!req.file) return res.status(400).json({ error: 'Файл не передан' })
      const ext = detect(req.file.buffer)
      if (!ext) return res.status(400).json({ error: 'Допустимы только изображения JPG, PNG, WEBP, GIF' })
      const dir = path.join(UPLOADS, req.params.kind)
      await fs.mkdir(dir, { recursive: true })
      const name = `${crypto.randomBytes(12).toString('hex')}.${ext}`
      await fs.writeFile(path.join(dir, name), req.file.buffer)
      res.status(201).json({ url: `/uploads/${req.params.kind}/${name}` })
    } catch (e) { next(e) }
  })
})

// ---------- Dashboard ----------
r.get('/dashboard', wrap(async (_req, res) => {
  const [users, products, orders, sales, lowStock, activeBanners] = await Promise.all([
    prisma.user.count(), prisma.product.count(), prisma.order.count(),
    prisma.order.aggregate({ _sum: { total: true }, where: { status: { not: 'CANCELLED' } } }),
    prisma.product.findMany({ where: { stock: { lte: 5 } }, orderBy: { stock: 'asc' }, take: 10, select: { id: true, name: true, stock: true } }),
    prisma.advertisement.count({ where: { status: 'ACTIVE' } })
  ])
  res.json({ users, products, orders, sales: sales._sum.total || 0, lowStock, activeBanners })
}))

// ---------- Товары ----------
const slugify = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
const full = { category: true, images: { orderBy: { sortOrder: 'asc' } }, specs: true }
r.get('/products', wrap(async (_req, res) => {
  res.json(await prisma.product.findMany({ orderBy: { id: 'desc' }, include: { category: true, images: { orderBy: { sortOrder: 'asc' }, take: 1 } } }))
}))
r.get('/products/:id', wrap(async (req, res) => {
  const p = await prisma.product.findUnique({ where: { id: id(req) }, include: full })
  p ? res.json(p) : res.status(404).json({ error: 'Товар не найден' })
}))
r.post('/products', wrap(async (req, res) => {
  const p = productCreate.safeParse(req.body)
  if (!p.success) return failValidation(res, p)
  const d = p.data
  if (!(await prisma.category.findUnique({ where: { id: d.categoryId } }))) return res.status(400).json({ error: 'Категория не найдена' })
  const base = slugify(`${d.brand}-${d.model}`) || `product-${Date.now()}`
  let slug = base, n = 1
  while (await prisma.product.findUnique({ where: { slug } })) slug = `${base}-${++n}`
  const created = await prisma.product.create({
    data: {
      slug, name: d.name, brand: d.brand, model: d.model, description: d.description, categoryId: d.categoryId,
      price: d.price, oldPrice: d.oldPrice ?? null, stock: d.stock,
      images: { create: d.images.map((url, i) => ({ url, sortOrder: i })) }, specs: { create: d.specs }
    }, include: full
  })
  res.status(201).json(created)
}))
r.patch('/products/:id', wrap(async (req, res) => {
  const p = productPatch.safeParse(req.body)
  if (!p.success) return failValidation(res, p)
  const { images, specs, ...rest } = p.data
  if (rest.categoryId && !(await prisma.category.findUnique({ where: { id: rest.categoryId } }))) return res.status(400).json({ error: 'Категория не найдена' })
  if (!(await prisma.product.findUnique({ where: { id: id(req) } }))) return res.status(404).json({ error: 'Товар не найден' })
  const updated = await prisma.$transaction(async tx => {
    if (images) { await tx.productImage.deleteMany({ where: { productId: id(req) } }); await tx.productImage.createMany({ data: images.map((url, i) => ({ productId: id(req), url, sortOrder: i })) }) }
    if (specs) { await tx.productSpecification.deleteMany({ where: { productId: id(req) } }); await tx.productSpecification.createMany({ data: specs.map(s => ({ productId: id(req), ...s })) }) }
    return tx.product.update({ where: { id: id(req) }, data: rest, include: full })
  })
  res.json(updated)
}))
r.delete('/products/:id', wrap(async (req, res) => {
  await prisma.product.deleteMany({ where: { id: id(req) } })
  res.json({ ok: true })
}))

// ---------- Категории ----------
r.get('/categories', wrap(async (_req, res) => {
  res.json(await prisma.category.findMany({ orderBy: { sortOrder: 'asc' }, include: { _count: { select: { products: true } } } }))
}))
r.post('/categories', wrap(async (req, res) => {
  const p = categoryCreate.safeParse(req.body)
  if (!p.success) return failValidation(res, p)
  if (await prisma.category.findUnique({ where: { slug: p.data.slug } })) return res.status(409).json({ error: 'Такой slug уже есть' })
  res.status(201).json(await prisma.category.create({ data: p.data }))
}))
r.patch('/categories/:id', wrap(async (req, res) => {
  const p = categoryPatch.safeParse(req.body)
  if (!p.success) return failValidation(res, p)
  try { res.json(await prisma.category.update({ where: { id: id(req) }, data: p.data })) }
  catch (e) { throw e.code === 'P2025' ? new HttpError(404, 'Категория не найдена') : e.code === 'P2002' ? new HttpError(409, 'Такой slug уже есть') : e }
}))
r.delete('/categories/:id', wrap(async (req, res) => {
  if (await prisma.product.count({ where: { categoryId: id(req) } })) return res.status(409).json({ error: 'Нельзя удалить категорию с товарами' })
  await prisma.category.deleteMany({ where: { id: id(req) } })
  res.json({ ok: true })
}))

// ---------- Пользователи (пароли и хеши никогда не отдаются) ----------
r.get('/users', wrap(async (_req, res) => {
  res.json(await prisma.user.findMany({ orderBy: { id: 'asc' }, select: { id: true, name: true, email: true, role: true, createdAt: true, _count: { select: { orders: true } } } }))
}))
r.delete('/users/:id', wrap(async (req, res) => {
  const u = await prisma.user.findUnique({ where: { id: id(req) } })
  if (!u) return res.status(404).json({ error: 'Пользователь не найден' })
  if (u.role === 'ADMIN') return res.status(403).json({ error: 'Администратора удалить нельзя' })
  await prisma.user.delete({ where: { id: u.id } })
  res.json({ ok: true })
}))

// ---------- Заказы ----------
r.get('/orders', wrap(async (_req, res) => {
  res.json(await prisma.order.findMany({ orderBy: { createdAt: 'desc' }, include: { items: true, user: { select: { email: true } } } }))
}))
r.patch('/orders/:id', wrap(async (req, res) => {
  const p = orderStatus.safeParse(req.body)
  if (!p.success) return failValidation(res, p)
  const out = await prisma.$transaction(async tx => {
    const o = await tx.order.findUnique({ where: { id: id(req) }, include: { items: true } })
    if (!o) throw new HttpError(404, 'Заказ не найден')
    if (o.status === 'CANCELLED' && p.data.status !== 'CANCELLED') throw new HttpError(409, 'Отменённый заказ нельзя возобновить')
    if (p.data.status === 'CANCELLED' && o.status !== 'CANCELLED')
      for (const i of o.items) if (i.productId) await tx.product.updateMany({ where: { id: i.productId }, data: { stock: { increment: i.quantity } } })
    return tx.order.update({ where: { id: o.id }, data: { status: p.data.status }, include: { items: true } })
  })
  res.json(out)
}))
// ---------- Реклама ----------
const adData = d => ({ ...d, description: d.description || null, categorySlug: d.categorySlug ?? null, startsAt: d.startsAt ?? null, endsAt: d.endsAt ?? null })
r.get('/advertisements', wrap(async (_req, res) => {
  const rows = await prisma.advertisement.findMany({ orderBy: [{ placement: 'asc' }, { sortOrder: 'asc' }, { id: 'asc' }], include: { _count: { select: { views: true, clicks: true } } } })
  res.json(rows.map(({ _count, ...a }) => ({ ...a, views: _count.views, clicks: _count.clicks })))
}))
r.post('/advertisements', wrap(async (req, res) => {
  const p = adCreate.safeParse(req.body)
  if (!p.success) return failValidation(res, p)
  res.status(201).json(await prisma.advertisement.create({ data: adData(p.data) }))
}))
r.patch('/advertisements/:id', wrap(async (req, res) => {
  const p = adPatch.safeParse(req.body)
  if (!p.success) return failValidation(res, p)
  const data = { ...p.data }
  if ('description' in data) data.description = data.description || null
  if ('categorySlug' in data) data.categorySlug = data.categorySlug ?? null
  if ('startsAt' in data) data.startsAt = data.startsAt ?? null
  if ('endsAt' in data) data.endsAt = data.endsAt ?? null
  try { res.json(await prisma.advertisement.update({ where: { id: id(req) }, data })) }
  catch (e) { throw e.code === 'P2025' ? new HttpError(404, 'Баннер не найден') : e }
}))
r.delete('/advertisements/:id', wrap(async (req, res) => {
  await prisma.advertisement.deleteMany({ where: { id: id(req) } })
  res.json({ ok: true })
}))
export default r

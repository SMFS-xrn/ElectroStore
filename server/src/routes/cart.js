import { Router } from 'express'
import { prisma } from '../db.js'
import { requireAuth } from '../middleware/auth.js'
import { cartAddSchema, cartPatchSchema } from '../validators/index.js'
import { failValidation } from '../services/http.js'

const r = Router()
r.use(requireAuth)
const include = { product: { include: { images: { orderBy: { sortOrder: 'asc' }, take: 1 } } } }
const shape = i => ({ itemId: i.id, id: i.productId, slug: i.product.slug, name: i.product.name, price: i.product.price, stock: i.product.stock, image: i.product.images[0]?.url, qty: i.quantity })
const list = async userId => (await prisma.cartItem.findMany({ where: { userId }, include, orderBy: { id: 'asc' } })).map(shape)

r.get('/', async (req, res, next) => { try { res.json(await list(req.user.id)) } catch (e) { next(e) } })
r.post('/', async (req, res, next) => {
  try {
    const p = cartAddSchema.safeParse(req.body)
    if (!p.success) return failValidation(res, p)
    const product = await prisma.product.findUnique({ where: { id: p.data.productId } })
    if (!product) return res.status(404).json({ error: 'Товар не найден' })
    if (product.stock < 1) return res.status(409).json({ error: 'Нет в наличии' })
    const ex = await prisma.cartItem.findUnique({ where: { userId_productId: { userId: req.user.id, productId: product.id } } })
    const quantity = Math.min((ex?.quantity || 0) + p.data.quantity, product.stock)
    await prisma.cartItem.upsert({
      where: { userId_productId: { userId: req.user.id, productId: product.id } },
      update: { quantity }, create: { userId: req.user.id, productId: product.id, quantity }
    })
    res.status(201).json(await list(req.user.id))
  } catch (e) { next(e) }
})
r.patch('/:id', async (req, res, next) => {
  try {
    const p = cartPatchSchema.safeParse(req.body)
    if (!p.success) return failValidation(res, p)
    const item = await prisma.cartItem.findFirst({ where: { id: Number(req.params.id), userId: req.user.id }, include: { product: true } })
    if (!item) return res.status(404).json({ error: 'Позиция не найдена' })
    await prisma.cartItem.update({ where: { id: item.id }, data: { quantity: Math.min(p.data.quantity, Math.max(item.product.stock, 1)) } })
    res.json(await list(req.user.id))
  } catch (e) { next(e) }
})
r.delete('/:id', async (req, res, next) => {
  try {
    await prisma.cartItem.deleteMany({ where: { id: Number(req.params.id), userId: req.user.id } })
    res.json(await list(req.user.id))
  } catch (e) { next(e) }
})
export default r

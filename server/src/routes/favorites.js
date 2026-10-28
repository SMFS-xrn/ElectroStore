import { Router } from 'express'
import { prisma } from '../db.js'
import { requireAuth } from '../middleware/auth.js'
import { favSchema } from '../validators/index.js'
import { failValidation } from '../services/http.js'

const r = Router()
r.use(requireAuth)
const list = async userId => (await prisma.favorite.findMany({
  where: { userId }, orderBy: { id: 'desc' },
  include: { product: { include: { images: { orderBy: { sortOrder: 'asc' }, take: 1 } } } }
})).map(f => f.product)

r.get('/', async (req, res, next) => { try { res.json(await list(req.user.id)) } catch (e) { next(e) } })
r.post('/', async (req, res, next) => {
  try {
    const p = favSchema.safeParse(req.body)
    if (!p.success) return failValidation(res, p)
    if (!(await prisma.product.findUnique({ where: { id: p.data.productId } }))) return res.status(404).json({ error: 'Товар не найден' })
    await prisma.favorite.upsert({
      where: { userId_productId: { userId: req.user.id, productId: p.data.productId } },
      update: {}, create: { userId: req.user.id, productId: p.data.productId }
    })
    res.status(201).json(await list(req.user.id))
  } catch (e) { next(e) }
})
r.delete('/:productId', async (req, res, next) => {
  try {
    await prisma.favorite.deleteMany({ where: { userId: req.user.id, productId: Number(req.params.productId) } })
    res.json(await list(req.user.id))
  } catch (e) { next(e) }
})
export default r

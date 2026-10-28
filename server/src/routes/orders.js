import { Router } from 'express'
import { prisma } from '../db.js'
import { requireAuth } from '../middleware/auth.js'
import { orderSchema } from '../validators/index.js'
import { HttpError, failValidation } from '../services/http.js'

const r = Router()
r.use(requireAuth)

r.post('/', async (req, res, next) => {
  try {
    const p = orderSchema.safeParse(req.body)
    if (!p.success) return failValidation(res, p)
    const userId = req.user.id
    const order = await prisma.$transaction(async tx => {
      const items = await tx.cartItem.findMany({ where: { userId }, include: { product: true } })
      if (!items.length) throw new HttpError(400, 'Корзина пуста')
      let total = 0
      for (const i of items) {
        // условное уменьшение: остаток не может стать отрицательным
        const upd = await tx.product.updateMany({ where: { id: i.productId, stock: { gte: i.quantity } }, data: { stock: { decrement: i.quantity } } })
        if (upd.count === 0) throw new HttpError(409, `Недостаточно товара на складе: ${i.product.name}`)
        total += i.quantity * i.product.price
      }
      const created = await tx.order.create({
        data: {
          userId, customerName: p.data.customerName, phone: p.data.phone, address: p.data.address, comment: p.data.comment || null, total,
          items: { create: items.map(i => ({ productId: i.productId, name: i.product.name, price: i.product.price, quantity: i.quantity })) }
        },
        include: { items: true }
      })
      await tx.cartItem.deleteMany({ where: { userId } })
      return created
    })
    res.status(201).json(order)
  } catch (e) { next(e) }
})
r.get('/my', async (req, res, next) => {
  try {
    res.json(await prisma.order.findMany({ where: { userId: req.user.id }, include: { items: true }, orderBy: { createdAt: 'desc' } }))
  } catch (e) { next(e) }
})
export default r

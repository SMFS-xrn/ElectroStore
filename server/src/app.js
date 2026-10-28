import 'dotenv/config'
import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { prisma } from './db.js'
import productsRouter from './routes/products.js'
import authRouter from './routes/auth.js'
import cartRouter from './routes/cart.js'
import favoritesRouter from './routes/favorites.js'
import ordersRouter from './routes/orders.js'
import adminRouter from './routes/admin.js'
import adsRouter from './routes/advertisements.js'
import { attachUser, csrfGuard } from './middleware/auth.js'
export { prisma }
const __dirname = path.dirname(fileURLToPath(import.meta.url))
export const app = express()

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }))
app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173', credentials: true }))
app.use(express.json({ limit: '1mb' }))
app.use(cookieParser())
app.use('/api', csrfGuard, attachUser)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')))

app.get('/api/health', (_req, res) => res.json({ ok: true }))
app.get('/api/categories', async (_req, res) => {
  res.json(await prisma.category.findMany({ orderBy: { sortOrder: 'asc' } }))
})
app.use('/api/auth', authRouter)
app.use('/api/cart', cartRouter)
app.use('/api/favorites', favoritesRouter)
app.use('/api/orders', ordersRouter)
app.use('/api/admin', adminRouter)
app.use('/api/advertisements', adsRouter)
app.use('/api', productsRouter)
app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found' }))
app.use((err, _req, res, _next) => { console.error(err); res.status(err.status || 500).json({ error: err.status ? err.message : 'Ошибка сервера' }) })

const port = Number(process.env.PORT) || 5000
if (process.argv[1] === fileURLToPath(import.meta.url)) app.listen(port, () => console.log(`API: http://localhost:${port}`))

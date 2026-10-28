// Создаёт ЕДИНСТВЕННОГО администратора. Данные берутся из server/.env (ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD).
import 'dotenv/config'
import { prisma } from '../src/db.js'
import { hashPassword } from '../src/services/auth.js'

const { ADMIN_NAME = 'Administrator', ADMIN_EMAIL, ADMIN_PASSWORD } = process.env
const stop = msg => { console.error(`Ошибка: ${msg}`); process.exit(1) }

if (!ADMIN_EMAIL || !ADMIN_PASSWORD) stop('заполните ADMIN_EMAIL и ADMIN_PASSWORD в server/.env')
if (ADMIN_PASSWORD.length < 10) stop('ADMIN_PASSWORD должен содержать минимум 10 символов')
if (!/^\S+@\S+\.\S+$/.test(ADMIN_EMAIL)) stop('ADMIN_EMAIL имеет неверный формат')

const existing = await prisma.user.findFirst({ where: { OR: [{ role: 'ADMIN' }, { adminSlot: 1 }] } })
if (existing) stop('администратор уже существует. Создание второго запрещено.')
const email = ADMIN_EMAIL.trim().toLowerCase()
if (await prisma.user.findUnique({ where: { email } })) stop('этот email уже занят обычным пользователем. Укажите другой ADMIN_EMAIL.')

try {
  await prisma.user.create({ data: { name: ADMIN_NAME, email, passwordHash: await hashPassword(ADMIN_PASSWORD), role: 'ADMIN', adminSlot: 1 } })
  console.log(`Администратор создан: ${email}. Удалите ADMIN_PASSWORD из .env.`)
} catch (e) {
  if (e.code === 'P2002') stop('администратор уже существует (ограничение базы данных).')
  throw e
} finally { await prisma.$disconnect() }

import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

if (!String(process.env.DATABASE_URL).includes('test.db')) throw new Error('Запускайте тесты через npm test (используется отдельная база test.db)')
const SERVER_DIR = fileURLToPath(new URL('..', import.meta.url))
let server, base, prisma, categoryId, adminId
const ADMIN = { email: 'admin@test.local', password: 'AdminPass-12345' }
const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0])

// Мини-клиент с cookie-сессией
function http() {
  let cookie = ''
  return async (method, p, body, opts = {}) => {
    const headers = opts.csrf === false ? {} : { 'X-Requested-With': 'ElectroStore' }
    if (cookie) headers.Cookie = cookie
    let payload
    if (body instanceof FormData) payload = body
    else if (body) { headers['Content-Type'] = 'application/json'; payload = JSON.stringify(body) }
    const res = await fetch(base + p, { method, headers, body: payload })
    const sc = res.headers.getSetCookie?.() || []
    if (sc.length) { const v = sc[0].split(';')[0]; cookie = v.endsWith('=') ? '' : v }
    return { status: res.status, data: await res.json().catch(() => null) }
  }
}
const anon = http(), usr = http(), adm = http()

before(async () => {
  const { app } = await import('../src/app.js')
  ;({ prisma } = await import('../src/db.js'))
  const { hashPassword } = await import('../src/services/auth.js')
  server = app.listen(0)
  await new Promise(r => server.once('listening', r))
  base = `http://127.0.0.1:${server.address().port}`
  categoryId = (await prisma.category.create({ data: { slug: 'smartphones', name: 'Телефоны' } })).id
  adminId = (await prisma.user.create({ data: { name: 'Admin', email: ADMIN.email, passwordHash: await hashPassword(ADMIN.password), role: 'ADMIN', adminSlot: 1 } })).id
})
after(async () => { server?.closeAllConnections?.(); server?.close(); await prisma?.$disconnect() })

// ---------- Регистрация и авторизация ----------
test('регистрация создаёт только USER, role/adminSlot из запроса игнорируются, пароль хешируется', async () => {
  const r = await usr('POST', '/api/auth/register', { name: 'Иван', email: 'ivan@test.local', password: 'password123', confirmPassword: 'password123', role: 'ADMIN', adminSlot: 1 })
  assert.equal(r.status, 201)
  assert.equal(r.data.user.role, 'USER')
  const db = await prisma.user.findUnique({ where: { email: 'ivan@test.local' } })
  assert.equal(db.role, 'USER'); assert.equal(db.adminSlot, null); assert.notEqual(db.passwordHash, 'password123')
})
test('регистрация: дубликат email, короткий пароль и несовпадение паролей отклоняются', async () => {
  const dup = await anon('POST', '/api/auth/register', { name: 'Иван', email: 'ivan@test.local', password: 'password123', confirmPassword: 'password123' })
  assert.equal(dup.status, 409)
  assert.equal((await anon('POST', '/api/auth/register', { name: 'Анна', email: 'a@test.local', password: '123', confirmPassword: '123' })).status, 400)
  assert.equal((await anon('POST', '/api/auth/register', { name: 'Анна', email: 'a@test.local', password: 'password123', confirmPassword: 'other-pass1' })).status, 400)
})
test('вход, /me, выход', async () => {
  const c = http()
  assert.equal((await c('POST', '/api/auth/login', { email: 'ivan@test.local', password: 'wrong-password' })).status, 401)
  assert.equal((await c('POST', '/api/auth/login', { email: 'ivan@test.local', password: 'password123' })).status, 200)
  assert.equal((await c('GET', '/api/auth/me')).data.user.email, 'ivan@test.local')
  await c('POST', '/api/auth/logout')
  assert.equal((await c('GET', '/api/auth/me')).data.user, null)
})
test('CSRF: изменяющий запрос без служебного заголовка отклоняется', async () => {
  assert.equal((await usr('POST', '/api/cart', { productId: 1, quantity: 1 }, { csrf: false })).status, 403)
})

// ---------- Единственный администратор ----------
test('вход администратора', async () => {
  assert.equal((await adm('POST', '/api/auth/login', ADMIN)).status, 200)
  assert.equal((await adm('GET', '/api/auth/me')).data.user.role, 'ADMIN')
})
test('/api/admin/*: 401 без входа, 403 для USER, 200 для администратора', async () => {
  assert.equal((await anon('GET', '/api/admin/dashboard')).status, 401)
  assert.equal((await usr('GET', '/api/admin/dashboard')).status, 403)
  assert.equal((await usr('POST', '/api/admin/products', {})).status, 403)
  assert.equal((await usr('POST', '/api/admin/advertisements', {})).status, 403)
  assert.equal((await adm('GET', '/api/admin/dashboard')).status, 200)
})
test('второго администратора создать нельзя (база и CLI)', async () => {
  await assert.rejects(prisma.user.create({ data: { name: 'Evil', email: 'evil@test.local', passwordHash: 'x', role: 'ADMIN', adminSlot: 1 } }))
  const r = spawnSync(process.execPath, ['scripts/create-admin.js'], { cwd: SERVER_DIR, encoding: 'utf8', env: { ...process.env, ADMIN_EMAIL: 'second@test.local', ADMIN_PASSWORD: 'AnotherPass-12345' } })
  assert.equal(r.status, 1); assert.match(r.stderr, /уже существует/)
  assert.equal(await prisma.user.count({ where: { role: 'ADMIN' } }), 1)
})
test('администратора нельзя удалить через API', async () => {
  assert.equal((await adm('DELETE', `/api/admin/users/${adminId}`)).status, 403)
})

// ---------- CRUD товаров ----------
const product = () => ({ name: 'Acme X1', brand: 'Acme', model: 'X1', description: 'Тестовый товар', categoryId, price: 5000, oldPrice: 6000, stock: 4, images: ['/images/smartphones-1.svg'], specs: [{ key: 'ОЗУ', value: '8 ГБ' }] })
test('CRUD товаров администратором', async () => {
  const c = await adm('POST', '/api/admin/products', product())
  assert.equal(c.status, 201); assert.equal(c.data.slug, 'acme-x1')
  assert.equal((await anon('GET', '/api/products/acme-x1')).status, 200)
  assert.equal((await anon('GET', '/api/categories/smartphones/products?brand=Acme')).data.total, 1)
  const u = await adm('PATCH', `/api/admin/products/${c.data.id}`, { price: 4500 })
  assert.equal(u.status, 200); assert.equal(u.data.price, 4500)
  assert.equal((await adm('PATCH', `/api/admin/products/${c.data.id}`, { price: 5000, oldPrice: 100 })).status, 400)
  assert.equal((await adm('POST', '/api/admin/products', { ...product(), price: -1 })).status, 400)
  assert.equal((await adm('POST', '/api/admin/products', { ...product(), images: ['javascript:alert(1)'] })).status, 400)
  assert.equal((await adm('DELETE', `/api/admin/products/${c.data.id}`)).status, 200)
  assert.equal((await anon('GET', '/api/products/acme-x1')).status, 404)
})

// ---------- Корзина и заказы ----------
test('заказ уменьшает остаток; нехватка товара откатывает заказ; остаток не уходит в минус', async () => {
  const p1 = await prisma.product.create({ data: { slug: 'p1', name: 'P1', brand: 'B', model: 'M', description: 'd', price: 1000, stock: 3, categoryId } })
  const p2 = await prisma.product.create({ data: { slug: 'p2', name: 'P2', brand: 'B', model: 'M', description: 'd', price: 2000, stock: 5, categoryId } })
  const add = await usr('POST', '/api/cart', { productId: p1.id, quantity: 5 })
  assert.equal(add.data[0].qty, 3, 'количество ограничено остатком')
  const bad = { customerName: 'Иван', phone: 'abc', address: 'Бишкек, ул. Тестовая 1' }
  assert.equal((await usr('POST', '/api/orders', bad)).status, 400)
  const ok = await usr('POST', '/api/orders', { ...bad, phone: '+996 555 123456' })
  assert.equal(ok.status, 201); assert.equal(ok.data.total, 3000)
  assert.equal((await prisma.product.findUnique({ where: { id: p1.id } })).stock, 0)
  assert.equal((await usr('POST', '/api/orders', { ...bad, phone: '+996 555 123456' })).status, 400, 'корзина очищена')
  await usr('POST', '/api/cart', { productId: p2.id, quantity: 4 })
  await prisma.product.update({ where: { id: p2.id }, data: { stock: 1 } })
  const race = await usr('POST', '/api/orders', { ...bad, phone: '+996 555 123456' })
  assert.equal(race.status, 409)
  assert.equal((await prisma.product.findUnique({ where: { id: p2.id } })).stock, 1)
  assert.equal(await prisma.order.count(), 1)
  assert.equal((await usr('GET', '/api/orders/my')).data.length, 1)
})

// ---------- Реклама ----------
const ad = (o = {}) => ({ title: 'Скидки', headline: 'Мощные ноутбуки', imageUrl: '/images/laptops-1.svg', buttonText: 'Посмотреть', linkUrl: '/laptops', placement: 'HOME_HERO', status: 'ACTIVE', sortOrder: 1, ...o })
const publicIds = async q => (await anon('GET', `/api/advertisements?${q}`)).data.map(a => a.id)
test('CRUD рекламы, расписание и статус', async () => {
  const c = await adm('POST', '/api/admin/advertisements', ad())
  assert.equal(c.status, 201)
  const id = c.data.id
  assert.ok((await publicIds('placement=HOME_HERO')).includes(id))
  await adm('PATCH', `/api/admin/advertisements/${id}`, { status: 'DISABLED' })
  assert.ok(!(await publicIds('placement=HOME_HERO')).includes(id), 'выключенная реклама скрыта')
  await adm('PATCH', `/api/admin/advertisements/${id}`, { status: 'ACTIVE', endsAt: '2020-01-01T00:00' })
  assert.ok(!(await publicIds('placement=HOME_HERO')).includes(id), 'просроченная реклама скрыта')
  await adm('PATCH', `/api/admin/advertisements/${id}`, { endsAt: '' })
  assert.ok((await publicIds('placement=HOME_HERO')).includes(id))
  assert.equal((await adm('POST', '/api/admin/advertisements', ad({ startsAt: '2030-01-02T00:00', endsAt: '2030-01-01T00:00' }))).status, 400)
  assert.equal((await adm('DELETE', `/api/admin/advertisements/${id}`)).status, 200)
  assert.ok(!(await publicIds('placement=HOME_HERO')).includes(id))
})
test('реклама: опасные ссылки запрещены, внешние допустимы', async () => {
  for (const linkUrl of ['javascript:alert(1)', 'JavaScript:alert(1)', 'data:text/html,x', '//evil.com', 'ftp://x.com'])
    assert.equal((await adm('POST', '/api/admin/advertisements', ad({ linkUrl }))).status, 400, linkUrl)
  const ext = await adm('POST', '/api/admin/advertisements', ad({ linkUrl: 'https://example.com/sale', placement: 'FOOTER' }))
  assert.equal(ext.status, 201)
  await adm('DELETE', `/api/admin/advertisements/${ext.data.id}`)
})
test('реклама: статистика просмотров и кликов, привязка баннера к категории', async () => {
  const c = await adm('POST', '/api/admin/advertisements', ad({ placement: 'CATEGORY', categorySlug: 'smartphones' }))
  const id = c.data.id
  assert.ok(!(await publicIds('placement=CATEGORY&category=laptops')).includes(id))
  assert.ok((await publicIds('placement=CATEGORY&category=smartphones')).includes(id))
  assert.equal((await anon('POST', `/api/advertisements/${id}/view`)).status, 204)
  assert.equal((await anon('POST', `/api/advertisements/${id}/click`)).status, 204)
  assert.equal((await anon('POST', '/api/advertisements/999999/view')).status, 404)
  const row = (await adm('GET', '/api/admin/advertisements')).data.find(a => a.id === id)
  assert.equal(row.views, 1); assert.equal(row.clicks, 1)
  await adm('DELETE', `/api/admin/advertisements/${id}`)
})

// ---------- Загрузка изображений ----------
test('загрузка: не изображение отклоняется, PNG принимается, не-админ получает 403', async () => {
  const fake = new FormData(); fake.append('file', new Blob(['<?php echo 1; ?>'], { type: 'image/png' }), 'evil.png')
  assert.equal((await adm('POST', '/api/admin/upload/banners', fake)).status, 400)
  const good = new FormData(); good.append('file', new Blob([PNG], { type: 'image/png' }), 'a.png')
  const r = await adm('POST', '/api/admin/upload/banners', good)
  assert.equal(r.status, 201); assert.match(r.data.url, /^\/uploads\/banners\/[0-9a-f]+\.png$/)
  await fs.unlink(path.join(SERVER_DIR, r.data.url.replace(/^\//, '')))
  const again = new FormData(); again.append('file', new Blob([PNG]), 'a.png')
  assert.equal((await usr('POST', '/api/admin/upload/banners', again)).status, 403)
})

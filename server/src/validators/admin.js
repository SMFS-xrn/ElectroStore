import { z } from 'zod'
const url = z.string().max(300).refine(s => s.startsWith('/uploads/') || s.startsWith('/images/'), 'Недопустимый путь изображения')
const productBase = z.object({
  name: z.string().trim().min(2, 'Название: минимум 2 символа').max(150),
  brand: z.string().trim().min(1, 'Укажите производителя').max(60),
  model: z.string().trim().min(1, 'Укажите модель').max(80),
  description: z.string().trim().min(1, 'Добавьте описание').max(5000),
  categoryId: z.number().int().positive('Выберите категорию'),
  price: z.number().int().min(0, 'Цена не может быть отрицательной').max(100000000),
  oldPrice: z.number().int().min(0).nullable().optional(),
  stock: z.number().int().min(0, 'Остаток не может быть отрицательным').max(100000),
  images: z.array(url).max(10),
  specs: z.array(z.object({ key: z.string().trim().min(1).max(60), value: z.string().trim().min(1).max(120) })).max(30)
})
const oldOk = d => d.oldPrice == null || d.price == null || d.oldPrice > d.price
export const productCreate = productBase.refine(oldOk, { message: 'Старая цена должна быть выше текущей', path: ['oldPrice'] })
export const productPatch = productBase.partial().refine(oldOk, { message: 'Старая цена должна быть выше текущей', path: ['oldPrice'] })
export const categoryCreate = z.object({
  name: z.string().trim().min(2, 'Название: минимум 2 символа').max(60),
  slug: z.string().trim().toLowerCase().regex(/^[a-z0-9-]+$/, 'Slug: латиница, цифры и дефис').max(40),
  image: url.nullable().optional(),
  sortOrder: z.number().int().min(0).max(1000).default(0)
})
export const categoryPatch = categoryCreate.partial()
export const orderStatus = z.object({ status: z.enum(['NEW', 'PROCESSING', 'SHIPPED', 'DONE', 'CANCELLED']) })

// ---------- Реклама ----------
export const PLACEMENTS = ['HOME_HERO', 'CATEGORY', 'HORIZONTAL', 'CATALOG', 'FOOTER']
// Разрешены только внутренние пути (/laptops) и http(s)-адреса: javascript:, data: и //host блокируются
const adLink = z.string().trim().min(1, 'Укажите ссылку').max(500).refine(
  s => (s.startsWith('/') && !s.startsWith('//') && !/[\s\\]/.test(s)) || /^https?:\/\/[^\s]+$/i.test(s),
  'Ссылка: внутренний путь (/laptops) или адрес http(s)://...')
const dateField = z.union([
  z.null(), z.literal('').transform(() => null),
  z.string().refine(s => !Number.isNaN(Date.parse(s)), 'Некорректная дата').transform(s => new Date(s))
]).optional()
const adBase = z.object({
  title: z.string().trim().min(2, 'Название: минимум 2 символа').max(100),
  headline: z.string().trim().min(2, 'Заголовок: минимум 2 символа').max(150),
  description: z.string().trim().max(500).optional(),
  imageUrl: url,
  buttonText: z.string().trim().min(1, 'Укажите текст кнопки').max(30),
  linkUrl: adLink,
  placement: z.enum(PLACEMENTS),
  categorySlug: z.union([z.null(), z.literal('').transform(() => null), z.string().trim().toLowerCase().regex(/^[a-z0-9-]+$/).max(40)]).optional(),
  status: z.enum(['ACTIVE', 'DISABLED']),
  sortOrder: z.number().int().min(0).max(1000),
  startsAt: dateField,
  endsAt: dateField
})
const datesOk = d => !(d.startsAt instanceof Date && d.endsAt instanceof Date) || d.endsAt > d.startsAt
export const adCreate = adBase.refine(datesOk, { message: 'Дата окончания должна быть позже начала', path: ['endsAt'] })
export const adPatch = adBase.partial().refine(datesOk, { message: 'Дата окончания должна быть позже начала', path: ['endsAt'] })

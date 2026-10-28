import { z } from 'zod'

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Имя: минимум 2 символа').max(60),
  email: z.string().trim().toLowerCase().email('Некорректный email').max(120),
  password: z.string().min(8, 'Пароль: минимум 8 символов').max(100),
  confirmPassword: z.string()
}).refine(d => d.password === d.confirmPassword, { message: 'Пароли не совпадают', path: ['confirmPassword'] })

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Некорректный email'),
  password: z.string().min(1, 'Введите пароль').max(100)
})
export const cartAddSchema = z.object({ productId: z.number().int().positive(), quantity: z.number().int().min(1).max(100).default(1) })
export const cartPatchSchema = z.object({ quantity: z.number().int().min(1).max(100) })
export const favSchema = z.object({ productId: z.number().int().positive() })
export const orderSchema = z.object({
  customerName: z.string().trim().min(2, 'Укажите имя').max(80),
  phone: z.string().trim().regex(/^\+?[\d\s()-]{7,20}$/, 'Некорректный телефон'),
  address: z.string().trim().min(5, 'Укажите адрес доставки').max(250),
  comment: z.string().trim().max(500).optional()
})

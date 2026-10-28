# ElectroStore

Интернет-магазин электроники: React + Vite, Express, Prisma, SQLite. Цены в сомах. Работает локально на Windows 10/11, без облачных сервисов.
Учебный проект — сайт для продажи электроники.

## Запуск (Node.js 20+)
```
copy server\.env.example server\.env       # затем задайте SESSION_SECRET (длинная случайная строка)
npm run setup                               # зависимости, создание базы, категории, 24 товара, 6 баннеров
npm run admin:create                        # единственный администратор (см. ниже)
npm run dev                                 # frontend :5173 + backend :5000
```
Откройте http://localhost:5173. Повторный `npm run setup` безопасен: пользователи, заказы и свои изменения не удаляются, демо-данные добавляются только если их ещё нет.

### Администратор
1. В `server/.env` укажите `ADMIN_EMAIL` и `ADMIN_PASSWORD` (минимум 10 символов).
2. `npm run admin:create`, затем удалите пароль из `.env`.
3. Войдите на `/login`, панель: `/admin`.

Администратор может быть только один: команда откажет, если он уже есть, а уникальный индекс `adminSlot` не даёт создать второго на уровне базы. Регистрация всегда создаёт роль `USER`; `/api/admin/*` проверяется на сервере (401 без входа, 403 для обычных пользователей).

## Команды
| Команда | Действие |
|---|---|
| `npm run dev` | запуск frontend и backend |
| `npm run build` | сборка frontend |
| `npm test` | тесты backend (отдельная база `server/prisma/test.db`) |
| `npm run admin:create` | создать единственного администратора |

## Структура
`client/` — React (pages, admin, components, contexts, services), `server/` — Express API (routes, middleware, validators, services), `server/prisma/` — схема и seed, `server/uploads/` — загруженные изображения.

## Безопасность
bcrypt, HTTP-only cookie-сессии (в базе только хеш токена), Zod-валидация, ограничение попыток входа, CSRF (Origin + служебный заголовок), helmet, проверка загружаемых файлов по содержимому, запрет `javascript:` в рекламных ссылках, Prisma (параметризованные запросы). Для публикации в интернет: HTTPS, `NODE_ENV=production`, свой `SESSION_SECRET`.

## База данных
Локально схема применяется командой `prisma db push` (идемпотентно, данные сохраняются при добавлении полей). Для боевого развёртывания создайте миграции: `cd server && npx prisma migrate dev --name init`.

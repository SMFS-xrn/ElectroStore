import { NavLink, Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext.jsx'
const LINKS = [['/admin', 'Dashboard', true], ['/admin/products', 'Товары'], ['/admin/categories', 'Категории'], ['/admin/advertisements', 'Реклама'], ['/admin/orders', 'Заказы'], ['/admin/users', 'Пользователи']]
export default function AdminLayout() {
  const { user, loading } = useAuth()
  if (loading) return <p className="muted">Загрузка…</p>
  if (!user) return <Navigate to="/login?next=/admin" replace />
  if (user.role !== 'ADMIN') return <section><h1>403</h1><p className="muted">Доступ запрещён.</p></section>
  return (
    <div className="admin">
      <nav className="side" aria-label="Админ-панель">{LINKS.map(([to, t, end]) => <NavLink key={to} to={to} end={end}>{t}</NavLink>)}</nav>
      <div className="admin-body"><Outlet /></div>
    </div>
  )
}

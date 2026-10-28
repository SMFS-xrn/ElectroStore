import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { Search, Heart, ShoppingCart, User, Menu, X } from 'lucide-react'
import { CATEGORIES } from '../../services/categories.js'
import { useAuth } from '../../contexts/AuthContext.jsx'
import { useShop } from '../../contexts/ShopContext.jsx'

export default function Header() {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const nav = useNavigate()
  const { cartCount, favs } = useShop()
  const { user } = useAuth()
  const submit = e => { e.preventDefault(); if (q.trim()) { nav(`/search?q=${encodeURIComponent(q.trim())}`); setOpen(false) } }
  return (
    <header className="header">
      <div className="container header-row">
        <button className="icon-btn menu-toggle" aria-label="Меню" onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</button>
        <Link to="/" className="logo">Electro<span>Store</span></Link>
        <form className="search" onSubmit={submit} role="search">
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Поиск товаров" aria-label="Поиск" />
          <button className="icon-btn" aria-label="Найти"><Search size={18} /></button>
        </form>
        <div className="header-actions">
          <Link to="/favorites" className="icon-btn rel" aria-label="Избранное"><Heart size={20} />{favs.length > 0 && <i className="count">{favs.length}</i>}</Link>
          <Link to="/cart" className="icon-btn rel" aria-label="Корзина"><ShoppingCart size={20} />{cartCount > 0 && <i className="count">{cartCount}</i>}</Link>
          <Link to={user ? '/profile' : '/login'} className="icon-btn" aria-label={user ? 'Профиль' : 'Войти'}><User size={20} /></Link>
        </div>
      </div>
      <nav className={`nav ${open ? 'open' : ''}`}>
        <div className="container nav-row">
          {CATEGORIES.map(c => <NavLink key={c.slug} to={`/${c.slug}`} onClick={() => setOpen(false)}>{c.name}</NavLink>)}
          {user?.role === 'ADMIN' && <NavLink to="/admin" onClick={() => setOpen(false)}>Админ-панель</NavLink>}
        </div>
      </nav>
    </header>
  )
}

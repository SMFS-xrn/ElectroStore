import { createContext, useContext, useEffect, useState } from 'react'
import { api, send } from '../services/api.js'
import { useAuth } from './AuthContext.jsx'
const Ctx = createContext(null)
const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d } catch { return d } }
const save = (k, v) => { localStorage.setItem(k, JSON.stringify(v)); return v }

export function ShopProvider({ children }) {
  const { user } = useAuth()
  const [cart, setCart] = useState(() => load('es_cart', []))
  const [favs, setFavs] = useState(() => load('es_favs', []))

  // Вход: переносим гостевую корзину/избранное на сервер, затем берём серверные данные
  useEffect(() => {
    let off = false
    ;(async () => {
      if (!user) { setCart(load('es_cart', [])); setFavs(load('es_favs', [])); return }
      for (const i of load('es_cart', [])) await send('POST', '/cart', { productId: i.id, quantity: i.qty }).catch(() => {})
      for (const f of load('es_favs', [])) await send('POST', '/favorites', { productId: f.id }).catch(() => {})
      localStorage.removeItem('es_cart'); localStorage.removeItem('es_favs')
      const [c, f] = await Promise.all([api('/cart'), api('/favorites')]).catch(() => [[], []])
      if (!off) { setCart(c); setFavs(f) }
    })()
    return () => { off = true }
  }, [user?.id])

  const snap = p => ({ id: p.id, slug: p.slug, name: p.name, brand: p.brand, price: p.price, oldPrice: p.oldPrice, stock: p.stock, image: p.images?.[0]?.url || p.image })
  const guestCart = fn => setCart(c => save('es_cart', fn(c)))
  const guestFavs = fn => setFavs(f => save('es_favs', fn(f)))
  const fail = e => alert(e.message)

  const addToCart = async (p, qty = 1) => {
    if (user) return send('POST', '/cart', { productId: p.id, quantity: qty }).then(setCart).catch(fail)
    guestCart(c => {
      const ex = c.find(i => i.id === p.id)
      const next = Math.min((ex?.qty || 0) + qty, p.stock)
      if (next < 1) return c
      return ex ? c.map(i => i.id === p.id ? { ...i, qty: next } : i) : [...c, { ...snap(p), qty: next }]
    })
  }
  const setQty = async (item, qty) => {
    const q = Math.max(1, Math.min(qty, item.stock))
    if (user) return send('PATCH', `/cart/${item.itemId}`, { quantity: q }).then(setCart).catch(fail)
    guestCart(c => c.map(i => i.id === item.id ? { ...i, qty: q } : i))
  }
  const removeFromCart = async item => {
    if (user) return send('DELETE', `/cart/${item.itemId}`).then(setCart).catch(fail)
    guestCart(c => c.filter(i => i.id !== item.id))
  }
  const toggleFav = async p => {
    const on = favs.some(x => x.id === p.id)
    if (user) return (on ? send('DELETE', `/favorites/${p.id}`) : send('POST', '/favorites', { productId: p.id })).then(setFavs).catch(fail)
    guestFavs(f => on ? f.filter(x => x.id !== p.id) : [...f, snap(p)])
  }
  const reloadCart = () => api('/cart').then(setCart).catch(() => {})

  return <Ctx.Provider value={{
    cart, favs, addToCart, setQty, removeFromCart, toggleFav, reloadCart,
    isFav: id => favs.some(x => x.id === id),
    cartCount: cart.reduce((s, i) => s + i.qty, 0),
    cartTotal: cart.reduce((s, i) => s + i.qty * i.price, 0)
  }}>{children}</Ctx.Provider>
}
export const useShop = () => useContext(Ctx)

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Trash2 } from 'lucide-react'
import Button from '../components/buttons/Button.jsx'
import { useShop } from '../contexts/ShopContext.jsx'
import { useAuth } from '../contexts/AuthContext.jsx'
import { send, som } from '../services/api.js'

function Checkout() {
  const { user } = useAuth()
  const { reloadCart } = useShop()
  const nav = useNavigate()
  const [v, setV] = useState({ customerName: user.name, phone: '', address: '', comment: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const set = k => e => setV({ ...v, [k]: e.target.value })
  const submit = async e => {
    e.preventDefault(); setError(''); setBusy(true)
    try { await send('POST', '/orders', v); await reloadCart(); nav('/orders') }
    catch (err) { setError(err.message); reloadCart() } finally { setBusy(false) }
  }
  return (
    <form className="form" onSubmit={submit}>
      <h2>Оформление заказа</h2>
      <label>Имя<input value={v.customerName} onChange={set('customerName')} required /></label>
      <label>Телефон<input value={v.phone} onChange={set('phone')} type="tel" placeholder="+996 ..." required /></label>
      <label>Адрес доставки<input value={v.address} onChange={set('address')} required /></label>
      <label>Комментарий<textarea value={v.comment} onChange={set('comment')} rows={3} /></label>
      {error && <p className="error" role="alert">{error}</p>}
      <Button disabled={busy}>{busy ? 'Отправка…' : 'Подтвердить заказ'}</Button>
      <p className="muted small">Онлайн-оплаты нет: оплата при получении.</p>
    </form>
  )
}

export default function Cart() {
  const { cart, setQty, removeFromCart, cartTotal } = useShop()
  const { user } = useAuth()
  if (!cart.length) return <section><h1>Корзина</h1><p className="muted">Корзина пуста.</p><Button to="/">Перейти в каталог</Button></section>
  return (
    <section><h1>Корзина</h1>
      <ul className="cart">{cart.map(i => (
        <li key={i.id}>
          <img src={i.image} alt="" />
          <Link to={`/products/${i.slug}`} className="cart-name">{i.name}</Link>
          <div className="qty">
            <button onClick={() => setQty(i, i.qty - 1)} aria-label="Меньше">−</button>
            <span>{i.qty}</span>
            <button onClick={() => setQty(i, i.qty + 1)} disabled={i.qty >= i.stock} aria-label="Больше">+</button>
          </div>
          <strong>{som(i.price * i.qty)}</strong>
          <button className="icon-btn" onClick={() => removeFromCart(i)} aria-label="Удалить"><Trash2 size={18} /></button>
        </li>))}
      </ul>
      <div className="total"><span>Итого: <strong>{som(cartTotal)}</strong></span>
        {!user && <Button to="/login?next=/cart">Войти и оформить заказ</Button>}</div>
      {user && <Checkout />}
    </section>
  )
}

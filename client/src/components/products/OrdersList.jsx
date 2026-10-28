import useApi from '../../hooks/useApi.js'
import State from './State.jsx'
import { som } from '../../services/api.js'
const STATUS = { NEW: 'Новый', PROCESSING: 'В обработке', SHIPPED: 'Отправлен', DONE: 'Выполнен', CANCELLED: 'Отменён' }
export default function OrdersList({ limit }) {
  const { data, loading, error } = useApi('/orders/my')
  const rows = data && (limit ? data.slice(0, limit) : data)
  return (
    <State loading={loading} error={error} empty={data && !data.length}>
      {rows && <ul className="orders">{rows.map(o => (
        <li key={o.id}>
          <div className="order-head"><strong>Заказ №{o.id}</strong><span className="muted">{new Date(o.createdAt).toLocaleDateString('ru-RU')}</span><span className="status">{STATUS[o.status] || o.status}</span><strong>{som(o.total)}</strong></div>
          <ul className="order-items">{o.items.map(i => <li key={i.id}>{i.name} × {i.quantity} — {som(i.price * i.quantity)}</li>)}</ul>
        </li>))}</ul>}
    </State>
  )
}

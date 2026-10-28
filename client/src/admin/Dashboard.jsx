import useApi from '../hooks/useApi.js'
import State from '../components/products/State.jsx'
import { som } from '../services/api.js'
export default function Dashboard() {
  const { data: d, loading, error } = useApi('/admin/dashboard')
  return (
    <State loading={loading} error={error}>{d && <>
      <h1>Dashboard</h1>
      <div className="stats">
        {[['Пользователи', d.users], ['Товары', d.products], ['Заказы', d.orders], ['Продажи', som(d.sales)], ['Активные баннеры', d.activeBanners]].map(([t, v]) =>
          <div key={t}><span className="muted small">{t}</span><strong>{v}</strong></div>)}
      </div>
      <h2>Заканчиваются на складе</h2>
      {d.lowStock.length ? <ul className="plain">{d.lowStock.map(p => <li key={p.id}>{p.name} — осталось {p.stock}</li>)}</ul> : <p className="muted">Все в наличии.</p>}
    </>}</State>
  )
}

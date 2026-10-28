import useApi from '../hooks/useApi.js'
import State from '../components/products/State.jsx'
import { send, som } from '../services/api.js'
const STATUS = [['NEW', 'Новый'], ['PROCESSING', 'В обработке'], ['SHIPPED', 'Отправлен'], ['DONE', 'Выполнен'], ['CANCELLED', 'Отменён']]
export default function Orders() {
  const { data, loading, error, reload } = useApi('/admin/orders')
  const change = async (o, status) => { try { await send('PATCH', `/admin/orders/${o.id}`, { status }) } catch (e) { alert(e.message) } reload() }
  return (
    <State loading={loading} error={error} empty={data && !data.length}>{data && <>
      <h1>Заказы</h1>
      <div className="table-wrap"><table className="table"><thead><tr><th>№</th><th>Клиент</th><th>Состав</th><th>Сумма</th><th>Статус</th></tr></thead>
        <tbody>{data.map(o => <tr key={o.id}><td>{o.id}</td>
          <td>{o.customerName}<br /><span className="muted small">{o.phone}<br />{o.address}{o.comment && <><br />«{o.comment}»</>}</span></td>
          <td>{o.items.map(i => <div key={i.id}>{i.name} × {i.quantity}</div>)}</td>
          <td>{som(o.total)}</td>
          <td><select value={o.status} onChange={e => change(o, e.target.value)}>{STATUS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></td></tr>)}</tbody></table></div>
    </>}</State>
  )
}

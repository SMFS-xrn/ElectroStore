import useApi from '../hooks/useApi.js'
import State from '../components/products/State.jsx'
import { send } from '../services/api.js'
export default function Users() {
  const { data, loading, error, reload } = useApi('/admin/users')
  const del = async u => { if (confirm(`Удалить пользователя ${u.email}?`)) { try { await send('DELETE', `/admin/users/${u.id}`); reload() } catch (e) { alert(e.message) } } }
  return (
    <State loading={loading} error={error}>{data && <>
      <h1>Пользователи</h1>
      <div className="table-wrap"><table className="table"><thead><tr><th>ID</th><th>Имя</th><th>Email</th><th>Роль</th><th>Заказов</th><th></th></tr></thead>
        <tbody>{data.map(u => <tr key={u.id}><td>{u.id}</td><td>{u.name}</td><td>{u.email}</td><td>{u.role}</td><td>{u._count.orders}</td>
          <td>{u.role !== 'ADMIN' && <button className="link-btn" onClick={() => del(u)}>Удалить</button>}</td></tr>)}</tbody></table></div>
    </>}</State>
  )
}

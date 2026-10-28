import { useState } from 'react'
import useApi from '../hooks/useApi.js'
import State from '../components/products/State.jsx'
import Button from '../components/buttons/Button.jsx'
import { send, uploadImage } from '../services/api.js'

function Row({ c, onDone }) {
  const [v, setV] = useState({ name: c.name, sortOrder: c.sortOrder, image: c.image })
  const act = async fn => { try { await fn(); onDone() } catch (e) { alert(e.message) } }
  return (
    <tr>
      <td><input value={v.name} onChange={e => setV({ ...v, name: e.target.value })} aria-label="Название" /></td>
      <td className="muted">{c.slug}</td>
      <td><input type="number" min="0" value={v.sortOrder} onChange={e => setV({ ...v, sortOrder: e.target.value })} style={{ width: 80 }} aria-label="Порядок" /></td>
      <td>{v.image && <img src={v.image} alt="" className="mini" />}
        <input type="file" accept="image/*" onChange={e => e.target.files[0] && act(async () => setV({ ...v, image: await uploadImage('categories', e.target.files[0]) }) )} /></td>
      <td>{c._count.products}</td>
      <td className="actions">
        <button className="link-btn" onClick={() => act(() => send('PATCH', `/admin/categories/${c.id}`, { name: v.name, sortOrder: Number(v.sortOrder), image: v.image }))}>Сохранить</button>
        <button className="link-btn" onClick={() => confirm('Удалить категорию?') && act(() => send('DELETE', `/admin/categories/${c.id}`))}>Удалить</button>
      </td>
    </tr>
  )
}
export default function Categories() {
  const { data, loading, error, reload } = useApi('/admin/categories')
  const [n, setN] = useState({ name: '', slug: '' })
  const [err, setErr] = useState('')
  const add = async e => {
    e.preventDefault(); setErr('')
    try { await send('POST', '/admin/categories', { ...n, sortOrder: (data?.length || 0) + 1 }); setN({ name: '', slug: '' }); reload() } catch (x) { setErr(x.message) }
  }
  return (
    <State loading={loading} error={error}>{data && <>
      <h1>Категории</h1>
      <div className="table-wrap"><table className="table"><thead><tr><th>Название</th><th>Slug</th><th>Порядок</th><th>Изображение</th><th>Товаров</th><th></th></tr></thead>
        <tbody>{data.map(c => <Row key={c.id + c.name + c.sortOrder} c={c} onDone={reload} />)}</tbody></table></div>
      <form className="form" onSubmit={add}><h2>Новая категория</h2>
        <label>Название<input value={n.name} onChange={e => setN({ ...n, name: e.target.value })} required /></label>
        <label>Slug (латиница)<input value={n.slug} onChange={e => setN({ ...n, slug: e.target.value })} required /></label>
        {err && <p className="error" role="alert">{err}</p>}<Button>Создать</Button></form>
    </>}</State>
  )
}

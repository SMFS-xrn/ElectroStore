import { useState } from 'react'
import useApi from '../hooks/useApi.js'
import State from '../components/products/State.jsx'
import Button from '../components/buttons/Button.jsx'
import { api, send, uploadImage, som } from '../services/api.js'

const EMPTY = { name: '', brand: '', model: '', description: '', categoryId: '', price: '', oldPrice: '', stock: '0', specs: '', images: [] }
const specsToText = s => s.map(x => `${x.key}: ${x.value}`).join('\n')
const textToSpecs = t => t.split('\n').map(l => { const i = l.indexOf(':'); return i > 0 ? { key: l.slice(0, i).trim(), value: l.slice(i + 1).trim() } : null }).filter(s => s && s.key && s.value)

function Form({ initial, id, categories, onClose }) {
  const [v, setV] = useState(initial)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const set = k => e => setV({ ...v, [k]: e.target.value })
  const addImage = async e => {
    const f = e.target.files[0]; if (!f) return
    try { const url = await uploadImage('products', f); setV(x => ({ ...x, images: [...x.images, url] })) } catch (x) { setError(x.message) }
    e.target.value = ''
  }
  const submit = async e => {
    e.preventDefault(); setError(''); setBusy(true)
    const body = { name: v.name, brand: v.brand, model: v.model, description: v.description, categoryId: Number(v.categoryId), price: Number(v.price),
      oldPrice: v.oldPrice === '' ? null : Number(v.oldPrice), stock: Number(v.stock), images: v.images, specs: textToSpecs(v.specs) }
    try { await (id ? send('PATCH', `/admin/products/${id}`, body) : send('POST', '/admin/products', body)); onClose(true) }
    catch (x) { setError(x.message) } finally { setBusy(false) }
  }
  return (
    <form className="form" onSubmit={submit}>
      <h2>{id ? 'Редактирование товара' : 'Новый товар'}</h2>
      <label>Название<input value={v.name} onChange={set('name')} required /></label>
      <label>Производитель<input value={v.brand} onChange={set('brand')} required /></label>
      <label>Модель<input value={v.model} onChange={set('model')} required /></label>
      <label>Категория<select value={v.categoryId} onChange={set('categoryId')} required><option value="">Выберите…</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
      <label>Цена, сом<input type="number" min="0" value={v.price} onChange={set('price')} required /></label>
      <label>Старая цена (для скидки)<input type="number" min="0" value={v.oldPrice} onChange={set('oldPrice')} /></label>
      <label>Остаток<input type="number" min="0" value={v.stock} onChange={set('stock')} required /></label>
      <label>Описание<textarea rows={4} value={v.description} onChange={set('description')} required /></label>
      <label>Характеристики (по одной в строке: «Ключ: Значение»)<textarea rows={5} value={v.specs} onChange={set('specs')} /></label>
      <div><strong className="small">Фотографии</strong>
        <div className="thumb-row">{v.images.map((u, i) => <span key={u} className="thumb"><img src={u} alt="" />
          <button type="button" aria-label="Убрать" onClick={() => setV({ ...v, images: v.images.filter((_, j) => j !== i) })}>×</button></span>)}</div>
        <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={addImage} /></div>
      {error && <p className="error" role="alert">{error}</p>}
      <div className="row"><Button disabled={busy}>{busy ? 'Сохранение…' : 'Сохранить'}</Button><Button type="button" variant="light" onClick={() => onClose(false)}>Отмена</Button></div>
    </form>
  )
}

export default function Products() {
  const { data, loading, error, reload } = useApi('/admin/products')
  const cats = useApi('/admin/categories')
  const [editing, setEditing] = useState(null) // { id, initial }
  const edit = async p => {
    try { const f = await api(`/admin/products/${p.id}`)
      setEditing({ id: f.id, initial: { name: f.name, brand: f.brand, model: f.model, description: f.description, categoryId: String(f.categoryId), price: String(f.price), oldPrice: f.oldPrice ?? '', stock: String(f.stock), specs: specsToText(f.specs), images: f.images.map(i => i.url) } })
    } catch (e) { alert(e.message) }
  }
  const del = async p => { if (confirm(`Удалить «${p.name}»?`)) { try { await send('DELETE', `/admin/products/${p.id}`); reload() } catch (e) { alert(e.message) } } }
  if (editing) return <Form key={editing.id || 'new'} initial={editing.initial} id={editing.id} categories={cats.data || []} onClose={saved => { setEditing(null); saved && reload() }} />
  return (
    <State loading={loading} error={error}>{data && <>
      <div className="row between"><h1>Товары</h1><Button onClick={() => setEditing({ id: null, initial: EMPTY })}>Добавить товар</Button></div>
      <div className="table-wrap"><table className="table"><thead><tr><th></th><th>Название</th><th>Категория</th><th>Цена</th><th>Остаток</th><th></th></tr></thead>
        <tbody>{data.map(p => <tr key={p.id}>
          <td>{p.images[0] && <img src={p.images[0].url} alt="" className="mini" />}</td><td>{p.name}</td><td>{p.category.name}</td>
          <td>{som(p.price)}{p.oldPrice > p.price && <><br /><s className="muted small">{som(p.oldPrice)}</s></>}</td><td>{p.stock}</td>
          <td className="actions"><button className="link-btn" onClick={() => edit(p)}>Изменить</button><button className="link-btn" onClick={() => del(p)}>Удалить</button></td></tr>)}</tbody></table></div>
    </>}</State>
  )
}

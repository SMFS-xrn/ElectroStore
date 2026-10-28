import { useState } from 'react'
import useApi from '../hooks/useApi.js'
import State from '../components/products/State.jsx'
import Button from '../components/buttons/Button.jsx'
import Banner from '../components/banners/Banner.jsx'
import { send, uploadImage } from '../services/api.js'
import { CATEGORIES } from '../services/categories.js'

const PLACE = { HOME_HERO: 'Главный баннер', CATEGORY: 'Баннер категории', HORIZONTAL: 'Горизонтальная реклама', CATALOG: 'Реклама в каталоге', FOOTER: 'Нижний баннер' }
const VARIANT = { HOME_HERO: 'hero', CATALOG: 'catalog' }
const EMPTY = { title: '', headline: '', description: '', imageUrl: '', buttonText: 'Посмотреть', linkUrl: '/', placement: 'HOME_HERO', categorySlug: '', status: 'ACTIVE', sortOrder: 1, startsAt: '', endsAt: '' }
const toLocal = d => d ? new Date(new Date(d) - new Date(d).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ''

function Form({ initial, id, onClose }) {
  const [v, setV] = useState(initial)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const set = k => e => setV({ ...v, [k]: e.target.value })
  const pick = async e => {
    const f = e.target.files[0]; if (!f) return
    try { setV(x => ({ ...x, imageUrl: '' })); const url = await uploadImage('banners', f); setV(x => ({ ...x, imageUrl: url })) } catch (x) { setError(x.message) }
  }
  const submit = async e => {
    e.preventDefault(); setError(''); setBusy(true)
    const body = { ...v, sortOrder: Number(v.sortOrder), startsAt: v.startsAt || null, endsAt: v.endsAt || null, categorySlug: v.placement === 'CATEGORY' ? (v.categorySlug || null) : null }
    try { await (id ? send('PATCH', `/admin/advertisements/${id}`, body) : send('POST', '/admin/advertisements', body)); onClose(true) }
    catch (x) { setError(x.message) } finally { setBusy(false) }
  }
  return (
    <>
      <form className="form" onSubmit={submit}>
        <h2>{id ? 'Редактирование рекламы' : 'Новая реклама'}</h2>
        <label>Название (для админки)<input value={v.title} onChange={set('title')} required /></label>
        <label>Заголовок<input value={v.headline} onChange={set('headline')} required /></label>
        <label>Описание<textarea rows={3} value={v.description} onChange={set('description')} /></label>
        <label>Изображение<input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={pick} /></label>
        <label>Текст кнопки<input value={v.buttonText} onChange={set('buttonText')} required /></label>
        <label>Ссылка (/laptops или https://…)<input value={v.linkUrl} onChange={set('linkUrl')} required /></label>
        <label>Быстро вставить ссылку на категорию
          <select value="" onChange={e => e.target.value && setV({ ...v, linkUrl: e.target.value })}><option value="">Выберите…</option>{CATEGORIES.map(c => <option key={c.slug} value={`/${c.slug}`}>{c.name}</option>)}</select></label>
        <label>Расположение<select value={v.placement} onChange={set('placement')}>{Object.entries(PLACE).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></label>
        {v.placement === 'CATEGORY' && <label>Показывать на странице категории<select value={v.categorySlug} onChange={set('categorySlug')}><option value="">Во всех категориях</option>{CATEGORIES.map(c => <option key={c.slug} value={c.slug}>{c.name}</option>)}</select></label>}
        <label>Статус<select value={v.status} onChange={set('status')}><option value="ACTIVE">Включена</option><option value="DISABLED">Выключена</option></select></label>
        <label>Порядок<input type="number" min="0" value={v.sortOrder} onChange={set('sortOrder')} /></label>
        <label>Начало показа<input type="datetime-local" value={v.startsAt} onChange={set('startsAt')} /></label>
        <label>Окончание показа<input type="datetime-local" value={v.endsAt} onChange={set('endsAt')} /></label>
        {error && <p className="error" role="alert">{error}</p>}
        <div className="row"><Button disabled={busy}>{busy ? 'Сохранение…' : 'Опубликовать'}</Button><Button type="button" variant="light" onClick={() => onClose(false)}>Отмена</Button></div>
      </form>
      <h2>Предварительный просмотр</h2>
      <Banner ad={{ ...v, id: 0, headline: v.headline || 'Заголовок', buttonText: v.buttonText || 'Кнопка' }} variant={VARIANT[v.placement] || 'strip'} preview />
    </>
  )
}

export default function Advertisements() {
  const { data, loading, error, reload } = useApi('/admin/advertisements')
  const [editing, setEditing] = useState(null)
  const act = async fn => { try { await fn() } catch (e) { alert(e.message) } reload() }
  const swap = (a, b) => act(async () => { await send('PATCH', `/admin/advertisements/${a.id}`, { sortOrder: b.sortOrder === a.sortOrder ? b.sortOrder + 1 : b.sortOrder }); await send('PATCH', `/admin/advertisements/${b.id}`, { sortOrder: a.sortOrder }) })
  const edit = a => setEditing({ id: a.id, initial: { title: a.title, headline: a.headline, description: a.description || '', imageUrl: a.imageUrl, buttonText: a.buttonText, linkUrl: a.linkUrl, placement: a.placement, categorySlug: a.categorySlug || '', status: a.status, sortOrder: a.sortOrder, startsAt: toLocal(a.startsAt), endsAt: toLocal(a.endsAt) } })
  if (editing) return <Form key={editing.id || 'new'} initial={editing.initial} id={editing.id} onClose={saved => { setEditing(null); saved && reload() }} />
  return (
    <State loading={loading} error={error}>{data && <>
      <div className="row between"><h1>Реклама</h1><Button onClick={() => setEditing({ id: null, initial: EMPTY })}>Создать рекламу</Button></div>
      <div className="table-wrap"><table className="table"><thead><tr><th></th><th>Название</th><th>Место</th><th>Статус</th><th>Показ</th><th>Просм. / Клики</th><th>Порядок</th><th></th></tr></thead>
        <tbody>{data.map((a, i) => {
          const sib = data.filter(x => x.placement === a.placement), k = sib.indexOf(a)
          return <tr key={a.id}>
            <td><img src={a.imageUrl} alt="" className="mini" /></td><td>{a.title}<br /><span className="muted small">{a.linkUrl}</span></td><td>{PLACE[a.placement]}{a.categorySlug && <><br /><span className="muted small">/{a.categorySlug}</span></>}</td>
            <td><button className="link-btn" onClick={() => act(() => send('PATCH', `/admin/advertisements/${a.id}`, { status: a.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE' }))}>{a.status === 'ACTIVE' ? 'Включена' : 'Выключена'}</button></td>
            <td className="small">{a.startsAt ? new Date(a.startsAt).toLocaleString('ru-RU') : 'сразу'}<br />{a.endsAt ? `до ${new Date(a.endsAt).toLocaleString('ru-RU')}` : 'без окончания'}</td>
            <td>{a.views} / {a.clicks}{a.views > 0 && <span className="muted small"> ({Math.round(a.clicks / a.views * 100)}%)</span>}</td>
            <td className="actions">{a.sortOrder} <button className="link-btn" disabled={k === 0} onClick={() => swap(a, sib[k - 1])} aria-label="Выше">↑</button><button className="link-btn" disabled={k === sib.length - 1} onClick={() => swap(a, sib[k + 1])} aria-label="Ниже">↓</button></td>
            <td className="actions"><button className="link-btn" onClick={() => edit(a)}>Изменить</button><button className="link-btn" onClick={() => confirm('Удалить рекламу?') && act(() => send('DELETE', `/admin/advertisements/${a.id}`))}>Удалить</button></td></tr>
        })}</tbody></table></div>
      {!data.length && <p className="muted">Рекламы пока нет.</p>}
    </>}</State>
  )
}

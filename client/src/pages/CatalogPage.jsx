import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import useApi from '../hooks/useApi.js'
import ProductGrid from '../components/products/ProductGrid.jsx'
import State from '../components/products/State.jsx'
import Button from '../components/buttons/Button.jsx'
import AdSlot from '../components/banners/AdSlot.jsx'

const SORTS = [['popular', 'По популярности'], ['price_asc', 'Сначала дешёвые'], ['price_desc', 'Сначала дорогие'], ['new', 'Новинки']]

export default function CatalogPage({ category }) {
  const [sp, setSp] = useSearchParams()
  const params = { brand: sp.getAll('brand'), spec: sp.getAll('spec'), minPrice: sp.get('minPrice'), maxPrice: sp.get('maxPrice'), sort: sp.get('sort') || 'popular', page: sp.get('page') || 1 }
  const { data, loading, error } = useApi(`/categories/${category.slug}/products`, params)
  const f = data?.facets
  const [wide] = useState(() => window.matchMedia('(min-width: 769px)').matches)
  const update = (fn) => { const n = new URLSearchParams(sp); fn(n); n.delete('page'); setSp(n) }
  const toggle = (key, val) => update(n => { const all = n.getAll(key); n.delete(key); (all.includes(val) ? all.filter(x => x !== val) : [...all, val]).forEach(x => n.append(key, x)) })
  const setOne = (key, val) => update(n => val ? n.set(key, val) : n.delete(key))
  const setSpec = (k, v) => update(n => { const rest = n.getAll('spec').filter(s => !s.startsWith(`${k}:`)); n.delete('spec'); rest.forEach(s => n.append('spec', s)); if (v) n.append('spec', `${k}:${v}`) })
  const goPage = p => { const n = new URLSearchParams(sp); n.set('page', p); setSp(n); window.scrollTo(0, 0) }
  const specVal = k => (sp.getAll('spec').find(s => s.startsWith(`${k}:`)) || '').slice(k.length + 1)

  return (
    <section>
      <div className="cat-head"><img src={`/images/${category.slug}-1.svg`} alt="" /><h1>{category.name}</h1></div>
      <AdSlot placement="CATEGORY" category={category.slug} limit={1} />
      <div className="catalog">
        <aside><details className="filters-box" open={wide}><summary>Фильтры и сортировка</summary><div className="filters">
          <label>Сортировка
            <select value={params.sort} onChange={e => setOne('sort', e.target.value)}>{SORTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
          </label>
          {f && <>
            <fieldset><legend>Производитель</legend>
              {f.brands.map(b => <label key={b} className="check"><input type="checkbox" checked={params.brand.includes(b)} onChange={() => toggle('brand', b)} />{b}</label>)}
            </fieldset>
            <fieldset><legend>Цена, сом</legend>
              <div className="row2">
                <input type="number" min="0" placeholder={f.minPrice} defaultValue={params.minPrice || ''} key={`a${params.minPrice}`} onBlur={e => setOne('minPrice', e.target.value)} aria-label="Цена от" />
                <input type="number" min="0" placeholder={f.maxPrice} defaultValue={params.maxPrice || ''} key={`b${params.maxPrice}`} onBlur={e => setOne('maxPrice', e.target.value)} aria-label="Цена до" />
              </div>
            </fieldset>
            {Object.entries(f.specs).map(([k, vals]) => (
              <label key={k}>{k}
                <select value={specVal(k)} onChange={e => setSpec(k, e.target.value)}><option value="">Все</option>{vals.map(v => <option key={v}>{v}</option>)}</select>
              </label>))}
            {[...sp.keys()].some(k => k !== 'sort') && <Button variant="light" onClick={() => setSp(new URLSearchParams(sp.get('sort') ? { sort: sp.get('sort') } : {}))}>Сбросить фильтры</Button>}
          </>}
        </div></details></aside>
        <div>
          <State loading={loading} error={error} empty={data && !data.items.length}>
            {data && <>
              <p className="muted small">Найдено: {data.total}</p>
              <ProductGrid items={data.items} inline={<AdSlot placement="CATALOG" limit={1} />} />
              {data.pages > 1 && <div className="pager">{Array.from({ length: data.pages }, (_, i) => i + 1).map(n =>
                <button key={n} className={`pg ${n === data.page ? 'on' : ''}`} onClick={() => goPage(n)}>{n}</button>)}</div>}
            </>}
          </State>
        </div>
      </div>
    </section>
  )
}

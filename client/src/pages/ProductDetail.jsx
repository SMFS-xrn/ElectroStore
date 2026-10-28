import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Heart } from 'lucide-react'
import useApi from '../hooks/useApi.js'
import State from '../components/products/State.jsx'
import ProductGrid from '../components/products/ProductGrid.jsx'
import Button from '../components/buttons/Button.jsx'
import { useShop } from '../contexts/ShopContext.jsx'
import { som } from '../services/api.js'

export default function ProductDetail() {
  const { slug } = useParams()
  const { data: p, loading, error } = useApi(`/products/${slug}`)
  const { addToCart, toggleFav, isFav } = useShop()
  const [idx, setIdx] = useState(0)
  const [zoom, setZoom] = useState(false)
  return (
    <State loading={loading} error={error}>
      {p && <section>
        <p className="muted small"><Link to={`/${p.category.slug}`}>{p.category.name}</Link> / {p.name}</p>
        <div className="detail">
          <div>
            <button className={`gallery-main ${zoom ? 'zoom' : ''}`} onClick={() => setZoom(!zoom)} aria-label="Увеличить изображение">
              <img src={p.images[idx]?.url} alt={p.name} />
            </button>
            <div className="thumbs">{p.images.map((im, i) => <button key={im.id} className={i === idx ? 'on' : ''} onClick={() => { setIdx(i); setZoom(false) }}><img src={im.url} alt="" /></button>)}</div>
          </div>
          <div>
            <div className="muted">{p.brand} · {p.model}</div>
            <h1>{p.name}</h1>
            <div className="price big">{som(p.price)} {p.oldPrice > p.price && <s>{som(p.oldPrice)}</s>}</div>
            <p className={p.stock > 0 ? 'ok' : 'error'}>{p.stock > 0 ? `В наличии: ${p.stock} шт.` : 'Нет в наличии'}</p>
            <div className="row">
              <Button disabled={p.stock < 1} onClick={() => addToCart(p)}>В корзину</Button>
              <Button variant="light" onClick={() => toggleFav(p)}><Heart size={18} /> {isFav(p.id) ? 'В избранном' : 'В избранное'}</Button>
            </div>
            <h2>Характеристики</h2>
            <dl className="specs">{p.specs.map(s => <div key={s.id}><dt>{s.key}</dt><dd>{s.value}</dd></div>)}</dl>
            <h2>Описание</h2><p>{p.description}</p>
          </div>
        </div>
        {p.similar.length > 0 && <><h2>Похожие товары</h2><ProductGrid items={p.similar} /></>}
      </section>}
    </State>
  )
}

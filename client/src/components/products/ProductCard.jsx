import { Link } from 'react-router-dom'
import { Heart } from 'lucide-react'
import Button from '../buttons/Button.jsx'
import { useShop } from '../../contexts/ShopContext.jsx'
import { som } from '../../services/api.js'

export default function ProductCard({ p }) {
  const { addToCart, toggleFav, isFav } = useShop()
  const img = p.images?.[0]?.url || p.image
  const sale = p.oldPrice && p.oldPrice > p.price ? Math.round((1 - p.price / p.oldPrice) * 100) : 0
  return (
    <article className="product">
      <Link to={`/products/${p.slug}`} className="product-img">
        {img && <img src={img} alt={p.name} loading="lazy" />}
        {sale > 0 && <span className="badge">−{sale}%</span>}
      </Link>
      <button className={`fav ${isFav(p.id) ? 'on' : ''}`} aria-label="В избранное" onClick={() => toggleFav(p)}><Heart size={18} /></button>
      <div className="muted small">{p.brand}</div>
      <Link to={`/products/${p.slug}`} className="product-name">{p.name}</Link>
      <div className="price">{som(p.price)} {p.oldPrice > p.price && <s>{som(p.oldPrice)}</s>}</div>
      {p.stock > 0
        ? <Button onClick={() => addToCart(p)}>В корзину</Button>
        : <span className="muted small">Нет в наличии</span>}
    </article>
  )
}

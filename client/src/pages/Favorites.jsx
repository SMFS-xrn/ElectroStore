import ProductGrid from '../components/products/ProductGrid.jsx'
import Button from '../components/buttons/Button.jsx'
import { useShop } from '../contexts/ShopContext.jsx'
export default function Favorites() {
  const { favs } = useShop()
  return <section><h1>Избранное</h1>
    {favs.length ? <ProductGrid items={favs} /> : <><p className="muted">Пока пусто.</p><Button to="/">На главную</Button></>}</section>
}

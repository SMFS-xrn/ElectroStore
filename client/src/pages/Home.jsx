import { Link } from 'react-router-dom'
import Button from '../components/buttons/Button.jsx'
import ProductGrid from '../components/products/ProductGrid.jsx'
import State from '../components/products/State.jsx'
import useApi from '../hooks/useApi.js'
import AdSlot from '../components/banners/AdSlot.jsx'
import { CATEGORIES } from '../services/categories.js'

function Block({ title, params }) {
  const { data, loading, error } = useApi('/products', { limit: 4, ...params })
  return <><h2>{title}</h2><State loading={loading} error={error} empty={data && !data.items.length}>{data && <ProductGrid items={data.items} />}</State></>
}
function StaticHero() {
  return (
      <section className="hero">
        <div>
          <h1>Электроника для работы и игр</h1>
          <p>Смартфоны, ноутбуки, компьютеры и аксессуары с доставкой.</p>
          <div className="row"><Button to="/laptops">Перейти в каталог</Button><Button to="/smartphones" variant="dark">Посмотреть товар</Button></div>
        </div>
        <img className="hero-img" src="/images/laptops-1.svg" alt="Ноутбук" />
      </section>
  )
}
export default function Home() {
  return (
    <>
      <AdSlot placement="HOME_HERO" fallback={<StaticHero />} />
      <h2>Популярные категории</h2>
      <div className="cat-list">{CATEGORIES.map(c => <Link key={c.slug} to={`/${c.slug}`}>{c.name}</Link>)}</div>
      <Block title="Популярные товары" params={{ sort: 'popular' }} />
      <AdSlot placement="HORIZONTAL" />
      <Block title="Новинки" params={{ sort: 'new' }} />
    </>
  )
}

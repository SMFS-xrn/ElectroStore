import { useSearchParams } from 'react-router-dom'
import useApi from '../hooks/useApi.js'
import ProductGrid from '../components/products/ProductGrid.jsx'
import State from '../components/products/State.jsx'
export default function Search() {
  const [sp] = useSearchParams()
  const q = sp.get('q') || ''
  const { data, loading, error } = useApi('/products', { q, limit: 48 })
  return <section><h1>Поиск: {q}</h1>
    <State loading={loading} error={error} empty={data && !data.items.length}>{data && <ProductGrid items={data.items} />}</State></section>
}

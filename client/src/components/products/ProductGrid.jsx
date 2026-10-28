import ProductCard from './ProductCard.jsx'
// inline — рекламный блок между товарами (на всю ширину сетки, после 4-го товара)
export default function ProductGrid({ items, inline }) {
  const at = Math.min(4, items.length)
  return (
    <div className="grid">
      {items.slice(0, at).map(p => <ProductCard key={p.id} p={p} />)}
      {inline && <div className="ad-wide">{inline}</div>}
      {items.slice(at).map(p => <ProductCard key={p.id} p={p} />)}
    </div>
  )
}

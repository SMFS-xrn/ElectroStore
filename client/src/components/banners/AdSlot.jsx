import { useState } from 'react'
import useApi from '../../hooks/useApi.js'
import Banner from './Banner.jsx'

// Загружает активную рекламу для места показа. Нет рекламы — показывается fallback (или ничего).
export default function AdSlot({ placement, category, limit, fallback = null }) {
  const { data, loading } = useApi('/advertisements', { placement, category })
  const [i, setI] = useState(0)
  if (loading) return null
  if (!data || !data.length) return fallback
  const list = limit ? data.slice(0, limit) : data
  if (placement === 'HOME_HERO') {
    const ad = list[i % list.length]
    return (
      <div>
        <Banner key={ad.id} ad={ad} variant="hero" />
        {list.length > 1 && <div className="dots">{list.map((a, n) =>
          <button key={a.id} className={n === i % list.length ? 'on' : ''} onClick={() => setI(n)} aria-label={`Баннер ${n + 1}`} />)}</div>}
      </div>
    )
  }
  return <>{list.map(a => <Banner key={a.id} ad={a} variant={placement === 'CATALOG' ? 'catalog' : 'strip'} />)}</>
}

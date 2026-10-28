import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { send } from '../../services/api.js'

const isInternal = u => u.startsWith('/') && !u.startsWith('//')
const isSafe = u => isInternal(u) || /^https?:\/\/[^\s]+$/i.test(u)
const seen = new Set() // один показ баннера за загрузку страницы

export function AdLink({ ad, preview, className, children }) {
  const click = () => { if (!preview) send('POST', `/advertisements/${ad.id}/click`).catch(() => {}) }
  if (preview || !isSafe(ad.linkUrl)) return <span className={className}>{children}</span>
  return isInternal(ad.linkUrl)
    ? <Link to={ad.linkUrl} className={className} onClick={click}>{children}</Link>
    : <a href={ad.linkUrl} className={className} target="_blank" rel="noopener noreferrer" onClick={click}>{children}</a>
}

export default function Banner({ ad, variant = 'strip', preview = false }) {
  useEffect(() => {
    if (preview || seen.has(ad.id)) return
    seen.add(ad.id)
    send('POST', `/advertisements/${ad.id}/view`).catch(() => {})
  }, [ad.id, preview])
  return (
    <section className={`ad ad-${variant}`}>
      <div className="ad-text">
        <h2 className="ad-title">{ad.headline}</h2>
        {ad.description && <p>{ad.description}</p>}
        <AdLink ad={ad} preview={preview} className="btn btn-primary">{ad.buttonText}</AdLink>
      </div>
      <div className="ad-img">{ad.imageUrl && <img src={ad.imageUrl} alt="" />}</div>
    </section>
  )
}

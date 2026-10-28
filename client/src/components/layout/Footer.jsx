import { Link } from 'react-router-dom'
import { CATEGORIES } from '../../services/categories.js'
export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-row">
        <div><strong>ElectroStore</strong><p>Современная электроника в Кыргызстане.</p></div>
        <ul>{CATEGORIES.map(c => <li key={c.slug}><Link to={`/${c.slug}`}>{c.name}</Link></li>)}</ul>
      </div>
    </footer>
  )
}

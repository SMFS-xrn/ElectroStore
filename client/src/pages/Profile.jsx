import { useNavigate, Link } from 'react-router-dom'
import RequireAuth from '../components/layout/RequireAuth.jsx'
import OrdersList from '../components/products/OrdersList.jsx'
import ProductGrid from '../components/products/ProductGrid.jsx'
import Button from '../components/buttons/Button.jsx'
import { useAuth } from '../contexts/AuthContext.jsx'
import { useShop } from '../contexts/ShopContext.jsx'
function Inner() {
  const { user, logout } = useAuth()
  const { favs } = useShop()
  const nav = useNavigate()
  return (
    <section>
      <h1>Профиль</h1>
      <dl className="specs"><div><dt>Имя</dt><dd>{user.name}</dd></div><div><dt>Email</dt><dd>{user.email}</dd></div></dl>
      <div className="row" style={{ marginTop: 16 }}><Button variant="dark" onClick={async () => { await logout(); nav('/') }}>Выйти</Button></div>
      <h2>Последние заказы</h2><OrdersList limit={3} />
      <p><Link to="/orders" className="link">Все заказы</Link></p>
      <h2>Избранное</h2>
      {favs.length ? <ProductGrid items={favs} /> : <p className="muted">Пока пусто.</p>}
    </section>
  )
}
export default function Profile() { return <RequireAuth><Inner /></RequireAuth> }

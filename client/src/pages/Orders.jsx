import RequireAuth from '../components/layout/RequireAuth.jsx'
import OrdersList from '../components/products/OrdersList.jsx'
export default function Orders() {
  return <RequireAuth><section><h1>Мои заказы</h1><OrdersList /></section></RequireAuth>
}

import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext.jsx'
export default function RequireAuth({ children }) {
  const { user, loading } = useAuth()
  const loc = useLocation()
  if (loading) return <p className="muted">Загрузка…</p>
  return user ? children : <Navigate to={`/login?next=${encodeURIComponent(loc.pathname)}`} replace />
}

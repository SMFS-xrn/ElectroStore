import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import AuthForm from '../components/buttons/AuthForm.jsx'
import { useAuth } from '../contexts/AuthContext.jsx'
export default function Login() {
  const { login } = useAuth()
  const nav = useNavigate()
  const next = new URLSearchParams(useSearchParams()[0]).get('next')
  const safeNext = next && next.startsWith('/') && !next.startsWith('//') ? next : '/profile'
  return <section className="narrow"><h1>Вход</h1>
    <AuthForm fields={[['email', 'Email', 'email'], ['password', 'Пароль', 'password']]} submitText="Войти"
      onSubmit={async v => { await login(v.email || '', v.password || ''); nav(safeNext) }} />
    <p className="muted">Нет аккаунта? <Link to="/register" className="link">Зарегистрироваться</Link></p></section>
}

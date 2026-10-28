import { Link, useNavigate } from 'react-router-dom'
import AuthForm from '../components/buttons/AuthForm.jsx'
import { useAuth } from '../contexts/AuthContext.jsx'
export default function Register() {
  const { register } = useAuth()
  const nav = useNavigate()
  return <section className="narrow"><h1>Регистрация</h1>
    <AuthForm fields={[['name', 'Имя'], ['email', 'Email', 'email'], ['password', 'Пароль', 'password'], ['confirmPassword', 'Подтверждение пароля', 'password']]} submitText="Зарегистрироваться"
      onSubmit={async v => { await register({ name: v.name || '', email: v.email || '', password: v.password || '', confirmPassword: v.confirmPassword || '' }); nav('/profile') }} />
    <p className="muted">Уже есть аккаунт? <Link to="/login" className="link">Войти</Link></p></section>
}

import { useState } from 'react'
import Button from './Button.jsx'
export default function AuthForm({ fields, submitText, onSubmit }) {
  const [vals, setVals] = useState({})
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const submit = async e => {
    e.preventDefault(); setError(''); setBusy(true)
    try { await onSubmit(vals) } catch (err) { setError(err.message) } finally { setBusy(false) }
  }
  return (
    <form className="form" onSubmit={submit} noValidate>
      {fields.map(([name, label, type]) => (
        <label key={name}>{label}
          <input name={name} type={type || 'text'} value={vals[name] || ''} onChange={e => setVals({ ...vals, [name]: e.target.value })} autoComplete={type === 'password' ? 'current-password' : name} required />
        </label>))}
      {error && <p className="error" role="alert">{error}</p>}
      <Button disabled={busy}>{busy ? 'Подождите…' : submitText}</Button>
    </form>
  )
}

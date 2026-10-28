export default function State({ loading, error, empty, children }) {
  if (loading) return <p className="muted">Загрузка…</p>
  if (error) return <p className="error">Не удалось загрузить данные: {error}</p>
  if (empty) return <p className="muted">Ничего не найдено.</p>
  return children
}

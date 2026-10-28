export async function api(path, params) {
  const qs = new URLSearchParams()
  Object.entries(params || {}).forEach(([k, v]) => [].concat(v).forEach(x => x !== '' && x != null && qs.append(k, x)))
  const res = await fetch(`/api${path}${qs.toString() ? `?${qs}` : ''}`, { credentials: 'include' })
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || `Ошибка ${res.status}`)
  return res.json()
}
export const som = n => `${new Intl.NumberFormat('ru-RU').format(n)} сом`

export async function send(method, path, body) {
  const res = await fetch(`/api${path}`, {
    method, credentials: 'include',
    headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'ElectroStore' },
    body: body ? JSON.stringify(body) : undefined
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || `Ошибка ${res.status}`)
  return data
}

export async function uploadImage(kind, file) {
  const fd = new FormData(); fd.append('file', file)
  const res = await fetch(`/api/admin/upload/${kind}`, { method: 'POST', credentials: 'include', headers: { 'X-Requested-With': 'ElectroStore' }, body: fd })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || `Ошибка ${res.status}`)
  return data.url
}

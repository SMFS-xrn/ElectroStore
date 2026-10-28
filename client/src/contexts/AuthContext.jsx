import { createContext, useContext, useEffect, useState } from 'react'
import { api, send } from '../services/api.js'
const Ctx = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => { api('/auth/me').then(d => setUser(d.user)).catch(() => {}).finally(() => setLoading(false)) }, [])
  const login = async (email, password) => setUser((await send('POST', '/auth/login', { email, password })).user)
  const register = async data => setUser((await send('POST', '/auth/register', data)).user)
  const logout = async () => { await send('POST', '/auth/logout').catch(() => {}); setUser(null) }
  return <Ctx.Provider value={{ user, loading, login, register, logout }}>{children}</Ctx.Provider>
}
export const useAuth = () => useContext(Ctx)

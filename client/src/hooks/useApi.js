import { useEffect, useState } from 'react'
import { api } from '../services/api.js'
export default function useApi(path, params) {
  const [state, set] = useState({ data: null, error: null, loading: true })
  const [tick, setTick] = useState(0)
  const key = path + JSON.stringify(params || {}) + tick
  useEffect(() => {
    let off = false
    set(s => ({ ...s, loading: true, error: null }))
    api(path, params).then(data => !off && set({ data, error: null, loading: false }))
      .catch(e => !off && set({ data: null, error: e.message, loading: false }))
    return () => { off = true }
  }, [key])
  return { ...state, reload: () => setTick(t => t + 1) }
}

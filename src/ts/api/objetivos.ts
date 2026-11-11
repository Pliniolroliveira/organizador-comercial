import type { Objetivo } from '../types'

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...options })
  if (res.status === 401) { window.location.href = '/login.html'; throw new Error('Unauthorized') }
  if (!res.ok) { const { error } = await res.json(); throw new Error(error) }
  if (res.status === 204) return undefined as T
  const { data } = await res.json()
  return data as T
}

export const getObjetivos = () => request<Objetivo[]>('/api/objetivos')
export const createObjetivo = (body: Omit<Objetivo, 'id' | 'criado_em'>) => request<Objetivo>('/api/objetivos', { method: 'POST', body: JSON.stringify(body) })
export const updateObjetivo = (id: string, body: Partial<Objetivo>) => request<Objetivo>(`/api/objetivos/${id}`, { method: 'PUT', body: JSON.stringify(body) })
export const deleteObjetivo = (id: string) => request<void>(`/api/objetivos/${id}`, { method: 'DELETE' })

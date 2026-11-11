import type { Evento } from '../types'

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...options })
  if (res.status === 401) { window.location.href = '/login.html'; throw new Error('Unauthorized') }
  if (!res.ok) { const { error } = await res.json(); throw new Error(error) }
  if (res.status === 204) return undefined as T
  const { data } = await res.json()
  return data as T
}

export const getEventos = () => request<Evento[]>('/api/eventos')
export const createEvento = (body: Omit<Evento, 'id' | 'criado_em'>) => request<Evento>('/api/eventos', { method: 'POST', body: JSON.stringify(body) })
export const updateEvento = (id: string, body: Partial<Evento>) => request<Evento>(`/api/eventos/${id}`, { method: 'PUT', body: JSON.stringify(body) })
export const deleteEvento = (id: string) => request<void>(`/api/eventos/${id}`, { method: 'DELETE' })

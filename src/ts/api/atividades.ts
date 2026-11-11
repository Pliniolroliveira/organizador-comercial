import type { Atividade } from '../types'

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...options })
  if (res.status === 401) { window.location.href = '/login.html'; throw new Error('Unauthorized') }
  if (!res.ok) { const { error } = await res.json(); throw new Error(error) }
  if (res.status === 204) return undefined as T
  const { data } = await res.json()
  return data as T
}

export const getAtividades = () => request<Atividade[]>('/api/atividades')
export const createAtividade = (body: Omit<Atividade, 'id' | 'criado_em'>) => request<Atividade>('/api/atividades', { method: 'POST', body: JSON.stringify(body) })
export const updateAtividade = (id: string, body: Partial<Atividade>) => request<Atividade>(`/api/atividades/${id}`, { method: 'PUT', body: JSON.stringify(body) })
export const deleteAtividade = (id: string) => request<void>(`/api/atividades/${id}`, { method: 'DELETE' })

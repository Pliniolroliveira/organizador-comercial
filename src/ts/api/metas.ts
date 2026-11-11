import type { Meta } from '../types'

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...options })
  if (res.status === 401) { window.location.href = '/login.html'; throw new Error('Unauthorized') }
  if (!res.ok) { const { error } = await res.json(); throw new Error(error) }
  if (res.status === 204) return undefined as T
  const { data } = await res.json()
  return data as T
}

export const getMetas = () => request<Meta[]>('/api/metas')
export const createMeta = (body: Omit<Meta, 'id' | 'criado_em'>) => request<Meta>('/api/metas', { method: 'POST', body: JSON.stringify(body) })
export const updateMeta = (id: string, body: Partial<Meta>) => request<Meta>(`/api/metas/${id}`, { method: 'PUT', body: JSON.stringify(body) })
export const deleteMeta = (id: string) => request<void>(`/api/metas/${id}`, { method: 'DELETE' })

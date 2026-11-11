import type { Lead } from '../types'

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...options })
  if (res.status === 401) { window.location.href = '/login.html'; throw new Error('Unauthorized') }
  if (!res.ok) { const { error } = await res.json(); throw new Error(error) }
  if (res.status === 204) return undefined as T
  const { data } = await res.json()
  return data as T
}

export const getLeads = () => request<Lead[]>('/api/leads')
export const createLead = (body: Omit<Lead, 'id' | 'criado_em' | 'virou_cliente'>) => request<Lead>('/api/leads', { method: 'POST', body: JSON.stringify(body) })
export const updateLead = (id: string, body: Partial<Lead>) => request<Lead>(`/api/leads/${id}`, { method: 'PUT', body: JSON.stringify(body) })
export const deleteLead = (id: string) => request<void>(`/api/leads/${id}`, { method: 'DELETE' })
export const leadVirouCliente = (id: string) => request<unknown>(`/api/leads/${id}/virou-cliente`, { method: 'POST' })

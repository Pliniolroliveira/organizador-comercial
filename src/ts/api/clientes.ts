import type { Cliente } from '../types'

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...options })
  if (res.status === 401) { window.location.href = '/login.html'; throw new Error('Unauthorized') }
  if (!res.ok) { const { error } = await res.json(); throw new Error(error) }
  if (res.status === 204) return undefined as T
  const { data } = await res.json()
  return data as T
}

export const getClientes = () => request<Cliente[]>('/api/clientes')
export const createCliente = (body: Omit<Cliente, 'id' | 'criado_em'>) => request<Cliente>('/api/clientes', { method: 'POST', body: JSON.stringify(body) })
export const updateCliente = (id: string, body: Partial<Cliente>) => request<Cliente>(`/api/clientes/${id}`, { method: 'PUT', body: JSON.stringify(body) })
export const deleteCliente = (id: string) => request<void>(`/api/clientes/${id}`, { method: 'DELETE' })

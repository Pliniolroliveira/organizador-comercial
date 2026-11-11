import type { Tarefa } from '../types'

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...options })
  if (res.status === 401) { window.location.href = '/login.html'; throw new Error('Unauthorized') }
  if (!res.ok) { const { error } = await res.json(); throw new Error(error) }
  if (res.status === 204) return undefined as T
  const { data } = await res.json()
  return data as T
}

export const getTarefas = () => request<Tarefa[]>('/api/tarefas')
export const createTarefa = (body: Omit<Tarefa, 'id' | 'criado_em'>) => request<Tarefa>('/api/tarefas', { method: 'POST', body: JSON.stringify(body) })
export const updateTarefa = (id: string, body: Partial<Tarefa>) => request<Tarefa>(`/api/tarefas/${id}`, { method: 'PUT', body: JSON.stringify(body) })
export const deleteTarefa = (id: string) => request<void>(`/api/tarefas/${id}`, { method: 'DELETE' })

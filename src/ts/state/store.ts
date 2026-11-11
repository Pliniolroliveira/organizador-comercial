import type {
  Objetivo, Meta, Tarefa, Lead, Cliente,
  Atividade, Evento, View, TaskFilter
} from '../types'

export interface AppState {
  objetivos: Objetivo[]
  metas: Meta[]
  tarefas: Tarefa[]
  leads: Lead[]
  clientes: Cliente[]
  atividades: Atividade[]
  eventos: Evento[]
  view: View
  taskFilter: TaskFilter
  config: { metaSemanal: number }
  ready: boolean
}

export const state: AppState = {
  objetivos: [],
  metas: [],
  tarefas: [],
  leads: [],
  clientes: [],
  atividades: [],
  eventos: [],
  view: 'painel',
  taskFilter: 'abertas',
  config: { metaSemanal: 20 },
  ready: false,
}

type Listener = () => void
const listeners = new Set<Listener>()

export function subscribe(fn: Listener): () => void {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export function notify(): void {
  listeners.forEach(fn => fn())
}

export function setView(view: View): void {
  state.view = view
  window.scrollTo(0, 0)
  notify()
}

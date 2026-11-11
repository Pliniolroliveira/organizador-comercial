import { state } from '../state/store'
import type { View } from '../types'

const VIEWS: Array<[View, string, string]> = [
  ['painel',     'Painel',           '<path d="M4 13h6V4H4zM14 20h6v-9h-6zM4 20h6v-4H4zM14 8h6V4h-6z"/>'],
  ['metas',      'Metas',            '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1"/>'],
  ['tarefas',    'Tarefas',          '<path d="M9 6h11M9 12h11M9 18h11M4 6l1 1 2-2M4 12l1 1 2-2M4 18l1 1 2-2"/>'],
  ['leads',      'Leads',            '<path d="M3 5h18l-7 8v6l-4-2v-4z"/>'],
  ['clientes',   'Clientes',         '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>'],
  ['prospeccao', 'Prospecção',       '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a1 1 0 0 1-1 1A15 15 0 0 1 4 5a1 1 0 0 1 1-1z"/>'],
  ['eventos',    'Eventos',          '<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>'],
]

const counts: Partial<Record<View, number>> = {}

function icon(d: string): string {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`
}

export function renderNav(): string {
  counts.tarefas = state.tarefas.filter(t => t.status !== 'concluida').length
  counts.leads = state.leads.filter(l => l.etapa !== 'ganho' && l.etapa !== 'perdido').length

  return VIEWS.map(([view, label, iconPath]) => {
    const active = state.view === view
    const count = counts[view]
    return `<a href="#${view}"${active ? ' aria-current="page"' : ''}>${icon(iconPath)}<span>${label}</span>${count ? `<span class="count">${count}</span>` : ''}</a>`
  }).join('')
}

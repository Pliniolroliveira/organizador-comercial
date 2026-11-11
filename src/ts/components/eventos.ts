import { state } from '../state/store'
import type { Evento } from '../types'

const esc = (s: unknown) => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!))
const fmtDate = (s?: string) => { if (!s) return ''; const d = new Date(s + 'T00:00:00'); return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }) }

const STATUS_LABELS: Record<Evento['status'], string> = { planejado: 'Planejado', em_andamento: 'Em andamento', concluido: 'Concluído', cancelado: 'Cancelado' }
const TIPO_LABELS: Record<string, string> = { palestra: 'Palestra', feira: 'Feira', workshop: 'Workshop', reuniao_grupo: 'Reunião em grupo', outro: 'Outro' }

export function renderEventos(): string {
  const tabs = [
    { id: 'todos', label: 'Todos', fn: () => true },
    { id: 'planejado', label: 'Planejados', fn: (e: Evento) => e.status === 'planejado' },
    { id: 'em_andamento', label: 'Em andamento', fn: (e: Evento) => e.status === 'em_andamento' },
    { id: 'concluido', label: 'Concluídos', fn: (e: Evento) => e.status === 'concluido' },
  ]
  const activeTab = (window as never as { _eventoTab?: string })._eventoTab ?? 'todos'
  const f = tabs.find(t => t.id === activeTab) ?? tabs[0]
  const lista = state.eventos.filter(f.fn)

  const tabsHtml = `<div class="tabs">${tabs.map(t => `<button data-act="filter-evento" data-id="${t.id}" aria-pressed="${t.id === f.id}">${t.label} ${state.eventos.filter(t.fn).length}</button>`).join('')}</div>`

  const rows = lista.length ? `<div class="list">${lista.map(e => `<div class="row">
    <button class="rowbtn" data-act="edit" data-col="eventos" data-id="${esc(e.id)}">
      <span class="t"><strong>${esc(e.titulo)}${e.tipo ? ` <span style="font-weight:400;color:var(--muted)">· ${esc(TIPO_LABELS[e.tipo] ?? e.tipo)}</span>` : ''}</strong>
      <span>${e.data_inicio ? fmtDate(e.data_inicio) + (e.data_fim && e.data_fim !== e.data_inicio ? ' → ' + fmtDate(e.data_fim) : '') : 'Sem data'}${e.local ? ' · ' + esc(e.local) : ''}${e.meta_participantes ? ' · ' + e.participantes_confirmados + '/' + e.meta_participantes + ' participantes' : ''}</span>
      </span>
    </button>
    <span class="chip ${e.status}">${STATUS_LABELS[e.status]}</span>
  </div>`).join('')}</div>` : `<div class="empty"><strong>${state.eventos.length ? 'Nada neste filtro' : 'Nenhum evento cadastrado'}</strong>${state.eventos.length ? 'Troque o filtro acima.' : 'Cadastre palestras, feiras, workshops e reuniões em grupo.'}</div>`

  return `<div class="head"><div><h1>Eventos</h1><p>Organização dos seus eventos comerciais.</p></div><div class="actions"><button class="btn primary w" data-act="new" data-col="eventos">Novo evento</button></div></div><section class="card">${tabsHtml}${rows}</section>`
}

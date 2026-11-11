import { state } from '../state/store'
import type { Tarefa } from '../types'

const esc = (s: unknown) => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!))
const pad = (n: number) => String(n).padStart(2, '0')
const today = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}` }
const fmtDate = (s?: string) => { if (!s) return ''; const d = new Date(s + 'T00:00:00'); return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '') }

const openTask = (t: Tarefa) => t.status !== 'concluida'
const late = (t: Tarefa) => openTask(t) && !!t.prazo && t.prazo < today()

export function renderTarefas(): string {
  const t = today()
  type Filter = { id: string; label: string; fn: (x: Tarefa) => boolean }
  const filtros: Filter[] = [
    { id: 'abertas', label: 'Abertas', fn: openTask },
    { id: 'hoje', label: 'Para hoje', fn: x => openTask(x) && !!x.prazo && x.prazo <= t },
    { id: 'atrasadas', label: 'Atrasadas', fn: late },
    { id: 'concluidas', label: 'Concluídas', fn: x => !openTask(x) },
  ]
  const f = filtros.find(x => x.id === state.taskFilter) ?? filtros[0]
  const ord: Record<string, number> = { alta: 0, media: 1, baixa: 2 }
  const lista = state.tarefas.filter(f.fn).sort((a, b) =>
    f.id === 'concluidas'
      ? (b.concluida_em ?? '').localeCompare(a.concluida_em ?? '')
      : (a.prazo ?? '9999').localeCompare(b.prazo ?? '9999') || (ord[a.prioridade] ?? 1) - (ord[b.prioridade] ?? 1)
  )

  const tabs = `<div class="tabs">${filtros.map(x => `<button data-act="filter-tarefa" data-id="${x.id}" aria-pressed="${x.id === f.id}">${x.label} ${state.tarefas.filter(x.fn).length}</button>`).join('')}</div>`

  const rows = lista.length ? `<div class="list">${lista.map(x => {
    const m = x.meta_id ? state.metas.find(m => m.id === x.meta_id) : null
    const feita = !openTask(x)
    const pr = { alta: 'Alta', media: 'Média', baixa: 'Baixa' }[x.prioridade]
    return `<div class="row${feita ? ' done' : ''}"><button class="check w" role="checkbox" aria-checked="${feita}" aria-label="Marcar: ${esc(x.titulo)}" data-act="toggle-tarefa" data-id="${esc(x.id)}"><svg viewBox="0 0 16 16" fill="none" stroke="#06243a" stroke-width="2.5"><path d="M3 8.5l3.2 3L13 4.5"/></svg></button><button class="rowbtn" data-act="edit" data-col="tarefas" data-id="${esc(x.id)}"><span class="t"><strong>${esc(x.titulo)}</strong><span>${m ? 'Meta: ' + esc(m.titulo) : 'Sem meta ligada'}${x.status === 'andamento' ? ' · Em andamento' : ''}</span></span></button>${pr && !feita ? `<span class="chip ${x.prioridade}">${pr}</span>` : ''}${feita ? `<span class="chip ok">${fmtDate(x.concluida_em) || 'Feita'}</span>` : (x.prazo ? `<span class="chip ${late(x) ? 'late' : ''}">${fmtDate(x.prazo)}</span>` : '')}</div>`
  }).join('')}</div>` : `<div class="empty"><strong>${state.tarefas.length ? 'Nada neste filtro' : 'Nenhuma tarefa ainda'}</strong>${state.tarefas.length ? 'Troque o filtro acima.' : 'Tarefas são os próximos passos concretos de cada meta.'}</div>`

  return `<div class="head"><div><h1>Tarefas</h1><p>O que precisa ser feito, por prazo e prioridade.</p></div><div class="actions"><button class="btn primary w" data-act="new" data-col="tarefas">Nova tarefa</button></div></div><section class="card">${tabs}${rows}</section>`
}

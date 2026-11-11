import { state } from '../state/store'
import type { Lead } from '../types'

const esc = (s: unknown) => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!))
const pad = (n: number) => String(n).padStart(2, '0')
const today = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}` }
const fmtDate = (s?: string) => { if (!s) return ''; const d = new Date(s + 'T00:00:00'); return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '') }
const brl = (n?: number) => (n ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
const sum = (arr: Lead[], k: 'valor') => arr.reduce((t, x) => t + (x[k] ?? 0), 0)
const openLead = (l: Lead) => l.etapa !== 'ganho' && l.etapa !== 'perdido'

const ETAPAS: Array<[string, string, string]> = [
  ['novo','Novo','--blue'], ['contato','Em contato','--cyan'], ['proposta','Proposta','--violet'],
  ['negociacao','Negociação','--magenta'], ['ganho','Ganho','--ok'], ['perdido','Perdido','--faint'],
]

export function renderLeads(): string {
  const t = today()
  const cols = ETAPAS.map(([etapa, label, color]) => {
    const ls = state.leads.filter(l => l.etapa === etapa).sort((a, b) => (a.proximo_contato ?? '9999').localeCompare(b.proximo_contato ?? '9999'))
    const cards = ls.map(l => `<article class="lead" draggable="true" data-lead="${esc(l.id)}">
      <button class="rowbtn" data-act="edit" data-col="leads" data-id="${esc(l.id)}"><strong>${esc(l.nome)}</strong><span class="who">${esc(l.empresa || l.interesse || 'Sem empresa')}</span></button>
      <div class="foot"><span class="num">${l.valor ? brl(l.valor) : '—'}</span>${l.proximo_contato && openLead(l) ? `<span class="chip ${l.proximo_contato < t ? 'late' : ''}">${fmtDate(l.proximo_contato)}</span>` : ''}</div>
      <div class="foot w">
        <select aria-label="Etapa de ${esc(l.nome)}" data-move="${esc(l.id)}">${ETAPAS.map(([v, lbl]) => `<option value="${v}"${v === l.etapa ? ' selected' : ''}>${lbl}</option>`).join('')}</select>
        <button class="btn small w" data-act="new" data-col="atividades" data-preset='${esc(JSON.stringify({ lead_id: l.id }))}'>Contato</button>
        ${l.etapa === 'ganho' && !l.virou_cliente ? `<button class="btn small primary w" data-act="virou-cliente" data-id="${esc(l.id)}">Virou cliente</button>` : ''}
        ${l.virou_cliente ? '<span class="chip ok">Cliente</span>' : ''}
      </div>
    </article>`).join('')
    return `<section class="col" data-etapa="${etapa}"><header><h3><span class="dot" style="background:var(${color})"></span>${label} ${ls.length}</h3><small>${brl(sum(ls, 'valor'))}</small></header>${cards}</section>`
  }).join('')

  const body = state.leads.length
    ? `<div class="board-wrap"><div class="board">${cols}</div></div>`
    : `<div class="card empty"><strong>Nenhum lead cadastrado</strong>Cada lead entra como Novo e avança pelas etapas até fechar.<div class="actions"><button class="btn primary w" data-act="new" data-col="leads">Adicionar lead</button></div></div>`

  return `<div class="head"><div><h1>Leads</h1><p>Arraste o cartão ou troque a etapa para mover no funil.</p></div><div class="actions"><button class="btn primary w" data-act="new" data-col="leads">Novo lead</button></div></div>${body}`
}

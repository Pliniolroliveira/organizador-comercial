import { state } from '../state/store'
import type { Cliente } from '../types'

const esc = (s: unknown) => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!))
const fmtDate = (s?: string) => { if (!s) return ''; const d = new Date(s + 'T00:00:00'); return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }) }
const brl = (n?: number) => n != null ? (n).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }) : '—'

const STATUS_LABELS: Record<Cliente['status'], string> = { ativo: 'Ativo', inativo: 'Inativo', em_renovacao: 'Em renovação' }

export function renderClientes(): string {
  const tabs = [
    { id: 'todos', label: 'Todos', fn: () => true },
    { id: 'ativo', label: 'Ativos', fn: (c: Cliente) => c.status === 'ativo' },
    { id: 'em_renovacao', label: 'Em renovação', fn: (c: Cliente) => c.status === 'em_renovacao' },
    { id: 'inativo', label: 'Inativos', fn: (c: Cliente) => c.status === 'inativo' },
  ]
  const activeTab = (window as never as { _clienteTab?: string })._clienteTab ?? 'todos'
  const f = tabs.find(t => t.id === activeTab) ?? tabs[0]
  const lista = state.clientes.filter(f.fn)

  const tabsHtml = `<div class="tabs">${tabs.map(t => `<button data-act="filter-cliente" data-id="${t.id}" aria-pressed="${t.id === f.id}">${t.label} ${state.clientes.filter(t.fn).length}</button>`).join('')}</div>`

  const rows = lista.length ? `<div class="list">${lista.map(c => `<div class="row">
    <button class="rowbtn" data-act="edit" data-col="clientes" data-id="${esc(c.id)}">
      <span class="t"><strong>${esc(c.nome)}${c.empresa ? ` <span style="font-weight:400;color:var(--muted)">· ${esc(c.empresa)}</span>` : ''}</strong>
      <span>${c.produto_contratado ? esc(c.produto_contratado) + ' · ' : ''}${brl(c.valor_contrato)}${c.data_renovacao ? ' · renovação ' + fmtDate(c.data_renovacao) : ''}</span></span>
    </button>
    <span class="chip ${c.status}">${STATUS_LABELS[c.status]}</span>
  </div>`).join('')}</div>` : `<div class="empty"><strong>${state.clientes.length ? 'Nada neste filtro' : 'Nenhum cliente ainda'}</strong>${state.clientes.length ? 'Troque o filtro acima.' : 'Clientes aparecem aqui quando você converte um lead ou cadastra manualmente.'}</div>`

  return `<div class="head"><div><h1>Clientes</h1><p>Fichas dos seus clientes ativos e histórico.</p></div><div class="actions"><button class="btn primary w" data-act="new" data-col="clientes">Novo cliente</button></div></div><section class="card">${tabsHtml}${rows}</section>`
}

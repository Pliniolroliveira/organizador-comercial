import { state } from '../state/store'
import type { Meta } from '../types'

const esc = (s: unknown) => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!))
const nf = (n?: number) => (n ?? 0).toLocaleString('pt-BR', { maximumFractionDigits: 1 })
const fmtDate = (s?: string) => { if (!s) return ''; const d = new Date(s + 'T00:00:00'); return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '') }
const pct = (m: Meta) => m.alvo > 0 ? Math.min(100, Math.round(m.atual / m.alvo * 100)) : 0

const btn = (col: string, label: string, cls = '', preset?: Record<string, unknown>) =>
  `<button class="btn w ${cls}" data-act="new" data-col="${col}"${preset ? ` data-preset='${esc(JSON.stringify(preset))}'` : ''}>${esc(label)}</button>`

function metaRow(m: Meta): string {
  const p = pct(m)
  const nt = state.tarefas.filter(x => x.meta_id === m.id && x.status !== 'concluida').length
  return `<div class="meta"><button class="rowbtn" data-act="edit" data-col="metas" data-id="${esc(m.id)}"><strong>${esc(m.titulo)}</strong><br><small>${nf(m.atual)} de ${nf(m.alvo)}${m.unidade ? ' ' + esc(m.unidade) : ''}${m.prazo ? ' · até ' + fmtDate(m.prazo) : ''}${nt ? ' · ' + nt + (nt === 1 ? ' tarefa aberta' : ' tarefas abertas') : ''}</small></button><span class="num" style="font-weight:600">${p}%</span><div class="bar${p >= 100 ? '' : ' mg'}"><span style="width:${p}%"></span></div></div>`
}

export function renderMetas(): string {
  const grupos = state.objetivos.map(o => ({ o, metas: state.metas.filter(m => m.objetivo_id === o.id) }))
  const soltas = state.metas.filter(m => !m.objetivo_id || !state.objetivos.find(o => o.id === m.objetivo_id))
  if (soltas.length) grupos.push({ o: null as never, metas: soltas })

  const body = grupos.length ? grupos.map(g => {
    const avg = g.metas.length ? Math.round(g.metas.reduce((t, m) => t + pct(m), 0) / g.metas.length) : 0
    return `<section class="card obj"><header><div><h2>${esc(g.o ? g.o.titulo : 'Metas sem objetivo')}</h2>${g.o && (g.o.descricao || g.o.prazo) ? `<p>${esc(g.o.descricao ?? '')}${g.o.descricao && g.o.prazo ? ' · ' : ''}${g.o.prazo ? 'Prazo: ' + fmtDate(g.o.prazo) : ''}</p>` : ''}</div><div style="text-align:right"><div class="pct num">${avg}%</div>${g.o ? `<button class="btn small ghost w" data-act="edit" data-col="objetivos" data-id="${esc(g.o.id)}">Editar</button>` : ''}</div></header>${g.metas.length ? g.metas.map(metaRow).join('') : '<div class="empty">Este objetivo ainda não tem metas.</div>'}${g.o ? `<div style="margin-top:12px">${btn('metas','Adicionar meta','small',{ objetivo_id: g.o.id })}</div>` : ''}</section>`
  }).join('') : `<div class="card empty"><strong>Nenhum objetivo ainda</strong>O objetivo diz aonde você quer chegar. As metas dizem com qual número você mede o caminho.<div class="actions">${btn('objetivos','Criar objetivo','primary')}</div></div>`

  return `<div class="head"><div><h1>Objetivos e metas</h1><p>Cada objetivo se divide em metas com número e prazo.</p></div><div class="actions">${btn('metas','Nova meta')}${btn('objetivos','Novo objetivo','primary')}</div></div><div class="stack">${body}</div>`
}

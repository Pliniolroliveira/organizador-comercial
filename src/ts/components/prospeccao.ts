import { state } from '../state/store'
import type { Atividade } from '../types'

const esc = (s: unknown) => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!))
const pad = (n: number) => String(n).padStart(2, '0')
const today = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}` }
const addDays = (s: string, n: number) => { const d = new Date(s + 'T00:00:00'); d.setDate(d.getDate() + n); return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}` }
const weekStart = (s: string) => { const d = new Date(s + 'T00:00:00'); return addDays(s, -((d.getDay() + 6) % 7)) }
const fmtDate = (s?: string) => { if (!s) return ''; const d = new Date(s + 'T00:00:00'); return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '') }

const TIPOS: Atividade['tipo'][] = ['Ligação', 'WhatsApp', 'E-mail', 'Reunião', 'Visita']
const BOM = new Set(['Reunião marcada', 'Proposta enviada', 'Fechou'])

export function renderProspeccao(): string {
  const t = today(), ws = weekStart(t), we = addDays(ws, 6)
  const sem = state.atividades.filter(a => a.data >= ws && a.data <= we)
  const alvo = state.config.metaSemanal
  const p = alvo ? Math.min(1, sem.length / alvo) : 0
  const circ = 2 * Math.PI * 52

  const ring = `<div class="ring"><svg viewBox="0 0 124 124" role="img" aria-label="${sem.length} de ${alvo} contatos na semana"><defs><linearGradient id="rg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="var(--cyan)"/><stop offset="1" stop-color="var(--violet)"/></linearGradient></defs><circle cx="62" cy="62" r="52" fill="none" stroke="var(--surface-2)" stroke-width="11"/><circle cx="62" cy="62" r="52" fill="none" stroke="url(#rg)" stroke-width="11" stroke-linecap="round" stroke-dasharray="${circ*p} ${circ}" transform="rotate(-90 62 62)"/></svg><div><div class="big num">${sem.length} <span class="muted" style="font-size:1rem">de ${alvo}</span></div><div class="muted">contatos nesta semana</div></div></div>`

  const maxT = Math.max(1, ...TIPOS.map(x => sem.filter(a => a.tipo === x).length))
  const tipos = TIPOS.map(x => { const n = sem.filter(a => a.tipo === x).length; return `<div class="frow"><span>${x}</span><div class="track"><span style="width:${n/maxT*100}%;background:var(--g-magenta)"></span></div><span class="n num">${n}</span></div>` }).join('')

  const lista = [...state.atividades].sort((a, b) => (b.data ?? '').localeCompare(a.data ?? '')).slice(0, 100)
  let last = '', rows = ''
  lista.forEach(a => {
    if (a.data !== last) { last = a.data; rows += `<div class="day">${a.data === t ? 'Hoje' : fmtDate(a.data)}</div>` }
    const l = a.lead_id ? state.leads.find(x => x.id === a.lead_id) : null
    rows += `<div class="row"><button class="rowbtn" data-act="edit" data-col="atividades" data-id="${esc(a.id)}"><span class="t"><strong>${esc(a.tipo || 'Contato')}${l ? ' com ' + esc(l.nome) : ''}</strong><span>${esc(a.nota || (l?.empresa) || 'Sem anotação')}</span></span></button><span class="chip ${BOM.has(a.resultado ?? '') ? 'ok' : ''}">${esc(a.resultado ?? '')}</span></div>`
  })
  const log = lista.length ? `<div class="list">${rows}</div>` : '<div class="empty"><strong>Nenhum contato registrado</strong>Registre cada ligação, mensagem ou reunião.</div>'

  return `<div class="head"><div><h1>Prospecção</h1><p>Registro de cada tentativa de contato e do que ela rendeu.</p></div><div class="actions"><button class="btn primary w" data-act="new" data-col="atividades">Registrar contato</button></div></div>
  <div class="stack"><div class="grid two"><section class="card"><header><h2>Ritmo da semana</h2></header>${ring}</section><section class="card"><header><h2>Por tipo de contato</h2></header><div class="funnel">${tipos}</div></section></div><section class="card"><header><h2>Histórico</h2></header>${log}</section></div>`
}

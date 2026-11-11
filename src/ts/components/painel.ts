import { state } from '../state/store'
import type { Lead, Tarefa } from '../types'

const esc = (s: unknown) => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!))
const pad = (n: number) => String(n).padStart(2, '0')
const today = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}` }
const addDays = (s: string, n: number) => { const d = new Date(s + 'T00:00:00'); d.setDate(d.getDate() + n); return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}` }
const weekStart = (s: string) => { const d = new Date(s + 'T00:00:00'); return addDays(s, -((d.getDay() + 6) % 7)) }
const fmtDate = (s?: string) => { if (!s) return ''; const d = new Date(s + 'T00:00:00'); return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '') }
const brl = (n?: number) => (n ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
const sum = (arr: Lead[], k: 'valor') => arr.reduce((t, x) => t + (x[k] ?? 0), 0)
const openLead = (l: Lead) => l.etapa !== 'ganho' && l.etapa !== 'perdido'
const openTask = (t: Tarefa) => t.status !== 'concluida'
const late = (t: Tarefa) => openTask(t) && !!t.prazo && t.prazo < today()

const btn = (col: string, label: string, cls = '', preset?: Record<string, unknown>) =>
  `<button class="btn w ${cls}" data-act="new" data-col="${col}"${preset ? ` data-preset='${esc(JSON.stringify(preset))}'` : ''}>${esc(label)}</button>`

export function renderPainel(): string {
  const t = today(), ws = weekStart(t), we = addDays(ws, 6)
  const abertos = state.leads.filter(openLead)
  const ganhos = state.leads.filter(l => l.etapa === 'ganho')
  const perdidos = state.leads.filter(l => l.etapa === 'perdido')
  const conv = ganhos.length + perdidos.length ? Math.round(ganhos.length / (ganhos.length + perdidos.length) * 100) : null
  const semana = state.atividades.filter(a => a.data >= ws && a.data <= we).length
  const alvo = state.config.metaSemanal
  const tAbertas = state.tarefas.filter(openTask)
  const tLate = state.tarefas.filter(late)

  const kpis = `<div class="grid kpis">
    <div class="kpi m"><span class="lab">Contatos na semana</span><span class="val num">${semana}<small>de ${alvo}</small></span></div>
    <div class="kpi c"><span class="lab">Em aberto no funil</span><span class="val num">${brl(sum(abertos, 'valor'))}</span><span class="sub">${abertos.length} lead${abertos.length !== 1 ? 's' : ''} ativo${abertos.length !== 1 ? 's' : ''}</span></div>
    <div class="kpi p"><span class="lab">Tarefas abertas</span><span class="val num">${tAbertas.length}</span><span class="sub">${tLate.length ? `${tLate.length} com prazo vencido` : 'Nenhuma atrasada'}</span></div>
    <div class="kpi p"><span class="lab">Taxa de conversão</span><span class="val num">${conv == null ? '—' : conv + '%'}</span><span class="sub">${ganhos.length} ganhos, ${perdidos.length} perdidos</span></div>
  </div>`

  const metasTop = [...state.metas].sort((a, b) => (a.prazo ?? '9999').localeCompare(b.prazo ?? '9999')).slice(0, 5)
  const metasHtml = metasTop.length ? metasTop.map(m => {
    const p = m.alvo > 0 ? Math.min(100, Math.round(m.atual / m.alvo * 100)) : 0
    return `<div class="prow"><div class="top"><span>${esc(m.titulo)}</span><span class="num">${p}%</span></div><div class="bar"><span style="width:${p}%"></span></div></div>`
  }).join('') : '<div class="empty">Nenhuma meta cadastrada ainda.</div>'

  const ETAPAS: Array<[string, string, string]> = [['novo','Novo','--blue'],['contato','Em contato','--cyan'],['proposta','Proposta','--violet'],['negociacao','Negociação','--magenta'],['ganho','Ganho','--ok']]
  const maxE = Math.max(1, ...ETAPAS.map(e => state.leads.filter(l => l.etapa === e[0]).length))
  const funil = ETAPAS.map(([etapa, label, color]) => {
    const ls = state.leads.filter(l => l.etapa === etapa)
    return `<div class="frow"><span>${label}</span><div class="track"><span style="width:${ls.length/maxE*100}%;background:var(${color})"></span></div><span class="n num">${ls.length}<small>${brl(sum(ls, 'valor'))}</small></span></div>`
  }).join('')

  const hoje = [
    ...state.tarefas.filter(x => openTask(x) && x.prazo && x.prazo <= t).map(x => ({ col: 'tarefas', id: x.id, titulo: x.titulo, quando: x.prazo!, tipo: 'Tarefa' })),
    ...abertos.filter(l => l.proximo_contato && l.proximo_contato <= t).map(l => ({ col: 'leads', id: l.id, titulo: `Retornar para ${l.nome}`, quando: l.proximo_contato!, tipo: 'Lead' })),
  ].sort((a, b) => a.quando.localeCompare(b.quando))

  const hojeHtml = hoje.length ? `<div class="list">${hoje.map(h =>
    `<div class="row"><button class="rowbtn" data-act="edit" data-col="${h.col}" data-id="${esc(h.id)}"><span class="t"><strong>${esc(h.titulo)}</strong><span>${h.tipo}</span></span></button><span class="chip ${h.quando < t ? 'late' : ''}">${h.quando < t ? 'Venceu ' + fmtDate(h.quando) : 'Hoje'}</span></div>`
  ).join('')}</div>` : '<div class="empty">Nada pendente para hoje.</div>'

  const d0 = new Date(ws + 'T00:00:00'), d1 = new Date(we + 'T00:00:00')
  const periodo = `Semana de ${d0.getDate()} a ${d1.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })}`

  return `<div class="head"><div><h1>Painel</h1><p>${esc(periodo)}</p></div><div class="actions">${btn('atividades','Registrar contato','cyan')}${btn('tarefas','Nova tarefa')}${btn('leads','Novo lead','primary')}</div></div>
  <div class="stack">${kpis}
    <div class="grid two">
      <section class="card"><header><h2>Prospecção e leads novos</h2><div class="legend"><span><i style="background:var(--cyan)"></i>Contatos</span><span><i style="background:var(--magenta)"></i>Leads novos</span></div></header><div class="chart"><canvas id="cLinha"></canvas></div></section>
      <section class="card"><header><h2>Progresso das metas</h2><a class="btn small ghost" href="#metas">Ver todas</a></header>${metasHtml}</section>
    </div>
    <div class="grid three">
      <section class="card"><header><h2>Funil de vendas</h2></header><div class="funnel">${funil}</div></section>
      <section class="card"><header><h2>Leads por origem</h2></header><div class="chart sm"><canvas id="cOrigem"></canvas></div><div class="legend" id="lgOrigem" style="margin-top:12px"></div></section>
      <section class="card"><header><h2>Tarefas por dia da semana</h2><span class="muted" style="font-size:.8rem">Últimos 30 dias</span></header><div class="chart sm"><canvas id="cDias"></canvas></div></section>
    </div>
    <section class="card"><header><h2>Para hoje</h2></header>${hojeHtml}</section>
  </div>`
}

declare const Chart: { new(el: HTMLCanvasElement, cfg: unknown): { destroy(): void }; defaults: Record<string, unknown> }
let _charts: Array<{ destroy(): void }> = []

export function drawCharts(): void {
  _charts.forEach(c => c.destroy()); _charts = []
  if (typeof Chart === 'undefined') return
  const cv = (n: string) => getComputedStyle(document.documentElement).getPropertyValue(n).trim()
  const C = { text: cv('--text'), muted: cv('--muted'), line: cv('--line'), cyan: cv('--cyan'), magenta: cv('--magenta'), violet: cv('--violet'), blue: cv('--blue'), pink: cv('--pink'), warn: cv('--warn'), faint: cv('--faint'), surface: cv('--surface'), s2: cv('--surface-2') }
  ;(Chart.defaults as Record<string, unknown>)['font'] = { family: cv('--body') }
  ;(Chart.defaults as Record<string, unknown>)['color'] = C.muted
  ;(Chart.defaults as Record<string, unknown>)['borderColor'] = C.line
  const tip = { backgroundColor: C.s2, titleColor: C.text, bodyColor: C.text, borderColor: C.line, borderWidth: 1, padding: 10, cornerRadius: 8 }
  const pad = (n: number) => String(n).padStart(2, '0')
  const addDaysL = (s: string, n: number) => { const d = new Date(s + 'T00:00:00'); d.setDate(d.getDate() + n); return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}` }
  const ws = weekStart(today()), semanas: string[] = []
  for (let i = 7; i >= 0; i--) semanas.push(addDaysL(ws, -7 * i))
  const bucket = (arr: Array<{ data?: string; criado_em?: string }>, key: 'data' | 'criado_em') => semanas.map(s => arr.filter(x => { const v = x[key]; return v && v >= s && v <= addDaysL(s, 6) }).length)

  const el = document.getElementById('cLinha') as HTMLCanvasElement | null
  if (el) {
    const vg = (ctx: { chart: { chartArea: { top: number; bottom: number }; ctx: CanvasRenderingContext2D } }, a: string, b: string) => { const { chartArea: ar, ctx: c } = ctx.chart; if (!ar) return a; const g = c.createLinearGradient(0, ar.top, 0, ar.bottom); g.addColorStop(0, a); g.addColorStop(1, b); return g }
    _charts.push(new Chart(el, { type: 'line', data: { labels: semanas.map(s => { const d = new Date(s + 'T00:00:00'); return pad(d.getDate()) + '/' + pad(d.getMonth()+1) }), datasets: [{ label: 'Contatos', data: bucket(state.atividades, 'data'), borderColor: C.cyan, borderWidth: 2.5, tension: .4, pointRadius: 3, fill: true, backgroundColor: (ctx: unknown) => vg(ctx as never, C.cyan + '55', C.cyan + '00') }, { label: 'Leads novos', data: bucket(state.leads, 'criado_em'), borderColor: C.magenta, borderWidth: 2.5, borderDash: [3,5], tension: .4, pointRadius: 3 }] }, options: { maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { ...tip, callbacks: { title: (i: Array<{ label: string }>) => 'Semana de ' + i[0].label } } }, scales: { x: { grid: { display: false } }, y: { beginAtZero: true, ticks: { precision: 0 } } } } }))
  }

  const oriEl = document.getElementById('cOrigem') as HTMLCanvasElement | null
  if (oriEl) {
    const ORIGENS = ['Indicação','Prospecção ativa','WhatsApp','Site','Instagram','Evento','Outro']
    const cores = [C.cyan, C.blue, C.violet, C.magenta, C.pink, C.warn, C.faint]
    const orig = ORIGENS.map((o, i) => ({ nome: o, n: state.leads.filter(l => (l.origem ?? 'Outro') === o).length, cor: cores[i] })).filter(o => o.n)
    if (orig.length) {
      _charts.push(new Chart(oriEl, { type: 'doughnut', data: { labels: orig.map(o => o.nome), datasets: [{ data: orig.map(o => o.n), backgroundColor: orig.map(o => o.cor), borderColor: C.surface, borderWidth: 3 }] }, options: { maintainAspectRatio: false, cutout: '68%', plugins: { legend: { display: false }, tooltip: tip } } }))
      const lg = document.getElementById('lgOrigem')
      if (lg) lg.innerHTML = orig.map(o => `<span><i style="background:${o.cor}"></i>${esc(o.nome)}<b>${o.n}</b></span>`).join('')
    }
  }

  const diasEl = document.getElementById('cDias') as HTMLCanvasElement | null
  if (diasEl) {
    const desde = addDaysL(today(), -30), dias = [0,0,0,0,0,0,0]
    state.tarefas.forEach(x => { if (x.concluida_em && x.concluida_em >= desde) dias[(new Date(x.concluida_em + 'T00:00:00').getDay() + 6) % 7]++ })
    const vg2 = (ctx: { chart: { chartArea: { top: number; bottom: number }; ctx: CanvasRenderingContext2D } }) => { const { chartArea: ar, ctx: c } = ctx.chart; if (!ar) return C.cyan; const g = c.createLinearGradient(0, ar.top, 0, ar.bottom); g.addColorStop(0, C.cyan); g.addColorStop(1, C.violet); return g }
    _charts.push(new Chart(diasEl, { type: 'bar', data: { labels: ['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'], datasets: [{ label: 'Concluídas', data: dias, borderRadius: 6, maxBarThickness: 26, backgroundColor: (ctx: unknown) => vg2(ctx as never) }] }, options: { maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: tip }, scales: { x: { grid: { display: false } }, y: { beginAtZero: true, ticks: { precision: 0 } } } } }))
  }
}

import { state, setView, notify, subscribe } from './state/store'
import { checkSession } from './api/auth'
import { getObjetivos } from './api/objetivos'
import { getMetas } from './api/metas'
import { getTarefas } from './api/tarefas'
import { getLeads } from './api/leads'
import { getClientes } from './api/clientes'
import { getAtividades } from './api/atividades'
import { getEventos } from './api/eventos'
import { renderNav } from './components/nav'
import { renderPainel, drawCharts } from './components/painel'
import { renderMetas } from './components/metas'
import { renderTarefas } from './components/tarefas'
import { renderLeads } from './components/leads'
import { renderClientes } from './components/clientes'
import { renderProspeccao } from './components/prospeccao'
import { renderEventos } from './components/eventos'
import { initForms } from './components/forms'
import type { View } from './types'

const VIEWS: Record<View, () => string> = {
  painel: renderPainel,
  metas: renderMetas,
  tarefas: renderTarefas,
  leads: renderLeads,
  clientes: renderClientes,
  prospeccao: renderProspeccao,
  eventos: renderEventos,
}

async function loadAllData(): Promise<void> {
  const [objetivos, metas, tarefas, leads, clientes, atividades, eventos] = await Promise.all([
    getObjetivos(),
    getMetas(),
    getTarefas(),
    getLeads(),
    getClientes(),
    getAtividades(),
    getEventos(),
  ])
  state.objetivos = objetivos
  state.metas = metas
  state.tarefas = tarefas
  state.leads = leads
  state.clientes = clientes
  state.atividades = atividades
  state.eventos = eventos
  state.ready = true
}

function render(): void {
  const nav = document.getElementById('nav')!
  const main = document.getElementById('view')!
  const scrollY = window.scrollY

  nav.innerHTML = renderNav()
  main.innerHTML = VIEWS[state.view]()

  window.scrollTo(0, scrollY)
  if (state.view === 'painel') drawCharts()
}

function route(): void {
  const hash = location.hash.slice(1) as View
  const view = hash in VIEWS ? hash : 'painel'
  if (state.view !== view) state.view = view
  render()
}

async function init(): Promise<void> {
  const authenticated = await checkSession()
  if (!authenticated) { window.location.href = '/login.html'; return }

  const main = document.getElementById('view')!
  main.innerHTML = '<div style="padding:40px;color:var(--muted)">Carregando…</div>'

  try {
    await loadAllData()
  } catch {
    main.innerHTML = '<div style="padding:40px;color:var(--danger)">Erro ao carregar dados. Recarregue a página.</div>'
    return
  }

  route()
  window.addEventListener('hashchange', route)
  subscribe(render)

  initForms()

  new MutationObserver(render).observe(document.documentElement, {
    attributes: true, attributeFilter: ['data-theme'],
  })
}

init()

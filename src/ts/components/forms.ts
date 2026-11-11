import { state, notify } from '../state/store'
import { createObjetivo, updateObjetivo, deleteObjetivo } from '../api/objetivos'
import { createMeta, updateMeta, deleteMeta } from '../api/metas'
import { createTarefa, updateTarefa, deleteTarefa } from '../api/tarefas'
import { createLead, updateLead, deleteLead, leadVirouCliente } from '../api/leads'
import { createCliente, updateCliente, deleteCliente } from '../api/clientes'
import { createAtividade, updateAtividade, deleteAtividade } from '../api/atividades'
import { createEvento, updateEvento, deleteEvento } from '../api/eventos'
import type { View } from '../types'

const esc = (s: unknown) => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!))

function toast(msg: string): void {
  document.querySelector('.toast')?.remove()
  const t = document.createElement('div')
  t.className = 'toast'; t.setAttribute('role', 'status'); t.textContent = msg
  document.body.appendChild(t); setTimeout(() => t.remove(), 4000)
}

type FieldDef = { key: string; label: string; type: 'text' | 'number' | 'date' | 'textarea' | 'select'; required?: boolean; half?: boolean; options?: Array<[string, string]> | (() => Array<[string, string]>); placeholder?: string; default?: string | number | (() => string) }

const FORMS: Record<string, { title: string; fields: FieldDef[] }> = {
  objetivos: { title: 'Objetivo', fields: [
    { key: 'titulo', label: 'Objetivo', type: 'text', required: true, placeholder: 'Ex.: Dobrar a carteira de clientes PME' },
    { key: 'descricao', label: 'Por que isso importa', type: 'textarea' },
    { key: 'prazo', label: 'Prazo', type: 'date' },
  ]},
  metas: { title: 'Meta', fields: [
    { key: 'titulo', label: 'Meta', type: 'text', required: true },
    { key: 'objetivo_id', label: 'Objetivo ligado', type: 'select', options: () => [['', 'Sem objetivo'], ...state.objetivos.map(o => [o.id, o.titulo])] as Array<[string,string]> },
    { key: 'alvo', label: 'Valor alvo', type: 'number', required: true, half: true },
    { key: 'atual', label: 'Valor atual', type: 'number', half: true },
    { key: 'unidade', label: 'Unidade', type: 'text', half: true, placeholder: 'contratos, R$…' },
    { key: 'prazo', label: 'Prazo', type: 'date', half: true },
  ]},
  tarefas: { title: 'Tarefa', fields: [
    { key: 'titulo', label: 'Tarefa', type: 'text', required: true },
    { key: 'meta_id', label: 'Meta ligada', type: 'select', options: () => [['', 'Nenhuma'], ...state.metas.map(m => [m.id, m.titulo])] as Array<[string,string]> },
    { key: 'prioridade', label: 'Prioridade', type: 'select', half: true, default: 'media', options: [['alta','Alta'],['media','Média'],['baixa','Baixa']] },
    { key: 'status', label: 'Situação', type: 'select', half: true, default: 'afazer', options: [['afazer','A fazer'],['andamento','Em andamento'],['concluida','Concluída']] },
    { key: 'prazo', label: 'Prazo', type: 'date' },
    { key: 'notas', label: 'Anotações', type: 'textarea' },
  ]},
  leads: { title: 'Lead', fields: [
    { key: 'nome', label: 'Nome do contato', type: 'text', required: true, half: true },
    { key: 'empresa', label: 'Empresa', type: 'text', half: true },
    { key: 'telefone', label: 'Telefone ou WhatsApp', type: 'text', half: true },
    { key: 'email', label: 'E-mail', type: 'text', half: true },
    { key: 'origem', label: 'Origem', type: 'select', half: true, default: 'Indicação', options: [['Indicação','Indicação'],['Prospecção ativa','Prospecção ativa'],['WhatsApp','WhatsApp'],['Site','Site'],['Instagram','Instagram'],['Evento','Evento'],['Outro','Outro']] },
    { key: 'etapa', label: 'Etapa', type: 'select', half: true, default: 'novo', options: [['novo','Novo'],['contato','Em contato'],['proposta','Proposta'],['negociacao','Negociação'],['ganho','Ganho'],['perdido','Perdido']] },
    { key: 'interesse', label: 'Interesse', type: 'text', placeholder: 'Ex.: Plano de saúde PME, 14 vidas' },
    { key: 'valor', label: 'Valor estimado (R$)', type: 'number', half: true },
    { key: 'proximo_contato', label: 'Próximo contato', type: 'date', half: true },
    { key: 'notas', label: 'Anotações', type: 'textarea' },
  ]},
  clientes: { title: 'Cliente', fields: [
    { key: 'nome', label: 'Nome', type: 'text', required: true, half: true },
    { key: 'empresa', label: 'Empresa', type: 'text', half: true },
    { key: 'cpf_cnpj', label: 'CPF / CNPJ', type: 'text', half: true },
    { key: 'telefone', label: 'Telefone', type: 'text', half: true },
    { key: 'email', label: 'E-mail', type: 'text', half: true },
    { key: 'produto_contratado', label: 'Produto contratado', type: 'text', half: true },
    { key: 'valor_contrato', label: 'Valor do contrato (R$)', type: 'number', half: true },
    { key: 'data_inicio', label: 'Início do contrato', type: 'date', half: true },
    { key: 'data_renovacao', label: 'Renovação', type: 'date', half: true },
    { key: 'status', label: 'Situação', type: 'select', half: true, default: 'ativo', options: [['ativo','Ativo'],['inativo','Inativo'],['em_renovacao','Em renovação']] },
    { key: 'notas', label: 'Anotações', type: 'textarea' },
  ]},
  atividades: { title: 'Contato', fields: [
    { key: 'data', label: 'Data', type: 'date', required: true, half: true, default: () => new Date().toISOString().slice(0,10) },
    { key: 'tipo', label: 'Tipo', type: 'select', half: true, default: 'Ligação', options: [['Ligação','Ligação'],['WhatsApp','WhatsApp'],['E-mail','E-mail'],['Reunião','Reunião'],['Visita','Visita']] },
    { key: 'lead_id', label: 'Lead', type: 'select', options: () => [['','Sem lead vinculado'], ...state.leads.map(l => [l.id, l.nome + (l.empresa ? ' · ' + l.empresa : '')])] as Array<[string,string]> },
    { key: 'resultado', label: 'Resultado', type: 'select', default: 'Conversa', options: [['Sem resposta','Sem resposta'],['Conversa','Conversa'],['Reunião marcada','Reunião marcada'],['Proposta enviada','Proposta enviada'],['Fechou','Fechou'],['Sem interesse','Sem interesse']] },
    { key: 'nota', label: 'Anotação', type: 'textarea' },
  ]},
  eventos: { title: 'Evento', fields: [
    { key: 'titulo', label: 'Título', type: 'text', required: true },
    { key: 'tipo', label: 'Tipo', type: 'select', half: true, default: 'palestra', options: [['palestra','Palestra'],['feira','Feira'],['workshop','Workshop'],['reuniao_grupo','Reunião em grupo'],['outro','Outro']] },
    { key: 'status', label: 'Status', type: 'select', half: true, default: 'planejado', options: [['planejado','Planejado'],['em_andamento','Em andamento'],['concluido','Concluído'],['cancelado','Cancelado']] },
    { key: 'data_inicio', label: 'Data início', type: 'date', half: true },
    { key: 'data_fim', label: 'Data fim', type: 'date', half: true },
    { key: 'local', label: 'Local', type: 'text' },
    { key: 'meta_participantes', label: 'Meta de participantes', type: 'number', half: true },
    { key: 'participantes_confirmados', label: 'Confirmados', type: 'number', half: true },
    { key: 'descricao', label: 'Descrição', type: 'textarea' },
    { key: 'resultado', label: 'Resultado', type: 'textarea' },
  ]},
}

const API = {
  objetivos: { create: createObjetivo, update: updateObjetivo, delete: deleteObjetivo },
  metas:     { create: createMeta,     update: updateMeta,     delete: deleteMeta },
  tarefas:   { create: createTarefa,   update: updateTarefa,   delete: deleteTarefa },
  leads:     { create: createLead,     update: updateLead,     delete: deleteLead },
  clientes:  { create: createCliente,  update: updateCliente,  delete: deleteCliente },
  atividades:{ create: createAtividade,update: updateAtividade,delete: deleteAtividade },
  eventos:   { create: createEvento,   update: updateEvento,   delete: deleteEvento },
}

type Col = keyof typeof API

function buildField(f: FieldDef, currentValue: unknown): string {
  const id = `f_${f.key}`
  const v = currentValue ?? (typeof f.default === 'function' ? (f.default as () => string)() : (f.default ?? ''))
  let ctl = ''
  if (f.type === 'textarea') {
    ctl = `<textarea id="${id}" name="${f.key}">${esc(v)}</textarea>`
  } else if (f.type === 'select') {
    const opts = (typeof f.options === 'function' ? (f.options as () => Array<[string,string]>)() : f.options ?? [])
    ctl = `<select id="${id}" name="${f.key}">${opts.map(([val, label]) => `<option value="${esc(val)}"${String(val) === String(v) ? ' selected' : ''}>${esc(label)}</option>`).join('')}</select>`
  } else {
    ctl = `<input id="${id}" name="${f.key}" type="${f.type}"${f.type === 'number' ? ' step="any" min="0" inputmode="decimal"' : ''} value="${esc(v)}"${f.placeholder ? ` placeholder="${esc(f.placeholder)}"` : ''}${f.required ? ' required' : ''}>`
  }
  return `<div class="field"><label for="${id}">${esc(f.label)}</label>${ctl}</div>`
}

export function openForm(col: Col, id?: string, preset?: Record<string, unknown>): void {
  const def = FORMS[col]
  const item = id ? (state[col] as unknown as Array<Record<string, unknown>>).find(x => x.id === id) : undefined
  const dlg = document.getElementById('dlg') as HTMLDialogElement

  let html = '', buf: string[] = []
  const flush = () => { if (buf.length) { html += buf.length > 1 ? `<div class="pair">${buf.join('')}</div>` : buf[0]; buf = [] } }

  for (const f of def.fields) {
    const val = item?.[f.key] ?? preset?.[f.key]
    const field = buildField(f, val)
    if (f.half) { buf.push(field); if (buf.length === 2) flush() } else { flush(); html += field }
  }
  flush()

  const canDel = !!id
  dlg.innerHTML = `<form><h2>${id ? 'Editar' : 'Novo'} ${def.title}</h2>${html}<div class="form-foot"><div>${canDel ? `<button type="button" class="btn danger w" id="delBtn">Excluir</button>` : ''}</div><div><button type="button" class="btn ghost" id="cancelBtn">Cancelar</button><button class="btn primary w" type="submit">Salvar</button></div></div></form>`

  const form = dlg.querySelector('form')!
  dlg.querySelector('#cancelBtn')?.addEventListener('click', () => dlg.close())

  const delBtn = dlg.querySelector('#delBtn')
  if (delBtn) {
    let confirmed = false
    delBtn.addEventListener('click', async () => {
      if (!confirmed) { confirmed = true; delBtn.textContent = 'Confirmar exclusão'; return }
      await (API[col].delete as (id: string) => Promise<void>)(id!);
      (state[col] as Array<{ id: string }>).splice((state[col] as Array<{ id: string }>).findIndex(x => x.id === id!), 1)
      dlg.close(); toast('Excluído.'); notify()
    })
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault()
    const data: Record<string, unknown> = {}
    for (const f of def.fields) {
      const el = form.elements.namedItem(f.key) as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      data[f.key] = f.type === 'number' ? (el.value === '' ? null : Number(el.value)) : el.value.trim() || null
    }
    const submitBtn = form.querySelector('button[type="submit"]') as HTMLButtonElement
    submitBtn.disabled = true
    try {
      if (id) {
        const updated = await (API[col].update as unknown as (id: string, body: Record<string, unknown>) => Promise<Record<string, unknown>>)(id, data)
        const idx = (state[col] as unknown as Array<{ id: string }>).findIndex(x => x.id === id)
        if (idx >= 0) (state[col] as unknown as Array<Record<string, unknown>>)[idx] = updated
      } else {
        const created = await (API[col].create as unknown as (body: Record<string, unknown>) => Promise<Record<string, unknown>>)(data)
        ;(state[col] as unknown as Array<Record<string, unknown>>).push(created)
      }
      dlg.close(); toast('Salvo.'); notify()
    } catch (err) {
      toast(`Erro: ${(err as Error).message}`)
    } finally {
      submitBtn.disabled = false
    }
  })

  dlg.showModal()
}

export function initForms(): void {
  document.addEventListener('click', async (e) => {
    const btn = (e.target as Element).closest<HTMLElement>('[data-act]')
    if (!btn) return
    const act = btn.dataset.act
    const col = btn.dataset.col as Col | undefined
    const id = btn.dataset.id

    if (act === 'new' && col) {
      const preset = btn.dataset.preset ? JSON.parse(btn.dataset.preset) : undefined
      openForm(col, undefined, preset)
    } else if (act === 'edit' && col && id) {
      openForm(col, id)
    } else if (act === 'virou-cliente' && id) {
      btn.setAttribute('disabled', '')
      try {
        const cliente = await leadVirouCliente(id) as Record<string, unknown>
        const lead = state.leads.find(l => l.id === id)
        if (lead) lead.virou_cliente = true
        state.clientes.push(cliente as never)
        toast('Lead convertido em cliente!')
        notify()
      } catch (err) {
        toast(`Erro: ${(err as Error).message}`)
      } finally {
        btn.removeAttribute('disabled')
      }
    } else if (act === 'toggle-tarefa' && id) {
      const t = state.tarefas.find(x => x.id === id)
      if (!t) return
      const novoStatus = t.status === 'concluida' ? 'afazer' : 'concluida'
      const updated = await updateTarefa(id, { status: novoStatus })
      const idx = state.tarefas.findIndex(x => x.id === id)
      if (idx >= 0) state.tarefas[idx] = updated
      notify()
    } else if (act === 'move-lead') {
      const etapa = btn.dataset.etapa as never
      const lead = state.leads.find(l => l.id === id)
      if (!lead || lead.etapa === etapa) return
      const updated = await updateLead(id!, { etapa })
      const idx = state.leads.findIndex(l => l.id === id)
      if (idx >= 0) state.leads[idx] = updated
      notify()
    } else if (act === 'filter-tarefa' && id) {
      state.taskFilter = id as never
      notify()
    } else if (act === 'filter-cliente' && id) {
      ;(window as never as { _clienteTab: string })._clienteTab = id
      notify()
    } else if (act === 'filter-evento' && id) {
      ;(window as never as { _eventoTab: string })._eventoTab = id
      notify()
    } else if (act === 'logout') {
      await fetch('/api/auth/logout', { method: 'POST' })
      window.location.href = '/login.html'
    }
  })

  document.addEventListener('change', async (e) => {
    const sel = (e.target as Element).closest<HTMLSelectElement>('[data-move]')
    if (!sel) return
    const id = sel.dataset.move!
    const etapa = sel.value as never
    const lead = state.leads.find(l => l.id === id)
    if (!lead || lead.etapa === etapa) return
    const updated = await updateLead(id, { etapa })
    const idx = state.leads.findIndex(l => l.id === id)
    if (idx >= 0) state.leads[idx] = updated
    notify()
  })

  document.addEventListener('dragstart', (e) => {
    const c = (e.target as Element).closest<HTMLElement>('[data-lead]')
    if (c) (e as DragEvent).dataTransfer?.setData('text/plain', c.dataset.lead!)
  })
  document.addEventListener('dragover', (e) => {
    const c = (e.target as Element).closest<HTMLElement>('[data-etapa]')
    if (c) { e.preventDefault(); c.classList.add('over') }
  })
  document.addEventListener('dragleave', (e) => {
    const c = (e.target as Element).closest<HTMLElement>('[data-etapa]')
    if (c && !c.contains(e.relatedTarget as Node)) c.classList.remove('over')
  })
  document.addEventListener('drop', async (e) => {
    const c = (e.target as Element).closest<HTMLElement>('[data-etapa]')
    if (!c) return
    e.preventDefault(); c.classList.remove('over')
    const id = (e as DragEvent).dataTransfer?.getData('text/plain')
    if (!id) return
    const etapa = c.dataset.etapa as never
    const lead = state.leads.find(l => l.id === id)
    if (!lead || lead.etapa === etapa) return
    const updated = await updateLead(id, { etapa })
    const idx = state.leads.findIndex(l => l.id === id)
    if (idx >= 0) state.leads[idx] = updated
    notify()
  })
}

export type Prioridade = 'alta' | 'media' | 'baixa'
export type StatusTarefa = 'afazer' | 'andamento' | 'concluida'
export type EtapaLead = 'novo' | 'contato' | 'proposta' | 'negociacao' | 'ganho' | 'perdido'
export type StatusCliente = 'ativo' | 'inativo' | 'em_renovacao'
export type TipoAtividade = 'Ligação' | 'WhatsApp' | 'E-mail' | 'Reunião' | 'Visita'
export type TipoEvento = 'palestra' | 'feira' | 'workshop' | 'reuniao_grupo' | 'outro'
export type StatusEvento = 'planejado' | 'em_andamento' | 'concluido' | 'cancelado'
export type View = 'painel' | 'metas' | 'tarefas' | 'leads' | 'clientes' | 'prospeccao' | 'eventos'
export type TaskFilter = 'abertas' | 'hoje' | 'atrasadas' | 'concluidas'

export interface Objetivo {
  id: string
  titulo: string
  descricao?: string
  prazo?: string
  criado_em: string
}

export interface Meta {
  id: string
  objetivo_id?: string
  titulo: string
  alvo: number
  atual: number
  unidade?: string
  prazo?: string
  criado_em: string
}

export interface Tarefa {
  id: string
  meta_id?: string
  titulo: string
  prioridade: Prioridade
  status: StatusTarefa
  prazo?: string
  notas?: string
  criado_em: string
  concluida_em?: string
}

export interface Lead {
  id: string
  nome: string
  empresa?: string
  telefone?: string
  email?: string
  origem?: string
  etapa: EtapaLead
  interesse?: string
  valor?: number
  proximo_contato?: string
  notas?: string
  criado_em: string
  fechado_em?: string
  virou_cliente: boolean
}

export interface Cliente {
  id: string
  lead_id?: string
  nome: string
  empresa?: string
  cpf_cnpj?: string
  telefone?: string
  email?: string
  produto_contratado?: string
  valor_contrato?: number
  data_inicio?: string
  data_renovacao?: string
  status: StatusCliente
  notas?: string
  criado_em: string
}

export interface Atividade {
  id: string
  lead_id?: string
  data: string
  tipo: TipoAtividade
  resultado?: string
  nota?: string
  criado_em: string
}

export interface Evento {
  id: string
  titulo: string
  tipo?: TipoEvento
  data_inicio?: string
  data_fim?: string
  local?: string
  descricao?: string
  meta_participantes?: number
  participantes_confirmados: number
  status: StatusEvento
  resultado?: string
  notas?: string
  criado_em: string
}

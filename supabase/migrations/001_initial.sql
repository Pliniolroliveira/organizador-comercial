-- Organizador Comercial — Migration inicial
-- Execute no SQL Editor do Supabase

-- Objetivos
CREATE TABLE IF NOT EXISTS objetivos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  titulo text NOT NULL,
  descricao text,
  prazo date,
  criado_em date NOT NULL DEFAULT CURRENT_DATE
);
ALTER TABLE objetivos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "usuario ve apenas seus dados" ON objetivos FOR ALL USING (auth.uid() = user_id);

-- Metas
CREATE TABLE IF NOT EXISTS metas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  objetivo_id uuid REFERENCES objetivos(id) ON DELETE SET NULL,
  titulo text NOT NULL,
  alvo numeric NOT NULL,
  atual numeric NOT NULL DEFAULT 0,
  unidade text,
  prazo date,
  criado_em date NOT NULL DEFAULT CURRENT_DATE
);
ALTER TABLE metas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "usuario ve apenas seus dados" ON metas FOR ALL USING (auth.uid() = user_id);

-- Tarefas
CREATE TABLE IF NOT EXISTS tarefas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  meta_id uuid REFERENCES metas(id) ON DELETE SET NULL,
  titulo text NOT NULL,
  prioridade text CHECK (prioridade IN ('alta','media','baixa')) DEFAULT 'media',
  status text CHECK (status IN ('afazer','andamento','concluida')) DEFAULT 'afazer',
  prazo date,
  notas text,
  criado_em date NOT NULL DEFAULT CURRENT_DATE,
  concluida_em date
);
ALTER TABLE tarefas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "usuario ve apenas seus dados" ON tarefas FOR ALL USING (auth.uid() = user_id);

-- Leads
CREATE TABLE IF NOT EXISTS leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  nome text NOT NULL,
  empresa text,
  telefone text,
  email text,
  origem text,
  etapa text CHECK (etapa IN ('novo','contato','proposta','negociacao','ganho','perdido')) DEFAULT 'novo',
  interesse text,
  valor numeric,
  proximo_contato date,
  notas text,
  criado_em date NOT NULL DEFAULT CURRENT_DATE,
  fechado_em date,
  virou_cliente boolean DEFAULT false
);
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "usuario ve apenas seus dados" ON leads FOR ALL USING (auth.uid() = user_id);

-- Clientes
CREATE TABLE IF NOT EXISTS clientes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  lead_id uuid REFERENCES leads(id) ON DELETE SET NULL,
  nome text NOT NULL,
  empresa text,
  cpf_cnpj text,
  telefone text,
  email text,
  produto_contratado text,
  valor_contrato numeric,
  data_inicio date,
  data_renovacao date,
  status text CHECK (status IN ('ativo','inativo','em_renovacao')) DEFAULT 'ativo',
  notas text,
  criado_em date NOT NULL DEFAULT CURRENT_DATE
);
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "usuario ve apenas seus dados" ON clientes FOR ALL USING (auth.uid() = user_id);

-- Atividades
CREATE TABLE IF NOT EXISTS atividades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  lead_id uuid REFERENCES leads(id) ON DELETE SET NULL,
  data date NOT NULL,
  tipo text CHECK (tipo IN ('Ligação','WhatsApp','E-mail','Reunião','Visita')),
  resultado text,
  nota text,
  criado_em date NOT NULL DEFAULT CURRENT_DATE
);
ALTER TABLE atividades ENABLE ROW LEVEL SECURITY;
CREATE POLICY "usuario ve apenas seus dados" ON atividades FOR ALL USING (auth.uid() = user_id);

-- Eventos
CREATE TABLE IF NOT EXISTS eventos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  titulo text NOT NULL,
  tipo text CHECK (tipo IN ('palestra','feira','workshop','reuniao_grupo','outro')),
  data_inicio date,
  data_fim date,
  local text,
  descricao text,
  meta_participantes integer,
  participantes_confirmados integer DEFAULT 0,
  status text CHECK (status IN ('planejado','em_andamento','concluido','cancelado')) DEFAULT 'planejado',
  resultado text,
  notas text,
  criado_em date NOT NULL DEFAULT CURRENT_DATE
);
ALTER TABLE eventos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "usuario ve apenas seus dados" ON eventos FOR ALL USING (auth.uid() = user_id);

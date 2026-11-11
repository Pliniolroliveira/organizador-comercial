# Organizador Comercial — Design Spec

**Data:** 2026-11-11  
**Stack:** Vite + TypeScript + Node.js (Vercel Serverless) + Supabase  
**Deploy:** Vercel (frontend + API) + Supabase (banco)  
**Usuários:** único (uso pessoal, dados de clientes protegidos por LGPD)

---

## 1. Visão Geral

Migração do Organizador Comercial de um arquivo HTML único para uma aplicação full-stack com:
- Frontend TypeScript + HTML + CSS compilado via Vite
- Backend Node.js como Vercel Serverless Functions
- Banco PostgreSQL no Supabase com autenticação e Row Level Security
- Arquitetura extensível: adicionar seções, campos e rotas sem reescrever código existente

---

## 2. Estrutura do Projeto

```
organizador-comercial/
├── src/
│   ├── index.html
│   ├── login.html
│   ├── styles/
│   │   ├── base.css          # reset, variáveis CSS, tipografia
│   │   ├── layout.css        # grid, sidebar, main content
│   │   ├── components.css    # cards, botões, forms, chips, kanban
│   │   ├── charts.css        # containers de gráficos
│   │   └── themes.css        # dark/light tokens
│   └── ts/
│       ├── main.ts            # entry point: init, roteamento por hash
│       ├── types/
│       │   └── index.ts       # todas as interfaces TypeScript
│       ├── state/
│       │   └── store.ts       # estado central em memória
│       ├── api/
│       │   ├── auth.ts
│       │   ├── leads.ts
│       │   ├── clientes.ts
│       │   ├── tarefas.ts
│       │   ├── metas.ts
│       │   ├── objetivos.ts
│       │   ├── atividades.ts
│       │   └── eventos.ts
│       └── components/
│           ├── nav.ts
│           ├── painel.ts
│           ├── metas.ts
│           ├── tarefas.ts
│           ├── leads.ts
│           ├── clientes.ts
│           ├── prospeccao.ts
│           ├── eventos.ts
│           └── forms.ts
├── api/                        # Vercel Serverless Functions
│   ├── auth/
│   │   ├── login.ts
│   │   ├── logout.ts
│   │   └── session.ts
│   ├── leads/
│   │   ├── index.ts            # GET, POST
│   │   ├── [id].ts             # PUT, DELETE
│   │   └── [id]/virou-cliente.ts
│   ├── clientes/
│   │   ├── index.ts
│   │   └── [id].ts
│   ├── tarefas/
│   │   ├── index.ts
│   │   └── [id].ts
│   ├── metas/
│   │   ├── index.ts
│   │   └── [id].ts
│   ├── objetivos/
│   │   ├── index.ts
│   │   └── [id].ts
│   ├── atividades/
│   │   ├── index.ts
│   │   └── [id].ts
│   └── eventos/
│       ├── index.ts
│       └── [id].ts
├── lib/                        # utilitários compartilhados (server-side)
│   ├── supabase.ts             # cliente Supabase com service role key
│   ├── auth.ts                 # validação de cookie/JWT
│   └── handler.ts              # wrapper de rota: valida sessão + trata erros
├── vite.config.ts
├── tsconfig.json
├── tsconfig.node.json
├── vercel.json
└── .env.local                  # nunca commitado
```

---

## 3. Autenticação

**Fluxo:**
1. Usuário acessa `/login.html`, digita email + senha
2. `POST /api/auth/login` valida com Supabase Auth
3. Em sucesso: servidor seta cookie `httpOnly; Secure; SameSite=Strict` com o JWT
4. Toda API route usa `lib/auth.ts` para validar o cookie antes de qualquer operação
5. Cookie inválido ou ausente → `401` → frontend redireciona para `/login.html`
6. `POST /api/auth/logout` limpa o cookie

**Segurança do cookie:**
```
Set-Cookie: session=<jwt>; HttpOnly; Secure; SameSite=Strict; Path=/api; Max-Age=86400
```

**Wrapper de rota (`lib/handler.ts`):**
Toda API route é envolta neste handler, que:
- Valida o cookie e extrai o `user_id`
- Injeta o `user_id` na query para garantir isolamento de dados
- Captura erros e retorna respostas padronizadas

---

## 4. Banco de Dados (Supabase)

### Tabelas

```sql
-- Habilitar RLS em todas as tabelas
ALTER TABLE objetivos ENABLE ROW LEVEL SECURITY;
-- (repetir para todas)

-- Política padrão em todas as tabelas:
CREATE POLICY "usuario ve apenas seus dados" ON <tabela>
  FOR ALL USING (auth.uid() = user_id);

objetivos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  titulo text NOT NULL,
  descricao text,
  prazo date,
  criado_em date NOT NULL DEFAULT CURRENT_DATE
)

metas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  objetivo_id uuid REFERENCES objetivos(id) ON DELETE SET NULL,
  titulo text NOT NULL,
  alvo numeric NOT NULL,
  atual numeric NOT NULL DEFAULT 0,
  unidade text,
  prazo date,
  criado_em date NOT NULL DEFAULT CURRENT_DATE
)

tarefas (
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
)

leads (
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
  virou_cliente boolean DEFAULT false   -- flag: já foi convertido
)

clientes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  lead_id uuid REFERENCES leads(id) ON DELETE SET NULL,  -- origem
  nome text NOT NULL,
  empresa text,
  cpf_cnpj text,          -- armazenado criptografado (pgcrypto)
  telefone text,
  email text,
  produto_contratado text,
  valor_contrato numeric,
  data_inicio date,
  data_renovacao date,
  status text CHECK (status IN ('ativo','inativo','em_renovacao')) DEFAULT 'ativo',
  notas text,
  criado_em date NOT NULL DEFAULT CURRENT_DATE
)

atividades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  lead_id uuid REFERENCES leads(id) ON DELETE SET NULL,
  data date NOT NULL,
  tipo text CHECK (tipo IN ('Ligação','WhatsApp','E-mail','Reunião','Visita')),
  resultado text,
  nota text,
  criado_em date NOT NULL DEFAULT CURRENT_DATE
)

eventos (
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
)
```

### Criptografia de CPF/CNPJ
Usar extensão `pgcrypto` do Supabase para criptografar `cpf_cnpj` em repouso.
A chave de criptografia fica em variável de ambiente no Vercel, nunca no banco.

---

## 5. API Routes

Todas as rotas:
- Requerem cookie de sessão válido (retornam `401` caso contrário)
- Injetam `user_id` automaticamente via `lib/handler.ts`
- Retornam JSON com `{ data }` em sucesso ou `{ error }` em falha

```
POST   /api/auth/login                    login com email + senha
POST   /api/auth/logout                   limpa cookie
GET    /api/auth/session                  verifica sessão ativa

GET    /api/objetivos                     lista todos
POST   /api/objetivos                     cria novo
PUT    /api/objetivos/:id                 atualiza
DELETE /api/objetivos/:id                 remove

GET    /api/metas                         lista todas
POST   /api/metas                         cria nova
PUT    /api/metas/:id                     atualiza
DELETE /api/metas/:id                     remove

GET    /api/tarefas                       lista todas
POST   /api/tarefas                       cria nova
PUT    /api/tarefas/:id                   atualiza (incluindo toggle concluída)
DELETE /api/tarefas/:id                   remove

GET    /api/leads                         lista todos
POST   /api/leads                         cria novo
PUT    /api/leads/:id                     atualiza (etapa, dados)
DELETE /api/leads/:id                     remove
POST   /api/leads/:id/virou-cliente       converte lead em cliente

GET    /api/clientes                      lista todos
POST   /api/clientes                      cria manual
PUT    /api/clientes/:id                  atualiza ficha
DELETE /api/clientes/:id                  remove

GET    /api/atividades                    lista todas
POST   /api/atividades                    registra contato
PUT    /api/atividades/:id                atualiza
DELETE /api/atividades/:id                remove

GET    /api/eventos                       lista todos
POST   /api/eventos                       cria evento
PUT    /api/eventos/:id                   atualiza
DELETE /api/eventos/:id                   remove
```

---

## 6. Frontend (TypeScript)

### Tipos centrais (`src/ts/types/index.ts`)
Interfaces TypeScript para todas as entidades. Mudar um campo aqui → TypeScript aponta todos os lugares a atualizar.

### Store central (`src/ts/state/store.ts`)
Estado em memória. Componentes leem do store, nunca chamam a API diretamente.
Atualização: API client chama rota → atualiza store → re-renderiza componente.

### API clients (`src/ts/api/`)
Uma função por operação, tipadas. Exemplo:
```typescript
// leads.ts
export async function leadVirouCliente(leadId: string): Promise<Cliente>
```

### Componentes (`src/ts/components/`)
Um arquivo por seção do app. Cada um exporta uma função `render()` que retorna HTML string.
Para adicionar uma nova seção: criar arquivo + registrar na nav. Nada mais muda.

### Formulários (`src/ts/components/forms.ts`)
Gerados a partir de configuração (array de campos). Adicionar campo = uma linha no array de configuração.

### Roteamento
Hash-based (`#painel`, `#metas`, `#tarefas`, `#leads`, `#clientes`, `#prospeccao`, `#eventos`).
`main.ts` escuta `hashchange` e chama o componente correto.

---

## 7. Segurança e LGPD

| Camada | Medida |
|---|---|
| Acesso ao sistema | Login obrigatório (Supabase Auth email+senha) |
| Cookie de sessão | `httpOnly; Secure; SameSite=Strict` — não acessível via JS |
| API routes | Validação de sessão em 100% das rotas antes de qualquer query |
| Banco | RLS ativo em todas as tabelas — `user_id = auth.uid()` |
| Credenciais | Chaves Supabase apenas em variáveis de ambiente no Vercel |
| CPF/CNPJ | Criptografado em repouso via pgcrypto |
| Vazamento de dados | RLS garante que nenhuma query retorna dados de outro usuário |
| HTTPS | Vercel força HTTPS em produção por padrão |

---

## 8. Variáveis de Ambiente

```
# .env.local (nunca commitado)
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=xxxx   # server-side apenas (nunca expor ao browser)
SUPABASE_JWT_SECRET=xxxx         # para validar o JWT do Supabase nas API routes
ENCRYPTION_KEY=xxxx              # para criptografar cpf_cnpj
```

---

## 9. Extensibilidade

O sistema foi projetado para crescer sem reescrever:

- **Nova seção:** criar `src/ts/components/nova-secao.ts` + `api/nova-secao/` + tabela no Supabase
- **Novo campo:** adicionar à interface TypeScript + migration SQL + config do formulário
- **Novo filtro/view:** novo item no array de filtros do componente
- **Vincular eventos a leads/clientes no futuro:** criar tabela `evento_participantes` + rota + atualizar componente de eventos — nada mais muda

---

## 10. Deploy

1. Repositório GitHub
2. Conectar ao Vercel (auto-deploy em push para `main`)
3. Variáveis de ambiente configuradas no painel do Vercel
4. Supabase: criar projeto, rodar migrations SQL, habilitar Auth

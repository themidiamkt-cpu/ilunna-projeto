# Ilunna Gestão

Sistema de gestão completo para a Ilunna — marca artesanal de produtos aromáticos.

## Módulos

- **Dashboard** — KPIs, gráficos de evolução, ranking de produtos, alertas
- **Frente de Caixa (PDV)** — abertura, vendas por toque, fechamento de caixa
- **Produtos** — cadastro com ficha técnica, cálculo automático de custo e margem
- **Insumos** — matérias-primas, entrada de estoque, custo unitário automático
- **Produção** — registro de lotes com consumo automático de insumos
- **Estoque** — valorização, alertas de mínimo, histórico de movimentações
- **Vendas** — histórico com detalhamento por venda

## Configuração

### 1. Instalar dependências

```bash
npm install
```

### 2. Variáveis de ambiente

O arquivo `.env.local` já está criado com as credenciais do Supabase. Se precisar atualizar:

```
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-anon-key
```

### 3. Banco de dados (Supabase)

Abra o arquivo `supabase/migrations/000_EXECUTAR_TUDO.sql` e cole o conteúdo inteiro no **Supabase SQL Editor**:

1. Acesse https://supabase.com/dashboard
2. Selecione o projeto **tixzthmbtdkeldhnkujx**
3. Vá em **SQL Editor** > **New query**
4. Copie e cole o conteúdo de `000_EXECUTAR_TUDO.sql`
5. Clique em **Run**

Isso cria todas as tabelas, triggers, views, funções RPC e dados iniciais da Ilunna.

### 4. Criar o primeiro usuário admin

Após rodar o SQL, crie um usuário no Supabase:

1. No painel do Supabase, vá em **Authentication** > **Users**
2. Clique em **Add user** > informe e-mail e senha
3. Copie o UUID do usuário criado
4. No SQL Editor, execute:

```sql
INSERT INTO perfis (usuario_id, nome, papel)
VALUES ('<uuid-do-usuario>', 'Seu Nome', 'admin');
```

### 5. Rodar localmente

```bash
npm run dev
```

Acesse `http://localhost:5173`

### 6. Deploy no Vercel

```bash
npm run build
```

No Vercel, configure as mesmas variáveis de ambiente (`VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`).

---

## Estrutura do projeto

```
src/
├── components/
│   ├── layout/       # Sidebar, Layout
│   └── ui/           # Componentes shadcn/ui
├── contexts/         # AuthContext
├── hooks/            # React Query hooks por módulo
├── lib/              # supabase.ts, utils.ts
├── pages/            # Páginas por módulo
└── types/            # database.types.ts
supabase/
└── migrations/       # SQL completo
```

## Regras de negócio implementadas no banco

- `custo_unitario` do insumo calculado automaticamente ao alterar custo ou volume de compra
- `custo_linha` da ficha técnica calculado automaticamente
- Recálculo em cascata: alterar o custo de um insumo recalcula todos os produtos que o usam
- `processar_venda` — RPC transacional: valida estoque, cria venda, dá baixa, registra movimentação
- `registrar_producao` — RPC transacional: valida insumos, consome, aumenta produto, registra lote

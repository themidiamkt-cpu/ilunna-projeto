-- ============================================================
-- MIGRATION 001: Schema Base - Ilunna Gestão
-- ============================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- ENUMS
-- ============================================================
CREATE TYPE unidade_insumo AS ENUM ('ml', 'gr', 'un');
CREATE TYPE tipo_insumo AS ENUM ('liquido', 'solido', 'embalagem', 'acessorio');
CREATE TYPE forma_pagamento AS ENUM ('dinheiro', 'pix', 'debito', 'credito', 'outro');
CREATE TYPE status_venda AS ENUM ('concluida', 'cancelada');
CREATE TYPE status_caixa AS ENUM ('aberto', 'fechado');
CREATE TYPE tipo_movimentacao AS ENUM ('entrada_insumo', 'producao', 'venda', 'ajuste', 'perda');
CREATE TYPE papel_usuario AS ENUM ('admin', 'operador');

-- ============================================================
-- TABLE: categorias
-- ============================================================
CREATE TABLE categorias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  descricao TEXT,
  cor TEXT DEFAULT '#C4704F',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- TABLE: perfis (linked to auth.users)
-- ============================================================
CREATE TABLE perfis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  nome TEXT NOT NULL,
  papel papel_usuario NOT NULL DEFAULT 'operador',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE perfis ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- TABLE: clientes
-- ============================================================
CREATE TABLE clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  telefone TEXT,
  email TEXT,
  observacao TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- TABLE: insumos
-- ============================================================
CREATE TABLE insumos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  tipo tipo_insumo NOT NULL DEFAULT 'liquido',
  unidade unidade_insumo NOT NULL DEFAULT 'ml',
  volume_compra NUMERIC(12,4) NOT NULL DEFAULT 1,
  custo_compra NUMERIC(12,4) NOT NULL DEFAULT 0,
  custo_unitario NUMERIC(12,6) NOT NULL DEFAULT 0, -- calculated: custo_compra / volume_compra
  estoque_atual NUMERIC(12,4) NOT NULL DEFAULT 0,
  estoque_minimo NUMERIC(12,4) NOT NULL DEFAULT 0,
  fornecedor TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE insumos ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- TABLE: produtos
-- ============================================================
CREATE TABLE produtos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  sku TEXT UNIQUE,
  categoria_id UUID REFERENCES categorias(id),
  preco_venda NUMERIC(12,4) NOT NULL DEFAULT 0,
  custo_producao NUMERIC(12,4) NOT NULL DEFAULT 0, -- calculated from fichas_tecnicas
  margem_valor NUMERIC(12,4) GENERATED ALWAYS AS (preco_venda - custo_producao) STORED,
  margem_percentual NUMERIC(8,4) GENERATED ALWAYS AS (
    CASE WHEN preco_venda > 0 THEN ((preco_venda - custo_producao) / preco_venda) * 100 ELSE 0 END
  ) STORED,
  estoque_atual NUMERIC(12,4) NOT NULL DEFAULT 0,
  estoque_minimo NUMERIC(12,4) NOT NULL DEFAULT 0,
  validade_dias INT,
  imagem_url TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE produtos ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- TABLE: fichas_tecnicas (BOM - Bill of Materials)
-- ============================================================
CREATE TABLE fichas_tecnicas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  produto_id UUID REFERENCES produtos(id) ON DELETE CASCADE NOT NULL,
  insumo_id UUID REFERENCES insumos(id) NOT NULL,
  quantidade NUMERIC(12,4) NOT NULL DEFAULT 0,
  custo_linha NUMERIC(12,6) NOT NULL DEFAULT 0, -- calculated: quantidade * custo_unitario
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(produto_id, insumo_id)
);
ALTER TABLE fichas_tecnicas ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- TABLE: caixas
-- ============================================================
CREATE TABLE caixas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data_abertura TIMESTAMPTZ NOT NULL DEFAULT now(),
  data_fechamento TIMESTAMPTZ,
  valor_abertura NUMERIC(12,4) NOT NULL DEFAULT 0,
  valor_fechamento_informado NUMERIC(12,4),
  valor_esperado NUMERIC(12,4) NOT NULL DEFAULT 0, -- calculated from vendas
  diferenca NUMERIC(12,4),
  usuario_id UUID REFERENCES auth.users(id),
  status status_caixa NOT NULL DEFAULT 'aberto',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE caixas ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- TABLE: vendas
-- ============================================================
CREATE TABLE vendas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero TEXT UNIQUE NOT NULL,
  data TIMESTAMPTZ NOT NULL DEFAULT now(),
  cliente_id UUID REFERENCES clientes(id),
  subtotal NUMERIC(12,4) NOT NULL DEFAULT 0,
  desconto NUMERIC(12,4) NOT NULL DEFAULT 0,
  total NUMERIC(12,4) NOT NULL DEFAULT 0,
  forma_pagamento forma_pagamento NOT NULL DEFAULT 'dinheiro',
  status status_venda NOT NULL DEFAULT 'concluida',
  caixa_id UUID REFERENCES caixas(id),
  usuario_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE vendas ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- TABLE: venda_itens
-- ============================================================
CREATE TABLE venda_itens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venda_id UUID REFERENCES vendas(id) ON DELETE CASCADE NOT NULL,
  produto_id UUID REFERENCES produtos(id) NOT NULL,
  quantidade INT NOT NULL DEFAULT 1,
  preco_unitario NUMERIC(12,4) NOT NULL DEFAULT 0,
  custo_unitario NUMERIC(12,4) NOT NULL DEFAULT 0, -- frozen at sale time
  subtotal NUMERIC(12,4) NOT NULL DEFAULT 0, -- quantidade * preco_unitario
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE venda_itens ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- TABLE: producoes
-- ============================================================
CREATE TABLE producoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  produto_id UUID REFERENCES produtos(id) NOT NULL,
  quantidade_produzida INT NOT NULL DEFAULT 1,
  custo_total NUMERIC(12,4) NOT NULL DEFAULT 0,
  lote TEXT,
  validade DATE,
  data TIMESTAMPTZ NOT NULL DEFAULT now(),
  usuario_id UUID REFERENCES auth.users(id),
  observacao TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE producoes ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- TABLE: movimentacoes_estoque
-- ============================================================
CREATE TABLE movimentacoes_estoque (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo tipo_movimentacao NOT NULL,
  referencia_tipo TEXT NOT NULL CHECK (referencia_tipo IN ('insumo', 'produto')),
  referencia_id UUID NOT NULL,
  quantidade NUMERIC(12,4) NOT NULL, -- positive = entrada, negative = saida
  custo_unitario NUMERIC(12,6),
  motivo TEXT,
  data TIMESTAMPTZ NOT NULL DEFAULT now(),
  usuario_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE movimentacoes_estoque ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- SEQUENCE: numero de venda
-- ============================================================
CREATE SEQUENCE IF NOT EXISTS venda_numero_seq START 1;

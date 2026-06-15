-- ================================================================
-- ILUNNA GESTÃO - SQL COMPLETO
-- Cole este arquivo inteiro no Supabase SQL Editor e execute.
-- Acesse: https://supabase.com/dashboard > SQL Editor > New query
-- ================================================================
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

-- ============================================================
-- MIGRATION 002: Triggers and Functions - Ilunna Gestão
-- ============================================================

-- ============================================================
-- FUNCTION: update updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Apply updated_at trigger to all tables that need it
CREATE TRIGGER tr_updated_at_categorias BEFORE UPDATE ON categorias FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_updated_at_insumos BEFORE UPDATE ON insumos FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_updated_at_produtos BEFORE UPDATE ON produtos FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_updated_at_fichas_tecnicas BEFORE UPDATE ON fichas_tecnicas FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_updated_at_clientes BEFORE UPDATE ON clientes FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_updated_at_caixas BEFORE UPDATE ON caixas FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_updated_at_vendas BEFORE UPDATE ON vendas FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_updated_at_producoes BEFORE UPDATE ON producoes FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_updated_at_perfis BEFORE UPDATE ON perfis FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- FUNCTION: calculate custo_unitario when insumo is updated
-- Business rule: custo_unitario = custo_compra / volume_compra
-- ============================================================
CREATE OR REPLACE FUNCTION calc_custo_unitario_insumo()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.volume_compra > 0 THEN
    NEW.custo_unitario = NEW.custo_compra / NEW.volume_compra;
  ELSE
    NEW.custo_unitario = 0;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER tr_calc_custo_unitario
BEFORE INSERT OR UPDATE OF custo_compra, volume_compra ON insumos
FOR EACH ROW EXECUTE FUNCTION calc_custo_unitario_insumo();

-- ============================================================
-- FUNCTION: recalculate ficha_tecnica custo_linha when touched
-- custo_linha = quantidade * custo_unitario_do_insumo
-- ============================================================
CREATE OR REPLACE FUNCTION calc_custo_linha_ficha()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  v_custo_unitario NUMERIC;
BEGIN
  SELECT custo_unitario INTO v_custo_unitario FROM insumos WHERE id = NEW.insumo_id;
  NEW.custo_linha = NEW.quantidade * COALESCE(v_custo_unitario, 0);
  RETURN NEW;
END;
$$;

CREATE TRIGGER tr_calc_custo_linha
BEFORE INSERT OR UPDATE ON fichas_tecnicas
FOR EACH ROW EXECUTE FUNCTION calc_custo_linha_ficha();

-- ============================================================
-- FUNCTION: recalculate produto custo_producao from fichas_tecnicas
-- Called when fichas_tecnicas changes
-- ============================================================
CREATE OR REPLACE FUNCTION recalc_custo_producao(p_produto_id UUID)
RETURNS VOID LANGUAGE plpgsql AS $$
DECLARE
  v_custo NUMERIC;
BEGIN
  SELECT COALESCE(SUM(custo_linha), 0)
  INTO v_custo
  FROM fichas_tecnicas
  WHERE produto_id = p_produto_id;

  UPDATE produtos
  SET custo_producao = v_custo
  WHERE id = p_produto_id;
END;
$$;

-- Trigger on fichas_tecnicas: recalculate product cost when recipe changes
CREATE OR REPLACE FUNCTION tr_ficha_changed()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM recalc_custo_producao(OLD.produto_id);
  ELSE
    PERFORM recalc_custo_producao(NEW.produto_id);
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER tr_ficha_changed_trigger
AFTER INSERT OR UPDATE OR DELETE ON fichas_tecnicas
FOR EACH ROW EXECUTE FUNCTION tr_ficha_changed();

-- ============================================================
-- CASCADE: when insumo custo_unitario changes,
-- update all fichas_tecnicas using it, then update all affected produtos
-- This is the KEY cascade recalculation
-- ============================================================
CREATE OR REPLACE FUNCTION cascade_recalc_from_insumo()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  v_produto_id UUID;
BEGIN
  -- Only cascade if custo_unitario actually changed
  IF NEW.custo_unitario IS DISTINCT FROM OLD.custo_unitario THEN
    -- Update custo_linha in all fichas_tecnicas using this insumo
    UPDATE fichas_tecnicas
    SET custo_linha = quantidade * NEW.custo_unitario
    WHERE insumo_id = NEW.id;

    -- Recalculate custo_producao for all affected produtos
    FOR v_produto_id IN
      SELECT DISTINCT produto_id FROM fichas_tecnicas WHERE insumo_id = NEW.id
    LOOP
      PERFORM recalc_custo_producao(v_produto_id);
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER tr_cascade_from_insumo
AFTER UPDATE OF custo_unitario ON insumos
FOR EACH ROW EXECUTE FUNCTION cascade_recalc_from_insumo();

-- ============================================================
-- FUNCTION: generate venda number (sequential, readable)
-- ============================================================
CREATE OR REPLACE FUNCTION generate_venda_numero()
RETURNS TEXT LANGUAGE plpgsql AS $$
DECLARE
  v_num BIGINT;
BEGIN
  v_num = nextval('venda_numero_seq');
  RETURN LPAD(v_num::TEXT, 6, '0');
END;
$$;

-- ============================================================
-- RPC: processar_venda (TRANSACTIONAL)
-- Creates venda + itens, deducts product stock, logs movement
-- Params: JSON with venda info and array of items
-- ============================================================
CREATE OR REPLACE FUNCTION processar_venda(
  p_caixa_id UUID,
  p_cliente_id UUID,
  p_forma_pagamento forma_pagamento,
  p_desconto NUMERIC,
  p_usuario_id UUID,
  p_itens JSONB -- [{produto_id, quantidade, preco_unitario}]
)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_venda_id UUID;
  v_numero TEXT;
  v_subtotal NUMERIC := 0;
  v_total NUMERIC := 0;
  v_item JSONB;
  v_produto RECORD;
  v_item_id UUID;
BEGIN
  -- Check caixa is open
  IF NOT EXISTS (SELECT 1 FROM caixas WHERE id = p_caixa_id AND status = 'aberto') THEN
    RAISE EXCEPTION 'Caixa nao esta aberto';
  END IF;

  -- Validate stock for all items first
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_itens)
  LOOP
    SELECT id, nome, estoque_atual, preco_venda, custo_producao
    INTO v_produto
    FROM produtos
    WHERE id = (v_item->>'produto_id')::UUID AND ativo = true;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Produto % nao encontrado', v_item->>'produto_id';
    END IF;

    IF v_produto.estoque_atual < (v_item->>'quantidade')::INT THEN
      RAISE EXCEPTION 'Estoque insuficiente para o produto: %', v_produto.nome;
    END IF;
  END LOOP;

  -- Generate numero
  v_numero := generate_venda_numero();

  -- Calculate subtotal
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_itens)
  LOOP
    v_subtotal := v_subtotal + ((v_item->>'preco_unitario')::NUMERIC * (v_item->>'quantidade')::INT);
  END LOOP;

  v_total := v_subtotal - COALESCE(p_desconto, 0);

  -- Create venda
  INSERT INTO vendas (numero, data, cliente_id, subtotal, desconto, total, forma_pagamento, status, caixa_id, usuario_id)
  VALUES (v_numero, now(), p_cliente_id, v_subtotal, COALESCE(p_desconto, 0), v_total, p_forma_pagamento, 'concluida', p_caixa_id, p_usuario_id)
  RETURNING id INTO v_venda_id;

  -- Create itens and deduct stock
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_itens)
  LOOP
    SELECT id, custo_producao INTO v_produto FROM produtos WHERE id = (v_item->>'produto_id')::UUID;

    -- Insert venda_item
    INSERT INTO venda_itens (venda_id, produto_id, quantidade, preco_unitario, custo_unitario, subtotal)
    VALUES (
      v_venda_id,
      (v_item->>'produto_id')::UUID,
      (v_item->>'quantidade')::INT,
      (v_item->>'preco_unitario')::NUMERIC,
      v_produto.custo_producao,
      (v_item->>'preco_unitario')::NUMERIC * (v_item->>'quantidade')::INT
    );

    -- Deduct stock
    UPDATE produtos
    SET estoque_atual = estoque_atual - (v_item->>'quantidade')::INT
    WHERE id = (v_item->>'produto_id')::UUID;

    -- Log movement
    INSERT INTO movimentacoes_estoque (tipo, referencia_tipo, referencia_id, quantidade, custo_unitario, motivo, data, usuario_id)
    VALUES ('venda', 'produto', (v_item->>'produto_id')::UUID, -((v_item->>'quantidade')::INT), v_produto.custo_producao, 'Venda ' || v_numero, now(), p_usuario_id);
  END LOOP;

  RETURN json_build_object('venda_id', v_venda_id, 'numero', v_numero, 'total', v_total);

EXCEPTION WHEN OTHERS THEN
  RAISE;
END;
$$;

-- ============================================================
-- RPC: registrar_producao (TRANSACTIONAL)
-- Consumes insumos, adds product stock, logs movements
-- ============================================================
CREATE OR REPLACE FUNCTION registrar_producao(
  p_produto_id UUID,
  p_quantidade INT,
  p_lote TEXT,
  p_observacao TEXT,
  p_usuario_id UUID
)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_producao_id UUID;
  v_item RECORD;
  v_custo_total NUMERIC := 0;
  v_validade DATE;
  v_validade_dias INT;
  v_produto_nome TEXT;
  v_falta TEXT := '';
BEGIN
  -- Get product info
  SELECT nome, validade_dias INTO v_produto_nome, v_validade_dias
  FROM produtos WHERE id = p_produto_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Produto nao encontrado';
  END IF;

  -- Check all insumos are sufficient
  FOR v_item IN
    SELECT ft.insumo_id, ft.quantidade * p_quantidade AS qtd_necessaria,
           i.nome AS insumo_nome, i.estoque_atual
    FROM fichas_tecnicas ft
    JOIN insumos i ON i.id = ft.insumo_id
    WHERE ft.produto_id = p_produto_id
  LOOP
    IF v_item.estoque_atual < v_item.qtd_necessaria THEN
      v_falta := v_falta || v_item.insumo_nome || ' (falta ' || round(v_item.qtd_necessaria - v_item.estoque_atual, 2) || '), ';
    END IF;
  END LOOP;

  IF v_falta <> '' THEN
    RAISE EXCEPTION 'Estoque insuficiente de insumos: %', rtrim(v_falta, ', ');
  END IF;

  -- Calculate total cost
  SELECT COALESCE(SUM(ft.custo_linha * p_quantidade), 0)
  INTO v_custo_total
  FROM fichas_tecnicas ft
  WHERE ft.produto_id = p_produto_id;

  -- Calculate validade
  IF v_validade_dias IS NOT NULL THEN
    v_validade := CURRENT_DATE + v_validade_dias;
  END IF;

  -- Auto-generate lote if not provided
  IF p_lote IS NULL OR p_lote = '' THEN
    p_lote := 'LOT-' || to_char(now(), 'YYYYMMDD-HH24MI');
  END IF;

  -- Create producao record
  INSERT INTO producoes (produto_id, quantidade_produzida, custo_total, lote, validade, data, usuario_id, observacao)
  VALUES (p_produto_id, p_quantidade, v_custo_total, p_lote, v_validade, now(), p_usuario_id, p_observacao)
  RETURNING id INTO v_producao_id;

  -- Consume insumos
  FOR v_item IN
    SELECT ft.insumo_id, ft.quantidade * p_quantidade AS qtd_consumida, ft.custo_linha
    FROM fichas_tecnicas ft
    WHERE ft.produto_id = p_produto_id
  LOOP
    -- Deduct from insumo stock
    UPDATE insumos
    SET estoque_atual = estoque_atual - v_item.qtd_consumida
    WHERE id = v_item.insumo_id;

    -- Log movement
    INSERT INTO movimentacoes_estoque (tipo, referencia_tipo, referencia_id, quantidade, motivo, data, usuario_id)
    VALUES ('producao', 'insumo', v_item.insumo_id, -v_item.qtd_consumida, 'Producao lote ' || p_lote, now(), p_usuario_id);
  END LOOP;

  -- Add product stock
  UPDATE produtos
  SET estoque_atual = estoque_atual + p_quantidade
  WHERE id = p_produto_id;

  -- Log product movement
  INSERT INTO movimentacoes_estoque (tipo, referencia_tipo, referencia_id, quantidade, custo_unitario, motivo, data, usuario_id)
  VALUES ('producao', 'produto', p_produto_id, p_quantidade, v_custo_total / p_quantidade, 'Producao lote ' || p_lote, now(), p_usuario_id);

  RETURN json_build_object('producao_id', v_producao_id, 'lote', p_lote, 'custo_total', v_custo_total);

EXCEPTION WHEN OTHERS THEN
  RAISE;
END;
$$;

-- ============================================================
-- RPC: fechar_caixa
-- ============================================================
CREATE OR REPLACE FUNCTION fechar_caixa(
  p_caixa_id UUID,
  p_valor_informado NUMERIC,
  p_usuario_id UUID
)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_esperado NUMERIC;
  v_abertura NUMERIC;
BEGIN
  -- Get valor_abertura
  SELECT valor_abertura INTO v_abertura FROM caixas WHERE id = p_caixa_id AND status = 'aberto';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Caixa nao encontrado ou ja fechado';
  END IF;

  -- Calculate expected: abertura + sum of dinheiro vendas
  SELECT v_abertura + COALESCE(SUM(total), 0)
  INTO v_esperado
  FROM vendas
  WHERE caixa_id = p_caixa_id AND status = 'concluida' AND forma_pagamento = 'dinheiro';

  -- Update caixa
  UPDATE caixas
  SET
    status = 'fechado',
    data_fechamento = now(),
    valor_fechamento_informado = p_valor_informado,
    valor_esperado = v_esperado,
    diferenca = p_valor_informado - v_esperado
  WHERE id = p_caixa_id;

  RETURN json_build_object('valor_esperado', v_esperado, 'diferenca', p_valor_informado - v_esperado);
END;
$$;

-- ============================================================
-- RPC: get_dashboard_summary
-- Returns all KPI data for dashboard for a given period
-- ============================================================
CREATE OR REPLACE FUNCTION get_dashboard_summary(
  p_data_inicio TIMESTAMPTZ,
  p_data_fim TIMESTAMPTZ
)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_result JSON;
BEGIN
  SELECT json_build_object(
    'faturamento', COALESCE(SUM(total), 0),
    'custo_total', COALESCE(SUM(
      (SELECT SUM(vi.custo_unitario * vi.quantidade)
       FROM venda_itens vi WHERE vi.venda_id = v.id)
    ), 0),
    'num_vendas', COUNT(*),
    'ticket_medio', CASE WHEN COUNT(*) > 0 THEN COALESCE(SUM(total), 0) / COUNT(*) ELSE 0 END
  )
  INTO v_result
  FROM vendas v
  WHERE v.data BETWEEN p_data_inicio AND p_data_fim
    AND v.status = 'concluida';

  RETURN v_result;
END;
$$;

-- ============================================================
-- MIGRATION 003: Views - Ilunna Gestão
-- ============================================================

-- ============================================================
-- VIEW: vw_margem_produtos
-- Product margin analysis
-- ============================================================
CREATE OR REPLACE VIEW vw_margem_produtos AS
SELECT
  p.id,
  p.nome,
  p.sku,
  c.nome AS categoria,
  c.cor AS categoria_cor,
  p.preco_venda,
  p.custo_producao,
  p.margem_valor,
  p.margem_percentual,
  p.estoque_atual,
  p.estoque_minimo,
  p.ativo
FROM produtos p
LEFT JOIN categorias c ON c.id = p.categoria_id
ORDER BY p.margem_percentual DESC;

-- ============================================================
-- VIEW: vw_estoque_baixo
-- Items below minimum stock (both products and insumos)
-- ============================================================
CREATE OR REPLACE VIEW vw_estoque_baixo AS
SELECT
  'produto' AS tipo,
  id,
  nome,
  estoque_atual,
  estoque_minimo,
  (estoque_minimo - estoque_atual) AS falta,
  NULL::TEXT AS unidade
FROM produtos
WHERE estoque_atual <= estoque_minimo AND ativo = true
UNION ALL
SELECT
  'insumo' AS tipo,
  id,
  nome,
  estoque_atual,
  estoque_minimo,
  (estoque_minimo - estoque_atual) AS falta,
  unidade::TEXT
FROM insumos
WHERE estoque_atual <= estoque_minimo AND ativo = true
ORDER BY falta DESC;

-- ============================================================
-- VIEW: vw_vendas_diarias
-- Daily sales summary
-- ============================================================
CREATE OR REPLACE VIEW vw_vendas_diarias AS
SELECT
  DATE(v.data) AS dia,
  COUNT(v.id) AS num_vendas,
  SUM(v.total) AS faturamento,
  SUM(vi_custo.custo_total) AS custo_total,
  SUM(v.total) - SUM(vi_custo.custo_total) AS lucro,
  CASE WHEN SUM(v.total) > 0 THEN
    ((SUM(v.total) - SUM(vi_custo.custo_total)) / SUM(v.total)) * 100
  ELSE 0 END AS margem_percentual,
  CASE WHEN COUNT(v.id) > 0 THEN SUM(v.total) / COUNT(v.id) ELSE 0 END AS ticket_medio
FROM vendas v
LEFT JOIN LATERAL (
  SELECT SUM(vi.custo_unitario * vi.quantidade) AS custo_total
  FROM venda_itens vi WHERE vi.venda_id = v.id
) vi_custo ON true
WHERE v.status = 'concluida'
GROUP BY DATE(v.data)
ORDER BY dia DESC;

-- ============================================================
-- VIEW: vw_vendas_por_categoria
-- Sales grouped by product category
-- ============================================================
CREATE OR REPLACE VIEW vw_vendas_por_categoria AS
SELECT
  c.id AS categoria_id,
  c.nome AS categoria,
  c.cor,
  COUNT(DISTINCT v.id) AS num_vendas,
  SUM(vi.quantidade) AS qtd_itens,
  SUM(vi.subtotal) AS faturamento,
  SUM(vi.custo_unitario * vi.quantidade) AS custo_total,
  SUM(vi.subtotal) - SUM(vi.custo_unitario * vi.quantidade) AS lucro
FROM venda_itens vi
JOIN vendas v ON v.id = vi.venda_id AND v.status = 'concluida'
JOIN produtos p ON p.id = vi.produto_id
LEFT JOIN categorias c ON c.id = p.categoria_id
GROUP BY c.id, c.nome, c.cor
ORDER BY faturamento DESC;

-- ============================================================
-- VIEW: vw_produtos_mais_vendidos
-- Top products by quantity and revenue
-- ============================================================
CREATE OR REPLACE VIEW vw_produtos_mais_vendidos AS
SELECT
  p.id,
  p.nome,
  p.sku,
  c.nome AS categoria,
  SUM(vi.quantidade) AS qtd_vendida,
  SUM(vi.subtotal) AS faturamento,
  SUM(vi.custo_unitario * vi.quantidade) AS custo_total,
  SUM(vi.subtotal) - SUM(vi.custo_unitario * vi.quantidade) AS lucro,
  CASE WHEN SUM(vi.subtotal) > 0 THEN
    ((SUM(vi.subtotal) - SUM(vi.custo_unitario * vi.quantidade)) / SUM(vi.subtotal)) * 100
  ELSE 0 END AS margem_media
FROM venda_itens vi
JOIN vendas v ON v.id = vi.venda_id AND v.status = 'concluida'
JOIN produtos p ON p.id = vi.produto_id
LEFT JOIN categorias c ON c.id = p.categoria_id
GROUP BY p.id, p.nome, p.sku, c.nome
ORDER BY qtd_vendida DESC;

-- ============================================================
-- VIEW: vw_valorizacao_estoque
-- Stock valuation
-- ============================================================
CREATE OR REPLACE VIEW vw_valorizacao_estoque AS
SELECT
  'produto' AS tipo,
  id,
  nome,
  estoque_atual AS quantidade,
  custo_producao AS custo_unitario,
  estoque_atual * custo_producao AS valor_custo,
  preco_venda AS preco_unitario,
  estoque_atual * preco_venda AS valor_venda
FROM produtos
WHERE ativo = true AND estoque_atual > 0
UNION ALL
SELECT
  'insumo' AS tipo,
  id,
  nome,
  estoque_atual AS quantidade,
  custo_unitario,
  estoque_atual * custo_unitario AS valor_custo,
  NULL AS preco_unitario,
  NULL AS valor_venda
FROM insumos
WHERE ativo = true AND estoque_atual > 0;

-- ============================================================
-- MIGRATION 004: RLS Policies - Ilunna Gestão
-- admin: full access; operador: limited access
-- ============================================================

-- Helper function to get current user's papel
CREATE OR REPLACE FUNCTION get_user_papel()
RETURNS TEXT LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT papel::TEXT FROM perfis WHERE usuario_id = auth.uid();
$$;

-- ============================================================
-- categorias: all authenticated users can read
-- ============================================================
CREATE POLICY "categorias_select" ON categorias FOR SELECT TO authenticated USING (true);
CREATE POLICY "categorias_admin_all" ON categorias FOR ALL TO authenticated
  USING (get_user_papel() = 'admin')
  WITH CHECK (get_user_papel() = 'admin');

-- ============================================================
-- perfis: users can see their own, admins see all
-- ============================================================
CREATE POLICY "perfis_own" ON perfis FOR SELECT TO authenticated
  USING (usuario_id = auth.uid() OR get_user_papel() = 'admin');
CREATE POLICY "perfis_admin_write" ON perfis FOR ALL TO authenticated
  USING (get_user_papel() = 'admin')
  WITH CHECK (get_user_papel() = 'admin');

-- ============================================================
-- insumos: operador can read, admin can write
-- ============================================================
CREATE POLICY "insumos_select" ON insumos FOR SELECT TO authenticated USING (true);
CREATE POLICY "insumos_admin_write" ON insumos FOR ALL TO authenticated
  USING (get_user_papel() = 'admin')
  WITH CHECK (get_user_papel() = 'admin');

-- ============================================================
-- produtos: all authenticated can read
-- ============================================================
CREATE POLICY "produtos_select" ON produtos FOR SELECT TO authenticated USING (true);
CREATE POLICY "produtos_admin_write" ON produtos FOR ALL TO authenticated
  USING (get_user_papel() = 'admin')
  WITH CHECK (get_user_papel() = 'admin');

-- ============================================================
-- fichas_tecnicas: admin only write, all read
-- ============================================================
CREATE POLICY "fichas_select" ON fichas_tecnicas FOR SELECT TO authenticated USING (true);
CREATE POLICY "fichas_admin_write" ON fichas_tecnicas FOR ALL TO authenticated
  USING (get_user_papel() = 'admin')
  WITH CHECK (get_user_papel() = 'admin');

-- ============================================================
-- clientes: all authenticated
-- ============================================================
CREATE POLICY "clientes_all" ON clientes FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- caixas: all authenticated can read/manage
-- ============================================================
CREATE POLICY "caixas_all" ON caixas FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- vendas: all authenticated can create/read
-- ============================================================
CREATE POLICY "vendas_select" ON vendas FOR SELECT TO authenticated USING (true);
CREATE POLICY "vendas_insert" ON vendas FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "vendas_update" ON vendas FOR UPDATE TO authenticated USING (true);

-- ============================================================
-- venda_itens: all authenticated
-- ============================================================
CREATE POLICY "venda_itens_all" ON venda_itens FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- producoes: all authenticated can read, admin and operador create
-- ============================================================
CREATE POLICY "producoes_all" ON producoes FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- movimentacoes_estoque: all authenticated can read, insert via RPC
-- ============================================================
CREATE POLICY "movimentacoes_select" ON movimentacoes_estoque FOR SELECT TO authenticated USING (true);
CREATE POLICY "movimentacoes_insert" ON movimentacoes_estoque FOR INSERT TO authenticated WITH CHECK (true);

-- ============================================================
-- MIGRATION 005: Seed Data - Ilunna Gestão
-- Real data for Ilunna brand (Brazilian handmade aromatics)
-- ============================================================

-- ============================================================
-- CATEGORIAS
-- ============================================================
INSERT INTO categorias (id, nome, descricao, cor) VALUES
  ('a1000000-0000-0000-0000-000000000001', 'Velas', 'Velas aromaticas artesanais', '#C4704F'),
  ('a1000000-0000-0000-0000-000000000002', 'Difusores', 'Difusores de ambiente', '#D4A853'),
  ('a1000000-0000-0000-0000-000000000003', 'Home Spray', 'Sprays aromaticos para ambiente', '#6B8F71'),
  ('a1000000-0000-0000-0000-000000000004', 'Escalda Pes', 'Produtos para relaxamento dos pes', '#8B6B9A'),
  ('a1000000-0000-0000-0000-000000000005', 'Linha Premium', 'Produtos da linha premium', '#2C6E8A');

-- ============================================================
-- INSUMOS
-- custo_unitario is auto-calculated by trigger: custo_compra / volume_compra
-- ============================================================
INSERT INTO insumos (id, nome, tipo, unidade, volume_compra, custo_compra, estoque_atual, estoque_minimo, fornecedor) VALUES
  ('b1000000-0000-0000-0000-000000000001', 'Alcool', 'liquido', 'ml', 1000, 8.00, 3000, 500, 'Distribuidora Quimica'),
  ('b1000000-0000-0000-0000-000000000002', 'Agua', 'liquido', 'ml', 5000, 3.00, 10000, 2000, 'Agua Mineral Local'),
  ('b1000000-0000-0000-0000-000000000003', 'Essencia', 'liquido', 'ml', 100, 35.00, 500, 100, 'Aromaflor Essencias'),
  ('b1000000-0000-0000-0000-000000000004', 'Essencia de Cosmeticos', 'liquido', 'ml', 100, 45.00, 300, 100, 'Aromaflor Essencias'),
  ('b1000000-0000-0000-0000-000000000005', 'Melaleuca', 'liquido', 'ml', 30, 18.00, 120, 30, 'Naturais Brasil'),
  ('b1000000-0000-0000-0000-000000000006', 'Cera de Coco Mole', 'solido', 'gr', 1000, 32.00, 5000, 1000, 'Ceras Naturais'),
  ('b1000000-0000-0000-0000-000000000007', 'Cera de Coco Dura', 'solido', 'gr', 1000, 34.00, 3000, 1000, 'Ceras Naturais'),
  ('b1000000-0000-0000-0000-000000000008', 'Cera de Abelha', 'solido', 'gr', 500, 28.00, 1000, 250, 'Apicultura Sol'),
  ('b1000000-0000-0000-0000-000000000009', 'Manteiga de Karite', 'solido', 'gr', 500, 38.00, 1000, 200, 'Naturais Brasil'),
  ('b1000000-0000-0000-0000-000000000010', 'Oleo de Amendoa', 'liquido', 'ml', 500, 22.00, 1000, 200, 'Naturais Brasil'),
  ('b1000000-0000-0000-0000-000000000011', 'Corante', 'liquido', 'ml', 30, 12.00, 150, 30, 'Pigmento Arte'),
  ('b1000000-0000-0000-0000-000000000012', 'Sal Grosso', 'solido', 'gr', 1000, 4.00, 5000, 500, 'Mercado Local'),
  ('b1000000-0000-0000-0000-000000000013', 'Ervas', 'solido', 'gr', 100, 8.00, 500, 100, 'Horta Aromatica'),
  ('b1000000-0000-0000-0000-000000000014', 'Pavil/Pavio', 'embalagem', 'un', 100, 18.00, 300, 50, 'Embalagens Craft'),
  ('b1000000-0000-0000-0000-000000000015', 'Frasco', 'embalagem', 'un', 12, 36.00, 72, 12, 'Embalagens Craft'),
  ('b1000000-0000-0000-0000-000000000016', 'Tampa', 'embalagem', 'un', 12, 12.00, 72, 12, 'Embalagens Craft'),
  ('b1000000-0000-0000-0000-000000000017', 'Valvula', 'embalagem', 'un', 12, 24.00, 48, 12, 'Embalagens Craft'),
  ('b1000000-0000-0000-0000-000000000018', 'Vareta', 'embalagem', 'un', 10, 8.00, 60, 10, 'Embalagens Craft'),
  ('b1000000-0000-0000-0000-000000000019', 'Etiqueta', 'acessorio', 'un', 100, 35.00, 500, 100, 'Grafica Artesanal'),
  ('b1000000-0000-0000-0000-000000000020', 'Sacola', 'acessorio', 'un', 50, 45.00, 100, 20, 'Embalagens Kraft'),
  ('b1000000-0000-0000-0000-000000000021', 'Pote mais Tampa', 'embalagem', 'un', 6, 42.00, 36, 6, 'Embalagens Craft'),
  ('b1000000-0000-0000-0000-000000000022', 'Lacre de Seguranca', 'acessorio', 'un', 100, 8.00, 400, 50, 'Embalagens Craft'),
  ('b1000000-0000-0000-0000-000000000023', 'Embalagem', 'acessorio', 'un', 10, 25.00, 50, 10, 'Embalagens Kraft'),
  ('b1000000-0000-0000-0000-000000000024', 'Laco', 'acessorio', 'un', 50, 20.00, 150, 20, 'Artesanato Decor'),
  ('b1000000-0000-0000-0000-000000000025', 'Pacotinho', 'acessorio', 'un', 50, 30.00, 100, 20, 'Embalagens Kraft');

-- ============================================================
-- PRODUTOS
-- custo_producao will be recalculated after fichas_tecnicas insert
-- ============================================================
INSERT INTO produtos (id, nome, sku, categoria_id, preco_venda, estoque_atual, estoque_minimo, validade_dias) VALUES
  ('c1000000-0000-0000-0000-000000000001', 'Vela Massa Mole', 'ILU-VEL-001', 'a1000000-0000-0000-0000-000000000001', 45.00, 10, 3, 365),
  ('c1000000-0000-0000-0000-000000000002', 'Difusor Refil', 'ILU-DIF-001', 'a1000000-0000-0000-0000-000000000002', 35.00, 10, 3, 180),
  ('c1000000-0000-0000-0000-000000000003', 'Home Spray Refil', 'ILU-HSP-001', 'a1000000-0000-0000-0000-000000000003', 28.00, 10, 3, 365),
  ('c1000000-0000-0000-0000-000000000004', 'Escalda Pes', 'ILU-ESP-001', 'a1000000-0000-0000-0000-000000000004', 38.00, 10, 3, 730),
  ('c1000000-0000-0000-0000-000000000005', 'Difusor Linha Premium', 'ILU-DPR-001', 'a1000000-0000-0000-0000-000000000005', 75.00, 10, 2, 180);

-- ============================================================
-- FICHAS TECNICAS (BOM - Bill of Materials)
-- custo_linha is auto-calculated by trigger
-- ============================================================

-- Vela Massa Mole (c1000000-...-001)
-- Cera de Coco Mole 150gr + Essencia 15ml + Corante 2ml + Pavio 1un + Pote mais Tampa 1un + Etiqueta 1un
INSERT INTO fichas_tecnicas (produto_id, insumo_id, quantidade) VALUES
  ('c1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000006', 150),  -- Cera de Coco Mole 150gr
  ('c1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000003', 15),   -- Essencia 15ml
  ('c1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000011', 2),    -- Corante 2ml
  ('c1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000014', 1),    -- Pavio 1un
  ('c1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000021', 1),    -- Pote mais Tampa 1un
  ('c1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000019', 1);    -- Etiqueta 1un

-- Difusor Refil (c1000000-...-002)
-- Alcool 100ml + Essencia 20ml + Vareta 4un + Frasco 1un + Tampa 1un + Etiqueta 1un
INSERT INTO fichas_tecnicas (produto_id, insumo_id, quantidade) VALUES
  ('c1000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000001', 100),  -- Alcool 100ml
  ('c1000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000003', 20),   -- Essencia 20ml
  ('c1000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000018', 4),    -- Vareta 4un
  ('c1000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000015', 1),    -- Frasco 1un
  ('c1000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000016', 1),    -- Tampa 1un
  ('c1000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000019', 1);    -- Etiqueta 1un

-- Home Spray Refil (c1000000-...-003)
-- Alcool 80ml + Agua 20ml + Essencia 15ml + Frasco 1un + Valvula 1un + Etiqueta 1un
INSERT INTO fichas_tecnicas (produto_id, insumo_id, quantidade) VALUES
  ('c1000000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000001', 80),   -- Alcool 80ml
  ('c1000000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000002', 20),   -- Agua 20ml
  ('c1000000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000003', 15),   -- Essencia 15ml
  ('c1000000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000015', 1),    -- Frasco 1un
  ('c1000000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000017', 1),    -- Valvula 1un
  ('c1000000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000019', 1);    -- Etiqueta 1un

-- Escalda Pes (c1000000-...-004)
-- Sal Grosso 500gr + Ervas 20gr + Oleo de Amendoa 10ml + Melaleuca 5ml + Pacotinho 1un + Etiqueta 1un
INSERT INTO fichas_tecnicas (produto_id, insumo_id, quantidade) VALUES
  ('c1000000-0000-0000-0000-000000000004', 'b1000000-0000-0000-0000-000000000012', 500),  -- Sal Grosso 500gr
  ('c1000000-0000-0000-0000-000000000004', 'b1000000-0000-0000-0000-000000000013', 20),   -- Ervas 20gr
  ('c1000000-0000-0000-0000-000000000004', 'b1000000-0000-0000-0000-000000000010', 10),   -- Oleo de Amendoa 10ml
  ('c1000000-0000-0000-0000-000000000004', 'b1000000-0000-0000-0000-000000000005', 5),    -- Melaleuca 5ml
  ('c1000000-0000-0000-0000-000000000004', 'b1000000-0000-0000-0000-000000000025', 1),    -- Pacotinho 1un
  ('c1000000-0000-0000-0000-000000000004', 'b1000000-0000-0000-0000-000000000019', 1);    -- Etiqueta 1un

-- Difusor Linha Premium (c1000000-...-005)
-- Alcool 200ml + Essencia de Cosmeticos 40ml + Vareta 6un + Frasco 1un + Tampa 1un + Lacre 1un + Etiqueta 1un + Embalagem 1un
INSERT INTO fichas_tecnicas (produto_id, insumo_id, quantidade) VALUES
  ('c1000000-0000-0000-0000-000000000005', 'b1000000-0000-0000-0000-000000000001', 200),  -- Alcool 200ml
  ('c1000000-0000-0000-0000-000000000005', 'b1000000-0000-0000-0000-000000000004', 40),   -- Essencia de Cosmeticos 40ml
  ('c1000000-0000-0000-0000-000000000005', 'b1000000-0000-0000-0000-000000000018', 6),    -- Vareta 6un
  ('c1000000-0000-0000-0000-000000000005', 'b1000000-0000-0000-0000-000000000015', 1),    -- Frasco 1un
  ('c1000000-0000-0000-0000-000000000005', 'b1000000-0000-0000-0000-000000000016', 1),    -- Tampa 1un
  ('c1000000-0000-0000-0000-000000000005', 'b1000000-0000-0000-0000-000000000022', 1),    -- Lacre de Seguranca 1un
  ('c1000000-0000-0000-0000-000000000005', 'b1000000-0000-0000-0000-000000000019', 1),    -- Etiqueta 1un
  ('c1000000-0000-0000-0000-000000000005', 'b1000000-0000-0000-0000-000000000023', 1);    -- Embalagem 1un

-- ============================================================
-- Recalculate custo_producao for all products
-- (triggers handle fichas_tecnicas inserts, but we do a final
-- explicit recalc to guarantee correctness after seed)
-- ============================================================
UPDATE produtos p SET custo_producao = (
  SELECT COALESCE(SUM(ft.quantidade * i.custo_unitario), 0)
  FROM fichas_tecnicas ft
  JOIN insumos i ON i.id = ft.insumo_id
  WHERE ft.produto_id = p.id
);

-- ============================================================
-- CLIENTES (sample customers)
-- ============================================================
INSERT INTO clientes (id, nome, telefone, email) VALUES
  ('d1000000-0000-0000-0000-000000000001', 'Ana Paula Silva', '(11) 99999-1001', 'ana.paula@email.com'),
  ('d1000000-0000-0000-0000-000000000002', 'Beatriz Souza', '(11) 99999-1002', 'beatriz.souza@email.com'),
  ('d1000000-0000-0000-0000-000000000003', 'Camila Rodrigues', '(11) 99999-1003', NULL),
  ('d1000000-0000-0000-0000-000000000004', 'Daniela Lima', '(11) 99999-1004', 'daniela.lima@email.com'),
  ('d1000000-0000-0000-0000-000000000005', 'Fernanda Costa', '(21) 99999-2001', NULL);

-- ============================================================
-- CAIXA (one open caixa for sample sales)
-- ============================================================
INSERT INTO caixas (id, data_abertura, valor_abertura, status) VALUES
  ('e1000000-0000-0000-0000-000000000001', now() - INTERVAL '30 days', 100.00, 'aberto');

-- ============================================================
-- SAMPLE VENDAS + ITENS (last 30 days)
-- Note: usuario_id is NULL (set after real auth user is created)
-- numero uses manual values since we seed the sequence after
-- ============================================================

-- Set sequence to start at 11 after our manual seeds
SELECT setval('venda_numero_seq', 10);

-- Venda 1 - 28 dias atras - Vela Massa Mole x2 + Difusor Refil x1 - PIX
INSERT INTO vendas (id, numero, data, cliente_id, subtotal, desconto, total, forma_pagamento, status, caixa_id)
VALUES ('f1000000-0000-0000-0000-000000000001', '000001', now() - INTERVAL '28 days',
        'd1000000-0000-0000-0000-000000000001', 125.00, 0, 125.00, 'pix', 'concluida',
        'e1000000-0000-0000-0000-000000000001');
INSERT INTO venda_itens (venda_id, produto_id, quantidade, preco_unitario, custo_unitario, subtotal) VALUES
  ('f1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001', 2, 45.00,
   (SELECT custo_producao FROM produtos WHERE id = 'c1000000-0000-0000-0000-000000000001'), 90.00),
  ('f1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000002', 1, 35.00,
   (SELECT custo_producao FROM produtos WHERE id = 'c1000000-0000-0000-0000-000000000002'), 35.00);

-- Venda 2 - 26 dias atras - Home Spray Refil x3 - Dinheiro
INSERT INTO vendas (id, numero, data, cliente_id, subtotal, desconto, total, forma_pagamento, status, caixa_id)
VALUES ('f1000000-0000-0000-0000-000000000002', '000002', now() - INTERVAL '26 days',
        'd1000000-0000-0000-0000-000000000002', 84.00, 0, 84.00, 'dinheiro', 'concluida',
        'e1000000-0000-0000-0000-000000000001');
INSERT INTO venda_itens (venda_id, produto_id, quantidade, preco_unitario, custo_unitario, subtotal) VALUES
  ('f1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000003', 3, 28.00,
   (SELECT custo_producao FROM produtos WHERE id = 'c1000000-0000-0000-0000-000000000003'), 84.00);

-- Venda 3 - 24 dias atras - Difusor Premium x1 + Vela x1 - Credito
INSERT INTO vendas (id, numero, data, cliente_id, subtotal, desconto, total, forma_pagamento, status, caixa_id)
VALUES ('f1000000-0000-0000-0000-000000000003', '000003', now() - INTERVAL '24 days',
        'd1000000-0000-0000-0000-000000000003', 120.00, 10.00, 110.00, 'credito', 'concluida',
        'e1000000-0000-0000-0000-000000000001');
INSERT INTO venda_itens (venda_id, produto_id, quantidade, preco_unitario, custo_unitario, subtotal) VALUES
  ('f1000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000005', 1, 75.00,
   (SELECT custo_producao FROM produtos WHERE id = 'c1000000-0000-0000-0000-000000000005'), 75.00),
  ('f1000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000001', 1, 45.00,
   (SELECT custo_producao FROM produtos WHERE id = 'c1000000-0000-0000-0000-000000000001'), 45.00);

-- Venda 4 - 21 dias atras - Escalda Pes x2 - PIX
INSERT INTO vendas (id, numero, data, cliente_id, subtotal, desconto, total, forma_pagamento, status, caixa_id)
VALUES ('f1000000-0000-0000-0000-000000000004', '000004', now() - INTERVAL '21 days',
        'd1000000-0000-0000-0000-000000000004', 76.00, 0, 76.00, 'pix', 'concluida',
        'e1000000-0000-0000-0000-000000000001');
INSERT INTO venda_itens (venda_id, produto_id, quantidade, preco_unitario, custo_unitario, subtotal) VALUES
  ('f1000000-0000-0000-0000-000000000004', 'c1000000-0000-0000-0000-000000000004', 2, 38.00,
   (SELECT custo_producao FROM produtos WHERE id = 'c1000000-0000-0000-0000-000000000004'), 76.00);

-- Venda 5 - 18 dias atras - Kit: Vela + Difusor + Home Spray - Debito
INSERT INTO vendas (id, numero, data, cliente_id, subtotal, desconto, total, forma_pagamento, status, caixa_id)
VALUES ('f1000000-0000-0000-0000-000000000005', '000005', now() - INTERVAL '18 days',
        'd1000000-0000-0000-0000-000000000005', 108.00, 0, 108.00, 'debito', 'concluida',
        'e1000000-0000-0000-0000-000000000001');
INSERT INTO venda_itens (venda_id, produto_id, quantidade, preco_unitario, custo_unitario, subtotal) VALUES
  ('f1000000-0000-0000-0000-000000000005', 'c1000000-0000-0000-0000-000000000001', 1, 45.00,
   (SELECT custo_producao FROM produtos WHERE id = 'c1000000-0000-0000-0000-000000000001'), 45.00),
  ('f1000000-0000-0000-0000-000000000005', 'c1000000-0000-0000-0000-000000000002', 1, 35.00,
   (SELECT custo_producao FROM produtos WHERE id = 'c1000000-0000-0000-0000-000000000002'), 35.00),
  ('f1000000-0000-0000-0000-000000000005', 'c1000000-0000-0000-0000-000000000003', 1, 28.00,
   (SELECT custo_producao FROM produtos WHERE id = 'c1000000-0000-0000-0000-000000000003'), 28.00);

-- Venda 6 - 15 dias atras - Difusor Premium x2 - PIX
INSERT INTO vendas (id, numero, data, subtotal, desconto, total, forma_pagamento, status, caixa_id)
VALUES ('f1000000-0000-0000-0000-000000000006', '000006', now() - INTERVAL '15 days',
        150.00, 0, 150.00, 'pix', 'concluida',
        'e1000000-0000-0000-0000-000000000001');
INSERT INTO venda_itens (venda_id, produto_id, quantidade, preco_unitario, custo_unitario, subtotal) VALUES
  ('f1000000-0000-0000-0000-000000000006', 'c1000000-0000-0000-0000-000000000005', 2, 75.00,
   (SELECT custo_producao FROM produtos WHERE id = 'c1000000-0000-0000-0000-000000000005'), 150.00);

-- Venda 7 - 12 dias atras - Vela x3 + Escalda Pes x1 - Dinheiro
INSERT INTO vendas (id, numero, data, cliente_id, subtotal, desconto, total, forma_pagamento, status, caixa_id)
VALUES ('f1000000-0000-0000-0000-000000000007', '000007', now() - INTERVAL '12 days',
        'd1000000-0000-0000-0000-000000000001', 173.00, 8.00, 165.00, 'dinheiro', 'concluida',
        'e1000000-0000-0000-0000-000000000001');
INSERT INTO venda_itens (venda_id, produto_id, quantidade, preco_unitario, custo_unitario, subtotal) VALUES
  ('f1000000-0000-0000-0000-000000000007', 'c1000000-0000-0000-0000-000000000001', 3, 45.00,
   (SELECT custo_producao FROM produtos WHERE id = 'c1000000-0000-0000-0000-000000000001'), 135.00),
  ('f1000000-0000-0000-0000-000000000007', 'c1000000-0000-0000-0000-000000000004', 1, 38.00,
   (SELECT custo_producao FROM produtos WHERE id = 'c1000000-0000-0000-0000-000000000004'), 38.00);

-- Venda 8 - 8 dias atras - Home Spray x2 + Difusor x1 - Credito
INSERT INTO vendas (id, numero, data, cliente_id, subtotal, desconto, total, forma_pagamento, status, caixa_id)
VALUES ('f1000000-0000-0000-0000-000000000008', '000008', now() - INTERVAL '8 days',
        'd1000000-0000-0000-0000-000000000002', 91.00, 0, 91.00, 'credito', 'concluida',
        'e1000000-0000-0000-0000-000000000001');
INSERT INTO venda_itens (venda_id, produto_id, quantidade, preco_unitario, custo_unitario, subtotal) VALUES
  ('f1000000-0000-0000-0000-000000000008', 'c1000000-0000-0000-0000-000000000003', 2, 28.00,
   (SELECT custo_producao FROM produtos WHERE id = 'c1000000-0000-0000-0000-000000000003'), 56.00),
  ('f1000000-0000-0000-0000-000000000008', 'c1000000-0000-0000-0000-000000000002', 1, 35.00,
   (SELECT custo_producao FROM produtos WHERE id = 'c1000000-0000-0000-0000-000000000002'), 35.00);

-- Venda 9 - 4 dias atras - Difusor Premium x1 + Vela x2 + Escalda Pes x1 - PIX
INSERT INTO vendas (id, numero, data, cliente_id, subtotal, desconto, total, forma_pagamento, status, caixa_id)
VALUES ('f1000000-0000-0000-0000-000000000009', '000009', now() - INTERVAL '4 days',
        'd1000000-0000-0000-0000-000000000003', 163.00, 15.00, 148.00, 'pix', 'concluida',
        'e1000000-0000-0000-0000-000000000001');
INSERT INTO venda_itens (venda_id, produto_id, quantidade, preco_unitario, custo_unitario, subtotal) VALUES
  ('f1000000-0000-0000-0000-000000000009', 'c1000000-0000-0000-0000-000000000005', 1, 75.00,
   (SELECT custo_producao FROM produtos WHERE id = 'c1000000-0000-0000-0000-000000000005'), 75.00),
  ('f1000000-0000-0000-0000-000000000009', 'c1000000-0000-0000-0000-000000000001', 2, 45.00,
   (SELECT custo_producao FROM produtos WHERE id = 'c1000000-0000-0000-0000-000000000001'), 90.00),
  ('f1000000-0000-0000-0000-000000000009', 'c1000000-0000-0000-0000-000000000004', 1, 38.00,
   (SELECT custo_producao FROM produtos WHERE id = 'c1000000-0000-0000-0000-000000000004'), 38.00);

-- Venda 10 - Hoje - Vela x1 + Home Spray x1 - PIX
INSERT INTO vendas (id, numero, data, cliente_id, subtotal, desconto, total, forma_pagamento, status, caixa_id)
VALUES ('f1000000-0000-0000-0000-000000000010', '000010', now(),
        'd1000000-0000-0000-0000-000000000004', 73.00, 0, 73.00, 'pix', 'concluida',
        'e1000000-0000-0000-0000-000000000001');
INSERT INTO venda_itens (venda_id, produto_id, quantidade, preco_unitario, custo_unitario, subtotal) VALUES
  ('f1000000-0000-0000-0000-000000000010', 'c1000000-0000-0000-0000-000000000001', 1, 45.00,
   (SELECT custo_producao FROM produtos WHERE id = 'c1000000-0000-0000-0000-000000000001'), 45.00),
  ('f1000000-0000-0000-0000-000000000010', 'c1000000-0000-0000-0000-000000000003', 1, 28.00,
   (SELECT custo_producao FROM produtos WHERE id = 'c1000000-0000-0000-0000-000000000003'), 28.00);

-- ============================================================
-- Update product stock to reflect what would remain after sample sales
-- (In production, processar_venda RPC handles this automatically)
-- The initial estoque_atual=10 was set assuming no prior sales.
-- After 10 sample vendas the actual stock should be adjusted.
-- For simplicity in seed, we recalculate based on vendas.
-- ============================================================
UPDATE produtos SET estoque_atual = 10 - (
  SELECT COALESCE(SUM(vi.quantidade), 0)
  FROM venda_itens vi
  JOIN vendas v ON v.id = vi.venda_id AND v.status = 'concluida'
  WHERE vi.produto_id = produtos.id
);

-- Ensure no negative stock (clamp to 0)
UPDATE produtos SET estoque_atual = 0 WHERE estoque_atual < 0;

-- ============================================================
-- SAMPLE PRODUCOES (production records)
-- ============================================================
INSERT INTO producoes (produto_id, quantidade_produzida, custo_total, lote, validade, data, observacao) VALUES
  ('c1000000-0000-0000-0000-000000000001',
   20,
   (SELECT custo_producao FROM produtos WHERE id = 'c1000000-0000-0000-0000-000000000001') * 20,
   'LOT-20260510-001',
   CURRENT_DATE + 365,
   now() - INTERVAL '5 days',
   'Primeiro lote do mes'),
  ('c1000000-0000-0000-0000-000000000002',
   15,
   (SELECT custo_producao FROM produtos WHERE id = 'c1000000-0000-0000-0000-000000000002') * 15,
   'LOT-20260510-002',
   CURRENT_DATE + 180,
   now() - INTERVAL '3 days',
   'Producao semanal difusores'),
  ('c1000000-0000-0000-0000-000000000003',
   20,
   (SELECT custo_producao FROM produtos WHERE id = 'c1000000-0000-0000-0000-000000000003') * 20,
   'LOT-20260510-003',
   CURRENT_DATE + 365,
   now() - INTERVAL '2 days',
   'Producao semanal home spray');

-- ============================================================
-- MOVIMENTACOES ESTOQUE (sample stock movements for audit trail)
-- ============================================================
INSERT INTO movimentacoes_estoque (tipo, referencia_tipo, referencia_id, quantidade, custo_unitario, motivo, data) VALUES
  ('entrada_insumo', 'insumo', 'b1000000-0000-0000-0000-000000000006', 2000, 0.032000, 'Compra Cera de Coco Mole', now() - INTERVAL '15 days'),
  ('entrada_insumo', 'insumo', 'b1000000-0000-0000-0000-000000000003', 300, 0.350000, 'Compra Essencia', now() - INTERVAL '15 days'),
  ('entrada_insumo', 'insumo', 'b1000000-0000-0000-0000-000000000001', 2000, 0.008000, 'Compra Alcool', now() - INTERVAL '10 days'),
  ('entrada_insumo', 'insumo', 'b1000000-0000-0000-0000-000000000019', 200, 0.350000, 'Compra Etiquetas', now() - INTERVAL '10 days');

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

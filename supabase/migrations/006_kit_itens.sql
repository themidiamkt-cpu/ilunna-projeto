-- ============================================================
-- Migration 006: tipo de produto + kit_itens
-- ============================================================

-- Adiciona coluna tipo em produtos
ALTER TABLE produtos
  ADD COLUMN IF NOT EXISTS tipo TEXT NOT NULL DEFAULT 'simples'
  CHECK (tipo IN ('simples', 'producao', 'kit'));

-- Tabela de composição de kits
CREATE TABLE IF NOT EXISTS kit_itens (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kit_id        UUID NOT NULL REFERENCES produtos(id) ON DELETE CASCADE,
  produto_id    UUID NOT NULL REFERENCES produtos(id),
  quantidade    NUMERIC(10,3) NOT NULL DEFAULT 1 CHECK (quantidade > 0),
  custo_unitario NUMERIC(10,4) NOT NULL DEFAULT 0,
  custo_linha   NUMERIC(10,4) GENERATED ALWAYS AS (quantidade * custo_unitario) STORED,
  created_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE(kit_id, produto_id)
);

ALTER TABLE kit_itens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "kit_itens_select" ON kit_itens
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "kit_itens_write" ON kit_itens
  FOR ALL TO authenticated
  USING (get_user_papel() = 'admin')
  WITH CHECK (get_user_papel() = 'admin');

-- Função: recalcula custo_producao de um kit a partir dos seus itens
CREATE OR REPLACE FUNCTION recalc_custo_kit(p_kit_id UUID)
RETURNS VOID LANGUAGE plpgsql AS $$
DECLARE
  v_custo NUMERIC;
BEGIN
  SELECT COALESCE(SUM(ki.quantidade * p.custo_producao), 0)
    INTO v_custo
    FROM kit_itens ki
    JOIN produtos p ON p.id = ki.produto_id
   WHERE ki.kit_id = p_kit_id;

  UPDATE produtos SET custo_producao = v_custo, updated_at = now()
   WHERE id = p_kit_id;
END;
$$;

-- Trigger: ao mudar kit_itens, recalcula custo do kit
CREATE OR REPLACE FUNCTION trg_kit_itens_recalc()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM recalc_custo_kit(OLD.kit_id);
  ELSE
    PERFORM recalc_custo_kit(NEW.kit_id);
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS kit_itens_recalc ON kit_itens;
CREATE TRIGGER kit_itens_recalc
  AFTER INSERT OR UPDATE OR DELETE ON kit_itens
  FOR EACH ROW EXECUTE FUNCTION trg_kit_itens_recalc();

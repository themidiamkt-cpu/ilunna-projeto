-- ============================================================
-- MIGRATION 008: Receitas de insumos compostos
-- Permite que um insumo seja produzido a partir de outros insumos.
-- ============================================================

CREATE TABLE IF NOT EXISTS insumo_composicoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  insumo_id UUID REFERENCES insumos(id) ON DELETE CASCADE NOT NULL,
  componente_insumo_id UUID REFERENCES insumos(id) NOT NULL,
  quantidade NUMERIC(12,4) NOT NULL DEFAULT 0,
  custo_linha NUMERIC(12,6) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(insumo_id, componente_insumo_id),
  CHECK (insumo_id <> componente_insumo_id)
);

ALTER TABLE insumo_composicoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "insumo_composicoes_select" ON insumo_composicoes
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "insumo_composicoes_admin_write" ON insumo_composicoes
  FOR ALL TO authenticated
  USING (get_user_papel() = 'admin')
  WITH CHECK (get_user_papel() = 'admin');

CREATE INDEX IF NOT EXISTS idx_insumo_composicoes_insumo
  ON insumo_composicoes(insumo_id);

CREATE INDEX IF NOT EXISTS idx_insumo_composicoes_componente
  ON insumo_composicoes(componente_insumo_id);

CREATE OR REPLACE FUNCTION calc_custo_linha_insumo_composicao()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  v_custo_unitario NUMERIC;
BEGIN
  SELECT custo_unitario INTO v_custo_unitario
  FROM insumos
  WHERE id = NEW.componente_insumo_id;

  NEW.custo_linha = NEW.quantidade * COALESCE(v_custo_unitario, 0);
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER tr_calc_custo_linha_insumo_composicao
BEFORE INSERT OR UPDATE ON insumo_composicoes
FOR EACH ROW EXECUTE FUNCTION calc_custo_linha_insumo_composicao();

CREATE OR REPLACE FUNCTION recalc_custo_insumo_composto(p_insumo_id UUID)
RETURNS VOID LANGUAGE plpgsql AS $$
DECLARE
  v_custo NUMERIC;
  v_volume NUMERIC;
BEGIN
  SELECT COALESCE(SUM(custo_linha), 0)
  INTO v_custo
  FROM insumo_composicoes
  WHERE insumo_id = p_insumo_id;

  SELECT volume_compra
  INTO v_volume
  FROM insumos
  WHERE id = p_insumo_id;

  UPDATE insumos
  SET
    custo_compra = v_custo,
    custo_unitario = CASE WHEN COALESCE(v_volume, 0) > 0 THEN v_custo / v_volume ELSE 0 END,
    updated_at = now()
  WHERE id = p_insumo_id;
END;
$$;

CREATE OR REPLACE FUNCTION tr_insumo_composicao_changed()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM recalc_custo_insumo_composto(OLD.insumo_id);
  ELSE
    PERFORM recalc_custo_insumo_composto(NEW.insumo_id);
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER tr_insumo_composicao_changed_trigger
AFTER INSERT OR UPDATE OR DELETE ON insumo_composicoes
FOR EACH ROW EXECUTE FUNCTION tr_insumo_composicao_changed();

CREATE OR REPLACE FUNCTION cascade_recalc_from_componente_insumo()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  v_insumo_id UUID;
BEGIN
  IF NEW.custo_unitario IS DISTINCT FROM OLD.custo_unitario THEN
    UPDATE insumo_composicoes
    SET custo_linha = quantidade * NEW.custo_unitario, updated_at = now()
    WHERE componente_insumo_id = NEW.id;

    FOR v_insumo_id IN
      SELECT DISTINCT insumo_id FROM insumo_composicoes WHERE componente_insumo_id = NEW.id
    LOOP
      PERFORM recalc_custo_insumo_composto(v_insumo_id);
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER tr_cascade_from_componente_insumo
AFTER UPDATE OF custo_unitario ON insumos
FOR EACH ROW EXECUTE FUNCTION cascade_recalc_from_componente_insumo();

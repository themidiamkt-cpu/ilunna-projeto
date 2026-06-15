-- Exige cliente nas novas vendas registradas como concluidas.
-- Mantem vendas historicas sem cliente intactas.

CREATE OR REPLACE FUNCTION validar_cliente_venda()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status = 'concluida' AND NEW.cliente_id IS NULL THEN
    RAISE EXCEPTION 'Selecione um cliente para registrar a venda';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validar_cliente_venda ON vendas;
CREATE TRIGGER trg_validar_cliente_venda
BEFORE INSERT OR UPDATE ON vendas
FOR EACH ROW
EXECUTE FUNCTION validar_cliente_venda();

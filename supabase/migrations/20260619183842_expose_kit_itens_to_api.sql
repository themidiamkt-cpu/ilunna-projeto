-- Expose kit item composition to the Supabase Data API for logged-in users.
-- RLS policies still control which rows can be read/written.
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.kit_itens TO authenticated;

-- Kits can now be composed from other products and direct insumos.
CREATE OR REPLACE FUNCTION public.recalc_custo_kit(p_kit_id UUID)
RETURNS VOID LANGUAGE plpgsql AS $$
DECLARE
  v_custo_produtos NUMERIC;
  v_custo_insumos NUMERIC;
  v_custo_total NUMERIC;
BEGIN
  SELECT COALESCE(SUM(ki.quantidade * p.custo_producao), 0)
    INTO v_custo_produtos
    FROM public.kit_itens ki
    JOIN public.produtos p ON p.id = ki.produto_id
   WHERE ki.kit_id = p_kit_id;

  SELECT COALESCE(SUM(ft.custo_linha), 0)
    INTO v_custo_insumos
    FROM public.fichas_tecnicas ft
   WHERE ft.produto_id = p_kit_id;

  v_custo_total := v_custo_produtos + v_custo_insumos;

  UPDATE public.produtos
     SET custo_producao = v_custo_total,
         preco_venda = CASE WHEN v_custo_total > 0 THEN v_custo_total * 3 ELSE 0 END,
         updated_at = now()
   WHERE id = p_kit_id;
END;
$$;

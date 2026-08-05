-- Produtos agora guardam o markup usado no cálculo do preço de venda.
ALTER TABLE public.produtos
  ADD COLUMN IF NOT EXISTS markup NUMERIC(8,4) NOT NULL DEFAULT 3;

-- As velas sem pote/latinha foram precificadas com margem maior para cobrir etiqueta,
-- papel seda, fita e acabamento. Mantemos esse comportamento no cadastro.
UPDATE public.produtos p
   SET markup = 4,
       preco_venda = CASE
         WHEN p.custo_producao > 0 THEN round(p.custo_producao * 4, 2)
         ELSE p.preco_venda
       END,
       updated_at = now()
  FROM public.categorias c
 WHERE p.categoria_id = c.id
   AND lower(c.nome) = 'velas';

UPDATE public.produtos
   SET markup = 4,
       preco_venda = CASE
         WHEN custo_producao > 0 THEN round(custo_producao * 4, 2)
         ELSE preco_venda
       END,
       updated_at = now()
 WHERE sku LIKE 'VELA-SEM-POTE-%'
    OR sku = 'VELA-LATINHA-FRASE-20G';

CREATE OR REPLACE VIEW public.vw_margem_produtos AS
SELECT
  p.id,
  p.nome,
  p.sku,
  c.nome AS categoria,
  c.cor AS categoria_cor,
  p.markup,
  p.preco_venda,
  p.custo_producao,
  p.margem_valor,
  p.margem_percentual,
  p.estoque_atual,
  p.estoque_minimo,
  p.ativo
FROM public.produtos p
LEFT JOIN public.categorias c ON c.id = p.categoria_id
ORDER BY p.margem_percentual DESC;

CREATE OR REPLACE FUNCTION public.recalc_custo_producao(p_produto_id UUID)
RETURNS VOID LANGUAGE plpgsql AS $$
DECLARE
  v_custo NUMERIC;
  v_markup NUMERIC;
BEGIN
  SELECT COALESCE(SUM(custo_linha), 0)
    INTO v_custo
    FROM public.fichas_tecnicas
   WHERE produto_id = p_produto_id;

  SELECT COALESCE(markup, 3)
    INTO v_markup
    FROM public.produtos
   WHERE id = p_produto_id;

  UPDATE public.produtos
     SET custo_producao = v_custo,
         preco_venda = CASE WHEN v_custo > 0 THEN round(v_custo * v_markup, 2) ELSE 0 END,
         updated_at = now()
   WHERE id = p_produto_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.recalc_custo_kit(p_kit_id UUID)
RETURNS VOID LANGUAGE plpgsql AS $$
DECLARE
  v_custo_produtos NUMERIC;
  v_custo_insumos NUMERIC;
  v_custo_total NUMERIC;
  v_markup NUMERIC;
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

  SELECT COALESCE(markup, 3)
    INTO v_markup
    FROM public.produtos
   WHERE id = p_kit_id;

  v_custo_total := v_custo_produtos + v_custo_insumos;

  UPDATE public.produtos
     SET custo_producao = v_custo_total,
         preco_venda = CASE WHEN v_custo_total > 0 THEN round(v_custo_total * v_markup, 2) ELSE 0 END,
         updated_at = now()
   WHERE id = p_kit_id;
END;
$$;

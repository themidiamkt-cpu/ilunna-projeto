-- Cadastro em lote das velas com pote enviadas em 2026-08-31.
-- Padrao: cera de coco mole + essencia 10% + pote + tampa + pavio + etiqueta + etiqueta de seguranca + lacre.
-- Markup usado: 4.

ALTER TABLE public.produtos
  ADD COLUMN IF NOT EXISTS markup NUMERIC(8,4) NOT NULL DEFAULT 3;

DO $$
DECLARE
  v_categoria_id uuid;
  v_cera_id uuid;
  v_essencia_id uuid;
  v_pavio_algodao_id uuid;
  v_pavio_madeira_id uuid;
  v_tampa_gourmet_id uuid;
  v_etiqueta_id uuid;
  v_etiqueta_seguranca_id uuid;
  v_lacre_id uuid;
  v_pote_id uuid;
  v_produto_id uuid;
  v_custo numeric;
  v_item record;
BEGIN
  SELECT id INTO v_categoria_id
    FROM public.categorias
   WHERE lower(nome) = 'velas'
   ORDER BY created_at
   LIMIT 1;

  IF v_categoria_id IS NULL THEN
    INSERT INTO public.categorias (nome, descricao, cor)
    VALUES ('Velas', 'Velas artesanais', '#C4704F')
    RETURNING id INTO v_categoria_id;
  END IF;

  SELECT id INTO v_cera_id
    FROM public.insumos
   WHERE ativo = true
     AND lower(nome) LIKE '%cera%'
     AND lower(nome) LIKE '%coco%'
     AND (lower(nome) LIKE '%mole%' OR lower(nome) LIKE '%ponto%')
   ORDER BY
     CASE WHEN lower(nome) LIKE '%mole%' THEN 0 ELSE 1 END,
     CASE WHEN lower(coalesce(fornecedor, '')) LIKE '%ponto%' THEN 0 ELSE 1 END,
     nome
   LIMIT 1;

  IF v_cera_id IS NULL THEN
    INSERT INTO public.insumos (
      nome, tipo, unidade, volume_compra, custo_compra, custo_unitario,
      estoque_atual, estoque_minimo, fornecedor, ativo
    )
    VALUES ('Cera de coco mole Ponto Quimica', 'solido', 'gr', 1000, 0, 0, 0, 0, 'Ponto Quimica', true)
    RETURNING id INTO v_cera_id;
  END IF;

  SELECT id INTO v_essencia_id
    FROM public.insumos
   WHERE ativo = true
     AND (lower(nome) LIKE '%essencia%' OR lower(nome) LIKE '%essência%')
   ORDER BY
     CASE WHEN lower(coalesce(fornecedor, '')) LIKE '%peter%' OR lower(coalesce(fornecedor, '')) LIKE '%piter%' THEN 0 ELSE 1 END,
     CASE WHEN lower(nome) LIKE '%vela%' THEN 0 ELSE 1 END,
     nome
   LIMIT 1;

  IF v_essencia_id IS NULL THEN
    INSERT INTO public.insumos (
      nome, tipo, unidade, volume_compra, custo_compra, custo_unitario,
      estoque_atual, estoque_minimo, fornecedor, ativo
    )
    VALUES ('Essencia Peter Paiva para velas', 'liquido', 'ml', 1000, 0, 0, 0, 0, 'Peter Paiva', true)
    RETURNING id INTO v_essencia_id;
  END IF;

  SELECT id INTO v_pavio_algodao_id
    FROM public.insumos
   WHERE ativo = true
     AND lower(nome) LIKE '%pavio%'
     AND (lower(nome) LIKE '%algod%' OR lower(nome) LIKE '%pavil%')
   ORDER BY
     CASE WHEN lower(nome) LIKE '%algod%' THEN 0 ELSE 1 END,
     nome
   LIMIT 1;

  IF v_pavio_algodao_id IS NULL THEN
    INSERT INTO public.insumos (
      nome, tipo, unidade, volume_compra, custo_compra, custo_unitario,
      estoque_atual, estoque_minimo, fornecedor, ativo
    )
    VALUES ('Pavio Algodao', 'acessorio', 'un', 1, 0, 0, 0, 0, NULL, true)
    RETURNING id INTO v_pavio_algodao_id;
  END IF;

  SELECT id INTO v_pavio_madeira_id
    FROM public.insumos
   WHERE ativo = true
     AND lower(nome) LIKE '%pavio%'
     AND lower(nome) LIKE '%madeira%'
   ORDER BY nome
   LIMIT 1;

  IF v_pavio_madeira_id IS NULL THEN
    INSERT INTO public.insumos (
      nome, tipo, unidade, volume_compra, custo_compra, custo_unitario,
      estoque_atual, estoque_minimo, fornecedor, ativo
    )
    VALUES ('Pavio Madeira', 'acessorio', 'un', 1, 0, 0, 0, 0, NULL, true)
    RETURNING id INTO v_pavio_madeira_id;
  END IF;

  SELECT id INTO v_tampa_gourmet_id
    FROM public.insumos
   WHERE nome = 'Tampa gourmet Peter Paiva R$ 8,20'
   ORDER BY created_at
   LIMIT 1;

  IF v_tampa_gourmet_id IS NULL THEN
    INSERT INTO public.insumos (
      nome, tipo, unidade, volume_compra, custo_compra, custo_unitario,
      estoque_atual, estoque_minimo, fornecedor, ativo
    )
    VALUES ('Tampa gourmet Peter Paiva R$ 8,20', 'embalagem', 'un', 1, 8.20, 8.20, 0, 0, 'Peter Paiva', true)
    RETURNING id INTO v_tampa_gourmet_id;
  END IF;

  SELECT id INTO v_etiqueta_id
    FROM public.insumos
   WHERE ativo = true
     AND lower(nome) = 'etiqueta'
   ORDER BY created_at
   LIMIT 1;

  IF v_etiqueta_id IS NULL THEN
    INSERT INTO public.insumos (
      nome, tipo, unidade, volume_compra, custo_compra, custo_unitario,
      estoque_atual, estoque_minimo, fornecedor, ativo
    )
    VALUES ('Etiqueta', 'acessorio', 'un', 1, 0, 0, 0, 0, NULL, true)
    RETURNING id INTO v_etiqueta_id;
  END IF;

  SELECT id INTO v_etiqueta_seguranca_id
    FROM public.insumos
   WHERE ativo = true
     AND lower(nome) LIKE '%etiqueta%'
     AND lower(nome) LIKE '%seguranca%'
   ORDER BY created_at
   LIMIT 1;

  IF v_etiqueta_seguranca_id IS NULL THEN
    INSERT INTO public.insumos (
      nome, tipo, unidade, volume_compra, custo_compra, custo_unitario,
      estoque_atual, estoque_minimo, fornecedor, ativo
    )
    VALUES ('Etiqueta de seguranca', 'acessorio', 'un', 1, 0, 0, 0, 0, NULL, true)
    RETURNING id INTO v_etiqueta_seguranca_id;
  END IF;

  SELECT id INTO v_lacre_id
    FROM public.insumos
   WHERE ativo = true
     AND lower(nome) LIKE '%lacre%'
   ORDER BY created_at
   LIMIT 1;

  IF v_lacre_id IS NULL THEN
    INSERT INTO public.insumos (
      nome, tipo, unidade, volume_compra, custo_compra, custo_unitario,
      estoque_atual, estoque_minimo, fornecedor, ativo
    )
    VALUES ('Lacre de Seguranca', 'acessorio', 'un', 100, 8.00, 0.08, 0, 0, NULL, true)
    RETURNING id INTO v_lacre_id;
  END IF;

  FOR v_item IN
    SELECT *
    FROM (VALUES
      ('VELA-FLOWERS-180G', 'Vela Flowers 180g', 180.0, 18.0, 'Pote Vela Flowers R$ 6,98', 6.98, 'algodao', 8),
      ('VELA-CLASSICA-TAMPA-BRANCA-ENGLISH-P-100G', 'Vela Classica Tampa Branca English P. 100g', 100.0, 10.0, 'Pote 150ml R$ 4,50', 4.50, 'algodao', 1),
      ('VELA-CLASSICA-TAMPA-BRANCA-ENGLISH-P-180G', 'Vela Classica Tampa Branca English P. 180g', 180.0, 18.0, 'Pote 180ml R$ 5,50', 5.50, 'algodao', 1),
      ('VELA-OURO-TAMPA-DOURADA-100G', 'Vela Ouro Tampa Dourada 100g', 100.0, 10.0, 'Pote 150ml R$ 4,50', 4.50, 'madeira', 3),
      ('VELA-OURO-TAMPA-DOURADA-180G', 'Vela Ouro Tampa Dourada 180g', 180.0, 18.0, 'Pote 180ml R$ 5,50', 5.50, 'madeira', 3),
      ('VELA-CLASSICA-TAMPA-PRETA-VANILA-100G', 'Vela Classica Tampa Preta Vanila 100g', 100.0, 10.0, 'Pote 150ml R$ 4,50', 4.50, 'algodao', 1),
      ('VELA-CLASSICA-TAMPA-PRETA-ENGLISH-180G', 'Vela Classica Tampa Preta English 180g', 180.0, 18.0, 'Pote 180ml R$ 5,50', 5.50, 'algodao', 1)
    ) AS t(sku, nome, peso_cera, peso_essencia, pote_nome, pote_custo, pavio_tipo, estoque)
  LOOP
    SELECT id INTO v_pote_id
      FROM public.insumos
     WHERE nome = v_item.pote_nome
     ORDER BY created_at
     LIMIT 1;

    IF v_pote_id IS NULL THEN
      INSERT INTO public.insumos (
        nome, tipo, unidade, volume_compra, custo_compra, custo_unitario,
        estoque_atual, estoque_minimo, fornecedor, ativo
      )
      VALUES (
        v_item.pote_nome, 'embalagem', 'un', 1, v_item.pote_custo, v_item.pote_custo,
        0, 0, NULL, true
      )
      RETURNING id INTO v_pote_id;
    END IF;

    INSERT INTO public.produtos (
      nome, sku, tipo, categoria_id, markup, preco_venda, custo_producao,
      estoque_atual, estoque_minimo, ativo
    )
    VALUES (
      v_item.nome, v_item.sku, 'producao', v_categoria_id, 4, 0, 0,
      v_item.estoque, 0, true
    )
    ON CONFLICT (sku) DO UPDATE SET
      nome = excluded.nome,
      tipo = excluded.tipo,
      categoria_id = excluded.categoria_id,
      markup = excluded.markup,
      estoque_atual = excluded.estoque_atual,
      estoque_minimo = excluded.estoque_minimo,
      ativo = true,
      updated_at = now()
    RETURNING id INTO v_produto_id;

    DELETE FROM public.fichas_tecnicas
     WHERE produto_id = v_produto_id;

    INSERT INTO public.fichas_tecnicas (produto_id, insumo_id, quantidade)
    VALUES
      (v_produto_id, v_cera_id, v_item.peso_cera),
      (v_produto_id, v_essencia_id, v_item.peso_essencia),
      (v_produto_id, CASE WHEN v_item.pavio_tipo = 'madeira' THEN v_pavio_madeira_id ELSE v_pavio_algodao_id END, 1),
      (v_produto_id, v_pote_id, 1),
      (v_produto_id, v_etiqueta_id, 1),
      (v_produto_id, v_tampa_gourmet_id, 1),
      (v_produto_id, v_etiqueta_seguranca_id, 1),
      (v_produto_id, v_lacre_id, 1);

    SELECT COALESCE(SUM(custo_linha), 0)
      INTO v_custo
      FROM public.fichas_tecnicas
     WHERE produto_id = v_produto_id;

    UPDATE public.produtos
       SET custo_producao = v_custo,
           preco_venda = round(v_custo * 4, 2),
           updated_at = now()
     WHERE id = v_produto_id;
  END LOOP;
END $$;

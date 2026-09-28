-- Segundo lote de cadastros recebido por prints em 2026-09-28.
-- Valores de venda explicitamente informados sao preservados.
-- Insumos/embalagens sem custo informado ficam zerados, sem estimativa.

DO $$
DECLARE
  v_cat_escalda uuid;
  v_cat_velas uuid;
  v_produto uuid;
  v_sal uuid;
  v_artemisia uuid;
  v_camomila uuid;
  v_hibisco uuid;
  v_oleo_canela uuid;
  v_boldo uuid;
  v_aroeira uuid;
  v_alfazema uuid;
  v_sache uuid;
  v_etiqueta uuid;
  v_cera uuid;
  v_essencia uuid;
  v_pavio uuid;
  v_lata uuid;
  v_custo numeric;
  v_item record;
BEGIN
  SELECT id INTO v_cat_escalda FROM public.categorias
   WHERE lower(nome) = 'escalda pes' ORDER BY created_at LIMIT 1;
  SELECT id INTO v_cat_velas FROM public.categorias
   WHERE lower(nome) = 'velas' ORDER BY created_at LIMIT 1;

  SELECT id INTO v_etiqueta FROM public.insumos
   WHERE ativo = true AND lower(nome) = 'etiqueta' ORDER BY created_at LIMIT 1;
  SELECT id INTO v_sal FROM public.insumos
   WHERE ativo = true AND lower(nome) = 'sal grosso' ORDER BY created_at LIMIT 1;

  IF v_cat_escalda IS NULL OR v_cat_velas IS NULL OR v_etiqueta IS NULL OR v_sal IS NULL THEN
    RAISE EXCEPTION 'Categoria ou insumo basico nao encontrado';
  END IF;

  -- O Jelly Spa deste lote foi comprado pronto.
  INSERT INTO public.produtos (
    nome, sku, tipo, categoria_id, custo_producao, preco_venda, markup,
    estoque_atual, estoque_minimo, ativo
  ) VALUES (
    'Jelly Spa', 'JELLY-SPA', 'simples', v_cat_escalda, 39.90, 79.90,
    round(79.90 / 39.90, 4), 15, 0, true
  )
  ON CONFLICT (sku) DO UPDATE SET
    nome = excluded.nome,
    tipo = excluded.tipo,
    categoria_id = excluded.categoria_id,
    custo_producao = excluded.custo_producao,
    preco_venda = excluded.preco_venda,
    markup = excluded.markup,
    estoque_atual = excluded.estoque_atual,
    estoque_minimo = excluded.estoque_minimo,
    ativo = true,
    updated_at = now()
  RETURNING id INTO v_produto;
  DELETE FROM public.fichas_tecnicas WHERE produto_id = v_produto;
  -- O trigger de exclusao recalcula o custo pela ficha; restaura o custo do item comprado pronto.
  UPDATE public.produtos
     SET custo_producao = 39.90, preco_venda = 79.90, markup = round(79.90 / 39.90, 4)
   WHERE id = v_produto;

  -- Insumos dos escalda-pes sem valor de compra informado nos prints.
  FOR v_item IN
    SELECT * FROM (VALUES
      ('Artemisia', 'solido', 'gr'),
      ('Camomila', 'solido', 'gr'),
      ('Hibisco', 'solido', 'gr'),
      ('Oleo essencial de canela', 'liquido', 'un'),
      ('Boldo', 'solido', 'gr'),
      ('Aroeira', 'solido', 'gr'),
      ('Alfazema ou Lavanda', 'solido', 'gr'),
      ('Sache kraft para escalda-pes 50g', 'embalagem', 'un')
    ) AS t(nome, tipo, unidade)
  LOOP
    IF NOT EXISTS (SELECT 1 FROM public.insumos WHERE lower(nome) = lower(v_item.nome)) THEN
      INSERT INTO public.insumos (
        nome, tipo, unidade, volume_compra, custo_compra, custo_unitario,
        estoque_atual, estoque_minimo, ativo
      ) VALUES (
        v_item.nome,
        v_item.tipo::public.tipo_insumo,
        v_item.unidade::public.unidade_insumo,
        1, 0, 0, 0, 0, true
      );
    END IF;
  END LOOP;

  SELECT id INTO v_artemisia FROM public.insumos WHERE lower(nome) = 'artemisia' ORDER BY created_at LIMIT 1;
  SELECT id INTO v_camomila FROM public.insumos WHERE lower(nome) = 'camomila' ORDER BY created_at LIMIT 1;
  SELECT id INTO v_hibisco FROM public.insumos WHERE lower(nome) = 'hibisco' ORDER BY created_at LIMIT 1;
  SELECT id INTO v_oleo_canela FROM public.insumos WHERE lower(nome) = 'oleo essencial de canela' ORDER BY created_at LIMIT 1;
  SELECT id INTO v_boldo FROM public.insumos WHERE lower(nome) = 'boldo' ORDER BY created_at LIMIT 1;
  SELECT id INTO v_aroeira FROM public.insumos WHERE lower(nome) = 'aroeira' ORDER BY created_at LIMIT 1;
  SELECT id INTO v_alfazema FROM public.insumos WHERE lower(nome) = 'alfazema ou lavanda' ORDER BY created_at LIMIT 1;
  SELECT id INTO v_sache FROM public.insumos WHERE lower(nome) = 'sache kraft para escalda-pes 50g' ORDER BY created_at LIMIT 1;

  FOR v_item IN
    SELECT * FROM (VALUES
      ('ESCALDA-PES-TPM-50G', 'Escalda-pes TPM 50g', 10::numeric, 'tpm'),
      ('ESCALDA-PES-LUA-CHEIA-50G', 'Escalda-pes Lua Cheia 50g', 10::numeric, 'cheia'),
      ('ESCALDA-PES-LUA-MINGUANTE-50G', 'Escalda-pes Lua Minguante 50g', 10::numeric, 'minguante'),
      ('ESCALDA-PES-LUA-CRESCENTE-50G', 'Escalda-pes Lua Crescente 50g', 10::numeric, 'crescente')
    ) AS t(sku, nome, estoque, formula)
  LOOP
    INSERT INTO public.produtos (
      nome, sku, tipo, categoria_id, custo_producao, preco_venda, markup,
      estoque_atual, estoque_minimo, ativo
    ) VALUES (
      v_item.nome, v_item.sku, 'producao', v_cat_escalda, 0, 19.90, 3,
      v_item.estoque, 0, true
    )
    ON CONFLICT (sku) DO UPDATE SET
      nome = excluded.nome, tipo = excluded.tipo, categoria_id = excluded.categoria_id,
      preco_venda = excluded.preco_venda, estoque_atual = excluded.estoque_atual,
      estoque_minimo = excluded.estoque_minimo, ativo = true, updated_at = now()
    RETURNING id INTO v_produto;

    DELETE FROM public.fichas_tecnicas WHERE produto_id = v_produto;
    INSERT INTO public.fichas_tecnicas (produto_id, insumo_id, quantidade)
    VALUES (v_produto, v_sache, 1), (v_produto, v_etiqueta, 1);

    IF v_item.formula = 'tpm' THEN
      INSERT INTO public.fichas_tecnicas (produto_id, insumo_id, quantidade) VALUES
        (v_produto, v_sal, 47.1698), (v_produto, v_artemisia, 0.9434),
        (v_produto, v_camomila, 0.9434), (v_produto, v_hibisco, 0.9434),
        (v_produto, v_oleo_canela, 0.2830);
    ELSE
      INSERT INTO public.fichas_tecnicas (produto_id, insumo_id, quantidade) VALUES
        (v_produto, v_sal, 48.0769), (v_produto, v_artemisia, 0.9615),
        (v_produto, CASE v_item.formula WHEN 'cheia' THEN v_boldo WHEN 'minguante' THEN v_aroeira ELSE v_alfazema END, 0.9615);
    END IF;

    SELECT coalesce(sum(custo_linha), 0) INTO v_custo
    FROM public.fichas_tecnicas WHERE produto_id = v_produto;
    UPDATE public.produtos SET custo_producao = v_custo, updated_at = now() WHERE id = v_produto;
  END LOOP;

  INSERT INTO public.produtos (
    nome, sku, tipo, categoria_id, custo_producao, preco_venda, markup,
    estoque_atual, estoque_minimo, ativo
  ) VALUES (
    'Escalda-pes Ciclo Feminino', 'ESCALDA-PES-CICLO-FEMININO', 'simples',
    v_cat_escalda, 0, 59.90, 3, 4, 0, true
  )
  ON CONFLICT (sku) DO UPDATE SET
    nome = excluded.nome, tipo = excluded.tipo, categoria_id = excluded.categoria_id,
    custo_producao = excluded.custo_producao, preco_venda = excluded.preco_venda,
    estoque_atual = excluded.estoque_atual, ativo = true, updated_at = now()
  RETURNING id INTO v_produto;
  DELETE FROM public.fichas_tecnicas WHERE produto_id = v_produto;

  SELECT id INTO v_cera FROM public.insumos
   WHERE ativo = true AND lower(nome) = 'cera de coco mole' ORDER BY created_at LIMIT 1;
  SELECT id INTO v_essencia FROM public.insumos
   WHERE ativo = true AND lower(nome) = 'essencia' ORDER BY created_at LIMIT 1;
  SELECT id INTO v_pavio FROM public.insumos
   WHERE ativo = true AND lower(nome) = 'pavio' ORDER BY created_at LIMIT 1;

  IF v_cera IS NULL OR v_essencia IS NULL OR v_pavio IS NULL THEN
    RAISE EXCEPTION 'Insumo basico de vela nao encontrado';
  END IF;

  FOR v_item IN
    SELECT * FROM (VALUES
      ('VELA-LATINHA-CHA-BRANCO-CINZA-100G', 'Vela latinha Cha Branco cinza 100g', 'Latinha cinza para vela 100g'),
      ('VELA-LATINHA-CASCAS-FOLHAS-BRANCA-100G', 'Vela latinha Cascas e Folhas branca 100g', 'Latinha branca para vela 100g'),
      ('VELA-LATINHA-CASCAS-FOLHAS-DOURADA-100G', 'Vela latinha Cascas e Folhas dourada 100g', 'Latinha dourada para vela 100g')
    ) AS t(sku, nome, lata_nome)
  LOOP
    SELECT id INTO v_lata FROM public.insumos WHERE nome = v_item.lata_nome ORDER BY created_at LIMIT 1;
    IF v_lata IS NULL THEN
      INSERT INTO public.insumos (
        nome, tipo, unidade, volume_compra, custo_compra, custo_unitario,
        estoque_atual, estoque_minimo, ativo
      ) VALUES (v_item.lata_nome, 'embalagem', 'un', 1, 0, 0, 0, 0, true)
      RETURNING id INTO v_lata;
    END IF;

    INSERT INTO public.produtos (
      nome, sku, tipo, categoria_id, custo_producao, preco_venda, markup,
      estoque_atual, estoque_minimo, ativo
    ) VALUES (v_item.nome, v_item.sku, 'producao', v_cat_velas, 0, 0, 4, 1, 0, true)
    ON CONFLICT (sku) DO UPDATE SET
      nome = excluded.nome, tipo = excluded.tipo, categoria_id = excluded.categoria_id,
      markup = excluded.markup, estoque_atual = excluded.estoque_atual,
      estoque_minimo = excluded.estoque_minimo, ativo = true, updated_at = now()
    RETURNING id INTO v_produto;

    DELETE FROM public.fichas_tecnicas WHERE produto_id = v_produto;
    INSERT INTO public.fichas_tecnicas (produto_id, insumo_id, quantidade) VALUES
      (v_produto, v_cera, 100), (v_produto, v_essencia, 10),
      (v_produto, v_pavio, 1), (v_produto, v_etiqueta, 1), (v_produto, v_lata, 1);
    SELECT coalesce(sum(custo_linha), 0) INTO v_custo
    FROM public.fichas_tecnicas WHERE produto_id = v_produto;
    UPDATE public.produtos
       SET custo_producao = v_custo, preco_venda = round(v_custo * 4, 2), updated_at = now()
     WHERE id = v_produto;
  END LOOP;
END $$;

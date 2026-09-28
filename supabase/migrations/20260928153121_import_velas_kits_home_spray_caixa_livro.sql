-- Terceiro lote de produtos recebido por imagens em 2026-09-28.
-- Velas reutilizam as fichas tecnicas validadas dos modelos classicos de 100g/180g.

DO $$
DECLARE
  v_cat_velas uuid;
  v_cat_home uuid;
  v_cat_premium uuid;
  v_template_100 uuid;
  v_template_180 uuid;
  v_produto uuid;
  v_custo numeric;
  v_item record;
  v_alcool uuid;
  v_agua uuid;
  v_essencia uuid;
  v_etiqueta uuid;
  v_valvula uuid;
  v_embalagem uuid;
  v_girassol uuid;
  v_caixa_gesso uuid;
  v_caixa_floral uuid;
  v_candle_kit uuid;
  v_diffuser_kit uuid;
BEGIN
  SELECT id INTO v_cat_velas FROM public.categorias WHERE lower(nome)='velas' ORDER BY created_at LIMIT 1;
  SELECT id INTO v_cat_home FROM public.categorias WHERE lower(nome)='home spray' ORDER BY created_at LIMIT 1;
  SELECT id INTO v_cat_premium FROM public.categorias WHERE lower(nome)='linha premium' ORDER BY created_at LIMIT 1;
  SELECT id INTO v_template_100 FROM public.produtos WHERE sku='VELA-CLASSICA-TAMPA-BRANCA-ENGLISH-P-100G';
  SELECT id INTO v_template_180 FROM public.produtos WHERE sku='VELA-CLASSICA-TAMPA-BRANCA-ENGLISH-P-180G';

  IF v_cat_velas IS NULL OR v_cat_home IS NULL OR v_cat_premium IS NULL
     OR v_template_100 IS NULL OR v_template_180 IS NULL THEN
    RAISE EXCEPTION 'Categorias ou velas modelo nao encontradas';
  END IF;

  FOR v_item IN
    SELECT * FROM (VALUES
      ('VELA-OUTUBRO-ROSA-100G', 'Vela Outubro Rosa 100g', 100, NULL::numeric),
      ('VELA-CANELA-100G', 'Vela Canela 100g', 100, 1::numeric),
      ('VELA-CANELA-180G', 'Vela Canela 180g', 180, 1::numeric),
      ('VELA-BAMBOO-100G', 'Vela Bamboo 100g', 100, 1::numeric),
      ('VELA-BAMBOO-180G', 'Vela Bamboo 180g', 180, 1::numeric),
      ('VELA-CLASSICA-TAMPA-PRETA-VANILA-100G', 'Vela Vanilla 100g', 100, 1::numeric),
      ('VELA-VANILLA-180G', 'Vela Vanilla 180g', 180, 1::numeric),
      ('VELA-LAVANDA-100G', 'Vela Lavanda 100g', 100, 1::numeric),
      ('VELA-LAVANDA-180G', 'Vela Lavanda 180g', 180, 1::numeric),
      ('VELA-LEMON-180G', 'Vela Lemon 180g', 180, 1::numeric),
      ('VELA-CHA-BRANCO-100G', 'Vela Cha Branco 100g', 100, 0::numeric),
      ('VELA-CHA-BRANCO-180G', 'Vela Cha Branco 180g', 180, 1::numeric),
      ('VELA-CASCAS-FOLHAS-100G', 'Vela Cascas e Folhas 100g', 100, 1::numeric)
    ) AS t(sku, nome, peso, estoque)
  LOOP
    INSERT INTO public.produtos (
      nome, sku, tipo, categoria_id, markup, preco_venda, custo_producao,
      estoque_atual, estoque_minimo, ativo
    ) VALUES (
      v_item.nome, v_item.sku, 'producao', v_cat_velas, 4, 0, 0,
      coalesce(v_item.estoque, 0), 0, true
    )
    ON CONFLICT (sku) DO UPDATE SET
      nome=excluded.nome, tipo='producao', categoria_id=v_cat_velas, markup=4,
      estoque_atual=coalesce(v_item.estoque, public.produtos.estoque_atual),
      ativo=true, updated_at=now()
    RETURNING id INTO v_produto;

    DELETE FROM public.fichas_tecnicas WHERE produto_id=v_produto;
    INSERT INTO public.fichas_tecnicas (produto_id, insumo_id, quantidade)
    SELECT v_produto, insumo_id, quantidade
    FROM public.fichas_tecnicas
    WHERE produto_id=CASE WHEN v_item.peso=100 THEN v_template_100 ELSE v_template_180 END;

    SELECT coalesce(sum(custo_linha),0) INTO v_custo
    FROM public.fichas_tecnicas WHERE produto_id=v_produto;
    UPDATE public.produtos
       SET custo_producao=v_custo, preco_venda=round(v_custo*4,2), updated_at=now()
     WHERE id=v_produto;
  END LOOP;

  SELECT id INTO v_alcool FROM public.insumos WHERE lower(nome)='alcool' ORDER BY created_at LIMIT 1;
  SELECT id INTO v_agua FROM public.insumos WHERE lower(nome)='agua' ORDER BY created_at LIMIT 1;
  SELECT id INTO v_essencia FROM public.insumos WHERE lower(nome)='essencia' ORDER BY created_at LIMIT 1;
  SELECT id INTO v_etiqueta FROM public.insumos WHERE lower(nome)='etiqueta' ORDER BY created_at LIMIT 1;
  SELECT id INTO v_valvula FROM public.insumos WHERE lower(nome)='valvula' ORDER BY created_at LIMIT 1;

  IF v_alcool IS NULL OR v_agua IS NULL OR v_essencia IS NULL OR v_etiqueta IS NULL OR v_valvula IS NULL THEN
    RAISE EXCEPTION 'Insumos de Home Spray nao encontrados';
  END IF;

  FOR v_item IN
    SELECT * FROM (VALUES
      ('Frasco cilindrico spray para Home Spray 20ml', 3.30::numeric),
      ('Frasco plastico para Home Spray 200ml', 10.00::numeric),
      ('Aromatizador de gesso Girassol', 3.00::numeric),
      ('Caixa para kit Home Spray 20ml e gesso', 12.10::numeric),
      ('Caixa floral para kit vela e difusor', 12.50::numeric)
    ) AS t(nome,custo)
  LOOP
    IF NOT EXISTS (SELECT 1 FROM public.insumos WHERE nome=v_item.nome) THEN
      INSERT INTO public.insumos (
        nome,tipo,unidade,volume_compra,custo_compra,custo_unitario,
        estoque_atual,estoque_minimo,ativo
      ) VALUES (v_item.nome,'embalagem','un',1,v_item.custo,v_item.custo,0,0,true);
    END IF;
  END LOOP;

  SELECT id INTO v_embalagem FROM public.insumos WHERE nome='Frasco plastico para Home Spray 200ml' ORDER BY created_at LIMIT 1;
  INSERT INTO public.produtos (
    nome,sku,tipo,categoria_id,markup,preco_venda,custo_producao,
    estoque_atual,estoque_minimo,ativo
  ) VALUES ('Home Spray 200ml frasco plastico','HOME-SPRAY-200ML-PLASTICO','producao',v_cat_home,3,0,0,1,0,true)
  ON CONFLICT (sku) DO UPDATE SET nome=excluded.nome,tipo='producao',categoria_id=v_cat_home,
    markup=3,estoque_atual=1,ativo=true,updated_at=now()
  RETURNING id INTO v_produto;
  DELETE FROM public.fichas_tecnicas WHERE produto_id=v_produto;
  INSERT INTO public.fichas_tecnicas (produto_id,insumo_id,quantidade) VALUES
    (v_produto,v_agua,34.7826),(v_produto,v_alcool,139.1304),(v_produto,v_essencia,26.0870),
    (v_produto,v_embalagem,1),(v_produto,v_valvula,1),(v_produto,v_etiqueta,1);
  SELECT coalesce(sum(custo_linha),0) INTO v_custo FROM public.fichas_tecnicas WHERE produto_id=v_produto;
  UPDATE public.produtos SET custo_producao=v_custo,preco_venda=round(v_custo*3,2),updated_at=now() WHERE id=v_produto;

  SELECT id INTO v_embalagem FROM public.insumos WHERE nome='Frasco cilindrico spray para Home Spray 20ml' ORDER BY created_at LIMIT 1;
  SELECT id INTO v_girassol FROM public.insumos WHERE nome='Aromatizador de gesso Girassol' ORDER BY created_at LIMIT 1;
  SELECT id INTO v_caixa_gesso FROM public.insumos WHERE nome='Caixa para kit Home Spray 20ml e gesso' ORDER BY created_at LIMIT 1;

  FOR v_item IN
    SELECT * FROM (VALUES
      ('KIT-HOME-SPRAY-GESSO-ENGLISH-PEAR','Kit Home Spray 20ml e Girassol English Pear',2::numeric),
      ('KIT-HOME-SPRAY-GESSO-CHA-BRANCO','Kit Home Spray 20ml e Girassol Cha Branco',1::numeric),
      ('KIT-HOME-SPRAY-GESSO-CEREJA-AVELA','Kit Home Spray 20ml e Girassol Cereja e Avela',1::numeric),
      ('KIT-HOME-SPRAY-GESSO-CASCAS-FOLHAS','Kit Home Spray 20ml e Girassol Cascas e Folhas',1::numeric)
    ) AS t(sku,nome,estoque)
  LOOP
    INSERT INTO public.produtos (
      nome,sku,tipo,categoria_id,markup,preco_venda,custo_producao,
      estoque_atual,estoque_minimo,ativo
    ) VALUES (v_item.nome,v_item.sku,'producao',v_cat_premium,3,0,0,v_item.estoque,0,true)
    ON CONFLICT (sku) DO UPDATE SET nome=excluded.nome,tipo='producao',categoria_id=v_cat_premium,
      markup=3,estoque_atual=excluded.estoque_atual,ativo=true,updated_at=now()
    RETURNING id INTO v_produto;
    DELETE FROM public.fichas_tecnicas WHERE produto_id=v_produto;
    INSERT INTO public.fichas_tecnicas (produto_id,insumo_id,quantidade) VALUES
      (v_produto,v_agua,3.4783),(v_produto,v_alcool,13.9130),(v_produto,v_essencia,2.6087),
      (v_produto,v_embalagem,1),(v_produto,v_etiqueta,1),
      (v_produto,v_girassol,1),(v_produto,v_caixa_gesso,1);
    SELECT coalesce(sum(custo_linha),0) INTO v_custo FROM public.fichas_tecnicas WHERE produto_id=v_produto;
    UPDATE public.produtos SET custo_producao=v_custo,preco_venda=round(v_custo*3,2),updated_at=now() WHERE id=v_produto;
  END LOOP;

  -- Kit de vela 100g + difusor 250ml + varetas + caixa floral.
  SELECT id INTO v_candle_kit FROM public.produtos WHERE sku='VELA-CHA-BRANCO-100G';
  SELECT id INTO v_caixa_floral FROM public.insumos WHERE nome='Caixa floral para kit vela e difusor' ORDER BY created_at LIMIT 1;

  INSERT INTO public.produtos (
    nome,sku,tipo,categoria_id,markup,preco_venda,custo_producao,
    estoque_atual,estoque_minimo,ativo
  ) VALUES ('Difusor Cha Branco 250ml','DIFUSOR-CHA-BRANCO-250ML','simples',
    (SELECT id FROM public.categorias WHERE lower(nome)='difusores' ORDER BY created_at LIMIT 1),
    3,93.99,34.046,0,0,true)
  ON CONFLICT (sku) DO UPDATE SET nome=excluded.nome,custo_producao=34.046,
    preco_venda=93.99,estoque_atual=0,ativo=true,updated_at=now()
  RETURNING id INTO v_diffuser_kit;

  INSERT INTO public.produtos (
    nome,sku,tipo,categoria_id,markup,preco_venda,custo_producao,
    estoque_atual,estoque_minimo,ativo
  ) VALUES ('Kit Vela e Difusor Cha Branco','KIT-VELA-DIFUSOR-CHA-BRANCO','kit',v_cat_premium,
    3,0,0,1,0,true)
  ON CONFLICT (sku) DO UPDATE SET nome=excluded.nome,tipo='kit',categoria_id=v_cat_premium,
    markup=3,estoque_atual=1,ativo=true,updated_at=now()
  RETURNING id INTO v_produto;
  DELETE FROM public.kit_itens WHERE kit_id=v_produto;
  DELETE FROM public.fichas_tecnicas WHERE produto_id=v_produto;
  INSERT INTO public.kit_itens (kit_id,produto_id,quantidade,custo_unitario)
  SELECT v_produto,id,1,custo_producao FROM public.produtos WHERE id IN (v_candle_kit,v_diffuser_kit);
  INSERT INTO public.fichas_tecnicas (produto_id,insumo_id,quantidade) VALUES (v_produto,v_caixa_floral,1);
  SELECT coalesce((SELECT sum(ki.quantidade*p.custo_producao) FROM public.kit_itens ki JOIN public.produtos p ON p.id=ki.produto_id WHERE ki.kit_id=v_produto),0)
       + coalesce((SELECT sum(ft.custo_linha) FROM public.fichas_tecnicas ft WHERE ft.produto_id=v_produto),0)
    INTO v_custo;
  UPDATE public.produtos SET custo_producao=v_custo,preco_venda=round(v_custo*3,2),updated_at=now() WHERE id=v_produto;

  INSERT INTO public.produtos (
    nome,sku,tipo,categoria_id,markup,preco_venda,custo_producao,
    estoque_atual,estoque_minimo,ativo
  ) VALUES ('Caixa livro decorativa','CAIXA-LIVRO-DECORATIVA','simples',v_cat_premium,
    3,59.90,0,2,0,true)
  ON CONFLICT (sku) DO UPDATE SET nome=excluded.nome,preco_venda=59.90,
    estoque_atual=2,ativo=true,updated_at=now();
END $$;

-- Quinto lote recebido por imagens em 2026-10-01.
-- Todos os cadastros usam SKU como chave idempotente.

DO $$
DECLARE
  v_cat_velas uuid;
  v_cat_home uuid;
  v_cat_difusores uuid;
  v_cat_escalda uuid;
  v_cat_premium uuid;
  v_template_100 uuid;
  v_template_180 uuid;
  v_template_escalda uuid;
  v_produto uuid;
  v_kit uuid;
  v_candle uuid;
  v_escalda uuid;
  v_custo numeric;
  v_caixa uuid;
  v_item record;
BEGIN
  SELECT id INTO v_cat_velas FROM public.categorias WHERE lower(nome)='velas' ORDER BY created_at LIMIT 1;
  SELECT id INTO v_cat_home FROM public.categorias WHERE lower(nome)='home spray' ORDER BY created_at LIMIT 1;
  SELECT id INTO v_cat_difusores FROM public.categorias WHERE lower(nome)='difusores' ORDER BY created_at LIMIT 1;
  SELECT id INTO v_cat_escalda FROM public.categorias WHERE lower(nome)='escalda pes' ORDER BY created_at LIMIT 1;
  SELECT id INTO v_cat_premium FROM public.categorias WHERE lower(nome)='linha premium' ORDER BY created_at LIMIT 1;
  SELECT id INTO v_template_100 FROM public.produtos WHERE sku='VELA-CLASSICA-TAMPA-BRANCA-ENGLISH-P-100G';
  SELECT id INTO v_template_180 FROM public.produtos WHERE sku='VELA-CLASSICA-TAMPA-BRANCA-ENGLISH-P-180G';
  SELECT id INTO v_template_escalda FROM public.produtos WHERE sku='ESCALDA-PES-LUA-CHEIA-50G';

  IF v_template_100 IS NULL OR v_template_180 IS NULL OR v_template_escalda IS NULL THEN
    RAISE EXCEPTION 'Produtos modelo nao encontrados';
  END IF;

  -- Refis de 500ml: frasco informado a R$ 8,90, tampa e etiqueta separadas.
  INSERT INTO public.insumos (nome,tipo,unidade,volume_compra,custo_compra,custo_unitario,estoque_atual,estoque_minimo,ativo)
  SELECT 'Frasco PET 500ml para refil','embalagem','un',1,8.90,8.90,0,0,true
  WHERE NOT EXISTS (SELECT 1 FROM public.insumos WHERE nome='Frasco PET 500ml para refil');

  INSERT INTO public.produtos (nome,sku,tipo,categoria_id,markup,preco_venda,custo_producao,estoque_atual,estoque_minimo,ativo)
  VALUES ('Home Spray Refil 500ml English Pear','HOME-SPRAY-REFIL-500ML-ENGLISH-PEAR','producao',v_cat_home,3,121.90,40.6345,0,0,true)
  ON CONFLICT (sku) DO UPDATE SET nome=excluded.nome,categoria_id=excluded.categoria_id,
    preco_venda=excluded.preco_venda,custo_producao=excluded.custo_producao,estoque_atual=0,ativo=true,updated_at=now();

  INSERT INTO public.produtos (nome,sku,tipo,categoria_id,markup,preco_venda,custo_producao,estoque_atual,estoque_minimo,ativo)
  VALUES ('Difusor Refil 500ml English Pear','DIFUSOR-REFIL-500ML-ENGLISH-PEAR','producao',v_cat_difusores,3,141.03,47.0100,0,0,true)
  ON CONFLICT (sku) DO UPDATE SET nome=excluded.nome,categoria_id=excluded.categoria_id,
    preco_venda=excluded.preco_venda,custo_producao=excluded.custo_producao,estoque_atual=0,ativo=true,updated_at=now();

  INSERT INTO public.produtos (nome,sku,tipo,categoria_id,markup,preco_venda,custo_producao,estoque_atual,estoque_minimo,ativo)
  VALUES ('Kit Refis 500ml Home Spray e Difusor English Pear','KIT-REFIS-500ML-ENGLISH-PEAR','kit',v_cat_premium,3,262.93,87.6445,1,0,true)
  ON CONFLICT (sku) DO UPDATE SET nome=excluded.nome,categoria_id=excluded.categoria_id,
    preco_venda=excluded.preco_venda,custo_producao=excluded.custo_producao,estoque_atual=1,ativo=true,updated_at=now();

  -- Doze signos, nos dois tamanhos mostrados; uma unidade de cada pote fotografado.
  FOR v_item IN
    SELECT signo,peso FROM (VALUES
      ('Aries'),('Touro'),('Gemeos'),('Cancer'),('Leao'),('Virgem'),
      ('Libra'),('Escorpiao'),('Sagitario'),('Capricornio'),('Aquario'),('Peixes')
    ) s(signo) CROSS JOIN (VALUES (100),(180)) p(peso)
  LOOP
    INSERT INTO public.produtos (nome,sku,tipo,categoria_id,markup,preco_venda,custo_producao,estoque_atual,estoque_minimo,ativo)
    VALUES ('Vela signo '||v_item.signo||' '||v_item.peso||'g',
      'VELA-SIGNO-'||upper(v_item.signo)||'-'||v_item.peso||'G','producao',v_cat_velas,4,0,0,1,0,true)
    ON CONFLICT (sku) DO UPDATE SET nome=excluded.nome,categoria_id=v_cat_velas,
      estoque_atual=1,ativo=true,updated_at=now()
    RETURNING id INTO v_produto;

    DELETE FROM public.fichas_tecnicas WHERE produto_id=v_produto;
    INSERT INTO public.fichas_tecnicas (produto_id,insumo_id,quantidade)
    SELECT v_produto,insumo_id,quantidade FROM public.fichas_tecnicas
    WHERE produto_id=CASE WHEN v_item.peso=100 THEN v_template_100 ELSE v_template_180 END;
    SELECT coalesce(sum(custo_linha),0) INTO v_custo FROM public.fichas_tecnicas WHERE produto_id=v_produto;
    UPDATE public.produtos SET custo_producao=v_custo,preco_venda=round(v_custo*4,2),updated_at=now() WHERE id=v_produto;
  END LOOP;

  -- Velas das fases da lua de 100g. Quantidades contadas na foto: 3/2/3/3.
  FOR v_item IN SELECT * FROM (VALUES
    ('LUA-NOVA','Lua Nova',3),('LUA-CRESCENTE','Lua Crescente',2),
    ('LUA-CHEIA','Lua Cheia',3),('LUA-MINGUANTE','Lua Minguante',3)
  ) AS t(codigo,nome,estoque)
  LOOP
    INSERT INTO public.produtos (nome,sku,tipo,categoria_id,markup,preco_venda,custo_producao,estoque_atual,estoque_minimo,ativo)
    VALUES ('Vela '||v_item.nome||' 100g','VELA-'||v_item.codigo||'-100G','producao',v_cat_velas,4,0,0,v_item.estoque,0,true)
    ON CONFLICT (sku) DO UPDATE SET nome=excluded.nome,categoria_id=v_cat_velas,
      estoque_atual=excluded.estoque_atual,ativo=true,updated_at=now()
    RETURNING id INTO v_produto;
    DELETE FROM public.fichas_tecnicas WHERE produto_id=v_produto;
    INSERT INTO public.fichas_tecnicas (produto_id,insumo_id,quantidade)
      SELECT v_produto,insumo_id,quantidade FROM public.fichas_tecnicas WHERE produto_id=v_template_100;
    SELECT coalesce(sum(custo_linha),0) INTO v_custo FROM public.fichas_tecnicas WHERE produto_id=v_produto;
    UPDATE public.produtos SET custo_producao=v_custo,preco_venda=round(v_custo*4,2),updated_at=now() WHERE id=v_produto;
  END LOOP;

  -- Lua Nova completa a familia de escalda-pes para permitir o quarto kit.
  INSERT INTO public.produtos (nome,sku,tipo,categoria_id,markup,preco_venda,custo_producao,estoque_atual,estoque_minimo,ativo)
  VALUES ('Escalda-pes Lua Nova 50g','ESCALDA-PES-LUA-NOVA-50G','producao',v_cat_escalda,3,19.90,0,10,0,true)
  ON CONFLICT (sku) DO UPDATE SET nome=excluded.nome,categoria_id=v_cat_escalda,
    preco_venda=19.90,estoque_atual=10,ativo=true,updated_at=now()
  RETURNING id INTO v_produto;
  DELETE FROM public.fichas_tecnicas WHERE produto_id=v_produto;
  INSERT INTO public.fichas_tecnicas (produto_id,insumo_id,quantidade)
    SELECT v_produto,insumo_id,quantidade FROM public.fichas_tecnicas WHERE produto_id=v_template_escalda;
  SELECT coalesce(sum(custo_linha),0) INTO v_custo FROM public.fichas_tecnicas WHERE produto_id=v_produto;
  UPDATE public.produtos SET custo_producao=v_custo,updated_at=now() WHERE id=v_produto;

  -- Caixa de madeira com palha informada a R$ 10,00 por kit.
  INSERT INTO public.insumos (nome,tipo,unidade,volume_compra,custo_compra,custo_unitario,estoque_atual,estoque_minimo,ativo)
  SELECT 'Caixa de madeira com palha para kit fases da lua','embalagem','un',1,10,10,0,0,true
  WHERE NOT EXISTS (SELECT 1 FROM public.insumos WHERE nome='Caixa de madeira com palha para kit fases da lua');
  SELECT id INTO v_caixa FROM public.insumos WHERE nome='Caixa de madeira com palha para kit fases da lua' ORDER BY created_at LIMIT 1;

  FOR v_item IN SELECT * FROM (VALUES
    ('LUA-NOVA','Lua Nova'),('LUA-CRESCENTE','Lua Crescente'),
    ('LUA-CHEIA','Lua Cheia'),('LUA-MINGUANTE','Lua Minguante')
  ) AS t(codigo,nome)
  LOOP
    SELECT id INTO v_candle FROM public.produtos WHERE sku='VELA-'||v_item.codigo||'-100G';
    SELECT id INTO v_escalda FROM public.produtos WHERE sku='ESCALDA-PES-'||v_item.codigo||'-50G';
    INSERT INTO public.produtos (nome,sku,tipo,categoria_id,markup,preco_venda,custo_producao,estoque_atual,estoque_minimo,ativo)
    VALUES ('Kit fase '||v_item.nome,'KIT-FASE-'||v_item.codigo,'kit',v_cat_premium,3,129.58,0,1,0,true)
    ON CONFLICT (sku) DO UPDATE SET nome=excluded.nome,tipo='kit',categoria_id=v_cat_premium,
      preco_venda=129.58,estoque_atual=1,ativo=true,updated_at=now()
    RETURNING id INTO v_kit;
    UPDATE public.produtos SET tipo='kit' WHERE id=v_kit;
    DELETE FROM public.kit_itens WHERE kit_id=v_kit;
    DELETE FROM public.fichas_tecnicas WHERE produto_id=v_kit;
    INSERT INTO public.kit_itens (kit_id,produto_id,quantidade,custo_unitario)
      SELECT v_kit,id,1,custo_producao FROM public.produtos WHERE id IN (v_candle,v_escalda);
    INSERT INTO public.fichas_tecnicas (produto_id,insumo_id,quantidade) VALUES (v_kit,v_caixa,1);
    SELECT coalesce(sum(custo_linha),0) INTO v_custo FROM public.kit_itens WHERE kit_id=v_kit;
    SELECT v_custo+coalesce(sum(custo_linha),0) INTO v_custo FROM public.fichas_tecnicas WHERE produto_id=v_kit;
    UPDATE public.produtos SET custo_producao=v_custo,updated_at=now() WHERE id=v_kit;
  END LOOP;

  -- Linha Ouro/Áurea: mesmo valor da vela clássica 100g; Áurea sem estoque.
  UPDATE public.produtos SET nome='Vela Ouro 100g - folha de ouro e parafina em gel',
    estoque_atual=3,preco_venda=79.68,updated_at=now() WHERE sku='VELA-OURO-TAMPA-DOURADA-100G';
  INSERT INTO public.produtos (nome,sku,tipo,categoria_id,markup,preco_venda,custo_producao,estoque_atual,estoque_minimo,ativo)
  VALUES ('Vela Aurea 100g - folha de ouro e parafina em gel','VELA-AUREA-100G','producao',v_cat_velas,4,79.68,19.92,0,0,true)
  ON CONFLICT (sku) DO UPDATE SET nome=excluded.nome,preco_venda=79.68,
    custo_producao=19.92,estoque_atual=0,ativo=true,updated_at=now();
END $$;

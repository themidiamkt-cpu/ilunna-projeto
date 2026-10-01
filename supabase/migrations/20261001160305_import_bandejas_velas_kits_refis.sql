-- Quarto lote recebido por imagens em 2026-10-01.
-- Upserts por SKU tornam a importacao segura para reexecucao.

DO $$
DECLARE
  v_cat_decor uuid;
  v_cat_velas uuid;
  v_cat_home uuid;
  v_cat_difusores uuid;
  v_cat_premium uuid;
  v_template_100 uuid;
  v_template_180 uuid;
  v_produto uuid;
  v_custo numeric;
  v_item record;
BEGIN
  INSERT INTO public.categorias (nome, descricao, cor)
  SELECT 'Decoracao', 'Bandejas e acessorios decorativos', '#B08D57'
  WHERE NOT EXISTS (SELECT 1 FROM public.categorias WHERE lower(nome)='decoracao');

  SELECT id INTO v_cat_decor FROM public.categorias WHERE lower(nome)='decoracao' ORDER BY created_at LIMIT 1;
  SELECT id INTO v_cat_velas FROM public.categorias WHERE lower(nome)='velas' ORDER BY created_at LIMIT 1;
  SELECT id INTO v_cat_home FROM public.categorias WHERE lower(nome)='home spray' ORDER BY created_at LIMIT 1;
  SELECT id INTO v_cat_difusores FROM public.categorias WHERE lower(nome)='difusores' ORDER BY created_at LIMIT 1;
  SELECT id INTO v_cat_premium FROM public.categorias WHERE lower(nome)='linha premium' ORDER BY created_at LIMIT 1;
  SELECT id INTO v_template_100 FROM public.produtos WHERE sku='VELA-CLASSICA-TAMPA-BRANCA-ENGLISH-P-100G';
  SELECT id INTO v_template_180 FROM public.produtos WHERE sku='VELA-CLASSICA-TAMPA-BRANCA-ENGLISH-P-180G';

  -- Bandejas: valores informados nos prints; R$ 34,90 para as organicas,
  -- usando a referencia de mercado solicitada pela cliente.
  FOR v_item IN SELECT * FROM (VALUES
    ('BANDEJA-ORGANICA-PRETA','Bandeja organica preta',34.90,2),
    ('BANDEJA-ORGANICA-OFF','Bandeja organica off-white',34.90,2),
    ('BANDEJA-PROVENCAL-P','Bandeja provencal pequena',59.90,1),
    ('BANDEJA-PROVENCAL-M','Bandeja provencal media',79.90,1),
    ('BANDEJA-CLASSICA-PRETA','Bandeja classica preta',39.90,1),
    ('BANDEJA-CLASSICA-DOURADA','Bandeja classica dourada',39.90,1),
    ('BANDEJA-BAMBU-P','Bandeja bambu pequena',79.90,1),
    ('BANDEJA-BAMBU-M','Bandeja bambu media',79.90,1),
    ('SUPORTE-REDONDO-20-ESPELHADO','Suporte multiuso redondo 20cm espelhado',79.90,1),
    ('SUPORTE-REDONDO-20-BRANCO','Suporte multiuso redondo 20cm branco',79.90,1),
    ('SUPORTE-REDONDO-20-BRONZE','Suporte multiuso redondo 20cm bronze',79.90,1),
    ('SUPORTE-REDONDO-20-PRETO','Suporte multiuso redondo 20cm preto',79.90,1),
    ('BANDEJA-VIDRO-20X11-ESPELHADO','Bandeja de vidro 20x11cm espelhada',79.90,0),
    ('BANDEJA-VIDRO-20X11-BRANCO','Bandeja de vidro 20x11cm branca',79.90,0),
    ('BANDEJA-VIDRO-20X11-BRONZE','Bandeja de vidro 20x11cm bronze',79.90,1),
    ('BANDEJA-VIDRO-20X11-PRETO','Bandeja de vidro 20x11cm preta',79.90,1),
    ('BANDEJA-VIDRO-25X15-ESPELHADO','Bandeja de vidro 25x15cm espelhada',79.90,1),
    ('BANDEJA-VIDRO-25X15-BRANCO','Bandeja de vidro 25x15cm branca',79.90,1),
    ('BANDEJA-VIDRO-25X15-BRONZE','Bandeja de vidro 25x15cm bronze',79.90,1)
  ) AS t(sku,nome,preco,estoque)
  LOOP
    INSERT INTO public.produtos (nome,sku,tipo,categoria_id,markup,preco_venda,custo_producao,estoque_atual,estoque_minimo,ativo)
    VALUES (v_item.nome,v_item.sku,'simples',v_cat_decor,3,v_item.preco,0,v_item.estoque,0,true)
    ON CONFLICT (sku) DO UPDATE SET nome=excluded.nome,categoria_id=excluded.categoria_id,
      preco_venda=excluded.preco_venda,estoque_atual=excluded.estoque_atual,ativo=true,updated_at=now();
  END LOOP;

  -- Estoques explicitamente mostrados nos potes de 180g.
  UPDATE public.produtos SET estoque_atual=3,updated_at=now() WHERE sku='VELA-CHA-BRANCO-180G';

  -- Novas velas que podem reaproveitar a ficha tecnica dos tamanhos classicos.
  FOR v_item IN SELECT * FROM (VALUES
    ('VELA-CASCAS-FOLHAS-180G','Vela Cascas e Folhas 180g',180,2),
    ('VELA-PEONIA-180G','Vela Peonia 180g',180,1),
    ('VELA-ENGLISH-PEAR-180G','Vela English Pear 180g',180,1),
    ('VELA-ANNE-WITH-AN-E','Vela edicao literaria Anne with an E',180,2)
  ) AS t(sku,nome,peso,estoque)
  LOOP
    INSERT INTO public.produtos (nome,sku,tipo,categoria_id,markup,preco_venda,custo_producao,estoque_atual,estoque_minimo,ativo)
    VALUES (v_item.nome,v_item.sku,'producao',v_cat_velas,4,0,0,v_item.estoque,0,true)
    ON CONFLICT (sku) DO UPDATE SET nome=excluded.nome,categoria_id=v_cat_velas,
      estoque_atual=excluded.estoque_atual,ativo=true,updated_at=now()
    RETURNING id INTO v_produto;
    DELETE FROM public.fichas_tecnicas WHERE produto_id=v_produto;
    INSERT INTO public.fichas_tecnicas (produto_id,insumo_id,quantidade)
      SELECT v_produto,insumo_id,quantidade FROM public.fichas_tecnicas
      WHERE produto_id=CASE WHEN v_item.peso=100 THEN v_template_100 ELSE v_template_180 END;
    SELECT coalesce(sum(custo_linha),0) INTO v_custo FROM public.fichas_tecnicas WHERE produto_id=v_produto;
    UPDATE public.produtos SET custo_producao=v_custo,preco_venda=round(v_custo*4,2),updated_at=now() WHERE id=v_produto;
  END LOOP;

  -- Produtos personalizados sem uma ficha equivalente validada no cadastro atual.
  FOR v_item IN SELECT * FROM (VALUES
    ('VELA-MASSAGEM-100G','Vela de massagem 100g - essencia personalizada',79.90,4),
    ('VELA-EDICAO-LITERARIA','Vela edicao literaria - essencia personalizada',105.41,1),
    ('VELA-PEONIA-ENGLISH-PEAR','Vela peonia - essencia English Pear',105.41,1)
  ) AS t(sku,nome,preco,estoque)
  LOOP
    INSERT INTO public.produtos (nome,sku,tipo,categoria_id,markup,preco_venda,custo_producao,estoque_atual,estoque_minimo,ativo)
    VALUES (v_item.nome,v_item.sku,'simples',v_cat_velas,4,v_item.preco,0,v_item.estoque,0,true)
    ON CONFLICT (sku) DO UPDATE SET nome=excluded.nome,preco_venda=excluded.preco_venda,
      estoque_atual=excluded.estoque_atual,ativo=true,updated_at=now();
  END LOOP;

  -- Kits fotografados prontos. Quando nao havia composicao tecnica completa no print,
  -- mantemos o preco de referencia do kit premium ja praticado.
  FOR v_item IN SELECT * FROM (VALUES
    ('KIT-HOME-DIFUSOR-200-CHA-BRANCO','Kit Home Spray e Difusor 200ml Cha Branco',199.40,1),
    ('KIT-HOME-DIFUSOR-200-CANELA','Kit Home Spray e Difusor 200ml Canela',199.40,1),
    ('KIT-HOME-DIFUSOR-250-CASCAS-FOLHAS','Kit Home Spray e Difusor 250ml Cascas e Folhas',199.40,1),
    ('KIT-HOME-DIFUSOR-250-CHA-BRANCO','Kit Home Spray e Difusor 250ml Cha Branco',199.40,1),
    ('KIT-HOME-DIFUSOR-VELA-CHA-BRANCO','Kit Home Spray, Difusor e Vela Cha Branco',279.08,1),
    ('KIT-LUXURY-ENGLISH-PEAR','Kit Luxury Vela e Difusor English Pear',199.40,1)
  ) AS t(sku,nome,preco,estoque)
  LOOP
    INSERT INTO public.produtos (nome,sku,tipo,categoria_id,markup,preco_venda,custo_producao,estoque_atual,estoque_minimo,ativo)
    VALUES (v_item.nome,v_item.sku,'kit',v_cat_premium,3,v_item.preco,0,v_item.estoque,0,true)
    ON CONFLICT (sku) DO UPDATE SET nome=excluded.nome,preco_venda=excluded.preco_venda,
      estoque_atual=excluded.estoque_atual,ativo=true,updated_at=now();
  END LOOP;

  -- A vela de frase surpresa ja existia; o print pede apenas essencia personalizada.
  UPDATE public.produtos SET nome='Vela latinha com frase surpresa 20g - essencia personalizada',updated_at=now()
  WHERE sku='VELA-LATINHA-FRASE-20G';

  -- Os tres kits de vela em po ja estavam cadastrados com os totais 10, 8 e 20.
  UPDATE public.produtos SET estoque_atual=10,updated_at=now() WHERE sku='KIT-VELA-EM-PO-50G-10ml';
  UPDATE public.produtos SET estoque_atual=8,updated_at=now() WHERE sku='KIT-VELA-EM-PO-50g';
  UPDATE public.produtos SET estoque_atual=20,updated_at=now() WHERE sku='KIT-VELA-EM-PO-100G';

  -- Refis de 200ml vendidos (estoque zerado). Custos incorporam frasco PET e tampa G28.
  INSERT INTO public.insumos (nome,tipo,unidade,volume_compra,custo_compra,custo_unitario,estoque_atual,estoque_minimo,ativo)
  SELECT 'Frasco PET redondo G28 200ml','embalagem','un',1,5.40,5.40,0,0,true
  WHERE NOT EXISTS (SELECT 1 FROM public.insumos WHERE nome='Frasco PET redondo G28 200ml');
  INSERT INTO public.insumos (nome,tipo,unidade,volume_compra,custo_compra,custo_unitario,estoque_atual,estoque_minimo,ativo)
  SELECT 'Tampa aluminio G28 prata','embalagem','un',1,1.00,1.00,0,0,true
  WHERE NOT EXISTS (SELECT 1 FROM public.insumos WHERE nome='Tampa aluminio G28 prata');

  UPDATE public.produtos SET nome='Home Spray Refil 200ml',estoque_atual=0,
    custo_producao=18.7384,preco_venda=56.22,updated_at=now() WHERE sku='ILU-HSP-001';
  UPDATE public.produtos SET nome='Difusor Refil 200ml',estoque_atual=0,
    custo_producao=23.1080,preco_venda=69.32,updated_at=now() WHERE sku='ILU-DIF-001';
END $$;

-- Cadastro das velas sem pote.
-- Formula: cera = peso informado; essencia = 10% do peso; pavio = 1 un; caixa = valor da tabela.
-- Markup usado: 4, para absorver etiqueta, papel seda, fita e acabamento variavel.

ALTER TABLE public.produtos
  ADD COLUMN IF NOT EXISTS markup NUMERIC(8,4) NOT NULL DEFAULT 3;

DO $$
DECLARE
  v_categoria_id uuid;
  v_cera_id uuid;
  v_cera_coco_mole_id uuid;
  v_essencia_id uuid;
  v_pavio_id uuid;
  v_caixa_id uuid;
  v_latinha_id uuid;
  v_frase_id uuid;
  v_produto_id uuid;
  v_custo numeric;
  v_item record;
BEGIN
  SELECT id INTO v_categoria_id
  FROM categorias
  WHERE lower(nome) = 'velas'
  ORDER BY created_at
  LIMIT 1;

  IF v_categoria_id IS NULL THEN
    INSERT INTO categorias (nome, descricao, cor)
    VALUES ('Velas', 'Velas artesanais', '#C4704F')
    RETURNING id INTO v_categoria_id;
  END IF;

  SELECT id INTO v_cera_id
  FROM insumos
  WHERE ativo = true
    AND lower(nome) LIKE '%cera%'
    AND (lower(nome) LIKE '%dura%' OR lower(nome) LIKE '%ponto%')
  ORDER BY
    CASE WHEN lower(nome) LIKE '%ponto%' THEN 0 ELSE 1 END,
    nome
  LIMIT 1;

  SELECT id INTO v_cera_coco_mole_id
  FROM insumos
  WHERE ativo = true
    AND lower(nome) LIKE '%cera%'
    AND (
      lower(nome) LIKE '%coco%'
      OR lower(nome) LIKE '%mole%'
    )
  ORDER BY
    CASE WHEN lower(nome) LIKE '%ponto%' THEN 0 ELSE 1 END,
    CASE WHEN lower(nome) LIKE '%coco%' THEN 0 ELSE 1 END,
    CASE WHEN lower(nome) LIKE '%mole%' THEN 0 ELSE 1 END,
    nome
  LIMIT 1;

  SELECT id INTO v_essencia_id
  FROM insumos
  WHERE ativo = true
    AND (lower(nome) LIKE '%essencia%' OR lower(nome) LIKE '%essência%')
  ORDER BY
    CASE WHEN lower(coalesce(fornecedor, '')) LIKE '%peter%' OR lower(coalesce(fornecedor, '')) LIKE '%piter%' THEN 0 ELSE 1 END,
    CASE WHEN lower(nome) LIKE '%vela%' THEN 0 ELSE 1 END,
    nome
  LIMIT 1;

  SELECT id INTO v_pavio_id
  FROM insumos
  WHERE ativo = true
    AND lower(nome) LIKE '%pavio%'
  ORDER BY
    CASE WHEN lower(nome) LIKE '%ilh%' THEN 0 ELSE 1 END,
    nome
  LIMIT 1;

  IF v_cera_id IS NULL THEN
    INSERT INTO insumos (
      nome, tipo, unidade, volume_compra, custo_compra, custo_unitario,
      estoque_atual, estoque_minimo, fornecedor, ativo
    )
    VALUES (
      'Cera dura Ponto Quimica',
      'solido', 'gr', 1000, 0, 0,
      0, 0, 'Ponto Quimica', true
    )
    RETURNING id INTO v_cera_id;
  END IF;

  IF v_cera_coco_mole_id IS NULL THEN
    INSERT INTO insumos (
      nome, tipo, unidade, volume_compra, custo_compra, custo_unitario,
      estoque_atual, estoque_minimo, fornecedor, ativo
    )
    VALUES (
      'Cera de coco mole Ponto Quimica',
      'solido', 'gr', 1000, 0, 0,
      0, 0, 'Ponto Quimica', true
    )
    RETURNING id INTO v_cera_coco_mole_id;
  END IF;

  IF v_essencia_id IS NULL THEN
    INSERT INTO insumos (
      nome, tipo, unidade, volume_compra, custo_compra, custo_unitario,
      estoque_atual, estoque_minimo, fornecedor, ativo
    )
    VALUES (
      'Essencia Peter Paiva para velas',
      'liquido', 'ml', 1000, 0, 0,
      0, 0, 'Peter Paiva', true
    )
    RETURNING id INTO v_essencia_id;
  END IF;

  IF v_pavio_id IS NULL THEN
    INSERT INTO insumos (
      nome, tipo, unidade, volume_compra, custo_compra, custo_unitario,
      estoque_atual, estoque_minimo, fornecedor, ativo
    )
    VALUES (
      'Pavio com ilhos Peter Paiva',
      'acessorio', 'un', 1, 0, 0,
      0, 0, 'Peter Paiva', true
    )
    RETURNING id INTO v_pavio_id;
  END IF;

  SELECT id INTO v_latinha_id
  FROM insumos
  WHERE nome = 'Latinha para vela frase surpresa'
  ORDER BY created_at
  LIMIT 1;

  IF v_latinha_id IS NULL THEN
    INSERT INTO insumos (
      nome, tipo, unidade, volume_compra, custo_compra, custo_unitario,
      estoque_atual, estoque_minimo, fornecedor, ativo
    )
    VALUES (
      'Latinha para vela frase surpresa',
      'embalagem', 'un', 1, 0.78, 0.78,
      0, 0, NULL, true
    )
    RETURNING id INTO v_latinha_id;
  END IF;

  SELECT id INTO v_frase_id
  FROM insumos
  WHERE nome = 'Frase surpresa para vela'
  ORDER BY created_at
  LIMIT 1;

  IF v_frase_id IS NULL THEN
    INSERT INTO insumos (
      nome, tipo, unidade, volume_compra, custo_compra, custo_unitario,
      estoque_atual, estoque_minimo, fornecedor, ativo
    )
    VALUES (
      'Frase surpresa para vela',
      'acessorio', 'un', 1, 1.00, 1.00,
      0, 0, NULL, true
    )
    RETURNING id INTO v_frase_id;
  END IF;

  FOR v_item IN
    SELECT *
    FROM (VALUES
      ('VELA-SEM-POTE-001', 'Vela sem pote Peonia fechada 50g', 50.0, 0.90),
      ('VELA-SEM-POTE-002', 'Vela sem pote Tulipa 25g', 25.0, 0.90),
      ('VELA-SEM-POTE-003', 'Vela sem pote Flor do Campo 20g', 20.0, 0.90),
      ('VELA-SEM-POTE-004', 'Vela sem pote Lotus Inc. 20g', 20.0, 0.90),
      ('VELA-SEM-POTE-005', 'Vela sem pote Flor de Natal 15g', 15.0, 0.90),
      ('VELA-SEM-POTE-006', 'Vela sem pote Flor Jasmim 14g', 14.0, 0.90),
      ('VELA-SEM-POTE-007', 'Vela sem pote Margarida 14g', 14.0, 0.90),
      ('VELA-SEM-POTE-008', 'Vela sem pote Margaridinha 4g', 4.0, NULL),
      ('VELA-SEM-POTE-009', 'Vela sem pote Rosa 45g', 45.0, 2.48),
      ('VELA-SEM-POTE-010', 'Vela sem pote Rosa 55g', 55.0, 2.48),
      ('VELA-SEM-POTE-011', 'Vela sem pote Peonia aberta 80g', 80.0, 1.35),
      ('VELA-SEM-POTE-012', 'Vela sem pote Peonia aberta 68g', 68.0, 1.35),
      ('VELA-SEM-POTE-013', 'Vela sem pote Flor coreana 40g', 40.0, 1.35),
      ('VELA-SEM-POTE-014', 'Vela sem pote Corda 45g', 45.0, 1.35),
      ('VELA-SEM-POTE-015', 'Vela sem pote Raposa 75g', 75.0, 1.35),
      ('VELA-SEM-POTE-016', 'Vela sem pote Design M. 75g', 75.0, 1.25),
      ('VELA-SEM-POTE-017', 'Vela sem pote Bubble 115g', 115.0, 1.25),
      ('VELA-SEM-POTE-018', 'Vela sem pote Urso rosas 115g', 115.0, 2.69),
      ('VELA-SEM-POTE-019', 'Vela sem pote Rosa perf. 70g', 70.0, 2.49),
      ('VELA-SEM-POTE-020', 'Vela sem pote Arco-iris 225g', 225.0, 2.49),
      ('VELA-SEM-POTE-021', 'Vela sem pote Pilar liso 165g', 165.0, 2.85),
      ('VELA-SEM-POTE-022', 'Vela sem pote Abundancia 100g', 100.0, 4.20),
      ('VELA-SEM-POTE-023', 'Vela sem pote Pinheiro Natal 60g', 60.0, 3.30),
      ('VELA-SEM-POTE-024', 'Vela sem pote Design esp. 65g', 65.0, 1.78),
      ('VELA-SEM-POTE-025', 'Vela sem pote Pinheiro esp. 30g', 30.0, 1.78),
      ('VELA-SEM-POTE-026', 'Vela sem pote Mini pinheiro 15g', 15.0, 1.35),
      ('VELA-SEM-POTE-027', 'Vela sem pote Mini noel 20g', 20.0, 1.35),
      ('VELA-SEM-POTE-028', 'Vela sem pote Mini bubble 35g', 35.0, 0.75),
      ('VELA-SEM-POTE-029', 'Vela sem pote B. Tulipa simples 50g', 50.0, 6.16),
      ('VELA-SEM-POTE-030', 'Vela sem pote Buque tulipa 75g', 75.0, 4.74),
      ('VELA-SEM-POTE-031', 'Vela sem pote Design mola 235g', 235.0, 6.52)
    ) AS t(sku, nome, peso_cera, custo_caixa)
  LOOP
    IF v_item.custo_caixa IS NOT NULL THEN
      SELECT id INTO v_caixa_id
      FROM insumos
      WHERE nome = 'Caixa para vela sem pote R$ ' || replace(to_char(v_item.custo_caixa, 'FM999999990.00'), '.', ',')
      ORDER BY created_at
      LIMIT 1;

      IF v_caixa_id IS NULL THEN
        INSERT INTO insumos (
          nome, tipo, unidade, volume_compra, custo_compra, custo_unitario,
          estoque_atual, estoque_minimo, fornecedor, ativo
        )
        VALUES (
          'Caixa para vela sem pote R$ ' || replace(to_char(v_item.custo_caixa, 'FM999999990.00'), '.', ','),
          'embalagem', 'un', 1, v_item.custo_caixa, v_item.custo_caixa,
          0, 0, NULL, true
        )
        RETURNING id INTO v_caixa_id;
      END IF;
    ELSE
      v_caixa_id := NULL;
    END IF;

    INSERT INTO produtos (
      nome, sku, tipo, categoria_id, markup, preco_venda, custo_producao,
      estoque_atual, estoque_minimo, ativo
    )
    VALUES (
      v_item.nome, v_item.sku, 'producao', v_categoria_id, 4, 0, 0,
      0, 0, true
    )
    ON CONFLICT (sku) DO UPDATE SET
      nome = excluded.nome,
      tipo = excluded.tipo,
      categoria_id = excluded.categoria_id,
      markup = excluded.markup,
      ativo = true,
      updated_at = now()
    RETURNING id INTO v_produto_id;

    DELETE FROM fichas_tecnicas WHERE produto_id = v_produto_id;

    INSERT INTO fichas_tecnicas (produto_id, insumo_id, quantidade)
    VALUES
      (v_produto_id, v_cera_id, v_item.peso_cera),
      (v_produto_id, v_essencia_id, round((v_item.peso_cera * 0.10)::numeric, 4)),
      (v_produto_id, v_pavio_id, 1);

    IF v_caixa_id IS NOT NULL THEN
      INSERT INTO fichas_tecnicas (produto_id, insumo_id, quantidade)
      VALUES (v_produto_id, v_caixa_id, 1);
    END IF;

    SELECT COALESCE(SUM(custo_linha), 0)
      INTO v_custo
      FROM fichas_tecnicas
     WHERE produto_id = v_produto_id;

    UPDATE produtos
       SET custo_producao = v_custo,
           markup = 4,
           preco_venda = round(v_custo * 4, 2),
           updated_at = now()
     WHERE id = v_produto_id;
  END LOOP;

  INSERT INTO produtos (
    nome, sku, tipo, categoria_id, markup, preco_venda, custo_producao,
    estoque_atual, estoque_minimo, ativo
  )
  VALUES (
    'Vela latinha com frase surpresa 20g',
    'VELA-LATINHA-FRASE-20G',
    'producao',
    v_categoria_id,
    4,
    0,
    0,
    0,
    0,
    true
  )
  ON CONFLICT (sku) DO UPDATE SET
    nome = excluded.nome,
    tipo = excluded.tipo,
    categoria_id = excluded.categoria_id,
    markup = excluded.markup,
    ativo = true,
    updated_at = now()
  RETURNING id INTO v_produto_id;

  DELETE FROM fichas_tecnicas WHERE produto_id = v_produto_id;

  INSERT INTO fichas_tecnicas (produto_id, insumo_id, quantidade)
  VALUES
    (v_produto_id, v_cera_coco_mole_id, 20),
    (v_produto_id, v_essencia_id, 2),
    (v_produto_id, v_pavio_id, 1),
    (v_produto_id, v_latinha_id, 1),
    (v_produto_id, v_frase_id, 1);

  SELECT COALESCE(SUM(custo_linha), 0)
    INTO v_custo
    FROM fichas_tecnicas
   WHERE produto_id = v_produto_id;

  UPDATE produtos
     SET custo_producao = v_custo,
         markup = 4,
         preco_venda = round(v_custo * 4, 2),
         updated_at = now()
   WHERE id = v_produto_id;
END $$;

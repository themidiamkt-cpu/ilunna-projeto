-- Cadastro baseado nos prints recebidos em 2026-09-28.
-- Custos nao informados (embalagens das bolinhas) permanecem zerados.
-- Todos os fosforos incluem uma etiqueta na ficha tecnica.

DO $$
DECLARE
  v_categoria_id uuid;
  v_etiqueta_id uuid;
  v_bolinha_id uuid;
  v_embalagem_id uuid;
  v_produto_id uuid;
  v_custo numeric;
  v_item record;
BEGIN
  SELECT id INTO v_categoria_id
  FROM public.categorias
  WHERE lower(nome) = 'rituais'
  ORDER BY created_at
  LIMIT 1;

  IF v_categoria_id IS NULL THEN
    INSERT INTO public.categorias (nome, descricao, cor)
    VALUES ('Rituais', 'Produtos para rituais de bem-estar', '#8B6B9A')
    RETURNING id INTO v_categoria_id;
  END IF;

  SELECT id INTO v_etiqueta_id
  FROM public.insumos
  WHERE ativo = true AND lower(nome) = 'etiqueta'
  ORDER BY created_at
  LIMIT 1;

  IF v_etiqueta_id IS NULL THEN
    INSERT INTO public.insumos (
      nome, tipo, unidade, volume_compra, custo_compra, custo_unitario,
      estoque_atual, estoque_minimo, ativo
    )
    VALUES ('Etiqueta', 'acessorio', 'un', 1, 0, 0, 0, 0, true)
    RETURNING id INTO v_etiqueta_id;
  END IF;

  SELECT id INTO v_bolinha_id
  FROM public.insumos
  WHERE ativo = true AND lower(nome) LIKE '%bolinha de gude%'
  ORDER BY created_at
  LIMIT 1;

  IF v_bolinha_id IS NULL THEN
    RAISE EXCEPTION 'Insumo de bolinhas de gude nao encontrado';
  END IF;

  FOR v_item IN
    SELECT * FROM (VALUES
      ('BOLINHAS-MASSAGEADORAS-50', 'Bolinhas massageadoras 50 unidades', 'Frasco para bolinhas massageadoras', 0.00::numeric, 9::numeric, 'bolinhas'),
      ('BOLINHAS-MASSAGEADORAS-RUSTICO-50', 'Bolinhas massageadoras rustico 50 unidades', 'Saco rustico para bolinhas massageadoras', 0.00::numeric, 20::numeric, 'bolinhas'),
      ('FOSFOROS-ECOLOGICOS-110ML-40', 'Fosforos ecologicos 40 unidades 110 ml', 'Vidro cilindrico 110 ml com 40 fosforos ecologicos', 11.80::numeric, 2::numeric, 'fosforos'),
      ('FOSFOROS-ECOLOGICOS-35ML-40', 'Fosforos ecologicos 40 unidades 35 ml', 'Vidro cilindrico 35 ml com 40 fosforos ecologicos', 6.90::numeric, 11::numeric, 'fosforos'),
      ('FOSFOROS-ECOLOGICOS-20', 'Fosforos ecologicos 20 unidades', 'Vidro com 20 fosforos ecologicos', 4.90::numeric, 140::numeric, 'fosforos')
    ) AS t(sku, nome, embalagem_nome, embalagem_custo, estoque, grupo)
  LOOP
    SELECT id INTO v_embalagem_id
    FROM public.insumos
    WHERE nome = v_item.embalagem_nome
    ORDER BY created_at
    LIMIT 1;

    IF v_embalagem_id IS NULL THEN
      INSERT INTO public.insumos (
        nome, tipo, unidade, volume_compra, custo_compra, custo_unitario,
        estoque_atual, estoque_minimo, fornecedor, ativo
      )
      VALUES (
        v_item.embalagem_nome, 'embalagem', 'un', 1,
        v_item.embalagem_custo, v_item.embalagem_custo,
        0, 0,
        CASE WHEN v_item.grupo = 'fosforos' THEN 'Peter Paiva' ELSE NULL END,
        true
      )
      RETURNING id INTO v_embalagem_id;
    END IF;

    INSERT INTO public.produtos (
      nome, sku, tipo, categoria_id, markup, preco_venda, custo_producao,
      estoque_atual, estoque_minimo, ativo
    )
    VALUES (
      v_item.nome, v_item.sku, 'producao', v_categoria_id, 3, 0, 0,
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

    DELETE FROM public.fichas_tecnicas WHERE produto_id = v_produto_id;

    IF v_item.grupo = 'bolinhas' THEN
      INSERT INTO public.fichas_tecnicas (produto_id, insumo_id, quantidade)
      VALUES
        (v_produto_id, v_bolinha_id, 50),
        (v_produto_id, v_embalagem_id, 1),
        (v_produto_id, v_etiqueta_id, 1);
    ELSE
      INSERT INTO public.fichas_tecnicas (produto_id, insumo_id, quantidade)
      VALUES
        (v_produto_id, v_embalagem_id, 1),
        (v_produto_id, v_etiqueta_id, 1);
    END IF;

    SELECT COALESCE(sum(custo_linha), 0)
    INTO v_custo
    FROM public.fichas_tecnicas
    WHERE produto_id = v_produto_id;

    UPDATE public.produtos
    SET custo_producao = v_custo,
        preco_venda = round(v_custo * 3, 2),
        updated_at = now()
    WHERE id = v_produto_id;
  END LOOP;
END $$;

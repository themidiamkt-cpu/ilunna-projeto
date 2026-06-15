-- ============================================================
-- MIGRATION 005: Seed Data - Ilunna Gestão
-- Real data for Ilunna brand (Brazilian handmade aromatics)
-- ============================================================

-- ============================================================
-- CATEGORIAS
-- ============================================================
INSERT INTO categorias (id, nome, descricao, cor) VALUES
  ('a1000000-0000-0000-0000-000000000001', 'Velas', 'Velas aromaticas artesanais', '#C4704F'),
  ('a1000000-0000-0000-0000-000000000002', 'Difusores', 'Difusores de ambiente', '#D4A853'),
  ('a1000000-0000-0000-0000-000000000003', 'Home Spray', 'Sprays aromaticos para ambiente', '#6B8F71'),
  ('a1000000-0000-0000-0000-000000000004', 'Escalda Pes', 'Produtos para relaxamento dos pes', '#8B6B9A'),
  ('a1000000-0000-0000-0000-000000000005', 'Linha Premium', 'Produtos da linha premium', '#2C6E8A');

-- ============================================================
-- INSUMOS
-- custo_unitario is auto-calculated by trigger: custo_compra / volume_compra
-- ============================================================
INSERT INTO insumos (id, nome, tipo, unidade, volume_compra, custo_compra, estoque_atual, estoque_minimo, fornecedor) VALUES
  ('b1000000-0000-0000-0000-000000000001', 'Alcool', 'liquido', 'ml', 1000, 8.00, 3000, 500, 'Distribuidora Quimica'),
  ('b1000000-0000-0000-0000-000000000002', 'Agua', 'liquido', 'ml', 5000, 3.00, 10000, 2000, 'Agua Mineral Local'),
  ('b1000000-0000-0000-0000-000000000003', 'Essencia', 'liquido', 'ml', 100, 35.00, 500, 100, 'Aromaflor Essencias'),
  ('b1000000-0000-0000-0000-000000000004', 'Essencia de Cosmeticos', 'liquido', 'ml', 100, 45.00, 300, 100, 'Aromaflor Essencias'),
  ('b1000000-0000-0000-0000-000000000005', 'Melaleuca', 'liquido', 'ml', 30, 18.00, 120, 30, 'Naturais Brasil'),
  ('b1000000-0000-0000-0000-000000000006', 'Cera de Coco Mole', 'solido', 'gr', 1000, 32.00, 5000, 1000, 'Ceras Naturais'),
  ('b1000000-0000-0000-0000-000000000007', 'Cera de Coco Dura', 'solido', 'gr', 1000, 34.00, 3000, 1000, 'Ceras Naturais'),
  ('b1000000-0000-0000-0000-000000000008', 'Cera de Abelha', 'solido', 'gr', 500, 28.00, 1000, 250, 'Apicultura Sol'),
  ('b1000000-0000-0000-0000-000000000009', 'Manteiga de Karite', 'solido', 'gr', 500, 38.00, 1000, 200, 'Naturais Brasil'),
  ('b1000000-0000-0000-0000-000000000010', 'Oleo de Amendoa', 'liquido', 'ml', 500, 22.00, 1000, 200, 'Naturais Brasil'),
  ('b1000000-0000-0000-0000-000000000011', 'Corante', 'liquido', 'ml', 30, 12.00, 150, 30, 'Pigmento Arte'),
  ('b1000000-0000-0000-0000-000000000012', 'Sal Grosso', 'solido', 'gr', 1000, 4.00, 5000, 500, 'Mercado Local'),
  ('b1000000-0000-0000-0000-000000000013', 'Ervas', 'solido', 'gr', 100, 8.00, 500, 100, 'Horta Aromatica'),
  ('b1000000-0000-0000-0000-000000000014', 'Pavil/Pavio', 'embalagem', 'un', 100, 18.00, 300, 50, 'Embalagens Craft'),
  ('b1000000-0000-0000-0000-000000000015', 'Frasco', 'embalagem', 'un', 12, 36.00, 72, 12, 'Embalagens Craft'),
  ('b1000000-0000-0000-0000-000000000016', 'Tampa', 'embalagem', 'un', 12, 12.00, 72, 12, 'Embalagens Craft'),
  ('b1000000-0000-0000-0000-000000000017', 'Valvula', 'embalagem', 'un', 12, 24.00, 48, 12, 'Embalagens Craft'),
  ('b1000000-0000-0000-0000-000000000018', 'Vareta', 'embalagem', 'un', 10, 8.00, 60, 10, 'Embalagens Craft'),
  ('b1000000-0000-0000-0000-000000000019', 'Etiqueta', 'acessorio', 'un', 100, 35.00, 500, 100, 'Grafica Artesanal'),
  ('b1000000-0000-0000-0000-000000000020', 'Sacola', 'acessorio', 'un', 50, 45.00, 100, 20, 'Embalagens Kraft'),
  ('b1000000-0000-0000-0000-000000000021', 'Pote mais Tampa', 'embalagem', 'un', 6, 42.00, 36, 6, 'Embalagens Craft'),
  ('b1000000-0000-0000-0000-000000000022', 'Lacre de Seguranca', 'acessorio', 'un', 100, 8.00, 400, 50, 'Embalagens Craft'),
  ('b1000000-0000-0000-0000-000000000023', 'Embalagem', 'acessorio', 'un', 10, 25.00, 50, 10, 'Embalagens Kraft'),
  ('b1000000-0000-0000-0000-000000000024', 'Laco', 'acessorio', 'un', 50, 20.00, 150, 20, 'Artesanato Decor'),
  ('b1000000-0000-0000-0000-000000000025', 'Pacotinho', 'acessorio', 'un', 50, 30.00, 100, 20, 'Embalagens Kraft');

-- ============================================================
-- PRODUTOS
-- custo_producao will be recalculated after fichas_tecnicas insert
-- ============================================================
INSERT INTO produtos (id, nome, sku, categoria_id, preco_venda, estoque_atual, estoque_minimo, validade_dias) VALUES
  ('c1000000-0000-0000-0000-000000000001', 'Vela Massa Mole', 'ILU-VEL-001', 'a1000000-0000-0000-0000-000000000001', 45.00, 10, 3, 365),
  ('c1000000-0000-0000-0000-000000000002', 'Difusor Refil', 'ILU-DIF-001', 'a1000000-0000-0000-0000-000000000002', 35.00, 10, 3, 180),
  ('c1000000-0000-0000-0000-000000000003', 'Home Spray Refil', 'ILU-HSP-001', 'a1000000-0000-0000-0000-000000000003', 28.00, 10, 3, 365),
  ('c1000000-0000-0000-0000-000000000004', 'Escalda Pes', 'ILU-ESP-001', 'a1000000-0000-0000-0000-000000000004', 38.00, 10, 3, 730),
  ('c1000000-0000-0000-0000-000000000005', 'Difusor Linha Premium', 'ILU-DPR-001', 'a1000000-0000-0000-0000-000000000005', 75.00, 10, 2, 180);

-- ============================================================
-- FICHAS TECNICAS (BOM - Bill of Materials)
-- custo_linha is auto-calculated by trigger
-- ============================================================

-- Vela Massa Mole (c1000000-...-001)
-- Cera de Coco Mole 150gr + Essencia 15ml + Corante 2ml + Pavio 1un + Pote mais Tampa 1un + Etiqueta 1un
INSERT INTO fichas_tecnicas (produto_id, insumo_id, quantidade) VALUES
  ('c1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000006', 150),  -- Cera de Coco Mole 150gr
  ('c1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000003', 15),   -- Essencia 15ml
  ('c1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000011', 2),    -- Corante 2ml
  ('c1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000014', 1),    -- Pavio 1un
  ('c1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000021', 1),    -- Pote mais Tampa 1un
  ('c1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000019', 1);    -- Etiqueta 1un

-- Difusor Refil (c1000000-...-002)
-- Alcool 100ml + Essencia 20ml + Vareta 4un + Frasco 1un + Tampa 1un + Etiqueta 1un
INSERT INTO fichas_tecnicas (produto_id, insumo_id, quantidade) VALUES
  ('c1000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000001', 100),  -- Alcool 100ml
  ('c1000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000003', 20),   -- Essencia 20ml
  ('c1000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000018', 4),    -- Vareta 4un
  ('c1000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000015', 1),    -- Frasco 1un
  ('c1000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000016', 1),    -- Tampa 1un
  ('c1000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000019', 1);    -- Etiqueta 1un

-- Home Spray Refil (c1000000-...-003)
-- Alcool 80ml + Agua 20ml + Essencia 15ml + Frasco 1un + Valvula 1un + Etiqueta 1un
INSERT INTO fichas_tecnicas (produto_id, insumo_id, quantidade) VALUES
  ('c1000000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000001', 80),   -- Alcool 80ml
  ('c1000000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000002', 20),   -- Agua 20ml
  ('c1000000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000003', 15),   -- Essencia 15ml
  ('c1000000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000015', 1),    -- Frasco 1un
  ('c1000000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000017', 1),    -- Valvula 1un
  ('c1000000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000019', 1);    -- Etiqueta 1un

-- Escalda Pes (c1000000-...-004)
-- Sal Grosso 500gr + Ervas 20gr + Oleo de Amendoa 10ml + Melaleuca 5ml + Pacotinho 1un + Etiqueta 1un
INSERT INTO fichas_tecnicas (produto_id, insumo_id, quantidade) VALUES
  ('c1000000-0000-0000-0000-000000000004', 'b1000000-0000-0000-0000-000000000012', 500),  -- Sal Grosso 500gr
  ('c1000000-0000-0000-0000-000000000004', 'b1000000-0000-0000-0000-000000000013', 20),   -- Ervas 20gr
  ('c1000000-0000-0000-0000-000000000004', 'b1000000-0000-0000-0000-000000000010', 10),   -- Oleo de Amendoa 10ml
  ('c1000000-0000-0000-0000-000000000004', 'b1000000-0000-0000-0000-000000000005', 5),    -- Melaleuca 5ml
  ('c1000000-0000-0000-0000-000000000004', 'b1000000-0000-0000-0000-000000000025', 1),    -- Pacotinho 1un
  ('c1000000-0000-0000-0000-000000000004', 'b1000000-0000-0000-0000-000000000019', 1);    -- Etiqueta 1un

-- Difusor Linha Premium (c1000000-...-005)
-- Alcool 200ml + Essencia de Cosmeticos 40ml + Vareta 6un + Frasco 1un + Tampa 1un + Lacre 1un + Etiqueta 1un + Embalagem 1un
INSERT INTO fichas_tecnicas (produto_id, insumo_id, quantidade) VALUES
  ('c1000000-0000-0000-0000-000000000005', 'b1000000-0000-0000-0000-000000000001', 200),  -- Alcool 200ml
  ('c1000000-0000-0000-0000-000000000005', 'b1000000-0000-0000-0000-000000000004', 40),   -- Essencia de Cosmeticos 40ml
  ('c1000000-0000-0000-0000-000000000005', 'b1000000-0000-0000-0000-000000000018', 6),    -- Vareta 6un
  ('c1000000-0000-0000-0000-000000000005', 'b1000000-0000-0000-0000-000000000015', 1),    -- Frasco 1un
  ('c1000000-0000-0000-0000-000000000005', 'b1000000-0000-0000-0000-000000000016', 1),    -- Tampa 1un
  ('c1000000-0000-0000-0000-000000000005', 'b1000000-0000-0000-0000-000000000022', 1),    -- Lacre de Seguranca 1un
  ('c1000000-0000-0000-0000-000000000005', 'b1000000-0000-0000-0000-000000000019', 1),    -- Etiqueta 1un
  ('c1000000-0000-0000-0000-000000000005', 'b1000000-0000-0000-0000-000000000023', 1);    -- Embalagem 1un

-- ============================================================
-- Recalculate custo_producao for all products
-- (triggers handle fichas_tecnicas inserts, but we do a final
-- explicit recalc to guarantee correctness after seed)
-- ============================================================
UPDATE produtos p SET custo_producao = (
  SELECT COALESCE(SUM(ft.quantidade * i.custo_unitario), 0)
  FROM fichas_tecnicas ft
  JOIN insumos i ON i.id = ft.insumo_id
  WHERE ft.produto_id = p.id
);

-- ============================================================
-- CLIENTES (sample customers)
-- ============================================================
INSERT INTO clientes (id, nome, telefone, email) VALUES
  ('d1000000-0000-0000-0000-000000000001', 'Ana Paula Silva', '(11) 99999-1001', 'ana.paula@email.com'),
  ('d1000000-0000-0000-0000-000000000002', 'Beatriz Souza', '(11) 99999-1002', 'beatriz.souza@email.com'),
  ('d1000000-0000-0000-0000-000000000003', 'Camila Rodrigues', '(11) 99999-1003', NULL),
  ('d1000000-0000-0000-0000-000000000004', 'Daniela Lima', '(11) 99999-1004', 'daniela.lima@email.com'),
  ('d1000000-0000-0000-0000-000000000005', 'Fernanda Costa', '(21) 99999-2001', NULL);

-- ============================================================
-- CAIXA (one open caixa for sample sales)
-- ============================================================
INSERT INTO caixas (id, data_abertura, valor_abertura, status) VALUES
  ('e1000000-0000-0000-0000-000000000001', now() - INTERVAL '30 days', 100.00, 'aberto');

-- ============================================================
-- SAMPLE VENDAS + ITENS (last 30 days)
-- Note: usuario_id is NULL (set after real auth user is created)
-- numero uses manual values since we seed the sequence after
-- ============================================================

-- Set sequence to start at 11 after our manual seeds
SELECT setval('venda_numero_seq', 10);

-- Venda 1 - 28 dias atras - Vela Massa Mole x2 + Difusor Refil x1 - PIX
INSERT INTO vendas (id, numero, data, cliente_id, subtotal, desconto, total, forma_pagamento, status, caixa_id)
VALUES ('f1000000-0000-0000-0000-000000000001', '000001', now() - INTERVAL '28 days',
        'd1000000-0000-0000-0000-000000000001', 125.00, 0, 125.00, 'pix', 'concluida',
        'e1000000-0000-0000-0000-000000000001');
INSERT INTO venda_itens (venda_id, produto_id, quantidade, preco_unitario, custo_unitario, subtotal) VALUES
  ('f1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001', 2, 45.00,
   (SELECT custo_producao FROM produtos WHERE id = 'c1000000-0000-0000-0000-000000000001'), 90.00),
  ('f1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000002', 1, 35.00,
   (SELECT custo_producao FROM produtos WHERE id = 'c1000000-0000-0000-0000-000000000002'), 35.00);

-- Venda 2 - 26 dias atras - Home Spray Refil x3 - Dinheiro
INSERT INTO vendas (id, numero, data, cliente_id, subtotal, desconto, total, forma_pagamento, status, caixa_id)
VALUES ('f1000000-0000-0000-0000-000000000002', '000002', now() - INTERVAL '26 days',
        'd1000000-0000-0000-0000-000000000002', 84.00, 0, 84.00, 'dinheiro', 'concluida',
        'e1000000-0000-0000-0000-000000000001');
INSERT INTO venda_itens (venda_id, produto_id, quantidade, preco_unitario, custo_unitario, subtotal) VALUES
  ('f1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000003', 3, 28.00,
   (SELECT custo_producao FROM produtos WHERE id = 'c1000000-0000-0000-0000-000000000003'), 84.00);

-- Venda 3 - 24 dias atras - Difusor Premium x1 + Vela x1 - Credito
INSERT INTO vendas (id, numero, data, cliente_id, subtotal, desconto, total, forma_pagamento, status, caixa_id)
VALUES ('f1000000-0000-0000-0000-000000000003', '000003', now() - INTERVAL '24 days',
        'd1000000-0000-0000-0000-000000000003', 120.00, 10.00, 110.00, 'credito', 'concluida',
        'e1000000-0000-0000-0000-000000000001');
INSERT INTO venda_itens (venda_id, produto_id, quantidade, preco_unitario, custo_unitario, subtotal) VALUES
  ('f1000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000005', 1, 75.00,
   (SELECT custo_producao FROM produtos WHERE id = 'c1000000-0000-0000-0000-000000000005'), 75.00),
  ('f1000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000001', 1, 45.00,
   (SELECT custo_producao FROM produtos WHERE id = 'c1000000-0000-0000-0000-000000000001'), 45.00);

-- Venda 4 - 21 dias atras - Escalda Pes x2 - PIX
INSERT INTO vendas (id, numero, data, cliente_id, subtotal, desconto, total, forma_pagamento, status, caixa_id)
VALUES ('f1000000-0000-0000-0000-000000000004', '000004', now() - INTERVAL '21 days',
        'd1000000-0000-0000-0000-000000000004', 76.00, 0, 76.00, 'pix', 'concluida',
        'e1000000-0000-0000-0000-000000000001');
INSERT INTO venda_itens (venda_id, produto_id, quantidade, preco_unitario, custo_unitario, subtotal) VALUES
  ('f1000000-0000-0000-0000-000000000004', 'c1000000-0000-0000-0000-000000000004', 2, 38.00,
   (SELECT custo_producao FROM produtos WHERE id = 'c1000000-0000-0000-0000-000000000004'), 76.00);

-- Venda 5 - 18 dias atras - Kit: Vela + Difusor + Home Spray - Debito
INSERT INTO vendas (id, numero, data, cliente_id, subtotal, desconto, total, forma_pagamento, status, caixa_id)
VALUES ('f1000000-0000-0000-0000-000000000005', '000005', now() - INTERVAL '18 days',
        'd1000000-0000-0000-0000-000000000005', 108.00, 0, 108.00, 'debito', 'concluida',
        'e1000000-0000-0000-0000-000000000001');
INSERT INTO venda_itens (venda_id, produto_id, quantidade, preco_unitario, custo_unitario, subtotal) VALUES
  ('f1000000-0000-0000-0000-000000000005', 'c1000000-0000-0000-0000-000000000001', 1, 45.00,
   (SELECT custo_producao FROM produtos WHERE id = 'c1000000-0000-0000-0000-000000000001'), 45.00),
  ('f1000000-0000-0000-0000-000000000005', 'c1000000-0000-0000-0000-000000000002', 1, 35.00,
   (SELECT custo_producao FROM produtos WHERE id = 'c1000000-0000-0000-0000-000000000002'), 35.00),
  ('f1000000-0000-0000-0000-000000000005', 'c1000000-0000-0000-0000-000000000003', 1, 28.00,
   (SELECT custo_producao FROM produtos WHERE id = 'c1000000-0000-0000-0000-000000000003'), 28.00);

-- Venda 6 - 15 dias atras - Difusor Premium x2 - PIX
INSERT INTO vendas (id, numero, data, subtotal, desconto, total, forma_pagamento, status, caixa_id)
VALUES ('f1000000-0000-0000-0000-000000000006', '000006', now() - INTERVAL '15 days',
        150.00, 0, 150.00, 'pix', 'concluida',
        'e1000000-0000-0000-0000-000000000001');
INSERT INTO venda_itens (venda_id, produto_id, quantidade, preco_unitario, custo_unitario, subtotal) VALUES
  ('f1000000-0000-0000-0000-000000000006', 'c1000000-0000-0000-0000-000000000005', 2, 75.00,
   (SELECT custo_producao FROM produtos WHERE id = 'c1000000-0000-0000-0000-000000000005'), 150.00);

-- Venda 7 - 12 dias atras - Vela x3 + Escalda Pes x1 - Dinheiro
INSERT INTO vendas (id, numero, data, cliente_id, subtotal, desconto, total, forma_pagamento, status, caixa_id)
VALUES ('f1000000-0000-0000-0000-000000000007', '000007', now() - INTERVAL '12 days',
        'd1000000-0000-0000-0000-000000000001', 173.00, 8.00, 165.00, 'dinheiro', 'concluida',
        'e1000000-0000-0000-0000-000000000001');
INSERT INTO venda_itens (venda_id, produto_id, quantidade, preco_unitario, custo_unitario, subtotal) VALUES
  ('f1000000-0000-0000-0000-000000000007', 'c1000000-0000-0000-0000-000000000001', 3, 45.00,
   (SELECT custo_producao FROM produtos WHERE id = 'c1000000-0000-0000-0000-000000000001'), 135.00),
  ('f1000000-0000-0000-0000-000000000007', 'c1000000-0000-0000-0000-000000000004', 1, 38.00,
   (SELECT custo_producao FROM produtos WHERE id = 'c1000000-0000-0000-0000-000000000004'), 38.00);

-- Venda 8 - 8 dias atras - Home Spray x2 + Difusor x1 - Credito
INSERT INTO vendas (id, numero, data, cliente_id, subtotal, desconto, total, forma_pagamento, status, caixa_id)
VALUES ('f1000000-0000-0000-0000-000000000008', '000008', now() - INTERVAL '8 days',
        'd1000000-0000-0000-0000-000000000002', 91.00, 0, 91.00, 'credito', 'concluida',
        'e1000000-0000-0000-0000-000000000001');
INSERT INTO venda_itens (venda_id, produto_id, quantidade, preco_unitario, custo_unitario, subtotal) VALUES
  ('f1000000-0000-0000-0000-000000000008', 'c1000000-0000-0000-0000-000000000003', 2, 28.00,
   (SELECT custo_producao FROM produtos WHERE id = 'c1000000-0000-0000-0000-000000000003'), 56.00),
  ('f1000000-0000-0000-0000-000000000008', 'c1000000-0000-0000-0000-000000000002', 1, 35.00,
   (SELECT custo_producao FROM produtos WHERE id = 'c1000000-0000-0000-0000-000000000002'), 35.00);

-- Venda 9 - 4 dias atras - Difusor Premium x1 + Vela x2 + Escalda Pes x1 - PIX
INSERT INTO vendas (id, numero, data, cliente_id, subtotal, desconto, total, forma_pagamento, status, caixa_id)
VALUES ('f1000000-0000-0000-0000-000000000009', '000009', now() - INTERVAL '4 days',
        'd1000000-0000-0000-0000-000000000003', 163.00, 15.00, 148.00, 'pix', 'concluida',
        'e1000000-0000-0000-0000-000000000001');
INSERT INTO venda_itens (venda_id, produto_id, quantidade, preco_unitario, custo_unitario, subtotal) VALUES
  ('f1000000-0000-0000-0000-000000000009', 'c1000000-0000-0000-0000-000000000005', 1, 75.00,
   (SELECT custo_producao FROM produtos WHERE id = 'c1000000-0000-0000-0000-000000000005'), 75.00),
  ('f1000000-0000-0000-0000-000000000009', 'c1000000-0000-0000-0000-000000000001', 2, 45.00,
   (SELECT custo_producao FROM produtos WHERE id = 'c1000000-0000-0000-0000-000000000001'), 90.00),
  ('f1000000-0000-0000-0000-000000000009', 'c1000000-0000-0000-0000-000000000004', 1, 38.00,
   (SELECT custo_producao FROM produtos WHERE id = 'c1000000-0000-0000-0000-000000000004'), 38.00);

-- Venda 10 - Hoje - Vela x1 + Home Spray x1 - PIX
INSERT INTO vendas (id, numero, data, cliente_id, subtotal, desconto, total, forma_pagamento, status, caixa_id)
VALUES ('f1000000-0000-0000-0000-000000000010', '000010', now(),
        'd1000000-0000-0000-0000-000000000004', 73.00, 0, 73.00, 'pix', 'concluida',
        'e1000000-0000-0000-0000-000000000001');
INSERT INTO venda_itens (venda_id, produto_id, quantidade, preco_unitario, custo_unitario, subtotal) VALUES
  ('f1000000-0000-0000-0000-000000000010', 'c1000000-0000-0000-0000-000000000001', 1, 45.00,
   (SELECT custo_producao FROM produtos WHERE id = 'c1000000-0000-0000-0000-000000000001'), 45.00),
  ('f1000000-0000-0000-0000-000000000010', 'c1000000-0000-0000-0000-000000000003', 1, 28.00,
   (SELECT custo_producao FROM produtos WHERE id = 'c1000000-0000-0000-0000-000000000003'), 28.00);

-- ============================================================
-- Update product stock to reflect what would remain after sample sales
-- (In production, processar_venda RPC handles this automatically)
-- The initial estoque_atual=10 was set assuming no prior sales.
-- After 10 sample vendas the actual stock should be adjusted.
-- For simplicity in seed, we recalculate based on vendas.
-- ============================================================
UPDATE produtos SET estoque_atual = 10 - (
  SELECT COALESCE(SUM(vi.quantidade), 0)
  FROM venda_itens vi
  JOIN vendas v ON v.id = vi.venda_id AND v.status = 'concluida'
  WHERE vi.produto_id = produtos.id
);

-- Ensure no negative stock (clamp to 0)
UPDATE produtos SET estoque_atual = 0 WHERE estoque_atual < 0;

-- ============================================================
-- SAMPLE PRODUCOES (production records)
-- ============================================================
INSERT INTO producoes (produto_id, quantidade_produzida, custo_total, lote, validade, data, observacao) VALUES
  ('c1000000-0000-0000-0000-000000000001',
   20,
   (SELECT custo_producao FROM produtos WHERE id = 'c1000000-0000-0000-0000-000000000001') * 20,
   'LOT-20260510-001',
   CURRENT_DATE + 365,
   now() - INTERVAL '5 days',
   'Primeiro lote do mes'),
  ('c1000000-0000-0000-0000-000000000002',
   15,
   (SELECT custo_producao FROM produtos WHERE id = 'c1000000-0000-0000-0000-000000000002') * 15,
   'LOT-20260510-002',
   CURRENT_DATE + 180,
   now() - INTERVAL '3 days',
   'Producao semanal difusores'),
  ('c1000000-0000-0000-0000-000000000003',
   20,
   (SELECT custo_producao FROM produtos WHERE id = 'c1000000-0000-0000-0000-000000000003') * 20,
   'LOT-20260510-003',
   CURRENT_DATE + 365,
   now() - INTERVAL '2 days',
   'Producao semanal home spray');

-- ============================================================
-- MOVIMENTACOES ESTOQUE (sample stock movements for audit trail)
-- ============================================================
INSERT INTO movimentacoes_estoque (tipo, referencia_tipo, referencia_id, quantidade, custo_unitario, motivo, data) VALUES
  ('entrada_insumo', 'insumo', 'b1000000-0000-0000-0000-000000000006', 2000, 0.032000, 'Compra Cera de Coco Mole', now() - INTERVAL '15 days'),
  ('entrada_insumo', 'insumo', 'b1000000-0000-0000-0000-000000000003', 300, 0.350000, 'Compra Essencia', now() - INTERVAL '15 days'),
  ('entrada_insumo', 'insumo', 'b1000000-0000-0000-0000-000000000001', 2000, 0.008000, 'Compra Alcool', now() - INTERVAL '10 days'),
  ('entrada_insumo', 'insumo', 'b1000000-0000-0000-0000-000000000019', 200, 0.350000, 'Compra Etiquetas', now() - INTERVAL '10 days');

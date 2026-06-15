-- ============================================================
-- MIGRATION 003: Views - Ilunna Gestão
-- ============================================================

-- ============================================================
-- VIEW: vw_margem_produtos
-- Product margin analysis
-- ============================================================
CREATE OR REPLACE VIEW vw_margem_produtos AS
SELECT
  p.id,
  p.nome,
  p.sku,
  c.nome AS categoria,
  c.cor AS categoria_cor,
  p.preco_venda,
  p.custo_producao,
  p.margem_valor,
  p.margem_percentual,
  p.estoque_atual,
  p.estoque_minimo,
  p.ativo
FROM produtos p
LEFT JOIN categorias c ON c.id = p.categoria_id
ORDER BY p.margem_percentual DESC;

-- ============================================================
-- VIEW: vw_estoque_baixo
-- Items below minimum stock (both products and insumos)
-- ============================================================
CREATE OR REPLACE VIEW vw_estoque_baixo AS
SELECT
  'produto' AS tipo,
  id,
  nome,
  estoque_atual,
  estoque_minimo,
  (estoque_minimo - estoque_atual) AS falta,
  NULL::TEXT AS unidade
FROM produtos
WHERE estoque_atual <= estoque_minimo AND ativo = true
UNION ALL
SELECT
  'insumo' AS tipo,
  id,
  nome,
  estoque_atual,
  estoque_minimo,
  (estoque_minimo - estoque_atual) AS falta,
  unidade::TEXT
FROM insumos
WHERE estoque_atual <= estoque_minimo AND ativo = true
ORDER BY falta DESC;

-- ============================================================
-- VIEW: vw_vendas_diarias
-- Daily sales summary
-- ============================================================
CREATE OR REPLACE VIEW vw_vendas_diarias AS
SELECT
  DATE(v.data) AS dia,
  COUNT(v.id) AS num_vendas,
  SUM(v.total) AS faturamento,
  SUM(vi_custo.custo_total) AS custo_total,
  SUM(v.total) - SUM(vi_custo.custo_total) AS lucro,
  CASE WHEN SUM(v.total) > 0 THEN
    ((SUM(v.total) - SUM(vi_custo.custo_total)) / SUM(v.total)) * 100
  ELSE 0 END AS margem_percentual,
  CASE WHEN COUNT(v.id) > 0 THEN SUM(v.total) / COUNT(v.id) ELSE 0 END AS ticket_medio
FROM vendas v
LEFT JOIN LATERAL (
  SELECT SUM(vi.custo_unitario * vi.quantidade) AS custo_total
  FROM venda_itens vi WHERE vi.venda_id = v.id
) vi_custo ON true
WHERE v.status = 'concluida'
GROUP BY DATE(v.data)
ORDER BY dia DESC;

-- ============================================================
-- VIEW: vw_vendas_por_categoria
-- Sales grouped by product category
-- ============================================================
CREATE OR REPLACE VIEW vw_vendas_por_categoria AS
SELECT
  c.id AS categoria_id,
  c.nome AS categoria,
  c.cor,
  COUNT(DISTINCT v.id) AS num_vendas,
  SUM(vi.quantidade) AS qtd_itens,
  SUM(vi.subtotal) AS faturamento,
  SUM(vi.custo_unitario * vi.quantidade) AS custo_total,
  SUM(vi.subtotal) - SUM(vi.custo_unitario * vi.quantidade) AS lucro
FROM venda_itens vi
JOIN vendas v ON v.id = vi.venda_id AND v.status = 'concluida'
JOIN produtos p ON p.id = vi.produto_id
LEFT JOIN categorias c ON c.id = p.categoria_id
GROUP BY c.id, c.nome, c.cor
ORDER BY faturamento DESC;

-- ============================================================
-- VIEW: vw_produtos_mais_vendidos
-- Top products by quantity and revenue
-- ============================================================
CREATE OR REPLACE VIEW vw_produtos_mais_vendidos AS
SELECT
  p.id,
  p.nome,
  p.sku,
  c.nome AS categoria,
  SUM(vi.quantidade) AS qtd_vendida,
  SUM(vi.subtotal) AS faturamento,
  SUM(vi.custo_unitario * vi.quantidade) AS custo_total,
  SUM(vi.subtotal) - SUM(vi.custo_unitario * vi.quantidade) AS lucro,
  CASE WHEN SUM(vi.subtotal) > 0 THEN
    ((SUM(vi.subtotal) - SUM(vi.custo_unitario * vi.quantidade)) / SUM(vi.subtotal)) * 100
  ELSE 0 END AS margem_media
FROM venda_itens vi
JOIN vendas v ON v.id = vi.venda_id AND v.status = 'concluida'
JOIN produtos p ON p.id = vi.produto_id
LEFT JOIN categorias c ON c.id = p.categoria_id
GROUP BY p.id, p.nome, p.sku, c.nome
ORDER BY qtd_vendida DESC;

-- ============================================================
-- VIEW: vw_valorizacao_estoque
-- Stock valuation
-- ============================================================
CREATE OR REPLACE VIEW vw_valorizacao_estoque AS
SELECT
  'produto' AS tipo,
  id,
  nome,
  estoque_atual AS quantidade,
  custo_producao AS custo_unitario,
  estoque_atual * custo_producao AS valor_custo,
  preco_venda AS preco_unitario,
  estoque_atual * preco_venda AS valor_venda
FROM produtos
WHERE ativo = true AND estoque_atual > 0
UNION ALL
SELECT
  'insumo' AS tipo,
  id,
  nome,
  estoque_atual AS quantidade,
  custo_unitario,
  estoque_atual * custo_unitario AS valor_custo,
  NULL AS preco_unitario,
  NULL AS valor_venda
FROM insumos
WHERE ativo = true AND estoque_atual > 0;

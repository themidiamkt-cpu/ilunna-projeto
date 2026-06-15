-- ============================================================
-- MIGRATION 004: RLS Policies - Ilunna Gestão
-- admin: full access; operador: limited access
-- ============================================================

-- Helper function to get current user's papel
CREATE OR REPLACE FUNCTION get_user_papel()
RETURNS TEXT LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT papel::TEXT FROM perfis WHERE usuario_id = auth.uid();
$$;

-- ============================================================
-- categorias: all authenticated users can read
-- ============================================================
CREATE POLICY "categorias_select" ON categorias FOR SELECT TO authenticated USING (true);
CREATE POLICY "categorias_admin_all" ON categorias FOR ALL TO authenticated
  USING (get_user_papel() = 'admin')
  WITH CHECK (get_user_papel() = 'admin');

-- ============================================================
-- perfis: users can see their own, admins see all
-- ============================================================
CREATE POLICY "perfis_own" ON perfis FOR SELECT TO authenticated
  USING (usuario_id = auth.uid() OR get_user_papel() = 'admin');
CREATE POLICY "perfis_admin_write" ON perfis FOR ALL TO authenticated
  USING (get_user_papel() = 'admin')
  WITH CHECK (get_user_papel() = 'admin');

-- ============================================================
-- insumos: operador can read, admin can write
-- ============================================================
CREATE POLICY "insumos_select" ON insumos FOR SELECT TO authenticated USING (true);
CREATE POLICY "insumos_admin_write" ON insumos FOR ALL TO authenticated
  USING (get_user_papel() = 'admin')
  WITH CHECK (get_user_papel() = 'admin');

-- ============================================================
-- produtos: all authenticated can read
-- ============================================================
CREATE POLICY "produtos_select" ON produtos FOR SELECT TO authenticated USING (true);
CREATE POLICY "produtos_admin_write" ON produtos FOR ALL TO authenticated
  USING (get_user_papel() = 'admin')
  WITH CHECK (get_user_papel() = 'admin');

-- ============================================================
-- fichas_tecnicas: admin only write, all read
-- ============================================================
CREATE POLICY "fichas_select" ON fichas_tecnicas FOR SELECT TO authenticated USING (true);
CREATE POLICY "fichas_admin_write" ON fichas_tecnicas FOR ALL TO authenticated
  USING (get_user_papel() = 'admin')
  WITH CHECK (get_user_papel() = 'admin');

-- ============================================================
-- clientes: all authenticated
-- ============================================================
CREATE POLICY "clientes_all" ON clientes FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- caixas: all authenticated can read/manage
-- ============================================================
CREATE POLICY "caixas_all" ON caixas FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- vendas: all authenticated can create/read
-- ============================================================
CREATE POLICY "vendas_select" ON vendas FOR SELECT TO authenticated USING (true);
CREATE POLICY "vendas_insert" ON vendas FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "vendas_update" ON vendas FOR UPDATE TO authenticated USING (true);

-- ============================================================
-- venda_itens: all authenticated
-- ============================================================
CREATE POLICY "venda_itens_all" ON venda_itens FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- producoes: all authenticated can read, admin and operador create
-- ============================================================
CREATE POLICY "producoes_all" ON producoes FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- movimentacoes_estoque: all authenticated can read, insert via RPC
-- ============================================================
CREATE POLICY "movimentacoes_select" ON movimentacoes_estoque FOR SELECT TO authenticated USING (true);
CREATE POLICY "movimentacoes_insert" ON movimentacoes_estoque FOR INSERT TO authenticated WITH CHECK (true);

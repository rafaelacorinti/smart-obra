-- ============================================================
-- Smart Obra - Migration 004: RLS por Tenant
-- Substituir policies de full access por isolamento por company_id
-- ============================================================

-- 1. Funcao helper para extrair company_id do JWT (via app_metadata)
CREATE OR REPLACE FUNCTION auth.company_id() RETURNS UUID AS $$$$
  SELECT COALESCE(
    (current_setting('request.jwt.claims', true)::json->>'company_id')::uuid,
    NULL
  );
$$$$ LANGUAGE SQL STABLE;

CREATE OR REPLACE FUNCTION auth.is_platform_admin() RETURNS BOOLEAN AS $$$$
  SELECT COALESCE(
    (current_setting('request.jwt.claims', true)::json->>'is_platform_admin')::boolean,
    false
  );
$$$$ LANGUAGE SQL STABLE;

-- 2. Drop ALL old policies e criar novas para tabelas de dados
DO $$$$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'clientes','obras','lancamentos','orcamentos','ordens_servico',
    'colaboradores','presencas_colaborador','pagamentos_colaborador',
    'documentos_colaborador','colaboradores_obra','materiais_obra',
    'fornecedores','materiais_estoque','movimentacoes_estoque',
    'veiculos','manutencoes_veiculo','abastecimentos_veiculo',
    'documentos_veiculo','diario_obra','fotos_obra','documentos_obra',
    'timeline_obra','eventos_calendario','documentos_cliente',
    'cronograma_etapas','compras','centro_custos','orcado_realizado',
    'app_settings'
  ]
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Authenticated full access" ON %I', tbl);
    EXECUTE format(
      'CREATE POLICY "Tenant isolation" ON %I FOR ALL TO authenticated USING (company_id = auth.company_id() OR auth.is_platform_admin()) WITH CHECK (company_id = auth.company_id())',
      tbl
    );
  END LOOP;
END $$$$;

-- 3. RLS para companies
DROP POLICY IF EXISTS "Authenticated full access" ON companies;

CREATE POLICY "Members can view their companies" ON companies
  FOR SELECT TO authenticated
  USING (
    id IN (SELECT company_id FROM user_companies WHERE user_id = auth.uid())
    OR auth.is_platform_admin()
  );

CREATE POLICY "Platform admin manages companies" ON companies
  FOR INSERT TO authenticated
  WITH CHECK (auth.is_platform_admin());

CREATE POLICY "Platform admin updates companies" ON companies
  FOR UPDATE TO authenticated
  USING (auth.is_platform_admin())
  WITH CHECK (auth.is_platform_admin());

CREATE POLICY "Platform admin deletes companies" ON companies
  FOR DELETE TO authenticated
  USING (auth.is_platform_admin());

-- 4. RLS para user_companies
DROP POLICY IF EXISTS "Authenticated full access" ON user_companies;

CREATE POLICY "Users see own memberships" ON user_companies
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR auth.is_platform_admin());

CREATE POLICY "Platform admin manages memberships" ON user_companies
  FOR INSERT TO authenticated
  WITH CHECK (auth.is_platform_admin());

CREATE POLICY "Platform admin updates memberships" ON user_companies
  FOR UPDATE TO authenticated
  USING (auth.is_platform_admin())
  WITH CHECK (auth.is_platform_admin());

CREATE POLICY "Platform admin deletes memberships" ON user_companies
  FOR DELETE TO authenticated
  USING (auth.is_platform_admin());

-- 5. user_profiles: manter acesso basico + platform admin
-- (nao alterar policy existente, apenas garantir que funciona)

-- 6. access_requests: manter acesso anon (nao alterar)

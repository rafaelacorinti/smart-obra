-- ============================================================
-- Smart Obra - Migration 003: Multi-Tenant
-- Criar tabelas companies + user_companies
-- Adicionar company_id a TODAS as tabelas de dados
-- Migrar dados existentes para empresa inicial
-- ============================================================

-- 1. TABELA: companies
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  legal_name TEXT,
  document_number TEXT,
  slug TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','suspended')),
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free','pro')),
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. TABELA: user_companies (N:N)
CREATE TABLE IF NOT EXISTS user_companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner','admin','manager','member')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, company_id)
);

CREATE INDEX IF NOT EXISTS idx_user_companies_user ON user_companies(user_id);
CREATE INDEX IF NOT EXISTS idx_user_companies_company ON user_companies(company_id);

-- 3. Adicionar is_platform_admin ao user_profiles
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS is_platform_admin BOOLEAN DEFAULT false;

-- 4. Criar empresa inicial
INSERT INTO companies (id, name, legal_name, slug, status, plan)
VALUES ('00000000-0000-0000-0000-000000000001', 'Empresa Principal', 'Empresa Principal', 'empresa-principal', 'active', 'pro')
ON CONFLICT (id) DO NOTHING;

-- 5. Adicionar company_id a TODAS as tabelas de dados
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);
ALTER TABLE obras ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);
ALTER TABLE lancamentos ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);
ALTER TABLE orcamentos ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);
ALTER TABLE ordens_servico ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);
ALTER TABLE colaboradores ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);
ALTER TABLE presencas_colaborador ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);
ALTER TABLE pagamentos_colaborador ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);
ALTER TABLE documentos_colaborador ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);
ALTER TABLE colaboradores_obra ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);
ALTER TABLE materiais_obra ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);
ALTER TABLE fornecedores ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);
ALTER TABLE materiais_estoque ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);
ALTER TABLE movimentacoes_estoque ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);
ALTER TABLE veiculos ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);
ALTER TABLE manutencoes_veiculo ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);
ALTER TABLE abastecimentos_veiculo ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);
ALTER TABLE documentos_veiculo ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);
ALTER TABLE diario_obra ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);
ALTER TABLE fotos_obra ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);
ALTER TABLE documentos_obra ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);
ALTER TABLE timeline_obra ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);
ALTER TABLE eventos_calendario ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);
ALTER TABLE documentos_cliente ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);
ALTER TABLE cronograma_etapas ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);
ALTER TABLE compras ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);
ALTER TABLE centro_custos ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);
ALTER TABLE orcado_realizado ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);
ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);

-- 6. Migrar dados existentes para empresa inicial
UPDATE clientes SET company_id = '00000000-0000-0000-0000-000000000001' WHERE company_id IS NULL;
UPDATE obras SET company_id = '00000000-0000-0000-0000-000000000001' WHERE company_id IS NULL;
UPDATE lancamentos SET company_id = '00000000-0000-0000-0000-000000000001' WHERE company_id IS NULL;
UPDATE orcamentos SET company_id = '00000000-0000-0000-0000-000000000001' WHERE company_id IS NULL;
UPDATE ordens_servico SET company_id = '00000000-0000-0000-0000-000000000001' WHERE company_id IS NULL;
UPDATE colaboradores SET company_id = '00000000-0000-0000-0000-000000000001' WHERE company_id IS NULL;
UPDATE presencas_colaborador SET company_id = '00000000-0000-0000-0000-000000000001' WHERE company_id IS NULL;
UPDATE pagamentos_colaborador SET company_id = '00000000-0000-0000-0000-000000000001' WHERE company_id IS NULL;
UPDATE documentos_colaborador SET company_id = '00000000-0000-0000-0000-000000000001' WHERE company_id IS NULL;
UPDATE colaboradores_obra SET company_id = '00000000-0000-0000-0000-000000000001' WHERE company_id IS NULL;
UPDATE materiais_obra SET company_id = '00000000-0000-0000-0000-000000000001' WHERE company_id IS NULL;
UPDATE fornecedores SET company_id = '00000000-0000-0000-0000-000000000001' WHERE company_id IS NULL;
UPDATE materiais_estoque SET company_id = '00000000-0000-0000-0000-000000000001' WHERE company_id IS NULL;
UPDATE movimentacoes_estoque SET company_id = '00000000-0000-0000-0000-000000000001' WHERE company_id IS NULL;
UPDATE veiculos SET company_id = '00000000-0000-0000-0000-000000000001' WHERE company_id IS NULL;
UPDATE manutencoes_veiculo SET company_id = '00000000-0000-0000-0000-000000000001' WHERE company_id IS NULL;
UPDATE abastecimentos_veiculo SET company_id = '00000000-0000-0000-0000-000000000001' WHERE company_id IS NULL;
UPDATE documentos_veiculo SET company_id = '00000000-0000-0000-0000-000000000001' WHERE company_id IS NULL;
UPDATE diario_obra SET company_id = '00000000-0000-0000-0000-000000000001' WHERE company_id IS NULL;
UPDATE fotos_obra SET company_id = '00000000-0000-0000-0000-000000000001' WHERE company_id IS NULL;
UPDATE documentos_obra SET company_id = '00000000-0000-0000-0000-000000000001' WHERE company_id IS NULL;
UPDATE timeline_obra SET company_id = '00000000-0000-0000-0000-000000000001' WHERE company_id IS NULL;
UPDATE eventos_calendario SET company_id = '00000000-0000-0000-0000-000000000001' WHERE company_id IS NULL;
UPDATE documentos_cliente SET company_id = '00000000-0000-0000-0000-000000000001' WHERE company_id IS NULL;
UPDATE cronograma_etapas SET company_id = '00000000-0000-0000-0000-000000000001' WHERE company_id IS NULL;
UPDATE compras SET company_id = '00000000-0000-0000-0000-000000000001' WHERE company_id IS NULL;
UPDATE centro_custos SET company_id = '00000000-0000-0000-0000-000000000001' WHERE company_id IS NULL;
UPDATE orcado_realizado SET company_id = '00000000-0000-0000-0000-000000000001' WHERE company_id IS NULL;
UPDATE app_settings SET company_id = '00000000-0000-0000-0000-000000000001' WHERE company_id IS NULL;

-- 7. Tornar company_id NOT NULL apos migracao
ALTER TABLE clientes ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE obras ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE lancamentos ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE orcamentos ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE ordens_servico ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE colaboradores ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE presencas_colaborador ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE pagamentos_colaborador ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE documentos_colaborador ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE colaboradores_obra ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE materiais_obra ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE fornecedores ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE materiais_estoque ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE movimentacoes_estoque ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE veiculos ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE manutencoes_veiculo ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE abastecimentos_veiculo ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE documentos_veiculo ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE diario_obra ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE fotos_obra ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE documentos_obra ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE timeline_obra ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE eventos_calendario ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE documentos_cliente ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE cronograma_etapas ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE compras ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE centro_custos ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE orcado_realizado ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE app_settings ALTER COLUMN company_id SET NOT NULL;

-- 8. Criar indexes para company_id
CREATE INDEX IF NOT EXISTS idx_clientes_company ON clientes(company_id);
CREATE INDEX IF NOT EXISTS idx_obras_company ON obras(company_id);
CREATE INDEX IF NOT EXISTS idx_lancamentos_company ON lancamentos(company_id);
CREATE INDEX IF NOT EXISTS idx_orcamentos_company ON orcamentos(company_id);
CREATE INDEX IF NOT EXISTS idx_ordens_servico_company ON ordens_servico(company_id);
CREATE INDEX IF NOT EXISTS idx_colaboradores_company ON colaboradores(company_id);
CREATE INDEX IF NOT EXISTS idx_presencas_colaborador_company ON presencas_colaborador(company_id);
CREATE INDEX IF NOT EXISTS idx_pagamentos_colaborador_company ON pagamentos_colaborador(company_id);
CREATE INDEX IF NOT EXISTS idx_documentos_colaborador_company ON documentos_colaborador(company_id);
CREATE INDEX IF NOT EXISTS idx_colaboradores_obra_company ON colaboradores_obra(company_id);
CREATE INDEX IF NOT EXISTS idx_materiais_obra_company ON materiais_obra(company_id);
CREATE INDEX IF NOT EXISTS idx_fornecedores_company ON fornecedores(company_id);
CREATE INDEX IF NOT EXISTS idx_materiais_estoque_company ON materiais_estoque(company_id);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_estoque_company ON movimentacoes_estoque(company_id);
CREATE INDEX IF NOT EXISTS idx_veiculos_company ON veiculos(company_id);
CREATE INDEX IF NOT EXISTS idx_manutencoes_veiculo_company ON manutencoes_veiculo(company_id);
CREATE INDEX IF NOT EXISTS idx_abastecimentos_veiculo_company ON abastecimentos_veiculo(company_id);
CREATE INDEX IF NOT EXISTS idx_documentos_veiculo_company ON documentos_veiculo(company_id);
CREATE INDEX IF NOT EXISTS idx_diario_obra_company ON diario_obra(company_id);
CREATE INDEX IF NOT EXISTS idx_fotos_obra_company ON fotos_obra(company_id);
CREATE INDEX IF NOT EXISTS idx_documentos_obra_company ON documentos_obra(company_id);
CREATE INDEX IF NOT EXISTS idx_timeline_obra_company ON timeline_obra(company_id);
CREATE INDEX IF NOT EXISTS idx_eventos_calendario_company ON eventos_calendario(company_id);
CREATE INDEX IF NOT EXISTS idx_documentos_cliente_company ON documentos_cliente(company_id);
CREATE INDEX IF NOT EXISTS idx_cronograma_etapas_company ON cronograma_etapas(company_id);
CREATE INDEX IF NOT EXISTS idx_compras_company ON compras(company_id);
CREATE INDEX IF NOT EXISTS idx_centro_custos_company ON centro_custos(company_id);
CREATE INDEX IF NOT EXISTS idx_orcado_realizado_company ON orcado_realizado(company_id);
CREATE INDEX IF NOT EXISTS idx_app_settings_company ON app_settings(company_id);

-- 9. Associar admin existente como owner + marcar como platform admin
INSERT INTO user_companies (user_id, company_id, role, status)
VALUES ('030b0c0d-8695-4148-9758-e41aaa84c949', '00000000-0000-0000-0000-000000000001', 'owner', 'active')
ON CONFLICT (user_id, company_id) DO NOTHING;

UPDATE user_profiles SET is_platform_admin = true WHERE email = 'admin@smartobra.com';

-- 10. Associar outros usuarios existentes como members
INSERT INTO user_companies (user_id, company_id, role, status)
SELECT up.id, '00000000-0000-0000-0000-000000000001', 'member', 'active'
FROM user_profiles up
WHERE up.email != 'admin@smartobra.com'
  AND NOT EXISTS (
    SELECT 1 FROM user_companies uc WHERE uc.user_id = up.id AND uc.company_id = '00000000-0000-0000-0000-000000000001'
  );

-- 11. RLS para novas tabelas (temporario: full access, sera substituido na 004)
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated full access" ON companies
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated full access" ON user_companies
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

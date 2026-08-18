-- ============================================================
-- Smart Obra - Migration: Full Schema
-- Run this in Supabase SQL Editor
-- ============================================================

-- TABELA: clientes
CREATE TABLE IF NOT EXISTS clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo TEXT NOT NULL CHECK (tipo IN ('PF', 'PJ')),
  nome TEXT NOT NULL,
  cpf_cnpj TEXT,
  telefone TEXT,
  email TEXT,
  cep TEXT,
  rua TEXT,
  numero TEXT,
  bairro TEXT,
  cidade TEXT,
  uf TEXT,
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- TABELA: obras
CREATE TABLE IF NOT EXISTS obras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  cliente TEXT,
  cliente_id UUID REFERENCES clientes(id) ON DELETE SET NULL,
  endereco TEXT,
  cidade TEXT,
  estado TEXT,
  data_inicio TEXT,
  previsao_termino TEXT,
  orcamento NUMERIC(15,2) DEFAULT 0,
  gasto_real NUMERIC(15,2) DEFAULT 0,
  progresso INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'PLANEJAMENTO'
    CHECK (status IN ('PLANEJAMENTO','EM_ANDAMENTO','PAUSADA','CONCLUIDA','CANCELADA')),
  descricao TEXT,
  foto_capa TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- TABELA: lancamentos (financeiro)
CREATE TABLE IF NOT EXISTS lancamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  obra_id UUID REFERENCES obras(id) ON DELETE SET NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('RECEITA', 'DESPESA')),
  categoria TEXT,
  descricao TEXT,
  valor NUMERIC(15,2) NOT NULL,
  data TEXT,
  data_pagamento TEXT,
  status TEXT NOT NULL DEFAULT 'PENDENTE'
    CHECK (status IN ('PENDENTE','PAGO','VENCIDO','CANCELADO')),
  fornecedor_cliente TEXT,
  observacoes TEXT,
  comprovante TEXT,
  parcela INTEGER,
  total_parcelas INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- TABELA: orcamentos
CREATE TABLE IF NOT EXISTS orcamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  obra_id UUID REFERENCES obras(id) ON DELETE CASCADE,
  obra_nome TEXT,
  cliente_nome TEXT,
  uf TEXT,
  bdi NUMERIC(8,4) DEFAULT 0,
  bdi_breakdown JSONB,
  area_m2 NUMERIC(10,2) DEFAULT 0,
  base_padrao TEXT DEFAULT 'SINAPI' CHECK (base_padrao IN ('SINAPI','SICRO','TCPO')),
  status TEXT DEFAULT 'RASCUNHO' CHECK (status IN ('RASCUNHO','APROVADO')),
  capitulos JSONB NOT NULL DEFAULT '[]'::jsonb,
  encargos_horista NUMERIC(8,4),
  encargos_mensalista NUMERIC(8,4),
  tipo_encargo TEXT,
  fator_regional NUMERIC(8,4),
  contingencia NUMERIC(8,4),
  subtotal NUMERIC(15,2) DEFAULT 0,
  valor_bdi NUMERIC(15,2) DEFAULT 0,
  valor_encargos NUMERIC(15,2),
  valor_contingencia NUMERIC(15,2),
  total NUMERIC(15,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- TABELA: ordens_servico
CREATE TABLE IF NOT EXISTS ordens_servico (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero SERIAL,
  obra_id UUID REFERENCES obras(id) ON DELETE SET NULL,
  cliente_id UUID REFERENCES clientes(id) ON DELETE SET NULL,
  cliente TEXT,
  local TEXT,
  tecnico_id TEXT,
  tecnico TEXT,
  tipo_servico TEXT,
  descricao TEXT,
  prioridade TEXT DEFAULT 'MEDIA'
    CHECK (prioridade IN ('BAIXA','MEDIA','ALTA','URGENTE')),
  status TEXT DEFAULT 'ABERTA'
    CHECK (status IN ('ABERTA','EM_ANDAMENTO','AGUARDANDO_MATERIAL','FINALIZADA','CANCELADA')),
  data_abertura TEXT,
  data_agendada TEXT,
  data_conclusao TEXT,
  valor_estimado NUMERIC(15,2) DEFAULT 0,
  observacoes TEXT,
  checklist JSONB DEFAULT '[]'::jsonb,
  materiais JSONB DEFAULT '[]'::jsonb,
  fotos TEXT[] DEFAULT '{}',
  hora_inicio TEXT,
  hora_fim TEXT,
  assinatura TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- TABELA: colaboradores
CREATE TABLE IF NOT EXISTS colaboradores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  cpf TEXT,
  cargo TEXT,
  telefone TEXT,
  endereco TEXT,
  status TEXT DEFAULT 'ATIVO' CHECK (status IN ('ATIVO','INATIVO','FERIAS')),
  salario NUMERIC(12,2) DEFAULT 0,
  data_admissao TEXT,
  avatar TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- TABELA: presencas_colaborador
CREATE TABLE IF NOT EXISTS presencas_colaborador (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  colaborador_id UUID NOT NULL REFERENCES colaboradores(id) ON DELETE CASCADE,
  data TEXT,
  check_in TEXT,
  check_out TEXT,
  horas NUMERIC(6,2) DEFAULT 0,
  tipo TEXT DEFAULT 'NORMAL' CHECK (tipo IN ('NORMAL','EXTRA','FALTA')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- TABELA: pagamentos_colaborador
CREATE TABLE IF NOT EXISTS pagamentos_colaborador (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  colaborador_id UUID NOT NULL REFERENCES colaboradores(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('SALARIO','ADIANTAMENTO','COMISSAO','BONUS')),
  valor NUMERIC(12,2) NOT NULL,
  data TEXT,
  status TEXT DEFAULT 'PENDENTE' CHECK (status IN ('PENDENTE','PAGO')),
  descricao TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- TABELA: documentos_colaborador
CREATE TABLE IF NOT EXISTS documentos_colaborador (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  colaborador_id UUID NOT NULL REFERENCES colaboradores(id) ON DELETE CASCADE,
  tipo TEXT CHECK (tipo IN ('RG','CPF','CNH','ASO','CTPS','CERTIDAO','OUTRO')),
  nome TEXT,
  validade TEXT,
  url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- TABELA: colaboradores_obra
CREATE TABLE IF NOT EXISTS colaboradores_obra (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  obra_id UUID NOT NULL REFERENCES obras(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  cargo TEXT,
  horas_trabalhadas NUMERIC(8,2) DEFAULT 0,
  avatar TEXT
);

-- TABELA: materiais_obra
CREATE TABLE IF NOT EXISTS materiais_obra (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  obra_id UUID NOT NULL REFERENCES obras(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  unidade TEXT,
  quantidade NUMERIC(12,4) DEFAULT 0,
  custo_unitario NUMERIC(12,4) DEFAULT 0,
  custo_total NUMERIC(15,2) DEFAULT 0
);

-- TABELA: fornecedores
CREATE TABLE IF NOT EXISTS fornecedores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  cnpj TEXT,
  telefone TEXT,
  email TEXT,
  endereco TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- TABELA: materiais_estoque
CREATE TABLE IF NOT EXISTS materiais_estoque (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo TEXT,
  nome TEXT NOT NULL,
  unidade TEXT DEFAULT 'un' CHECK (unidade IN ('un','m','m2','m3','kg','l','pc','saco')),
  quantidade NUMERIC(12,4) DEFAULT 0,
  estoque_minimo NUMERIC(12,4) DEFAULT 0,
  valor_unitario NUMERIC(12,4) DEFAULT 0,
  fornecedor_id TEXT,
  fornecedor TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- TABELA: movimentacoes_estoque
CREATE TABLE IF NOT EXISTS movimentacoes_estoque (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id UUID REFERENCES materiais_estoque(id) ON DELETE SET NULL,
  material_nome TEXT,
  tipo TEXT NOT NULL CHECK (tipo IN ('ENTRADA','SAIDA')),
  quantidade NUMERIC(12,4) NOT NULL,
  obra_id UUID REFERENCES obras(id) ON DELETE SET NULL,
  obra_nome TEXT,
  responsavel TEXT,
  motivo TEXT,
  data TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- TABELA: veiculos
CREATE TABLE IF NOT EXISTS veiculos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  placa TEXT,
  tipo TEXT DEFAULT 'CARRO'
    CHECK (tipo IN ('CARRO','CAMINHAO','MOTO','MAQUINA','EQUIPAMENTO')),
  marca TEXT,
  modelo TEXT,
  ano INTEGER,
  km_atual NUMERIC(12,2) DEFAULT 0,
  horimetro NUMERIC(12,2) DEFAULT 0,
  status TEXT DEFAULT 'ATIVO' CHECK (status IN ('ATIVO','MANUTENCAO','INATIVO')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- TABELA: manutencoes_veiculo
CREATE TABLE IF NOT EXISTS manutencoes_veiculo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  veiculo_id UUID NOT NULL REFERENCES veiculos(id) ON DELETE CASCADE,
  tipo TEXT CHECK (tipo IN ('PREVENTIVA','CORRETIVA','REVISAO')),
  descricao TEXT,
  data TEXT,
  custo NUMERIC(12,2) DEFAULT 0,
  km_na_manutencao NUMERIC(12,2) DEFAULT 0,
  proxima_km NUMERIC(12,2),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- TABELA: abastecimentos_veiculo
CREATE TABLE IF NOT EXISTS abastecimentos_veiculo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  veiculo_id UUID NOT NULL REFERENCES veiculos(id) ON DELETE CASCADE,
  data TEXT,
  litros NUMERIC(8,2),
  preco_litro NUMERIC(8,4),
  total NUMERIC(12,2),
  km NUMERIC(12,2),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- TABELA: documentos_veiculo
CREATE TABLE IF NOT EXISTS documentos_veiculo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  veiculo_id UUID NOT NULL REFERENCES veiculos(id) ON DELETE CASCADE,
  tipo TEXT CHECK (tipo IN ('CRLV','SEGURO','IPVA','LICENCIAMENTO','OUTRO')),
  nome TEXT,
  validade TEXT,
  url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- TABELA: diario_obra
CREATE TABLE IF NOT EXISTS diario_obra (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  obra_id UUID NOT NULL REFERENCES obras(id) ON DELETE CASCADE,
  data TEXT,
  clima TEXT CHECK (clima IN ('ENSOLARADO','NUBLADO','CHUVOSO','TEMPESTADE')),
  descricao TEXT,
  fotos TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- TABELA: fotos_obra
CREATE TABLE IF NOT EXISTS fotos_obra (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  obra_id UUID NOT NULL REFERENCES obras(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  descricao TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- TABELA: documentos_obra
CREATE TABLE IF NOT EXISTS documentos_obra (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  obra_id UUID NOT NULL REFERENCES obras(id) ON DELETE CASCADE,
  nome TEXT,
  tipo TEXT CHECK (tipo IN ('CONTRATO','PROJETO','ALVARA','ORCAMENTO','OUTRO')),
  url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- TABELA: timeline_obra
CREATE TABLE IF NOT EXISTS timeline_obra (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  obra_id UUID NOT NULL REFERENCES obras(id) ON DELETE CASCADE,
  tipo TEXT DEFAULT 'ACTIVITY' CHECK (tipo IN ('MILESTONE','ACTIVITY','NOTE')),
  titulo TEXT,
  descricao TEXT,
  data TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- TABELA: eventos_calendario
CREATE TABLE IF NOT EXISTS eventos_calendario (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  data TEXT,
  tipo TEXT CHECK (tipo IN ('VENCIMENTO','ENTREGA','REUNIAO','MANUTENCAO')),
  descricao TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- TABELA: documentos_cliente
CREATE TABLE IF NOT EXISTS documentos_cliente (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  tipo TEXT CHECK (tipo IN ('CONTRATO','PROPOSTA','ORCAMENTO','OUTRO')),
  nome TEXT,
  url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- TABELA: user_profiles
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'GESTOR'
    CHECK (role IN ('ADMIN','FINANCEIRO','GESTOR','TECNICO','VISUALIZADOR')),
  company_name TEXT,
  phone TEXT,
  active BOOLEAN DEFAULT true,
  allowed_modules JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- TABELA: access_requests
CREATE TABLE IF NOT EXISTS access_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  telefone TEXT,
  empresa TEXT,
  cargo TEXT,
  mensagem TEXT,
  status TEXT DEFAULT 'pendente'
    CHECK (status IN ('pendente','aprovado','rejeitado','bloqueado')),
  data_solicitacao TIMESTAMPTZ DEFAULT now(),
  data_resposta TIMESTAMPTZ,
  motivo_rejeicao TEXT
);

-- TABELA: centro_custos (derivada, persistida)
CREATE TABLE IF NOT EXISTS centro_custos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  obra_id UUID NOT NULL REFERENCES obras(id) ON DELETE CASCADE,
  centro TEXT NOT NULL,
  orcado NUMERIC(15,2) DEFAULT 0,
  realizado NUMERIC(15,2) DEFAULT 0,
  UNIQUE(obra_id, centro)
);

-- TABELA: orcado_realizado (derivada, persistida)
CREATE TABLE IF NOT EXISTS orcado_realizado (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  obra_id UUID NOT NULL REFERENCES obras(id) ON DELETE CASCADE,
  categoria TEXT NOT NULL,
  planejado NUMERIC(15,2) DEFAULT 0,
  realizado NUMERIC(15,2) DEFAULT 0,
  UNIQUE(obra_id, categoria)
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_lancamentos_obra ON lancamentos(obra_id);
CREATE INDEX IF NOT EXISTS idx_lancamentos_status ON lancamentos(status);
CREATE INDEX IF NOT EXISTS idx_orcamentos_obra ON orcamentos(obra_id);
CREATE INDEX IF NOT EXISTS idx_ordens_servico_status ON ordens_servico(status);
CREATE INDEX IF NOT EXISTS idx_presencas_colaborador ON presencas_colaborador(colaborador_id);
CREATE INDEX IF NOT EXISTS idx_pagamentos_colaborador ON pagamentos_colaborador(colaborador_id);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_material ON movimentacoes_estoque(material_id);
CREATE INDEX IF NOT EXISTS idx_diario_obra ON diario_obra(obra_id);
CREATE INDEX IF NOT EXISTS idx_fotos_obra ON fotos_obra(obra_id);
CREATE INDEX IF NOT EXISTS idx_docs_obra ON documentos_obra(obra_id);
CREATE INDEX IF NOT EXISTS idx_timeline_obra ON timeline_obra(obra_id);
CREATE INDEX IF NOT EXISTS idx_manutencoes_veiculo ON manutencoes_veiculo(veiculo_id);
CREATE INDEX IF NOT EXISTS idx_abastecimentos_veiculo ON abastecimentos_veiculo(veiculo_id);
CREATE INDEX IF NOT EXISTS idx_docs_veiculo ON documentos_veiculo(veiculo_id);
CREATE INDEX IF NOT EXISTS idx_docs_colaborador ON documentos_colaborador(colaborador_id);
CREATE INDEX IF NOT EXISTS idx_docs_cliente ON documentos_cliente(cliente_id);
CREATE INDEX IF NOT EXISTS idx_centro_custos_obra ON centro_custos(obra_id);
CREATE INDEX IF NOT EXISTS idx_orcado_realizado_obra ON orcado_realizado(obra_id);

-- ============================================================
-- RLS (Basic - Fase 1: authenticated full access)
-- ============================================================
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE obras ENABLE ROW LEVEL SECURITY;
ALTER TABLE lancamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE orcamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE ordens_servico ENABLE ROW LEVEL SECURITY;
ALTER TABLE colaboradores ENABLE ROW LEVEL SECURITY;
ALTER TABLE presencas_colaborador ENABLE ROW LEVEL SECURITY;
ALTER TABLE pagamentos_colaborador ENABLE ROW LEVEL SECURITY;
ALTER TABLE documentos_colaborador ENABLE ROW LEVEL SECURITY;
ALTER TABLE colaboradores_obra ENABLE ROW LEVEL SECURITY;
ALTER TABLE materiais_obra ENABLE ROW LEVEL SECURITY;
ALTER TABLE fornecedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE materiais_estoque ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimentacoes_estoque ENABLE ROW LEVEL SECURITY;
ALTER TABLE veiculos ENABLE ROW LEVEL SECURITY;
ALTER TABLE manutencoes_veiculo ENABLE ROW LEVEL SECURITY;
ALTER TABLE abastecimentos_veiculo ENABLE ROW LEVEL SECURITY;
ALTER TABLE documentos_veiculo ENABLE ROW LEVEL SECURITY;
ALTER TABLE diario_obra ENABLE ROW LEVEL SECURITY;
ALTER TABLE fotos_obra ENABLE ROW LEVEL SECURITY;
ALTER TABLE documentos_obra ENABLE ROW LEVEL SECURITY;
ALTER TABLE timeline_obra ENABLE ROW LEVEL SECURITY;
ALTER TABLE eventos_calendario ENABLE ROW LEVEL SECURITY;
ALTER TABLE documentos_cliente ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE centro_custos ENABLE ROW LEVEL SECURITY;
ALTER TABLE orcado_realizado ENABLE ROW LEVEL SECURITY;

-- Policies: authenticated users have full access (Fase 1)
DO $$
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
    'user_profiles','access_requests','centro_custos','orcado_realizado'
  ]
  LOOP
    EXECUTE format(
      'CREATE POLICY "Authenticated full access" ON %I FOR ALL TO authenticated USING (true) WITH CHECK (true)',
      tbl
    );
  END LOOP;
END $$;

-- Allow anon access to access_requests for public registration
CREATE POLICY "Anon can insert access_requests" ON access_requests
  FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Anon can read access_requests" ON access_requests
  FOR SELECT TO anon USING (true);

-- ============================================================
-- STORAGE BUCKETS
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('fotos-obra', 'fotos-obra', true),
  ('documentos-obra', 'documentos-obra', false),
  ('documentos-colaborador', 'documentos-colaborador', false),
  ('documentos-veiculo', 'documentos-veiculo', false),
  ('documentos-cliente', 'documentos-cliente', false),
  ('comprovantes', 'comprovantes', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Auth upload" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth read" ON storage.objects
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth delete" ON storage.objects
  FOR DELETE TO authenticated USING (true);
CREATE POLICY "Public read fotos" ON storage.objects
  FOR SELECT TO anon USING (bucket_id = 'fotos-obra');

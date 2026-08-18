-- ============================================================
-- Smart Obra - Migration 002: Add missing tables and columns
-- ============================================================

-- TABELA: cronograma_etapas (missing from 001)
CREATE TABLE IF NOT EXISTS cronograma_etapas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  obra_id UUID NOT NULL REFERENCES obras(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  data_prevista TEXT,
  data_realizada TEXT,
  percentual_concluido NUMERIC(5,2) DEFAULT 0,
  valor_planejado NUMERIC(15,2) DEFAULT 0,
  valor_realizado NUMERIC(15,2) DEFAULT 0,
  status TEXT DEFAULT 'NAO_INICIADA'
    CHECK (status IN ('NAO_INICIADA','EM_ANDAMENTO','CONCLUIDA','ATRASADA')),
  ordem INTEGER DEFAULT 0,
  depende_de UUID REFERENCES cronograma_etapas(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cronograma_obra ON cronograma_etapas(obra_id);

-- TABELA: compras (missing from 001)
CREATE TABLE IF NOT EXISTS compras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item TEXT NOT NULL,
  quantidade NUMERIC(12,4) DEFAULT 0,
  unidade TEXT,
  obra_id UUID REFERENCES obras(id) ON DELETE SET NULL,
  obra_nome TEXT,
  fornecedor_id UUID REFERENCES fornecedores(id) ON DELETE SET NULL,
  fornecedor_nome TEXT,
  valor_unitario NUMERIC(12,4) DEFAULT 0,
  valor_total NUMERIC(15,2) DEFAULT 0,
  status TEXT DEFAULT 'SOLICITACAO'
    CHECK (status IN ('SOLICITACAO','COTACAO','APROVACAO','PEDIDO','RECEBIMENTO','PAGAMENTO')),
  cotacoes JSONB DEFAULT '[]'::jsonb,
  data_solicitacao TEXT,
  data_cotacao TEXT,
  data_aprovacao TEXT,
  data_pedido TEXT,
  data_recebimento TEXT,
  data_pagamento TEXT,
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_compras_obra ON compras(obra_id);
CREATE INDEX IF NOT EXISTS idx_compras_status ON compras(status);

-- TABELA: app_settings (for configuracoes page)
CREATE TABLE IF NOT EXISTS app_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chave TEXT NOT NULL UNIQUE,
  valor JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Extend diario_obra: add missing columns
ALTER TABLE diario_obra ADD COLUMN IF NOT EXISTS equipe_presente_numero INTEGER DEFAULT 0;
ALTER TABLE diario_obra ADD COLUMN IF NOT EXISTS equipe_nomes TEXT;
ALTER TABLE diario_obra ADD COLUMN IF NOT EXISTS ocorrencias TEXT;
ALTER TABLE diario_obra ADD COLUMN IF NOT EXISTS videos TEXT[] DEFAULT '{}';

-- Update clima CHECK to include PARCIALMENTE_NUBLADO
ALTER TABLE diario_obra DROP CONSTRAINT IF EXISTS diario_obra_clima_check;
ALTER TABLE diario_obra ADD CONSTRAINT diario_obra_clima_check
  CHECK (clima IN ('ENSOLARADO','NUBLADO','CHUVOSO','TEMPESTADE','PARCIALMENTE_NUBLADO'));

-- Extend documentos_obra: add missing columns
ALTER TABLE documentos_obra DROP CONSTRAINT IF EXISTS documentos_obra_tipo_check;
ALTER TABLE documentos_obra ADD CONSTRAINT documentos_obra_tipo_check
  CHECK (tipo IN ('CONTRATO','PROJETO','ALVARA','ORCAMENTO','NOTA_FISCAL','ART','PLANTA','OUTRO'));
ALTER TABLE documentos_obra ADD COLUMN IF NOT EXISTS categoria TEXT;
ALTER TABLE documentos_obra ADD COLUMN IF NOT EXISTS tamanho INTEGER DEFAULT 0;
ALTER TABLE documentos_obra ADD COLUMN IF NOT EXISTS descricao TEXT;
ALTER TABLE documentos_obra ADD COLUMN IF NOT EXISTS obra_nome TEXT;
ALTER TABLE documentos_obra ADD COLUMN IF NOT EXISTS data_upload TEXT;

-- Extend fotos_obra: add missing columns
ALTER TABLE fotos_obra ADD COLUMN IF NOT EXISTS data TEXT;
ALTER TABLE fotos_obra ADD COLUMN IF NOT EXISTS etapa TEXT;

-- RLS for new tables
ALTER TABLE cronograma_etapas ENABLE ROW LEVEL SECURITY;
ALTER TABLE compras ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated full access" ON cronograma_etapas
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated full access" ON compras
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated full access" ON app_settings
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

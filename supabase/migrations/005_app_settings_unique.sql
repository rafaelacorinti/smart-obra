-- ============================================================
-- Smart Obra - Migration 005: Unique constraint for app_settings
-- Fix: upsert on (chave, company_id) requires a UNIQUE constraint
-- ============================================================

-- 1. Remove the old UNIQUE constraint on chave alone (from 002)
ALTER TABLE app_settings DROP CONSTRAINT IF EXISTS app_settings_chave_key;

-- 2. Remove duplicate rows before adding the composite unique constraint
-- Keeps the most recently updated row for each (chave, company_id) pair
DELETE FROM app_settings a
USING app_settings b
WHERE a.chave = b.chave
  AND a.company_id = b.company_id
  AND a.id < b.id;

-- 3. Add the composite UNIQUE constraint
ALTER TABLE app_settings
  ADD CONSTRAINT app_settings_chave_company_key UNIQUE (chave, company_id);

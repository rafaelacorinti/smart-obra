-- ============================================================
-- BOOTSTRAP: Cole APENAS ESTA FUNCAO no SQL Editor do Supabase
-- Dashboard: https://supabase.com/dashboard/project/qdseprgffntpuhxfvvqf/sql/new
-- Depois rode: node _run_migration_auto.js
-- ============================================================
CREATE OR REPLACE FUNCTION exec_sql(sql_text TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSON;
BEGIN
  EXECUTE sql_text;
  result := json_build_object('status', 'ok');
  RETURN result;
EXCEPTION WHEN OTHERS THEN
  result := json_build_object('status', 'error', 'message', SQLERRM, 'detail', SQLSTATE);
  RETURN result;
END;
$$;

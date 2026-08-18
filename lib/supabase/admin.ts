import { createClient } from "@supabase/supabase-js";

// Admin client without strict typing - used in API routes
// This allows flexible queries without type constraints
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

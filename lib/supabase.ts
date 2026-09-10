import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error(
    "Missing Supabase environment variables. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local (see .env.local.example)."
  );
}

// Server-only client using the service role key. This must never be imported
// into a "use client" file or exposed to the browser — it bypasses Row Level
// Security. All access to it goes through our own API routes, which enforce
// auth via the session cookie themselves.
export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false },
});

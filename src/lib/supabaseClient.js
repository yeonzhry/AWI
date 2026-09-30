import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

// `supabase` is null until REACT_APP_SUPABASE_URL / REACT_APP_SUPABASE_ANON_KEY
// are set in .env — createClient throws synchronously on missing args, which
// would otherwise take down the whole app before those are configured.
export const supabase =
  supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

if (!supabase) {
  // eslint-disable-next-line no-console
  console.warn(
    'Supabase env vars are missing. Set REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY in .env.'
  );
}

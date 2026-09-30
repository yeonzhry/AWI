import { supabase } from '../lib/supabaseClient';

const TABLE = 'offerings';

// Postgres "undefined column" — thrown until the `is_hidden` migration has
// been run on the live database. Falls back to the pre-migration query/insert
// shape instead of failing outright, so petals don't just vanish in the
// meantime (see offerings table migration note in project docs/chat).
const UNDEFINED_COLUMN = '42703';

export async function fetchOfferings() {
  if (!supabase) throw new Error('Supabase is not configured');

  const { data, error } = await supabase
    .from(TABLE)
    .select('id, message, created_at')
    .eq('is_hidden', false)
    .order('created_at', { ascending: true });

  if (!error) return data;

  if (error.code === UNDEFINED_COLUMN) {
    const fallback = await supabase
      .from(TABLE)
      .select('id, message, created_at')
      .order('created_at', { ascending: true });
    if (fallback.error) throw fallback.error;
    return fallback.data;
  }

  throw error;
}

export async function createOffering(message, isHidden = false) {
  if (!supabase) throw new Error('Supabase is not configured');

  const { data, error } = await supabase
    .from(TABLE)
    .insert({ message, is_hidden: isHidden })
    .select('id, message, created_at')
    .single();

  if (!error) return data;

  if (error.code === UNDEFINED_COLUMN) {
    const fallback = await supabase
      .from(TABLE)
      .insert({ message })
      .select('id, message, created_at')
      .single();
    if (fallback.error) throw fallback.error;
    return fallback.data;
  }

  throw error;
}

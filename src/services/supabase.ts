import { createClient } from '@supabase/supabase-js';

// Acceso a las variables de entorno inyectadas por Vite
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// Inicializa el cliente Supabase
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
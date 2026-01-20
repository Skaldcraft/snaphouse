import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zggsricjippxrfvpzgqx.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpnZ3NyaWNqaXBweHJmdnB6Z3F4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4NjcyOTcsImV4cCI6MjA4MzQ0MzI5N30.ZrsDDGnkL7ubjhlMftjgUt3hRd6kiYRg8Ne7IrKO44w';

const customSupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

export default customSupabaseClient;

export { 
    customSupabaseClient,
    customSupabaseClient as supabase,
};

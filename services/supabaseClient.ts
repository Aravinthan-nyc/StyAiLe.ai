/**
 * Supabase Client Configuration
 * Initializes the Supabase client with project credentials
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Supabase project credentials
const supabaseUrl = 'https://rpibepmxjcaouxmnmeab.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwaWJlcG14amNhb3V4bW5tZWFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5NTg3NTUsImV4cCI6MjA4NTUzNDc1NX0.qBWinoaF0CxTwT1jXpOGvQNp38EzzXk9xS0m-aKO0as';

// Create and export the Supabase client
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
    },
});

/**
 * Get the current user ID
 * Returns the authenticated user's ID or null if not authenticated
 */
export async function getCurrentUserId(): Promise<string | null> {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        return user?.id || null;
    } catch {
        return null;
    }
}

export default supabase;


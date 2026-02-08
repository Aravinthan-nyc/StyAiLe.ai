/**
 * Authentication Service
 * Handles user authentication using Supabase Auth
 */

import { supabase } from './supabaseClient';
import { User, Session, AuthError } from '@supabase/supabase-js';

// Auth response type
interface AuthResponse {
    user: User | null;
    session: Session | null;
    error: AuthError | null;
}

/**
 * Sign up a new user with email and password
 */
export async function signUp(email: string, password: string): Promise<AuthResponse> {
    try {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
        });

        if (error) {
            return { user: null, session: null, error };
        }

        return {
            user: data.user,
            session: data.session,
            error: null,
        };
    } catch (e: any) {
        return {
            user: null,
            session: null,
            error: { message: e.message || 'Sign up failed', name: 'AuthError', status: 500 } as AuthError,
        };
    }
}

/**
 * Sign in an existing user with email and password
 */
export async function signIn(email: string, password: string): Promise<AuthResponse> {
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            return { user: null, session: null, error };
        }

        return {
            user: data.user,
            session: data.session,
            error: null,
        };
    } catch (e: any) {
        return {
            user: null,
            session: null,
            error: { message: e.message || 'Sign in failed', name: 'AuthError', status: 500 } as AuthError,
        };
    }
}

/**
 * Sign out the current user
 */
export async function signOut(): Promise<{ error: AuthError | null }> {
    try {
        const { error } = await supabase.auth.signOut();
        return { error };
    } catch (e: any) {
        return {
            error: { message: e.message || 'Sign out failed', name: 'AuthError', status: 500 } as AuthError,
        };
    }
}

/**
 * Get the current authenticated user
 */
export async function getCurrentUser(): Promise<User | null> {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        return user;
    } catch {
        return null;
    }
}

/**
 * Get the current session
 */
export async function getCurrentSession(): Promise<Session | null> {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        return session;
    } catch {
        return null;
    }
}

/**
 * Listen to auth state changes
 * Returns an unsubscribe function
 */
export function onAuthStateChange(
    callback: (user: User | null, session: Session | null) => void
): () => void {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (event, session) => {
            callback(session?.user || null, session);
        }
    );

    return () => subscription.unsubscribe();
}

/**
 * Check if user has completed onboarding
 */
export function hasCompletedOnboarding(): boolean {
    try {
        return localStorage.getItem('styaile_onboarding_complete') === 'true';
    } catch {
        return false;
    }
}

/**
 * Mark onboarding as complete
 */
export function setOnboardingComplete(): void {
    try {
        localStorage.setItem('styaile_onboarding_complete', 'true');
    } catch {
        console.warn('Could not save onboarding status');
    }
}

/**
 * Check if API key is configured
 */
export function hasApiKeyConfigured(): boolean {
    try {
        const stored = localStorage.getItem('styaile_api_keys');
        if (stored) {
            const keys = JSON.parse(stored);
            return !!keys.gemini;
        }
    } catch {
        // Ignore
    }
    return false;
}

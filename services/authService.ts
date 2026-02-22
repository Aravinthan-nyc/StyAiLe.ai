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
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) {
            // Silently handle network errors
            if (error.message?.includes('fetch') || error.message?.includes('network')) {
                console.warn('Unable to connect to authentication server. Working offline.');
                return null;
            }
            throw error;
        }
        return user;
    } catch (e: any) {
        // Suppress network-related errors in console
        if (e.message?.includes('fetch') || e.message?.includes('Failed to fetch')) {
            console.warn('Authentication service unavailable. App will work in offline mode.');
        }
        return null;
    }
}

/**
 * Get the current session
 */
export async function getCurrentSession(): Promise<Session | null> {
    try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
            // Silently handle network errors
            if (error.message?.includes('fetch') || error.message?.includes('network')) {
                return null;
            }
            throw error;
        }
        return session;
    } catch (e: any) {
        // Suppress network-related errors
        if (e.message?.includes('fetch') || e.message?.includes('Failed to fetch')) {
            // Silent fail for offline mode
        }
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

/**
 * AuthView - Login and Sign Up Screen
 * Beautiful authentication UI matching app theme
 */

import React, { useState } from 'react';
import { signIn, signUp } from '../services/authService';
import { Sparkles, Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle } from '../components/Icons';

interface AuthViewProps {
    onAuthSuccess: () => void;
}

const AuthView: React.FC<AuthViewProps> = ({ onAuthSuccess }) => {
    const [mode, setMode] = useState<'login' | 'signup'>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        // Validation
        if (!email || !password) {
            setError('Please fill in all fields');
            return;
        }

        if (mode === 'signup' && password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setLoading(true);

        try {
            if (mode === 'login') {
                const { user, error } = await signIn(email, password);
                if (error) {
                    setError(error.message || 'Login failed');
                } else if (user) {
                    onAuthSuccess();
                }
            } else {
                const { user, error } = await signUp(email, password);
                if (error) {
                    setError(error.message || 'Sign up failed');
                } else if (user) {
                    setSuccess('Account created! Please check your email to verify your account.');
                    setMode('login');
                }
            }
        } catch (e: any) {
            setError(e.message || 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-white font-sans bg-gradient-to-b from-zinc-900 to-black">

            {/* Content */}
            <div className="relative z-10 w-full max-w-sm">
                {/* Logo */}
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-white mb-6 shadow-[0_0_40px_-5px_rgba(255,255,255,0.3)]">
                        <Sparkles size={36} className="text-black" />
                    </div>
                    <h1 className="text-4xl font-bold text-white tracking-tight mb-2">
                        StyAiLe.ai
                    </h1>
                    <p className="text-gray-400 text-sm font-medium tracking-wide uppercase opacity-70">Your AI-Powered Wardrobe</p>
                </div>

                {/* Form Card */}
                <div className="backdrop-blur-xl bg-white/5 border border-white/10 p-8 rounded-[2rem] shadow-2xl shadow-black/50">
                    <h2 className="text-2xl font-bold text-white text-center mb-8 tracking-tight">
                        {mode === 'login' ? 'Welcome Back' : 'Create Account'}
                    </h2>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Email */}
                        <div className="relative group">
                            <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-white transition-colors" />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Email address"
                                className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-white placeholder-gray-500 focus:outline-none focus:border-white/40 focus:bg-white/10 transition-all font-medium"
                                autoComplete="email"
                            />
                        </div>

                        {/* Password */}
                        <div className="relative group">
                            <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-white transition-colors" />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Password"
                                className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-12 py-4 text-white placeholder-gray-500 focus:outline-none focus:border-white/40 focus:bg-white/10 transition-all font-medium"
                                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors p-1"
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>

                        {/* Confirm Password (Sign Up only) */}
                        {mode === 'signup' && (
                            <div className="relative group">
                                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-white transition-colors" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Confirm password"
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-white placeholder-gray-500 focus:outline-none focus:border-white/40 focus:bg-white/10 transition-all font-medium"
                                    autoComplete="new-password"
                                />
                            </div>
                        )}

                        {/* Error Message */}
                        {error && (
                            <div className="flex items-center gap-3 text-red-200 text-sm bg-red-500/10 px-4 py-3 rounded-2xl border border-red-500/20 backdrop-blur-md">
                                <AlertCircle size={18} className="shrink-0" />
                                <span className="font-medium">{error}</span>
                            </div>
                        )}

                        {/* Success Message */}
                        {success && (
                            <div className="flex items-center gap-3 text-green-200 text-sm bg-green-500/10 px-4 py-3 rounded-2xl border border-green-500/20 backdrop-blur-md">
                                <Sparkles size={18} className="shrink-0" />
                                <span className="font-medium">{success}</span>
                            </div>
                        )}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 mt-2 bg-white text-black font-bold rounded-2xl flex items-center justify-center gap-2 hover:bg-gray-100 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:hover:scale-100 shadow-xl shadow-white/5"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <>
                                    {mode === 'login' ? 'Sign In' : 'Create Account'}
                                    <ArrowRight size={20} />
                                </>
                            )}
                        </button>
                    </form>

                    {/* Toggle Mode */}
                    <div className="mt-8 text-center bg-white/5 rounded-xl py-3 border border-white/5">
                        <p className="text-gray-400 text-sm">
                            {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}
                            <button
                                type="button"
                                onClick={() => {
                                    setMode(mode === 'login' ? 'signup' : 'login');
                                    setError(null);
                                    setSuccess(null);
                                }}
                                className="ml-2 text-white font-bold hover:underline decoration-white/30 underline-offset-4 transition-all"
                            >
                                {mode === 'login' ? 'Sign Up' : 'Sign In'}
                            </button>
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <p className="text-gray-600 text-xs text-center mt-8 font-medium">
                    By continuing, you agree to our Terms of Service
                </p>
            </div>
        </div>
    );
};

export default AuthView;

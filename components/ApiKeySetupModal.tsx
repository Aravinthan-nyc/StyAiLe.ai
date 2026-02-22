/**
 * ApiKeySetupModal - Modal to collect API keys
 * ONE-TIME ENTRY ONLY - Locks after save, no changes allowed
 */

import React, { useState, useEffect } from 'react';
import { Key, ExternalLink, AlertCircle, Check, Sparkles } from '../components/Icons';
import {
    isApiKeyLocked,
    lockApiKey,
    getLockedApiKey,
    getSupportEmail,
    openSupportEmail,
    getDaysRemaining,
    BETA_CONFIG
} from '../services/betaSecurityService';

interface ApiKeySetupModalProps {
    onComplete: () => void;
}

const STORAGE_KEY = 'styaile_api_keys';

const ApiKeySetupModal: React.FC<ApiKeySetupModalProps> = ({ onComplete }) => {
    const [geminiKey, setGeminiKey] = useState('');
    const [nvidiaKey, setNvidiaKey] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [isLocked, setIsLocked] = useState(false);
    const [showConfirmation, setShowConfirmation] = useState(false);

    // Check lock status on mount
    useEffect(() => {
        const checkLockStatus = () => {
            const locked = isApiKeyLocked();
            setIsLocked(locked);

            if (locked) {
                // Load existing keys if locked
                try {
                    const stored = localStorage.getItem(STORAGE_KEY);
                    if (stored) {
                        const keys = JSON.parse(stored);
                        // Show masked version
                        setGeminiKey(keys.gemini ? '••••••••••••••••••••' : '');
                        setNvidiaKey(keys.nvidia ? '••••••••••••••••••••' : '');
                    }
                } catch (e) {
                    console.warn('Could not load keys:', e);
                }
            }
        };
        checkLockStatus();
    }, []);

    const handleSave = async () => {
        setError(null);

        // Double-check lock status
        if (isApiKeyLocked()) {
            setError('API key is already locked. No changes allowed.');
            return;
        }

        // Validate Gemini key is required
        if (!geminiKey.trim()) {
            setError('Gemini API key is required to use AI features');
            return;
        }

        // Basic format validation
        if (!geminiKey.startsWith('AIza')) {
            setError('Invalid Gemini API key format. It should start with "AIza"');
            return;
        }

        // Show confirmation first
        if (!showConfirmation) {
            setShowConfirmation(true);
            return;
        }

        setSaving(true);

        try {
            // Save keys to localStorage
            const keys = {
                gemini: geminiKey.trim(),
                nvidia: nvidiaKey.trim() || '',
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(keys));

            // LOCK THE API KEY - NO SECOND CHANCES
            const locked = lockApiKey(geminiKey.trim());
            if (!locked) {
                throw new Error('Failed to lock API key');
            }

            // Small delay for UX
            await new Promise(resolve => setTimeout(resolve, 500));

            onComplete();
        } catch (e: any) {
            setError('Failed to save API keys');
        } finally {
            setSaving(false);
            setShowConfirmation(false);
        }
    };

    // If API key is already locked, show locked view
    if (isLocked) {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-white font-sans bg-gradient-to-b from-zinc-900 to-black">
                <div className="relative z-10 w-full max-w-sm">
                    {/* Header */}
                    <div className="text-center mb-10">
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-white/10 mb-6 border border-white/20">
                            <svg width={32} height={32} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                            </svg>
                        </div>
                        <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">
                            API Key Locked
                        </h1>
                        <p className="text-gray-400 text-sm font-medium opacity-80">
                            Your API key has been securely saved
                        </p>
                    </div>

                    {/* Locked Card */}
                    <div className="backdrop-blur-xl bg-white/5 border border-white/10 p-8 rounded-[2rem] shadow-2xl shadow-black/50 space-y-6">
                        {/* Masked Key Display */}
                        <div>
                            <label className="text-white font-bold text-sm flex items-center gap-2 mb-3">
                                <span className="text-white">✦</span> Gemini API Key
                                <span className="text-xs bg-green-500/20 text-green-400 px-2.5 py-0.5 rounded-full font-medium">Active</span>
                            </label>
                            <div className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-4 text-gray-500 font-mono text-sm">
                                {geminiKey || '••••••••••••••••••••'}
                            </div>
                        </div>

                        {/* Info Box */}
                        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-5">
                            <div className="flex items-start gap-4">
                                <AlertCircle size={20} className="text-yellow-400 mt-0.5 shrink-0" />
                                <div>
                                    <p className="text-white text-sm font-bold mb-1">One-Time Entry</p>
                                    <p className="text-gray-400 text-xs leading-relaxed">
                                        API key cannot be changed from the app. To update your key, please contact support.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Support Contact */}
                        <div className="text-center space-y-4">
                            <p className="text-xs text-gray-500 uppercase tracking-wider">
                                Need to change your API key?
                            </p>
                            <button
                                onClick={() => openSupportEmail('API Key Update Request')}
                                className="w-full py-4 bg-white/10 border border-white/20 text-white font-bold rounded-2xl flex items-center justify-center gap-2 hover:bg-white/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                            >
                                <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                                    <polyline points="22,6 12,13 2,6"></polyline>
                                </svg>
                                Email Support
                            </button>
                            <p className="text-gray-600 text-xs">
                                {getSupportEmail()}
                            </p>
                        </div>

                        {/* Continue Button */}
                        <button
                            onClick={onComplete}
                            className="w-full py-4 bg-white text-black font-bold rounded-2xl flex items-center justify-center gap-2 hover:bg-gray-100 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-white/5"
                        >
                            Continue to App <Check size={20} />
                        </button>
                    </div>

                    {/* Beta Info */}
                    <div className="text-center mt-6">
                        <p className="text-xs text-gray-600">
                            Beta Version • {getDaysRemaining()} days remaining
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // Confirmation Modal
    if (showConfirmation) {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-white font-sans bg-gradient-to-b from-zinc-900 to-black">
                <div className="relative z-10 w-full max-w-sm">
                    {/* Warning Card */}
                    <div className="backdrop-blur-xl bg-white/5 border border-yellow-500/30 p-8 rounded-[2rem] shadow-2xl shadow-black/50 space-y-6">
                        {/* Warning Icon */}
                        <div className="text-center">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-yellow-500/20 mb-4">
                                <AlertCircle size={32} className="text-yellow-400" />
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-2">
                                Confirm API Key
                            </h2>
                            <p className="text-gray-400 text-sm">
                                This is your <strong className="text-white">only chance</strong> to enter your API key
                            </p>
                        </div>

                        {/* Key Preview */}
                        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                            <p className="text-xs text-gray-500 mb-2">Your Gemini API Key:</p>
                            <p className="text-white font-mono text-sm break-all">
                                {geminiKey.substring(0, 10)}...{geminiKey.substring(geminiKey.length - 4)}
                            </p>
                        </div>

                        {/* Warning Text */}
                        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                            <p className="text-red-300 text-xs text-center leading-relaxed">
                                After confirmation, you will NOT be able to change this key from the app.
                                To update, you'll need to email support.
                            </p>
                        </div>

                        {/* Buttons */}
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowConfirmation(false)}
                                className="flex-1 py-4 bg-white/10 border border-white/20 text-white font-bold rounded-2xl hover:bg-white/20 transition-all"
                            >
                                Go Back
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="flex-1 py-4 bg-white text-black font-bold rounded-2xl flex items-center justify-center gap-2 hover:bg-gray-100 transition-all disabled:opacity-50"
                            >
                                {saving ? (
                                    <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <>Confirm</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Normal entry form
    return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-white font-sans bg-gradient-to-b from-zinc-900 to-black">

            {/* Content */}
            <div className="relative z-10 w-full max-w-sm">
                {/* Header */}
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-white mb-6 shadow-[0_0_40px_-5px_rgba(255,255,255,0.3)]">
                        <Key size={32} className="text-black" />
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">
                        Setup AI Access
                    </h1>
                    <p className="text-gray-400 text-sm font-medium opacity-80">
                        Enter your API key to unlock AI features
                    </p>
                </div>

                {/* Form Card */}
                <div className="backdrop-blur-xl bg-white/5 border border-white/10 p-8 rounded-[2rem] shadow-2xl shadow-black/50 space-y-6">

                    {/* ONE-TIME WARNING */}
                    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 flex items-start gap-3">
                        <AlertCircle size={18} className="text-yellow-400 shrink-0 mt-0.5" />
                        <p className="text-yellow-200 text-xs leading-relaxed">
                            <strong className="text-yellow-100">One-time entry:</strong> You can only enter your API key once. Double-check before confirming.
                        </p>
                    </div>

                    {/* Gemini API Key - Required */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <label className="text-white font-bold text-sm flex items-center gap-2">
                                <span className="text-white">✦</span> Google Gemini API
                                <span className="text-xs bg-white text-black px-2.5 py-0.5 rounded-full font-bold">Required</span>
                            </label>
                            <a
                                href="https://aistudio.google.com/app/apikey"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-gray-400 hover:text-white text-xs flex items-center gap-1 font-medium transition-colors"
                            >
                                Get Free Key <ExternalLink size={12} />
                            </a>
                        </div>
                        <input
                            type="password"
                            value={geminiKey}
                            onChange={(e) => setGeminiKey(e.target.value)}
                            placeholder="AIzaSy..."
                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-4 text-white placeholder-gray-600 font-mono text-sm focus:outline-none focus:border-white/40 focus:bg-white/10 transition-all font-medium"
                        />
                        <p className="text-gray-500 text-xs mt-2 ml-1">
                            Powers image analysis, chat, and outfit suggestions
                        </p>
                    </div>

                    {/* NVIDIA API Key - Optional */}
                    <div className="opacity-80 hover:opacity-100 transition-opacity">
                        <div className="flex items-center justify-between mb-3">
                            <label className="text-white font-bold text-sm flex items-center gap-2">
                                <span className="text-gray-500">●</span> NVIDIA NIM API
                                <span className="text-xs bg-white/10 text-gray-400 px-2.5 py-0.5 rounded-full font-medium">Optional</span>
                            </label>
                            <a
                                href="https://build.nvidia.com/explore/discover"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-gray-400 hover:text-white text-xs flex items-center gap-1 font-medium transition-colors"
                            >
                                Get Key <ExternalLink size={12} />
                            </a>
                        </div>
                        <input
                            type="password"
                            value={nvidiaKey}
                            onChange={(e) => setNvidiaKey(e.target.value)}
                            placeholder="nvapi-xxxxxxxx..."
                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-4 text-white placeholder-gray-600 font-mono text-sm focus:outline-none focus:border-white/40 focus:bg-white/10 transition-all font-medium"
                        />
                        <p className="text-gray-500 text-xs mt-2 ml-1">
                            For advanced features (not required)
                        </p>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="flex items-center gap-3 text-red-200 text-sm bg-red-500/10 px-4 py-3 rounded-2xl border border-red-500/20 backdrop-blur-md">
                            <AlertCircle size={18} className="shrink-0" />
                            <span className="font-medium">{error}</span>
                        </div>
                    )}

                    {/* Info Box */}
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                        <div className="flex items-start gap-4">
                            <Sparkles size={20} className="text-white mt-0.5 shrink-0" />
                            <div>
                                <p className="text-white text-sm font-bold mb-1">Your keys are safe</p>
                                <p className="text-gray-400 text-xs leading-relaxed">
                                    Keys are encrypted and stored locally. They never leave your device.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <button
                        onClick={handleSave}
                        disabled={saving || !geminiKey.trim()}
                        className="w-full py-4 bg-white text-black font-bold rounded-2xl flex items-center justify-center gap-2 hover:bg-gray-100 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:hover:scale-100 shadow-xl shadow-white/5"
                    >
                        {saving ? (
                            <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <>
                                Save & Lock Key <Check size={20} />
                            </>
                        )}
                    </button>

                    {/* Support Email */}
                    <p className="text-center text-gray-600 text-xs">
                        Need help? <button onClick={() => openSupportEmail('API Key Setup Help')} className="text-gray-400 hover:text-white underline transition-colors">{getSupportEmail()}</button>
                    </p>
                </div>

                {/* Beta Info */}
                <div className="text-center mt-6">
                    <p className="text-xs text-gray-600">
                        Beta Version • {BETA_CONFIG.durationDays}-day trial
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ApiKeySetupModal;

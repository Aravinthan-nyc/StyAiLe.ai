/**
 * ApiKeySetupModal - Modal to collect API keys
 * Shown after onboarding, before main app access
 */

import React, { useState, useEffect } from 'react';
import { Key, ExternalLink, AlertCircle, Check, Sparkles } from '../components/Icons';

interface ApiKeySetupModalProps {
    onComplete: () => void;
}

const STORAGE_KEY = 'styaile_api_keys';

const ApiKeySetupModal: React.FC<ApiKeySetupModalProps> = ({ onComplete }) => {
    const [geminiKey, setGeminiKey] = useState('');
    const [nvidiaKey, setNvidiaKey] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    // Load existing keys
    useEffect(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                const keys = JSON.parse(stored);
                setGeminiKey(keys.gemini || '');
                setNvidiaKey(keys.nvidia || '');
            }
        } catch (e) {
            console.warn('Could not load keys:', e);
        }
    }, []);

    const handleSave = async () => {
        setError(null);

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

        setSaving(true);

        try {
            // Save keys to localStorage
            const keys = {
                gemini: geminiKey.trim(),
                nvidia: nvidiaKey.trim() || '',
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(keys));

            // Small delay for UX
            await new Promise(resolve => setTimeout(resolve, 500));

            onComplete();
        } catch (e: any) {
            setError('Failed to save API keys');
        } finally {
            setSaving(false);
        }
    };

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
                                    Keys are stored locally on your device. They never leave your phone.
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
                                Continue to App <Check size={20} />
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ApiKeySetupModal;

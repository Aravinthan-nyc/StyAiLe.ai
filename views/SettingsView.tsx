import React, { useState, useEffect } from 'react';
import { AppView } from '../types';
import { Key, ExternalLink, Check, X } from '../components/Icons';

interface SettingsViewProps {
    setView: (view: AppView) => void;
    onSignOut?: () => void;
}

interface ApiKeys {
    nvidia: string;
    gemini: string;
}

const STORAGE_KEY = 'styaile_api_keys';

const SettingsView: React.FC<SettingsViewProps> = ({ setView, onSignOut }) => {
    const [keys, setKeys] = useState<ApiKeys>({ nvidia: '', gemini: '' });
    const [saved, setSaved] = useState(false);
    const [showTutorial, setShowTutorial] = useState(false);

    useEffect(() => {
        // Load saved keys from localStorage
        const savedKeys = localStorage.getItem(STORAGE_KEY);
        if (savedKeys) {
            try {
                setKeys(JSON.parse(savedKeys));
            } catch (e) {
                console.error('Failed to load API keys:', e);
            }
        } else {
            // First time user - show tutorial
            setShowTutorial(true);
        }
    }, []);

    const handleSave = () => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(keys));
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);

        // Also update .env variables for immediate use (only works in memory, not file)
        // The app will need to reload to pick up these changes from localStorage
        if (keys.nvidia) {
            (window as any).__NVIDIA_API_KEY__ = keys.nvidia;
        }
        if (keys.gemini) {
            (window as any).__GEMINI_API_KEY__ = keys.gemini;
        }
    };

    const handleClear = () => {
        setKeys({ nvidia: '', gemini: '' });
        localStorage.removeItem(STORAGE_KEY);
    };

    return (
        <div className="min-h-screen pb-32 px-4 pt-6 bg-black text-white">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <button
                    onClick={() => setView(AppView.WARDROBE)}
                    className="p-2 -ml-2 text-gray-400 hover:text-white btn-press transition-colors"
                >
                    <X size={24} />
                </button>
                <div className="flex items-center gap-2">
                    <img src="/logo.png" alt="Logo" className="w-8 h-8" />
                    <h1 className="text-xl font-bold text-white">Settings</h1>
                </div>
                <div className="w-10" />
            </div>

            {/* Tutorial Modal */}
            {showTutorial && (
                <div className="glass-card-strong p-6 mb-6 animate-slide-up">
                    <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                        <Key size={20} /> Welcome to StyAiLe.ai!
                    </h2>
                    <p className="text-gray-400 text-sm mb-4 leading-relaxed">
                        To use AI features, you need a <strong>Gemini API key</strong>. It's free and takes 30 seconds to get!
                    </p>
                    <div className="space-y-3 text-sm">
                        <div className="flex items-start gap-2">
                            <span className="text-white font-mono bg-white/10 px-2 py-0.5 rounded">1</span>
                            <span className="text-gray-300">Go to Google AI Studio (link below)</span>
                        </div>
                        <div className="flex items-start gap-2">
                            <span className="text-white font-mono bg-white/10 px-2 py-0.5 rounded">2</span>
                            <span className="text-gray-300">Click "Create API Key" and copy it</span>
                        </div>
                        <div className="flex items-start gap-2">
                            <span className="text-white font-mono bg-white/10 px-2 py-0.5 rounded">3</span>
                            <span className="text-gray-300">Paste it below and tap Save</span>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowTutorial(false)}
                        className="mt-5 w-full py-3 bg-white text-black rounded-2xl font-semibold btn-press"
                    >
                        Got it!
                    </button>
                </div>
            )}

            {/* API Key Inputs */}
            <div className="space-y-6">
                {/* Gemini API Key - PRIMARY */}
                <div className="glass-card p-5 rounded-3xl border-2 border-primary/30">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-white flex items-center gap-2">
                            <span className="text-blue-400">✦</span> Google Gemini API <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">Required</span>
                        </h3>
                        <a
                            href="https://aistudio.google.com/app/apikey"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:text-white text-xs flex items-center gap-1 font-medium"
                        >
                            Get Free Key <ExternalLink size={12} />
                        </a>
                    </div>
                    <input
                        type="password"
                        value={keys.gemini}
                        onChange={(e) => setKeys({ ...keys, gemini: e.target.value })}
                        placeholder="AIzaSy..."
                        className="glass-input w-full px-4 py-3 rounded-xl text-sm font-mono"
                    />
                    <p className="text-gray-500 text-xs mt-2">
                        Powers all AI features: image analysis, chat, outfit suggestions
                    </p>
                </div>

                {/* NVIDIA API Key - OPTIONAL */}
                <div className="glass-card p-5 rounded-3xl opacity-60">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-white flex items-center gap-2">
                            <span className="text-green-400">●</span> NVIDIA NIM API <span className="text-xs bg-white/10 text-gray-400 px-2 py-0.5 rounded-full">Optional</span>
                        </h3>
                        <a
                            href="https://build.nvidia.com/explore/discover"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-400 hover:text-white text-xs flex items-center gap-1"
                        >
                            Get Key <ExternalLink size={12} />
                        </a>
                    </div>
                    <input
                        type="password"
                        value={keys.nvidia}
                        onChange={(e) => setKeys({ ...keys, nvidia: e.target.value })}
                        placeholder="nvapi-xxxxxxxx..."
                        className="glass-input w-full px-4 py-3 rounded-xl text-sm font-mono"
                    />
                    <p className="text-gray-500 text-xs mt-2">
                        Legacy option - not required when using Gemini
                    </p>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 mt-8">
                <button
                    onClick={handleClear}
                    className="flex-1 py-4 glass-card text-gray-400 rounded-2xl font-medium btn-press hover:text-white hover:bg-white/5 transition-colors"
                >
                    Clear All
                </button>
                <button
                    onClick={handleSave}
                    className={`flex-[2] py-4 rounded-2xl font-bold btn-press flex items-center justify-center gap-2 transition-all ${saved
                        ? 'bg-green-500 text-white'
                        : 'bg-white text-black hover:bg-gray-200'
                        }`}
                >
                    {saved ? <><Check size={20} /> Saved!</> : 'Save Keys'}
                </button>
            </div>

            {/* Info Box */}
            <div className="mt-8 p-4 glass-card rounded-2xl text-center">
                <p className="text-gray-500 text-xs leading-relaxed">
                    🔒 Your API keys are stored <strong className="text-gray-300">locally</strong> in your browser.
                    They never leave your device.
                </p>
            </div>

            {/* Quick Links */}
            <div className="mt-6 space-y-2">
                <a
                    href="https://docs.nvidia.com/nim/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-4 glass-card rounded-2xl text-gray-400 hover:text-white transition-colors flex items-center justify-between"
                >
                    <span className="text-sm">NVIDIA NIM Documentation</span>
                    <ExternalLink size={16} />
                </a>
                <a
                    href="https://ai.google.dev/docs"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-4 glass-card rounded-2xl text-gray-400 hover:text-white transition-colors flex items-center justify-between"
                >
                    <span className="text-sm">Google Gemini Documentation</span>
                    <ExternalLink size={16} />
                </a>
            </div>

            {/* Sign Out Button */}
            {onSignOut && (
                <div className="mt-6">
                    <button
                        onClick={() => {
                            if (window.confirm('Are you sure you want to sign out?')) {
                                onSignOut();
                            }
                        }}
                        className="w-full py-4 bg-red-500/10 text-red-400 font-medium rounded-2xl border border-red-500/20 hover:bg-red-500/20 transition-colors"
                    >
                        Sign Out
                    </button>
                </div>
            )}

            {/* Version */}
            <div className="mt-8 text-center">
                <p className="text-gray-600 text-xs">StyAiLe.ai v1.0.0</p>
            </div>
        </div>
    );
};

export default SettingsView;

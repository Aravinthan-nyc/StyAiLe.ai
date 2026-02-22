import React, { useState } from 'react';
import { AppView } from '../types';
import { X, Bug, RefreshCw, Mail, Shield, ChevronRight } from '../components/Icons';
import { getSubscription, formatPlanName, getPlanColor } from '../services/subscriptionService';
import { checkForUpdates, APP_VERSION } from '../services/liveUpdateService';
import { CreditDisplay } from '../components/CreditDisplay';
import { AdService } from '../services/adService';
import { CreditService } from '../services/creditService';


interface SettingsViewProps {
    setView: (view: AppView) => void;
    onSignOut?: () => void;
    onNavigateTo?: (view: AppView) => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ setView, onSignOut, onNavigateTo }) => {
    const [checkingUpdate, setCheckingUpdate] = useState(false);
    const subscription = getSubscription();

    const navigate = (view: AppView) => {
        if (onNavigateTo) {
            onNavigateTo(view);
        } else {
            setView(view);
        }
    };

    const handleReportBug = () => {
        const subject = encodeURIComponent('Bug Report / Feedback - StyAiLe Beta');
        const body = encodeURIComponent(`Please describe the issue or feedback:\n\n\n\n--- App Info ---\nVersion: ${APP_VERSION.version} (Build ${APP_VERSION.buildNumber})\nPlatform: Web/PWA`);
        window.location.href = `mailto:notpavan2022@gmail.com?subject=${subject}&body=${body}`;
    };

    const handleCheckUpdate = async () => {
        setCheckingUpdate(true);
        try {
            const status = await checkForUpdates(true);
            if (!status.available) {
                // Simple feedback for no update
                // In a real app, use a toast. Here standard alert is fine as requested "overkill" applies to logic not necessarily every UI element unless specified
                // But let's make it look nice if we can, or just rely on UpdatePrompt to handle the positive case
                alert(`You are on the latest version (${APP_VERSION.version})`);
            }
        } catch (e) {
            console.error(e);
            alert('Failed to check for updates');
        } finally {
            setCheckingUpdate(false);
        }
    };

    return (
        <div className="min-h-screen pb-32 px-4 pt-6 bg-black text-white font-sans">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <button
                    onClick={() => setView(AppView.WARDROBE)}
                    className="p-2 -ml-2 text-gray-400 hover:text-white transition-colors hover:bg-white/5 rounded-full"
                >
                    <X size={24} />
                </button>
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-tr from-white to-gray-400 rounded-lg flex items-center justify-center">
                        <span className="text-black font-bold text-lg">S</span>
                    </div>
                    <h1 className="text-xl font-bold text-white tracking-tight">Settings</h1>
                </div>
                <CreditDisplay />
            </div>

            {/* Current Plan Badge */}
            <button
                onClick={() => navigate(AppView.SUBSCRIPTION)}
                className="w-full bg-zinc-900/50 border border-white/10 p-4 rounded-2xl mb-8 flex items-center justify-between group hover:bg-zinc-900 transition-all"
            >
                <div className="flex items-center gap-4">
                    <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-lg"
                        style={{ backgroundColor: `${getPlanColor(subscription.tier)}20`, boxShadow: `0 0 20px ${getPlanColor(subscription.tier)}10` }}
                    >
                        {subscription.tier === 'free' ? '🆓' : subscription.tier === 'starter' ? '⭐' : subscription.tier === 'pro' ? '💎' : '👑'}
                    </div>
                    <div className="text-left">
                        <div className="font-bold text-white text-lg">{formatPlanName(subscription.tier)} Plan</div>
                        <div className="text-sm text-gray-400 font-medium">{subscription.status}</div>
                    </div>
                </div>
                <ChevronRight size={20} className="text-gray-500 group-hover:text-white transition-colors" />
            </button>

            {/* Credits & Ads Section */}
            <div className="mb-8">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 px-1">
                    Credits & Rewards
                </h3>
                <div className="bg-zinc-900/50 border border-white/10 rounded-2xl overflow-hidden p-1">
                    <button
                        onClick={async () => {
                            const result = await AdService.showRewardAd();
                            if (result.success && result.reward) {
                                alert(`You earned ${result.reward} credits!`);
                                // Force refresh context if needed, but subscription/credit service should handle it
                            }
                        }}
                        className="w-full px-4 py-4 flex items-center justify-between hover:bg-white/5 transition-colors group"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center text-yellow-400 group-hover:bg-yellow-500/20 transition-colors">
                                <span className="text-xl">📺</span>
                            </div>
                            <div className="text-left">
                                <div className="font-semibold text-white">Watch Ad to Earn Credits</div>
                                <div className="text-xs text-gray-400 mt-0.5">Get 5 free credits instantly</div>
                            </div>
                        </div>
                        <div className="bg-white/10 px-3 py-1 rounded-full text-xs font-bold text-white group-hover:bg-white/20 transition-colors">
                            +5 Credits
                        </div>
                    </button>
                </div>
            </div>

            {/* Support & Updates Section - THE MAIN FOCUS */}
            <div className="mb-8">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 px-1">
                    Support & Updates
                </h3>
                <div className="bg-zinc-900/50 border border-white/10 rounded-2xl overflow-hidden divide-y divide-white/5">

                    {/* Report Bug / Email Support */}
                    <button
                        onClick={handleReportBug}
                        className="w-full px-5 py-4 flex items-center justify-between hover:bg-white/5 transition-colors group"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 group-hover:bg-blue-500/20 transition-colors">
                                <Mail size={20} />
                            </div>
                            <div className="text-left">
                                <div className="font-semibold text-white">Contact Support</div>
                                <div className="text-xs text-gray-400 mt-0.5">Report bugs & request API changes</div>
                            </div>
                        </div>
                        <ChevronRight size={18} className="text-gray-600 group-hover:text-white transition-colors" />
                    </button>

                    {/* Check for Updates */}
                    <button
                        onClick={handleCheckUpdate}
                        disabled={checkingUpdate}
                        className="w-full px-5 py-4 flex items-center justify-between hover:bg-white/5 transition-colors group"
                    >
                        <div className="flex items-center gap-4">
                            {checkingUpdate ? (
                                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                </div>
                            ) : (
                                <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center text-green-400 group-hover:bg-green-500/20 transition-colors">
                                    <RefreshCw size={20} />
                                </div>
                            )}
                            <div className="text-left">
                                <div className="font-semibold text-white">Check for Updates</div>
                                <div className="text-xs text-gray-400 mt-0.5">
                                    {checkingUpdate ? 'Checking...' : `Current version: v${APP_VERSION.version}`}
                                </div>
                            </div>
                        </div>
                        {!checkingUpdate && <ChevronRight size={18} className="text-gray-600 group-hover:text-white transition-colors" />}
                    </button>

                </div>
            </div>

            {/* Privacy & Security (Visual only for now) */}
            <div className="mb-8">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 px-1">
                    Security
                </h3>
                <div className="bg-zinc-900/50 border border-white/10 rounded-2xl overflow-hidden p-5">
                    <div className="flex items-start gap-4">
                        <Shield size={22} className="text-gray-400 mt-1" />
                        <div>
                            <div className="font-semibold text-white mb-1">API Key Secured</div>
                            <p className="text-xs text-gray-500 leading-relaxed">
                                Your API key is encrypted and stored locally. To change it, please contact support via the button above.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Sign Out Button */}
            {onSignOut && (
                <button
                    onClick={() => {
                        if (window.confirm('Are you sure you want to sign out?')) {
                            onSignOut();
                        }
                    }}
                    className="w-full py-4 bg-red-500/10 text-red-400 font-bold rounded-2xl border border-red-500/10 hover:bg-red-500/20 transition-all active:scale-[0.98]"
                >
                    Sign Out
                </button>
            )}

            {/* Version Footer */}
            <div className="mt-8 text-center space-y-2">
                <p className="text-white font-bold text-sm tracking-widest">StyAiLe.ai</p>
                <p className="text-gray-600 text-xs font-mono">
                    v{APP_VERSION.version} ({APP_VERSION.buildNumber}) • {APP_VERSION.buildDate}
                </p>
            </div>
        </div>
    );
};

export default SettingsView;


import React from 'react';
import { getSupportEmail, getExpirationDate, openSupportEmail, BETA_CONFIG } from '../services/betaSecurityService';

interface BetaExpiredViewProps {
    onBack?: () => void;
}

const BetaExpiredView: React.FC<BetaExpiredViewProps> = () => {
    return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-8">
            <div className="max-w-md text-center">
                {/* Icon */}
                <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-8 border border-white/10">
                    <svg width={48} height={48} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                        <circle cx="12" cy="12" r="10"></circle>
                        <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                </div>

                {/* Title */}
                <h1 className="text-3xl font-bold mb-4">Beta Period Ended</h1>

                {/* Message */}
                <p className="text-gray-400 mb-2">
                    This beta version expired on
                </p>
                <p className="text-xl font-semibold text-white mb-8">
                    {getExpirationDate()}
                </p>

                {/* Thank you message */}
                <div className="glass-card rounded-2xl p-6 mb-8 border border-white/10">
                    <p className="text-gray-300 text-sm leading-relaxed">
                        Thank you for participating in the StyAiLe beta program!
                        Your feedback has been invaluable. Please contact us for
                        continued access or to receive the full release.
                    </p>
                </div>

                {/* Contact Section */}
                <div className="space-y-4">
                    <p className="text-xs text-gray-500 uppercase tracking-wider">
                        Contact for extended access
                    </p>

                    <button
                        onClick={() => openSupportEmail('Beta Access Extension Request')}
                        className="w-full py-4 bg-white text-black rounded-xl font-bold transition-colors hover:bg-gray-200 btn-press"
                    >
                        Email Support
                    </button>

                    <p className="text-gray-500 text-sm">
                        {getSupportEmail()}
                    </p>
                </div>

                {/* Beta info */}
                <div className="mt-12 pt-6 border-t border-white/10">
                    <p className="text-xs text-gray-600">
                        Beta Version • {BETA_CONFIG.durationDays}-day trial
                    </p>
                </div>
            </div>
        </div>
    );
};

export default BetaExpiredView;

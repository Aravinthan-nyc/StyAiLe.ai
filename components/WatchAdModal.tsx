import React from 'react';
import { AdMobService } from '../services/adMobService';
import { X, PlayCircle, Loader2 } from 'lucide-react';

interface WatchAdModalProps {
    isOpen: boolean;
    onClose: () => void;
    onRewardEarned: () => void;
    requiredCredits: number;
    currentCredits: number;
}

export function WatchAdModal({ isOpen, onClose, onRewardEarned, requiredCredits, currentCredits }: WatchAdModalProps) {
    const [isLoading, setIsLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    if (!isOpen) return null;

    const handleWatchAd = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const adService = AdMobService.getInstance();
            await adService.initialize();
            const success = await adService.showRewardedAd();

            if (success) {
                onRewardEarned();
                onClose();
            } else {
                setError("Ad failed to load or was closed early. Please try again.");
            }
        } catch (err: any) {
            console.error("Ad Error:", err);
            setError("Could not load ad. Please check your connection.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl w-full max-w-sm p-6 shadow-2xl animate-in fade-in zoom-in duration-200">

                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h3 className="text-xl font-bold text-white mb-1">Need More Credits?</h3>
                        <p className="text-sm text-gray-400">
                            You have <span className="text-white font-mono">{currentCredits}</span> credits.
                            This action costs <span className="text-white font-mono">{requiredCredits}</span>.
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-white/10 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="bg-black/30 rounded-xl p-4 mb-6 border border-white/5">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                            <PlayCircle className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div>
                            <p className="text-emerald-400 font-medium">+5 Free Credits</p>
                            <p className="text-xs text-gray-500">Watch a short video ad</p>
                        </div>
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs">
                        {error}
                    </div>
                )}

                {/* Actions */}
                <button
                    onClick={handleWatchAd}
                    disabled={isLoading}
                    className="w-full py-3 px-4 bg-white text-black font-semibold rounded-xl hover:bg-gray-200 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Loading Ad...
                        </>
                    ) : (
                        <>
                            Watch Video (+5 Credits)
                        </>
                    )}
                </button>

                <button
                    onClick={onClose}
                    className="w-full mt-3 py-2 text-sm text-gray-500 hover:text-white transition-colors"
                >
                    Maybe later
                </button>
            </div>
        </div>
    );
}

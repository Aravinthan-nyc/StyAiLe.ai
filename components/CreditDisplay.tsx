import React, { useEffect, useState } from 'react';
import { CreditService } from '../services/creditService';
import { AdService } from '../services/adService';
import { Coins, Loader2 } from 'lucide-react';

export const CreditDisplay: React.FC = () => {
    const [credits, setCredits] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Initial fetch
        CreditService.getBalance().then(setCredits);

        // Subscribe to changes
        const unsubscribe = CreditService.subscribeToBalance((newBalance) => {
            setCredits(newBalance);
        });

        return () => {
            // unsubscribe(); // Fix: function returns unsubscribe or void depending on implementation
        };
    }, []);

    const handleWatchAd = async () => {
        setLoading(true);
        const result = await AdService.showRewardAd();
        if (result.success && result.reward) {
            // Optimistic update or refresh
            const newBalance = await CreditService.getBalance();
            setCredits(newBalance);
            alert(`You earned ${result.reward} credits!`);
        } else {
            alert('Ad failed to load. Please try again later.');
        }
        setLoading(false);
    };

    if (credits === null) return null;

    return (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-900 border border-gray-800 rounded-full">
            <Coins className="w-4 h-4 text-yellow-500" />
            <span className="text-sm font-medium text-white">{credits}</span>
            <button
                onClick={handleWatchAd}
                disabled={loading}
                className="ml-2 text-xs text-blue-400 hover:text-blue-300 disabled:opacity-50"
            >
                {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : '+ Get Free'}
            </button>
        </div>
    );
};

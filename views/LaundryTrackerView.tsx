import React, { useState, useMemo } from 'react';
import { WardrobeItem } from '../types';
import { isItemLocked, getLockStatusText } from '../services/lockService';
import {
    ArrowLeft,
    Shirt,
    Unlock,
    Clock,
    Sparkles
} from '../components/Icons';

interface LaundryTrackerViewProps {
    wardrobe: WardrobeItem[];
    onBack: () => void;
    onUnlockItem?: (id: string) => void;
}

const LaundryTrackerView: React.FC<LaundryTrackerViewProps> = ({
    wardrobe,
    onBack,
    onUnlockItem
}) => {
    const [unlocking, setUnlocking] = useState<string | null>(null);

    // Get all items that are locked (in laundry/in use)
    const lockedItems = useMemo(() => {
        return wardrobe.filter(item => isItemLocked(item));
    }, [wardrobe]);

    const handleUnlock = async (item: WardrobeItem) => {
        setUnlocking(item.id);
        try {
            if (onUnlockItem) {
                onUnlockItem(item.id);
            }
        } catch (error) {
            console.error('Failed to unlock item:', error);
        } finally {
            setUnlocking(null);
        }
    };

    const handleUnlockAll = () => {
        lockedItems.forEach(item => {
            if (onUnlockItem) onUnlockItem(item.id);
        });
    };

    return (
        <div className="min-h-screen bg-black text-white pb-24">
            {/* Header */}
            <div className="sticky top-0 z-20 bg-black/80 backdrop-blur-xl border-b border-white/5 px-4 py-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onBack}
                        className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                            Laundry Tracker
                        </h1>
                        <p className="text-xs text-gray-400">
                            {lockedItems.length} items in laundry
                        </p>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="p-4">
                {lockedItems.length === 0 ? (
                    /* Empty State */
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-4 border border-white/10">
                            <Sparkles size={32} className="text-gray-600" />
                        </div>
                        <h2 className="text-xl font-bold text-white mb-2">All Clean!</h2>
                        <p className="text-gray-400 text-sm mb-6 max-w-xs">
                            You have no items in laundry right now. Items are added here when you wear them.
                        </p>
                        <button
                            onClick={onBack}
                            className="flex items-center gap-2 px-6 py-3 bg-white/10 text-white rounded-full font-medium border border-white/10 hover:bg-white/20 transition-colors"
                        >
                            Back to Wardrobe
                        </button>
                    </div>
                ) : (
                    /* Laundry Items */
                    <div className="space-y-4">
                        <div className="glass-card rounded-2xl p-4 border border-white/10 mb-6">
                            <div className="flex items-center gap-3 mb-2">
                                <Clock size={18} className="text-gray-400" />
                                <span className="text-sm text-gray-400">
                                    Items will unlock automatically after the laundry cycle
                                </span>
                            </div>
                        </div>

                        {lockedItems.map(item => {
                            const lockStatus = getLockStatusText(item);
                            const isUnlocking = unlocking === item.id;

                            return (
                                <div
                                    key={item.id}
                                    className="glass-card rounded-2xl overflow-hidden border border-white/10"
                                >
                                    <div className="flex items-center p-4 gap-4">
                                        {/* Image */}
                                        <div className="w-20 h-20 flex-shrink-0 rounded-xl bg-white/5 overflow-hidden border border-white/5">
                                            {item.imageData ? (
                                                <img
                                                    src={item.imageData}
                                                    alt={item.description}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <Shirt size={24} className="text-gray-600" />
                                                </div>
                                            )}
                                        </div>

                                        {/* Details */}
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-semibold truncate">{item.description}</h3>
                                            <p className="text-sm text-gray-500">{item.category}</p>
                                            <p className="text-xs text-gray-600 mt-1">{lockStatus}</p>
                                        </div>

                                        {/* Unlock Button */}
                                        <button
                                            onClick={() => handleUnlock(item)}
                                            disabled={isUnlocking}
                                            className={`p-3 rounded-xl transition-all ${isUnlocking
                                                    ? 'bg-white/5 text-gray-500'
                                                    : 'bg-white/10 text-white hover:bg-white/20 border border-white/10'
                                                }`}
                                        >
                                            <Unlock size={20} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Bulk Unlock Button */}
            {lockedItems.length > 1 && (
                <div className="fixed bottom-20 left-0 right-0 px-4">
                    <button
                        onClick={handleUnlockAll}
                        className="w-full py-4 bg-white text-black rounded-2xl font-semibold shadow-lg shadow-white/20 hover:bg-gray-100 transition-colors"
                    >
                        Unlock All ({lockedItems.length} items)
                    </button>
                </div>
            )}
        </div>
    );
};

export default LaundryTrackerView;

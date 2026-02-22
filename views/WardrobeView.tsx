import React, { useState, useMemo, useRef, useCallback } from 'react';
import { WardrobeItem, ClothingCategory } from '../types';
import { WatchAdModal } from '../components/WatchAdModal';
import { supabase } from '../services/supabaseClient';
import { Plus, Search, X, Shirt, Sparkles, Lock, Unlock, Clock, Trash2, Menu } from '../components/Icons';
import { isItemLocked, getLockStatusText } from '../services/lockService';

interface WardrobeViewProps {
    items: WardrobeItem[];
    onDeleteItem: (id: string) => void;
    onAddClick: () => void;
    onAskStylist?: (selectedItems: WardrobeItem[]) => void;
    onLockItem?: (id: string, days?: number) => void;
    onUnlockItem?: (id: string) => void;
    onOpenSidebar?: () => void;
}

const categoryOrder = [
    'All',
    ClothingCategory.TOP,
    ClothingCategory.BOTTOM,
    ClothingCategory.DRESS,
    ClothingCategory.OUTERWEAR,
    ClothingCategory.SHOES,
    ClothingCategory.ACCESSORY,
    ClothingCategory.OTHER,
];

// Modern glass badges
const getCategoryBadgeClass = (category: ClothingCategory): string => {
    return 'bg-white/10 text-white/90 border border-white/5 backdrop-blur-md';
};

const LONG_PRESS_DURATION = 500; // ms

const WardrobeView: React.FC<WardrobeViewProps> = ({
    items,
    onDeleteItem,
    onAddClick,
    onAskStylist,
    onLockItem,
    onUnlockItem,
    onOpenSidebar
}) => {
    const [activeCategory, setActiveCategory] = useState<string>('All');
    const [selectedItem, setSelectedItem] = useState<WardrobeItem | null>(null);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isSelectMode, setIsSelectMode] = useState(false);
    const longPressTimer = useRef<NodeJS.Timeout | null>(null);

    const filteredItems = useMemo(() => {
        if (activeCategory === 'All') return items;
        return items.filter(item => item.category === activeCategory);
    }, [items, activeCategory]);

    const categoryCounts = useMemo(() => {
        const counts: Record<string, number> = { All: items.length };
        items.forEach(item => {
            counts[item.category] = (counts[item.category] || 0) + 1;
        });
        return counts;
    }, [items]);

    // Long press handlers
    const handlePressStart = useCallback((itemId: string) => {
        longPressTimer.current = setTimeout(() => {
            setIsSelectMode(true);
            setSelectedIds(new Set([itemId]));
        }, LONG_PRESS_DURATION);
    }, []);

    const handlePressEnd = useCallback(() => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }
    }, []);

    // Toggle selection
    const toggleSelection = useCallback((itemId: string) => {
        setSelectedIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(itemId)) {
                newSet.delete(itemId);
            } else {
                newSet.add(itemId);
            }
            if (newSet.size === 0) {
                setIsSelectMode(false);
            }
            return newSet;
        });
    }, []);

    const handleItemClick = useCallback((item: WardrobeItem) => {
        if (isSelectMode) {
            toggleSelection(item.id);
        } else {
            setSelectedItem(item);
        }
    }, [isSelectMode, toggleSelection]);

    const exitSelectMode = useCallback(() => {
        setIsSelectMode(false);
        setSelectedIds(new Set());
    }, []);

    const handleAskStylist = useCallback(() => {
        if (onAskStylist && selectedIds.size > 0) {
            const selectedItems = items.filter(item => selectedIds.has(item.id));
            onAskStylist(selectedItems);
            exitSelectMode();
        }
    }, [items, selectedIds, onAskStylist, exitSelectMode]);


    if (items.length === 0) {
        return (
            <div className="min-h-screen pb-24 flex items-center justify-center">
                <div className="flex flex-col items-center text-center p-8 glass-card rounded-3xl mx-4 animate-fade-in">
                    <div className="w-20 h-20 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full flex items-center justify-center mb-6 animate-pulse">
                        <Shirt size={40} className="text-primary" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Wardrobe Empty</h2>
                    <p className="text-gray-400 mb-8 max-w-xs leading-relaxed">Add your favorite pieces to verify style intelligence.</p>
                    <button
                        onClick={onAddClick}
                        className="flex items-center gap-2 px-8 py-4 bg-primary text-black rounded-full font-semibold shadow-lg shadow-primary/30 btn-press hover:bg-primary/90 transition-all"
                    >
                        <Plus size={20} />
                        Add First Item
                    </button>
                </div>
            </div>
        );
    }


    // AdMob Integration
    const [showAdModal, setShowAdModal] = useState(false);
    const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

    const checkCreditsAndProceed = async (cost: number, action: () => void) => {
        // Optimistic check (real check happens on server)
        // For MVP, we'll assume we need to check local state or fetch fresh
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profile } = await supabase
            .from('profiles')
            .select('credits')
            .eq('id', user.id)
            .single();

        const currentCredits = profile?.credits || 0;

        if (currentCredits < cost) {
            setPendingAction(() => action);
            setShowAdModal(true);
        } else {
            action();
        }
    };

    const handleAdReward = () => {
        // Credits added by service.
        // Retry the pending action
        if (pendingAction) {
            pendingAction();
            setPendingAction(null);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white pb-20">
            {/* Header */}
            <div className="sticky top-0 z-20 bg-black/80 backdrop-blur-xl border-b border-white/5 px-4 py-4">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">My Wardrobe</h1>
                        <p className="text-xs text-gray-400">{items.length} items • {filteredItems.length} shown</p>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Ask Stylist Button (Small) */}
                        {selectedIds.size > 0 && (
                            <button
                                onClick={() => onAskStylist?.(items.filter(i => selectedIds.has(i.id)))}
                                className="p-2 bg-blue-600/20 text-blue-400 rounded-full hover:bg-blue-600/30 transition-colors border border-blue-600/30"
                            >
                                <Sparkles size={20} />
                            </button>
                        )}

                        {/* Add Item Button */}
                        <button
                            onClick={onAddClick}
                            className="p-2 bg-white/10 text-white rounded-full hover:bg-white/20 transition-colors border border-white/10"
                        >
                            <Plus size={20} />
                        </button>

                        {/* Sidebar Toggle - Top Right */}
                        {onOpenSidebar && (
                            <button
                                onClick={onOpenSidebar}
                                className="p-2 bg-white/5 text-gray-300 rounded-full hover:bg-white/15 transition-colors border border-white/10"
                            >
                                <Menu size={20} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Categories */}
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 mask-linear">
                    {categoryOrder.map(cat => {
                        const count = categoryCounts[cat] || 0;
                        if (cat !== 'All' && count === 0) return null;
                        const isActive = activeCategory === cat;
                        return (
                            <button
                                key={cat}
                                onClick={() => setActiveCategory(cat)}
                                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all border
                                ${isActive
                                        ? 'bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.3)]'
                                        : 'bg-white/5 text-gray-400 border-white/5 hover:bg-white/10 hover:border-white/20'
                                    }`}
                            >
                                {cat === 'All' ? 'All Items' : cat}
                                {count > 0 && (
                                    <span className={`ml-2 text-xs ${isActive ? 'text-black/60' : 'text-gray-600'}`}>
                                        {count}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="p-4 space-y-6">
                {/* Empty State */}
                {filteredItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
                        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-4 border border-white/10">
                            <Shirt size={32} className="text-gray-600" />
                        </div>
                        <h3 className="text-lg font-medium text-white mb-2">My Closet is Empty</h3>
                        <p className="text-sm text-gray-500 max-w-xs mx-auto mb-6">
                            Start building your digital wardrobe by adding your favorite clothes.
                        </p>
                        <button
                            onClick={onAddClick}
                            className="px-6 py-3 bg-white text-black rounded-full font-bold hover:bg-gray-200 transition-colors flex items-center gap-2"
                        >
                            <Plus size={18} />
                            Add First Item
                        </button>
                    </div>
                ) : (
                    /* Grid */
                    <div className="grid grid-cols-2 gap-4 pb-20">
                        {filteredItems.map((item, index) => {
                            const isSelected = selectedIds.has(item.id);
                            const locked = isItemLocked(item);
                            const wearCount = item.wearCount || 0;

                            return (
                                <div
                                    key={item.id}
                                    onClick={() => handleItemClick(item)}
                                    onMouseDown={() => handlePressStart(item.id)}
                                    onMouseUp={handlePressEnd}
                                    onMouseLeave={handlePressEnd}
                                    onTouchStart={() => handlePressStart(item.id)}
                                    onTouchEnd={handlePressEnd}
                                    className={`group relative aspect-[3/4] rounded-2xl overflow-hidden cursor-pointer transition-all duration-300
                                        ${isSelected ? 'ring-2 ring-white scale-[0.98]' : 'hover:scale-[1.02]'}
                                    `}
                                >
                                    {/* Image */}
                                    <img
                                        src={item.imageData}
                                        alt={item.description}
                                        className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 
                                            ${locked ? 'opacity-50 grayscale-[0.5]' : 'opacity-100'}
                                        `}
                                    />

                                    {/* Gradient Overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80" />

                                    {/* Locked State */}
                                    {locked && (
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-2 border border-white/10">
                                                <Lock size={12} className="text-red-400" />
                                                <span className="text-xs font-medium text-white/90">Planned</span>
                                            </div>
                                        </div>
                                    )}

                                    {/* Selection Check */}
                                    {isSelectMode && (
                                        <div className={`absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center border transition-all
                                            ${isSelected ? 'bg-white border-white' : 'bg-black/40 border-white/40 backdrop-blur-sm'}
                                        `}>
                                            {isSelected && <div className="w-2.5 h-2.5 bg-black rounded-full" />}
                                        </div>
                                    )}

                                    {/* Item Info */}
                                    <div className="absolute bottom-3 left-3 right-3">
                                        <p className="text-sm font-medium text-white truncate">{item.description}</p>
                                        <div className="flex items-center justify-between mt-1">
                                            <span className="text-xs text-gray-400 capitalize">{item.category}</span>
                                            {wearCount > 0 && (
                                                <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-gray-300">
                                                    {wearCount}x
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* FAB for Multi-Select Actions */}
            {selectedIds.size > 0 && !selectedItem && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 z-30 animate-slide-up">
                    <div className="bg-black/80 backdrop-blur-xl border border-white/10 rounded-full px-6 py-3 flex items-center gap-4 shadow-2xl">
                        <span className="text-sm font-medium text-white">{selectedIds.size} selected</span>
                        <div className="h-4 w-px bg-white/20" />
                        <button
                            onClick={() => onAskStylist?.(items.filter(i => selectedIds.has(i.id)))}
                            className="text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-2 text-sm font-bold"
                        >
                            <Sparkles size={16} />
                            Ask Stylist
                        </button>
                        <button
                            onClick={() => {
                                setIsSelectMode(false);
                                setSelectedIds(new Set());
                            }}
                            className="text-gray-400 hover:text-white transition-colors"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>
            )}

            {/* Selection Modal */}
            {selectedItem && (
                <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 pb-24 sm:p-0">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity" onClick={() => setSelectedItem(null)} />
                    <div className="relative bg-[#111] border border-white/10 w-full max-w-sm rounded-[2rem] overflow-hidden shadow-2xl animate-slide-up">
                        <div className="aspect-square relative">
                            <img src={selectedItem.imageData} alt="" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-90" />
                            <button
                                onClick={() => setSelectedItem(null)}
                                className="absolute top-4 right-4 p-2 bg-black/40 backdrop-blur-md rounded-full text-white border border-white/10"
                            >
                                <X size={20} />
                            </button>
                            <div className="absolute bottom-6 left-6 right-6">
                                <h3 className="text-2xl font-bold text-white mb-1">{selectedItem.description}</h3>
                                <p className="text-gray-400 capitalize">
                                    {selectedItem.category} • {selectedItem.colors ? selectedItem.colors.join(', ') : ''}
                                </p>
                            </div>
                        </div>

                        <div className="p-6 grid grid-cols-2 gap-3">
                            {isItemLocked(selectedItem) ? (
                                <button
                                    onClick={() => {
                                        onUnlockItem?.(selectedItem.id);
                                        setSelectedItem(null);
                                    }}
                                    className="col-span-1 py-4 bg-green-500/10 border border-green-500/20 text-green-400 rounded-2xl font-medium flex flex-col items-center gap-2 hover:bg-green-500/20 transition-all"
                                >
                                    <Unlock size={24} />
                                    <span className="text-xs">Unlock Item</span>
                                </button>
                            ) : (
                                <button
                                    onClick={() => {
                                        onLockItem?.(selectedItem.id, 7);
                                        setSelectedItem(null);
                                    }}
                                    className="col-span-1 py-4 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-2xl font-medium flex flex-col items-center gap-2 hover:bg-blue-500/20 transition-all"
                                >
                                    <Clock size={24} />
                                    <span className="text-xs">Laundry (7d)</span>
                                </button>
                            )}

                            <button
                                onClick={() => {
                                    onDeleteItem(selectedItem.id);
                                    setSelectedItem(null);
                                }}
                                className="col-span-1 py-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl font-medium flex flex-col items-center gap-2 hover:bg-red-500/20 transition-all"
                            >
                                <Trash2 size={24} />
                                <span className="text-xs">Delete</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WardrobeView;

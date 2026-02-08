import React, { useState, useMemo, useRef, useCallback } from 'react';
import { WardrobeItem, ClothingCategory } from '../types';
import { Plus, Search, X, Shirt, Sparkles, Lock, Unlock, Clock, Trash2 } from '../components/Icons';
import { isItemLocked, getLockStatusText } from '../services/lockService';

interface WardrobeViewProps {
    items: WardrobeItem[];
    onDeleteItem: (id: string) => void;
    onAddClick: () => void;
    onAskStylist?: (selectedItems: WardrobeItem[]) => void;
    onLockItem?: (id: string, days?: number) => void;
    onUnlockItem?: (id: string) => void;
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

const WardrobeView: React.FC<WardrobeViewProps> = ({ items, onDeleteItem, onAddClick, onAskStylist, onLockItem, onUnlockItem }) => {
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

    return (
        <div className="min-h-screen pb-28 pt-4">
            {/* Header */}
            <div className="sticky top-0 bg-[#050505]/80 backdrop-blur-xl z-20 px-4 pt-2 pb-4 border-b border-white/5">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">Wardrobe</h1>
                        <p className="text-sm text-gray-500 font-medium tracking-wide mt-1">{items.length} ITEMS COLLECTED</p>
                    </div>
                    <button
                        onClick={onAddClick}
                        className="w-12 h-12 flex items-center justify-center bg-white text-black rounded-full shadow-lg shadow-white/10 btn-press hover:bg-gray-200 transition-colors"
                    >
                        <Plus size={24} />
                    </button>
                </div>

                {/* Category Tabs */}
                <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                    {categoryOrder.map(cat => {
                        const count = categoryCounts[cat] || 0;
                        if (cat !== 'All' && count === 0) return null;
                        const isActive = activeCategory === cat;
                        return (
                            <button
                                key={cat}
                                onClick={() => setActiveCategory(cat)}
                                className={`flex-shrink-0 px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 btn-press
                  ${isActive
                                        ? 'bg-white text-black shadow-md'
                                        : 'bg-white/5 text-gray-400 border border-white/5 hover:bg-white/10'
                                    }`}
                            >
                                {cat} <span className={`ml-1 text-xs ${isActive ? 'text-black/60' : 'text-gray-600'}`}>({count})</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Items Grid */}
            <div className="px-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                    {filteredItems.map((item, index) => {
                        const isSelected = selectedIds.has(item.id);
                        return (
                            <div
                                key={item.id}
                                onClick={() => handleItemClick(item)}
                                onMouseDown={() => handlePressStart(item.id)}
                                onMouseUp={handlePressEnd}
                                onMouseLeave={handlePressEnd}
                                onTouchStart={() => handlePressStart(item.id)}
                                onTouchEnd={handlePressEnd}
                                className={`group relative glass-card rounded-3xl overflow-hidden cursor-pointer animate-slide-up transition-all duration-300
                                    ${isSelected ? 'ring-2 ring-primary border-transparent' : 'border-white/5 hover:border-white/20'}`}
                                style={{ animationDelay: `${index * 0.05}s` }}
                            >
                                {/* Selection indicator */}
                                {isSelectMode && (
                                    <div className={`absolute top-3 left-3 w-6 h-6 rounded-full flex items-center justify-center z-10 transition-all shadow-lg
                                        ${isSelected ? 'bg-primary text-black scale-110' : 'bg-black/50 border border-white/30 backdrop-blur-sm'}`}>
                                        {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
                                    </div>
                                )}

                                <div className="aspect-[4/5] overflow-hidden bg-[#111] relative">
                                    <img
                                        src={item.imageData}
                                        alt={item.description}
                                        className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 ${isSelected ? 'opacity-60' : 'opacity-90'}`}
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />

                                    <div className="absolute bottom-3 left-3 right-3">
                                        <p className="text-white text-sm font-medium truncate">{item.description}</p>
                                        <p className="text-xs text-gray-400 mt-0.5 capitalize">{item.category.toLowerCase()}</p>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Ask Stylist FAB */}
            {isSelectMode && selectedIds.size > 0 && onAskStylist && (
                <div className="fixed bottom-24 left-0 right-0 flex justify-center z-40 animate-slide-up px-6">
                    <div className="flex items-center gap-3 p-2 bg-[#1a1a1a]/90 backdrop-blur-xl border border-white/10 rounded-full shadow-2xl shadow-black/50 pl-6 pr-2">
                        <span className="text-white font-medium text-sm whitespace-nowrap">{selectedIds.size} Selected</span>

                        <button
                            onClick={exitSelectMode}
                            className="w-10 h-10 flex items-center justify-center bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors"
                        >
                            <X size={18} />
                        </button>

                        <button
                            onClick={handleAskStylist}
                            className="px-6 py-3 bg-white text-black rounded-full font-bold text-sm shadow-lg flex items-center gap-2 hover:bg-gray-100 transition-colors btn-press"
                        >
                            <Sparkles size={16} />
                            Ask AI
                        </button>
                    </div>
                </div>
            )}

            {/* Item Detail Modal */}
            {selectedItem && (
                <div
                    className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end justify-center animate-fade-in"
                    onClick={() => setSelectedItem(null)}
                >
                    <div
                        className="bg-[#121212] w-full max-w-xl rounded-t-[40px] border-t border-white/10 shadow-[0_-10px_40px_rgba(0,0,0,1)] animate-slide-up overflow-hidden"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="p-6">
                            {/* Drag Handle */}
                            <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-8" />

                            <div className="flex gap-6 mb-8">
                                <div className="w-1/3 aspect-[3/4] rounded-2xl overflow-hidden bg-[#222] shadow-inner border border-white/5">
                                    <img
                                        src={selectedItem.imageData}
                                        alt={selectedItem.description}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <div className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-white/10 text-white mb-3">
                                                {selectedItem.category.toUpperCase()}
                                            </div>
                                            <h3 className="text-xl font-bold text-white mb-2 leading-tight">{selectedItem.description}</h3>
                                        </div>
                                    </div>

                                    <div className="flex gap-2 mt-4">
                                        {selectedItem.colors.map((color, i) => (
                                            <span key={i} className="px-3 py-1 bg-white/5 border border-white/5 rounded-full text-xs text-gray-300 capitalize">
                                                {color}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => {
                                    onDeleteItem(selectedItem.id);
                                    setSelectedItem(null);
                                }}
                                className="w-full py-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl font-semibold flex items-center justify-center gap-2 btn-press hover:bg-red-500/20 transition-all"
                            >
                                <X size={20} />
                                Remove Item
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WardrobeView;

import React, { useState, useEffect } from 'react';
import { WardrobeItem } from '../types';
import {
    getSavedOutfits,
    saveOutfit,
    deleteOutfit,
    toggleFavorite,
    SavedOutfit
} from '../services/savedOutfitsService';
import {
    Plus,
    Trash2,
    Star,
    X,
    Shirt,
    ArrowLeft,
    CheckCircle
} from '../components/Icons';

interface SavedOutfitsViewProps {
    wardrobe: WardrobeItem[];
    onBack: () => void;
}

const SavedOutfitsView: React.FC<SavedOutfitsViewProps> = ({ wardrobe, onBack }) => {
    const [outfits, setOutfits] = useState<SavedOutfit[]>([]);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
    const [outfitName, setOutfitName] = useState('');
    const [outfitOccasion, setOutfitOccasion] = useState('');
    const [selectedOutfit, setSelectedOutfit] = useState<SavedOutfit | null>(null);

    useEffect(() => {
        setOutfits(getSavedOutfits());
    }, []);

    const handleCreateOutfit = () => {
        if (selectedItems.size === 0) return;

        const newOutfit = saveOutfit(
            Array.from(selectedItems),
            outfitName,
            outfitOccasion || undefined
        );

        setOutfits([newOutfit, ...outfits]);
        setShowCreateModal(false);
        setSelectedItems(new Set());
        setOutfitName('');
        setOutfitOccasion('');
    };

    const handleDelete = (id: string) => {
        deleteOutfit(id);
        setOutfits(outfits.filter(o => o.id !== id));
        if (selectedOutfit?.id === id) setSelectedOutfit(null);
    };

    const handleToggleFavorite = (id: string) => {
        const updated = toggleFavorite(id);
        if (updated) {
            setOutfits(outfits.map(o => o.id === id ? updated : o));
        }
    };

    const toggleItemSelection = (itemId: string) => {
        const newSet = new Set(selectedItems);
        if (newSet.has(itemId)) {
            newSet.delete(itemId);
        } else {
            newSet.add(itemId);
        }
        setSelectedItems(newSet);
    };

    const getOutfitItems = (itemIds: string[]): WardrobeItem[] => {
        return wardrobe.filter(item => itemIds.includes(item.id));
    };

    // Outfit Detail View
    if (selectedOutfit) {
        const items = getOutfitItems(selectedOutfit.itemIds);
        return (
            <div className="min-h-screen bg-black text-white pb-24">
                {/* Header */}
                <div className="sticky top-0 z-20 bg-black/80 backdrop-blur-xl border-b border-white/5 px-4 py-4">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setSelectedOutfit(null)}
                            className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <div className="flex-1">
                            <h1 className="text-xl font-bold">{selectedOutfit.name}</h1>
                            {selectedOutfit.occasion && (
                                <p className="text-sm text-gray-400">{selectedOutfit.occasion}</p>
                            )}
                        </div>
                        <button
                            onClick={() => handleToggleFavorite(selectedOutfit.id)}
                            className={`p-2 rounded-full transition-colors ${selectedOutfit.isFavorite
                                    ? 'bg-yellow-500/20 text-yellow-400'
                                    : 'bg-white/5 text-gray-400 hover:bg-white/10'
                                }`}
                        >
                            <Star size={20} />
                        </button>
                    </div>
                </div>

                {/* Items Grid */}
                <div className="p-4">
                    <div className="grid grid-cols-2 gap-4">
                        {items.map(item => (
                            <div
                                key={item.id}
                                className="glass-card rounded-2xl overflow-hidden border border-white/10"
                            >
                                <div className="aspect-square bg-white/5">
                                    {item.imageData ? (
                                        <img
                                            src={item.imageData}
                                            alt={item.description}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <Shirt size={40} className="text-gray-600" />
                                        </div>
                                    )}
                                </div>
                                <div className="p-3">
                                    <p className="text-sm font-medium truncate">{item.description}</p>
                                    <p className="text-xs text-gray-500">{item.category}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Delete Button */}
                <div className="fixed bottom-20 left-0 right-0 px-4">
                    <button
                        onClick={() => handleDelete(selectedOutfit.id)}
                        className="w-full py-4 bg-red-500/10 text-red-400 rounded-2xl font-semibold border border-red-500/20 hover:bg-red-500/20 transition-colors"
                    >
                        Delete Outfit
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white pb-24">
            {/* Header */}
            <div className="sticky top-0 z-20 bg-black/80 backdrop-blur-xl border-b border-white/5 px-4 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={onBack}
                            className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                                Saved Outfits
                            </h1>
                            <p className="text-xs text-gray-400">{outfits.length} outfits</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="p-3 bg-white text-black rounded-full shadow-lg shadow-white/20 hover:bg-gray-100 transition-colors"
                    >
                        <Plus size={20} />
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="p-4">
                {outfits.length === 0 ? (
                    /* Empty State */
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-4 border border-white/10">
                            <Shirt size={32} className="text-gray-600" />
                        </div>
                        <h2 className="text-xl font-bold text-white mb-2">No Saved Outfits</h2>
                        <p className="text-gray-400 text-sm mb-6 max-w-xs">
                            Create outfit combinations from your wardrobe to quickly access them later
                        </p>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="flex items-center gap-2 px-6 py-3 bg-white text-black rounded-full font-semibold shadow-lg shadow-white/20"
                        >
                            <Plus size={18} />
                            Create First Outfit
                        </button>
                    </div>
                ) : (
                    /* Outfits Grid */
                    <div className="space-y-4">
                        {outfits.map(outfit => {
                            const items = getOutfitItems(outfit.itemIds);
                            return (
                                <button
                                    key={outfit.id}
                                    onClick={() => setSelectedOutfit(outfit)}
                                    className="w-full glass-card rounded-2xl p-4 border border-white/10 hover:border-white/20 transition-all text-left"
                                >
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-semibold">{outfit.name}</h3>
                                            {outfit.isFavorite && (
                                                <Star size={14} className="text-yellow-400 fill-yellow-400" />
                                            )}
                                        </div>
                                        <span className="text-xs text-gray-500">
                                            {items.length} items
                                        </span>
                                    </div>

                                    {/* Preview */}
                                    <div className="flex gap-2 overflow-x-auto no-scrollbar">
                                        {items.slice(0, 4).map(item => (
                                            <div
                                                key={item.id}
                                                className="w-16 h-16 flex-shrink-0 rounded-xl bg-white/5 overflow-hidden border border-white/5"
                                            >
                                                {item.imageData ? (
                                                    <img
                                                        src={item.imageData}
                                                        alt=""
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <Shirt size={20} className="text-gray-600" />
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                        {items.length > 4 && (
                                            <div className="w-16 h-16 flex-shrink-0 rounded-xl bg-white/5 flex items-center justify-center border border-white/5">
                                                <span className="text-xs text-gray-400">+{items.length - 4}</span>
                                            </div>
                                        )}
                                    </div>

                                    {outfit.occasion && (
                                        <p className="text-xs text-gray-500 mt-2">{outfit.occasion}</p>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Create Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end justify-center">
                    <div className="w-full max-w-lg bg-[#0a0a0a] rounded-t-3xl border-t border-white/10 max-h-[90vh] overflow-hidden flex flex-col">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-4 border-b border-white/5">
                            <h2 className="text-lg font-bold">Create Outfit</h2>
                            <button
                                onClick={() => {
                                    setShowCreateModal(false);
                                    setSelectedItems(new Set());
                                    setOutfitName('');
                                    setOutfitOccasion('');
                                }}
                                className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Form */}
                        <div className="p-4 space-y-4">
                            <input
                                type="text"
                                placeholder="Outfit Name"
                                value={outfitName}
                                onChange={e => setOutfitName(e.target.value)}
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-white/30"
                            />
                            <input
                                type="text"
                                placeholder="Occasion (optional)"
                                value={outfitOccasion}
                                onChange={e => setOutfitOccasion(e.target.value)}
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-white/30"
                            />
                        </div>

                        {/* Item Selection */}
                        <div className="flex-1 overflow-y-auto p-4 pt-0">
                            <p className="text-sm text-gray-400 mb-3">
                                Select items ({selectedItems.size} selected)
                            </p>
                            <div className="grid grid-cols-3 gap-3">
                                {wardrobe.map(item => {
                                    const isSelected = selectedItems.has(item.id);
                                    return (
                                        <button
                                            key={item.id}
                                            onClick={() => toggleItemSelection(item.id)}
                                            className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all ${isSelected
                                                    ? 'border-white shadow-lg shadow-white/20'
                                                    : 'border-white/10 hover:border-white/30'
                                                }`}
                                        >
                                            {item.imageData ? (
                                                <img
                                                    src={item.imageData}
                                                    alt=""
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-white/5 flex items-center justify-center">
                                                    <Shirt size={24} className="text-gray-600" />
                                                </div>
                                            )}
                                            {isSelected && (
                                                <div className="absolute inset-0 bg-white/20 flex items-center justify-center">
                                                    <CheckCircle size={24} className="text-white" />
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Save Button */}
                        <div className="p-4 border-t border-white/5">
                            <button
                                onClick={handleCreateOutfit}
                                disabled={selectedItems.size === 0}
                                className={`w-full py-4 rounded-xl font-semibold transition-all ${selectedItems.size > 0
                                        ? 'bg-white text-black hover:bg-gray-100'
                                        : 'bg-white/10 text-gray-500 cursor-not-allowed'
                                    }`}
                            >
                                Save Outfit ({selectedItems.size} items)
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SavedOutfitsView;

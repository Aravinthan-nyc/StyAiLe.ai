import React, { useState, useEffect } from 'react';
import { WardrobeItem, OutfitSuggestion } from '../types';

interface OutfitsViewProps {
    wardrobe: WardrobeItem[];
    onBack: () => void;
}

const OUTFITS_KEY = 'styaile_saved_outfits';

const OutfitsView: React.FC<OutfitsViewProps> = ({ wardrobe, onBack }) => {
    const [outfits, setOutfits] = useState<OutfitSuggestion[]>([]);
    const [selectedOutfit, setSelectedOutfit] = useState<OutfitSuggestion | null>(null);
    const [filterOccasion, setFilterOccasion] = useState<string>('all');

    useEffect(() => {
        try {
            const stored = localStorage.getItem(OUTFITS_KEY);
            if (stored) setOutfits(JSON.parse(stored));
        } catch (e) {
            console.error('Failed to load outfits:', e);
        }
    }, []);

    const saveOutfits = (newOutfits: OutfitSuggestion[]) => {
        setOutfits(newOutfits);
        localStorage.setItem(OUTFITS_KEY, JSON.stringify(newOutfits));
    };

    const handleDelete = (id: string) => {
        if (!window.confirm('Delete this outfit?')) return;
        saveOutfits(outfits.filter(o => o.id !== id));
        if (selectedOutfit?.id === id) setSelectedOutfit(null);
    };

    const handleToggleFavorite = (id: string) => {
        saveOutfits(outfits.map(o =>
            o.id === id ? { ...o, isFavorite: !o.isFavorite } : o
        ));
    };

    const handleWear = (id: string) => {
        saveOutfits(outfits.map(o =>
            o.id === id ? { ...o, timesWorn: (o.timesWorn || 0) + 1 } : o
        ));
    };

    const getItemById = (id: string) => wardrobe.find(w => w.id === id);

    const occasions = ['all', ...new Set(outfits.filter(o => o.occasion).map(o => o.occasion!))];
    const filteredOutfits = filterOccasion === 'all'
        ? outfits
        : outfits.filter(o => o.occasion === filterOccasion);

    // Outfit detail view
    if (selectedOutfit) {
        const items = selectedOutfit.itemIds.map(id => getItemById(id)).filter(Boolean) as WardrobeItem[];

        return (
            <div className="min-h-screen bg-black text-white pb-24">
                <div className="sticky top-0 z-10 bg-black/80 backdrop-blur-xl border-b border-white/10">
                    <div className="flex items-center justify-between p-4">
                        <button onClick={() => setSelectedOutfit(null)} className="p-2 hover:bg-white/10 rounded-full">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <h1 className="text-xl font-bold">Outfit Details</h1>
                        <button
                            onClick={() => handleToggleFavorite(selectedOutfit.id!)}
                            className="p-2 hover:bg-white/10 rounded-full"
                        >
                            {selectedOutfit.isFavorite ? (
                                <svg className="w-6 h-6 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                                </svg>
                            ) : (
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                </svg>
                            )}
                        </button>
                    </div>
                </div>

                <div className="p-4">
                    {/* Outfit Name & Occasion */}
                    <div className="mb-6">
                        <h2 className="text-2xl font-bold mb-2">{selectedOutfit.name}</h2>
                        {selectedOutfit.occasion && (
                            <span className="inline-block px-3 py-1 bg-white/10 rounded-full text-sm capitalize">
                                {selectedOutfit.occasion}
                            </span>
                        )}
                    </div>

                    {/* Items Grid */}
                    <div className="grid grid-cols-2 gap-3 mb-6">
                        {items.map(item => (
                            <div key={item.id} className="glass-card rounded-xl overflow-hidden">
                                <img src={item.imageData} alt={item.description} className="w-full aspect-square object-cover" />
                                <div className="p-3">
                                    <p className="font-medium truncate">{item.description}</p>
                                    <p className="text-sm text-gray-400">{item.category}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Reasoning */}
                    <div className="glass-card rounded-xl p-4 mb-6">
                        <h3 className="font-semibold mb-2">Why this works</h3>
                        <p className="text-gray-300 text-sm">{selectedOutfit.reasoning}</p>
                    </div>

                    {/* Stats */}
                    <div className="glass-card rounded-xl p-4 mb-6">
                        <div className="flex justify-between">
                            <span className="text-gray-400">Times Worn</span>
                            <span className="font-semibold">{selectedOutfit.timesWorn || 0}</span>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={() => { handleWear(selectedOutfit.id!); setSelectedOutfit({ ...selectedOutfit, timesWorn: (selectedOutfit.timesWorn || 0) + 1 }); }}
                            className="py-3 rounded-xl btn-primary flex items-center justify-center gap-2"
                        >
                            <span>👔</span> Wear Today
                        </button>
                        <button
                            onClick={() => handleDelete(selectedOutfit.id!)}
                            className="py-3 rounded-xl btn-secondary flex items-center justify-center gap-2 text-red-400"
                        >
                            <span>🗑️</span> Delete
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Outfits list view
    return (
        <div className="min-h-screen bg-black text-white pb-24">
            <div className="sticky top-0 z-10 bg-black/80 backdrop-blur-xl border-b border-white/10">
                <div className="flex items-center justify-between p-4">
                    <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-full">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <h1 className="text-xl font-bold">Saved Outfits</h1>
                    <div className="w-10" />
                </div>

                {/* Occasion Filter */}
                {occasions.length > 1 && (
                    <div className="px-4 pb-4 overflow-x-auto no-scrollbar">
                        <div className="flex gap-2">
                            {occasions.map(occ => (
                                <button
                                    key={occ}
                                    onClick={() => setFilterOccasion(occ)}
                                    className={`px-4 py-2 rounded-full whitespace-nowrap transition-all ${filterOccasion === occ
                                            ? 'bg-white text-black'
                                            : 'bg-white/10 text-white'
                                        }`}
                                >
                                    {occ === 'all' ? 'All' : occ}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <div className="p-4">
                {outfits.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="text-6xl mb-4">👕</div>
                        <h2 className="text-2xl font-bold mb-2">No Saved Outfits</h2>
                        <p className="text-gray-400 mb-6">
                            Generate outfits in the Stylist and save your favorites here
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredOutfits.map(outfit => {
                            const items = outfit.itemIds.slice(0, 3).map(id => getItemById(id)).filter(Boolean) as WardrobeItem[];
                            return (
                                <button
                                    key={outfit.id}
                                    onClick={() => setSelectedOutfit(outfit)}
                                    className="w-full glass-card rounded-2xl p-4 text-left hover:bg-white/5"
                                >
                                    <div className="flex items-start gap-3">
                                        {/* Preview Images */}
                                        <div className="flex -space-x-3">
                                            {items.map((item, i) => (
                                                <img
                                                    key={item.id}
                                                    src={item.imageData}
                                                    alt={item.description}
                                                    className="w-14 h-14 rounded-lg object-cover border-2 border-black"
                                                    style={{ zIndex: 3 - i }}
                                                />
                                            ))}
                                            {outfit.itemIds.length > 3 && (
                                                <div className="w-14 h-14 rounded-lg bg-white/10 flex items-center justify-center text-sm border-2 border-black">
                                                    +{outfit.itemIds.length - 3}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-semibold truncate">{outfit.name}</h3>
                                                {outfit.isFavorite && <span className="text-red-500">❤️</span>}
                                            </div>
                                            {outfit.occasion && (
                                                <span className="inline-block px-2 py-0.5 bg-white/10 rounded text-xs capitalize mt-1">
                                                    {outfit.occasion}
                                                </span>
                                            )}
                                            <p className="text-sm text-gray-400 mt-1">
                                                {outfit.itemIds.length} items • Worn {outfit.timesWorn || 0} times
                                            </p>
                                        </div>
                                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default OutfitsView;

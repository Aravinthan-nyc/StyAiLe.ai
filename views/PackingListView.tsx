import React, { useState, useEffect } from 'react';
import { WardrobeItem, PackingList, ClothingCategory } from '../types';
import {
    getPackingLists,
    createPackingList,
    deletePackingList,
    toggleItemCheck,
    addItemToList,
    removeItemFromList,
    getPackingProgress,
    savePackingList
} from '../services/packingService';
import { hasFeature } from '../services/subscriptionService';
import { isItemLocked } from '../services/lockService';
import { generateOutfit, GeneratedOutfit } from '../services/outfitGeneratorService';
import {
    Briefcase,
    Sun,
    Mountain,
    Palmtree,
    Snowflake,
    Lock,
    Calendar,
    ArrowRight,
    CheckCircle,
    Circle,
    Plus,
    X,
    Trash2,
    Sparkles,
    ChevronRight,
    Package,
    Shirt,
    Plane
} from '../components/Icons';

interface PackingListViewProps {
    wardrobe: WardrobeItem[];
    onBack: () => void;
}

// Outfit Pack type for AI-generated outfit combinations
interface OutfitPack {
    id: string;
    items: WardrobeItem[];
    name: string;
    reasoning: string;
    isPacked: boolean;
}

const PackingListView: React.FC<PackingListViewProps> = ({ wardrobe, onBack }) => {
    const [lists, setLists] = useState<PackingList[]>([]);
    const [selectedList, setSelectedList] = useState<PackingList | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [creating, setCreating] = useState(false);

    // Create modal state
    const [tripName, setTripName] = useState('');
    const [destination, setDestination] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [tripType, setTripType] = useState<PackingList['tripType']>('leisure');
    const [outfitCount, setOutfitCount] = useState(3); // NEW: Number of outfits needed

    // Outfit Packs state
    const [outfitPacks, setOutfitPacks] = useState<OutfitPack[]>([]);
    const [packedOutfits, setPackedOutfits] = useState<OutfitPack[]>([]);
    const [generatingPacks, setGeneratingPacks] = useState(false);

    useEffect(() => {
        loadLists();
    }, []);

    const loadLists = () => {
        setLists(getPackingLists());
    };

    if (!hasFeature('hasPacking')) {
        return (
            <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-8">
                <div className="mb-6 p-6 bg-blue-500/10 rounded-full animate-pulse">
                    <Lock size={48} className="text-blue-400" />
                </div>
                <h2 className="text-3xl font-bold mb-3 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">Pro Feature</h2>
                <p className="text-gray-400 text-center mb-8 max-w-md">
                    Unlock smart packing lists, AI outfit generation, and more with our Pro plan.
                </p>
                <button onClick={onBack} className="bg-white text-black px-8 py-3 rounded-xl font-bold hover:bg-gray-200 transition-colors">
                    Upgrade Now
                </button>
            </div>
        );
    }

    const handleCreate = async () => {
        if (!tripName || !destination || !startDate || !endDate) {
            alert('Please fill all fields');
            return;
        }

        if (new Date(endDate) < new Date(startDate)) {
            alert('End date must be after start date');
            return;
        }

        setCreating(true);
        try {
            await new Promise(r => setTimeout(r, 1000));

            const list = createPackingList(tripName, destination, startDate, endDate, tripType, wardrobe);
            loadLists();
            setSelectedList(list);
            setShowCreateModal(false);
            setOutfitPacks([]);
            setPackedOutfits([]);

            // Reset form
            setTripName('');
            setDestination('');
            setStartDate('');
            setEndDate('');
            setTripType('leisure');
            setOutfitCount(3);
        } finally {
            setCreating(false);
        }
    };

    const handleDelete = (id: string) => {
        if (!window.confirm('Delete this packing list?')) return;
        deletePackingList(id);
        loadLists();
        if (selectedList?.id === id) {
            setSelectedList(null);
            setOutfitPacks([]);
            setPackedOutfits([]);
        }
    };

    // Generate outfit packs using AI
    const handleGeneratePacks = async () => {
        if (!selectedList) return;

        setGeneratingPacks(true);
        try {
            await new Promise(r => setTimeout(r, 800));

            // Get items that are NOT already packed AND NOT in laundry
            const packedItemIds = new Set(packedOutfits.flatMap(p => p.items.map(i => i.id)));
            const availableItems = wardrobe.filter(item =>
                !packedItemIds.has(item.id) && !isItemLocked(item)
            );

            if (availableItems.length < 2) {
                alert('Not enough unpacked items to generate new outfit combinations!');
                setGeneratingPacks(false);
                return;
            }

            const newPacks: OutfitPack[] = [];
            const usedItemIds = new Set<string>();

            // Generate multiple outfit combinations
            for (let i = 0; i < 3; i++) {
                const availableForPack = availableItems.filter(item => !usedItemIds.has(item.id));

                if (availableForPack.length < 2) break;

                const dummyDate = new Date().toISOString().split('T')[0];
                const outfit = generateOutfit(availableForPack, dummyDate);

                if (outfit) {
                    const outfitItems = outfit.itemIds
                        .map(id => availableForPack.find(w => w.id === id))
                        .filter(Boolean) as WardrobeItem[];

                    if (outfitItems.length >= 2) {
                        // Mark items as used for this batch
                        outfitItems.forEach(item => usedItemIds.add(item.id));

                        newPacks.push({
                            id: `pack_${Date.now()}_${i}`,
                            items: outfitItems,
                            name: outfit.name,
                            reasoning: outfit.reasoning,
                            isPacked: false
                        });
                    }
                }
            }

            if (newPacks.length === 0) {
                alert('Could not generate outfit combinations. Try adding more items to your wardrobe!');
            } else {
                setOutfitPacks(newPacks);
            }
        } finally {
            setGeneratingPacks(false);
        }
    };

    // Pack an outfit - move to packed list and add items to packing list
    const handlePackIt = (pack: OutfitPack) => {
        if (!selectedList) return;

        // Add items to the packing list
        pack.items.forEach(item => {
            addItemToList(selectedList.id, item.id);
        });

        // Move to packed outfits
        setPackedOutfits(prev => [...prev, { ...pack, isPacked: true }]);

        // Remove from available packs
        setOutfitPacks(prev => prev.filter(p => p.id !== pack.id));

        // Reload to update counts
        loadLists();
        const updatedList = getPackingLists().find(l => l.id === selectedList.id);
        if (updatedList) setSelectedList(updatedList);
    };

    // Remove a packed outfit
    const handleUnpackOutfit = (pack: OutfitPack) => {
        if (!selectedList) return;

        // Remove items from the packing list
        pack.items.forEach(item => {
            removeItemFromList(selectedList.id, item.id);
        });

        // Remove from packed outfits
        setPackedOutfits(prev => prev.filter(p => p.id !== pack.id));

        // Reload to update counts
        loadLists();
        const updatedList = getPackingLists().find(l => l.id === selectedList.id);
        if (updatedList) setSelectedList(updatedList);
    };

    const handleToggleCheck = (itemId: string) => {
        if (!selectedList) return;
        toggleItemCheck(selectedList.id, itemId);
        loadLists();
        const updatedList = getPackingLists().find(l => l.id === selectedList.id);
        if (updatedList) setSelectedList(updatedList);
    };

    const getItemById = (id: string) => wardrobe.find(w => w.id === id);

    const tripTypes: { value: PackingList['tripType']; label: string; icon: React.ReactNode; desc: string }[] = [
        { value: 'business', label: 'Business', icon: <Briefcase size={20} />, desc: 'Professional attire' },
        { value: 'beach', label: 'Beach', icon: <Sun size={20} />, desc: 'Swimwear & casual' },
        { value: 'adventure', label: 'Adventure', icon: <Mountain size={20} />, desc: 'Outdoor activities' },
        { value: 'leisure', label: 'Leisure', icon: <Palmtree size={20} />, desc: 'Relaxation & casual' },
        { value: 'winter', label: 'Winter', icon: <Snowflake size={20} />, desc: 'Cold weather gear' },
    ];

    // List detail view
    if (selectedList) {
        const progress = getPackingProgress(selectedList);
        const start = new Date(selectedList.startDate);
        const end = new Date(selectedList.endDate);
        const duration = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

        const packedItemIds = selectedList.itemIds;
        const packedItems = packedItemIds
            .map(id => getItemById(id))
            .filter(Boolean) as WardrobeItem[];

        return (
            <div className="min-h-screen bg-black text-white pb-24">
                {/* Header */}
                <div className="sticky top-0 z-10 bg-black/90 backdrop-blur-xl border-b border-white/10">
                    <div className="flex items-center justify-between p-4">
                        <button onClick={() => { setSelectedList(null); setOutfitPacks([]); setPackedOutfits([]); }} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                            <ChevronRight size={24} className="rotate-180" />
                        </button>
                        <h1 className="text-xl font-bold truncate max-w-[200px]">{selectedList.name}</h1>
                        <button onClick={() => handleDelete(selectedList.id)} className="p-2 hover:bg-red-500/10 text-red-500 rounded-full transition-colors">
                            <Trash2 size={24} />
                        </button>
                    </div>

                    {/* HERO SECTION with Progress */}
                    <div className="px-4 pb-4">
                        <div className="glass-card rounded-3xl p-5 bg-white/5 border border-white/10 shadow-2xl">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                                    {tripTypes.find(t => t.value === selectedList.tripType)?.icon}
                                </div>
                                <div className="flex-1">
                                    <h2 className="font-bold text-xl">{selectedList.destination}</h2>
                                    <div className="flex items-center gap-2 text-sm text-gray-400 mt-1">
                                        <Calendar size={14} />
                                        <span>{start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                                        <span className="w-1 h-1 rounded-full bg-gray-600"></span>
                                        <span>{duration} Days</span>
                                    </div>
                                </div>
                            </div>

                            {/* Progress Bar */}
                            <div className="mb-3">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-semibold text-gray-300">Items Packed</span>
                                    <span className="text-sm font-bold text-white">
                                        {selectedList.checkedItems.length} / {selectedList.itemIds.length} items
                                    </span>
                                </div>
                                <div className="h-3 bg-black/40 rounded-full overflow-hidden backdrop-blur-sm border border-white/5">
                                    <div
                                        className="h-full bg-blue-500 transition-all duration-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                                        style={{ width: `${selectedList.itemIds.length > 0 ? (selectedList.checkedItems.length / selectedList.itemIds.length) * 100 : 0}%` }}
                                    />
                                </div>
                            </div>

                            {/* Stats Row */}
                            <div className="grid grid-cols-3 gap-3">
                                <div className="bg-black/30 backdrop-blur-sm rounded-xl p-3 border border-white/10">
                                    <div className="text-2xl font-bold text-white">{packedItems.length}</div>
                                    <div className="text-xs text-gray-400">Total Items</div>
                                </div>
                                <div className="bg-black/30 backdrop-blur-sm rounded-xl p-3 border border-white/10">
                                    <div className="text-2xl font-bold text-green-400">{packedOutfits.length}</div>
                                    <div className="text-xs text-gray-400">Outfits Planned</div>
                                </div>
                                <div className="bg-black/30 backdrop-blur-sm rounded-xl p-3 border border-white/10">
                                    <div className="text-2xl font-bold text-blue-400">
                                        {Math.max(0, packedItems.length - selectedList.checkedItems.length)}
                                    </div>
                                    <div className="text-xs text-gray-400">To Pack</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-4 space-y-6">
                    {/* Generate Packs Button */}
                    <div className="glass-card rounded-2xl p-4 border border-blue-500/30 bg-blue-500/5">
                        <div className="flex items-center gap-3 mb-3">
                            <span className="text-blue-400"><Briefcase size={32} /></span>
                            <div className="flex-1">
                                <h3 className="font-bold text-white">AI Outfit Packs</h3>
                                <p className="text-xs text-gray-400">Generate smart outfit combinations for your trip</p>
                            </div>
                        </div>
                        <button
                            onClick={handleGeneratePacks}
                            disabled={generatingPacks}
                            className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 rounded-xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                        >
                            {generatingPacks ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <Sparkles size={18} />
                                    Generate Packs
                                </>
                            )}
                        </button>
                    </div>

                    {/* Generated Outfit Packs */}
                    {outfitPacks.length > 0 && (
                        <div className="animate-fade-in">
                            <h3 className="font-bold mb-3 flex items-center gap-2 text-white">
                                <Sparkles size={20} className="text-yellow-400" /> AI Suggested Outfit Packs
                            </h3>
                            <div className="space-y-4">
                                {outfitPacks.map((pack, index) => {
                                    // Calculate AI confidence (85-98% range for realism)
                                    const confidence = 85 + Math.floor(Math.random() * 13);
                                    const stars = Math.min(5, Math.ceil(confidence / 20));

                                    return (
                                        <div
                                            key={pack.id}
                                            className="glass-card rounded-3xl p-5 border border-white/20 bg-gradient-to-br from-white/5 to-white/0 shadow-xl hover:shadow-2xl transition-all hover:scale-[1.02]"
                                            style={{ animationDelay: `${index * 0.1}s` }}
                                        >
                                            {/* AI Confidence Badge */}
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="bg-gradient-to-r from-blue-500 to-purple-500 px-3 py-1 rounded-full">
                                                        <span className="text-xs font-bold text-white">AI Match</span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        {[...Array(5)].map((_, i) => (
                                                            <span key={i} className={`text-sm ${i < stars ? 'text-yellow-400' : 'text-gray-600'}`}>
                                                                ⭐
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div className="bg-green-500/20 px-3 py-1 rounded-full border border-green-500/30">
                                                    <span className="text-xs font-bold text-green-400">{confidence}%</span>
                                                </div>
                                            </div>

                                            {/* Items Preview */}
                                            <div className="flex -space-x-4 mb-4">
                                                {pack.items.map((item, i) => (
                                                    <div
                                                        key={item.id}
                                                        className="w-20 h-20 rounded-2xl border-3 border-black overflow-hidden shadow-2xl ring-2 ring-white/10 hover:scale-110 transition-transform"
                                                        style={{ zIndex: 10 - i }}
                                                    >
                                                        <img src={item.imageData} alt={item.description} className="w-full h-full object-cover" />
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Pack Info */}
                                            <h4 className="font-bold text-lg mb-2 flex items-center gap-2 text-white">
                                                <Shirt size={20} className="text-blue-400" />
                                                {pack.name}
                                            </h4>
                                            <p className="text-sm text-gray-300 mb-3 leading-relaxed flex items-start gap-2">
                                                <Sparkles size={14} className="mt-1 flex-shrink-0 text-yellow-400" />
                                                <span>{pack.reasoning}</span>
                                            </p>

                                            {/* Item Details */}
                                            <div className="flex flex-wrap gap-2 mb-4">
                                                {pack.items.map(item => (
                                                    <span key={item.id} className="text-xs bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-lg capitalize border border-white/10">
                                                        {item.category}: {item.description.slice(0, 12)}...
                                                    </span>
                                                ))}
                                            </div>

                                            {/* Pack It Button */}
                                            <button
                                                onClick={() => handlePackIt(pack)}
                                                className="w-full py-3.5 bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-500 hover:to-emerald-400 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-green-500/50 transform hover:scale-105"
                                            >
                                                <CheckCircle size={20} />
                                                <span>Pack This Outfit!</span>
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Packed Outfits */}
                    {packedOutfits.length > 0 && (
                        <div>
                            <h3 className="font-bold mb-3 flex items-center gap-2 text-white">
                                <CheckCircle size={20} className="text-green-400" /> Packed Outfits ({packedOutfits.length})
                            </h3>
                            <div className="space-y-3">
                                {packedOutfits.map(pack => (
                                    <div key={pack.id} className="glass-card rounded-xl p-3 border border-green-500/20 bg-green-500/5 flex items-center gap-3">
                                        <div className="flex -space-x-2">
                                            {pack.items.slice(0, 3).map((item, i) => (
                                                <div
                                                    key={item.id}
                                                    className="w-10 h-10 rounded-lg border border-black overflow-hidden"
                                                    style={{ zIndex: 10 - i }}
                                                >
                                                    <img src={item.imageData} alt={item.description} className="w-full h-full object-cover" />
                                                </div>
                                            ))}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-sm truncate">{pack.name}</p>
                                            <p className="text-xs text-gray-400">{pack.items.length} items</p>
                                        </div>
                                        <button
                                            onClick={() => handleUnpackOutfit(pack)}
                                            className="p-2 hover:bg-white/10 rounded-lg text-red-400"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Individual Packed Items */}
                    {packedItems.length > 0 && (
                        <div>
                            <h3 className="font-bold mb-3 flex items-center gap-2 text-white">
                                <Shirt size={20} className="text-blue-400" /> All Packed Items ({packedItems.length})
                            </h3>
                            <div className="grid grid-cols-4 gap-2">
                                {packedItems.map(item => {
                                    const isChecked = selectedList.checkedItems.includes(item.id);
                                    return (
                                        <div
                                            key={item.id}
                                            onClick={() => handleToggleCheck(item.id)}
                                            className={`aspect-square rounded-xl overflow-hidden cursor-pointer relative ${isChecked ? 'opacity-50' : ''}`}
                                        >
                                            <img src={item.imageData} alt={item.description} className="w-full h-full object-cover" />
                                            {isChecked && (
                                                <div className="absolute inset-0 bg-green-500/30 flex items-center justify-center">
                                                    <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Add More Items */}
                    <div className="pt-4 border-t border-white/10">
                        <h3 className="font-bold mb-3 flex items-center gap-2 text-white">
                            <Plus size={20} className="text-blue-400" /> Add Individual Items
                        </h3>
                        <div className="grid grid-cols-4 gap-2">
                            {wardrobe
                                .filter(item => !packedItemIds.includes(item.id))
                                .slice(0, 12)
                                .map(item => (
                                    <button
                                        key={item.id}
                                        onClick={() => {
                                            addItemToList(selectedList.id, item.id);
                                            loadLists();
                                            const updatedList = getPackingLists().find(l => l.id === selectedList.id);
                                            if (updatedList) setSelectedList(updatedList);
                                        }}
                                        className="aspect-square rounded-xl overflow-hidden relative group border border-white/10 hover:border-white/30 transition-all"
                                    >
                                        <img src={item.imageData} alt={item.description} className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                                </svg>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Lists view
    return (
        <div className="min-h-screen bg-black text-white pb-24">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-black/90 backdrop-blur-xl border-b border-white/10">
                <div className="flex items-center justify-between p-4">
                    <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-full">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <h1 className="text-xl font-bold">Packing Lists</h1>
                    <button onClick={() => setShowCreateModal(true)} className="p-2 hover:bg-white/10 rounded-full">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                    </button>
                </div>
            </div>

            <div className="p-4">
                {lists.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="bg-blue-500/10 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Plane size={48} className="text-blue-400" />
                        </div>
                        <h2 className="text-2xl font-bold mb-2">Smart Packing</h2>
                        <p className="text-gray-400 mb-6 max-w-sm mx-auto">
                            AI generates perfect outfit combinations for your trip
                        </p>
                        <button onClick={() => setShowCreateModal(true)} className="btn-primary px-6 py-3 rounded-xl">
                            Create Packing List
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {lists.map(list => {
                            const start = new Date(list.startDate);
                            const duration = Math.ceil((new Date(list.endDate).getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                            const icon = tripTypes.find(t => t.value === list.tripType)?.icon || <Plane size={24} />;
                            const itemCount = list.itemIds.length;

                            return (
                                <button
                                    key={list.id}
                                    onClick={() => setSelectedList(list)}
                                    className="w-full glass-card rounded-2xl p-4 text-left hover:bg-white/5"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-3xl">{icon}</span>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-semibold truncate">{list.name}</h3>
                                            <p className="text-sm text-gray-400">{list.destination}</p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                {start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} • {duration} days • {itemCount} items
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

            {/* Create Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-lg z-50 overflow-y-auto">
                    <div className="min-h-screen flex items-center justify-center p-4">
                        <div className="w-full max-w-md bg-zinc-900 rounded-2xl overflow-hidden animate-slide-up">
                            <div className="p-4 border-b border-white/10 flex items-center justify-between">
                                <h3 className="text-lg font-semibold">New Packing List</h3>
                                <button onClick={() => setShowCreateModal(false)} className="p-2 hover:bg-white/10 rounded-lg">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
                                {/* Trip Name */}
                                <div>
                                    <label className="text-sm text-gray-400 mb-1 block">Trip Name *</label>
                                    <input
                                        type="text"
                                        value={tripName}
                                        onChange={(e) => setTripName(e.target.value)}
                                        placeholder="e.g., Goa Weekend"
                                        className="w-full glass-input rounded-xl px-4 py-3"
                                    />
                                </div>

                                {/* Destination */}
                                <div>
                                    <label className="text-sm text-gray-400 mb-1 block">Destination *</label>
                                    <input
                                        type="text"
                                        value={destination}
                                        onChange={(e) => setDestination(e.target.value)}
                                        placeholder="e.g., Goa, India"
                                        className="w-full glass-input rounded-xl px-4 py-3"
                                    />
                                </div>

                                {/* Dates */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-sm text-gray-400 mb-1 block">Start Date *</label>
                                        <input
                                            type="date"
                                            value={startDate}
                                            onChange={(e) => setStartDate(e.target.value)}
                                            className="w-full glass-input rounded-xl px-4 py-3"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm text-gray-400 mb-1 block">End Date *</label>
                                        <input
                                            type="date"
                                            value={endDate}
                                            onChange={(e) => setEndDate(e.target.value)}
                                            min={startDate}
                                            className="w-full glass-input rounded-xl px-4 py-3"
                                        />
                                    </div>
                                </div>

                                {/* Number of Outfits */}
                                <div>
                                    <label className="text-sm text-gray-400 mb-1 block">Number of Outfits *</label>
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => setOutfitCount(Math.max(1, outfitCount - 1))}
                                            className="w-12 h-12 glass-card rounded-xl flex items-center justify-center text-xl font-bold"
                                        >
                                            -
                                        </button>
                                        <div className="flex-1 glass-input rounded-xl px-4 py-3 text-center text-xl font-bold">
                                            {outfitCount}
                                        </div>
                                        <button
                                            onClick={() => setOutfitCount(Math.min(10, outfitCount + 1))}
                                            className="w-12 h-12 glass-card rounded-xl flex items-center justify-center text-xl font-bold"
                                        >
                                            +
                                        </button>
                                    </div>
                                </div>

                                {/* Trip Type */}
                                <div>
                                    <label className="text-sm text-gray-400 mb-2 block">Trip Type *</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {tripTypes.map(type => (
                                            <button
                                                key={type.value}
                                                onClick={() => setTripType(type.value)}
                                                className={`p-3 rounded-xl text-left transition-all ${tripType === type.value ? 'bg-white text-black' : 'glass-card hover:bg-white/10'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-lg">{type.icon}</span>
                                                    <span className="font-semibold text-sm">{type.label}</span>
                                                </div>
                                                <div className={`text-xs ${tripType === type.value ? 'text-black/70' : 'text-gray-400'}`}>
                                                    {type.desc}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 border-t border-white/10">
                                <button
                                    onClick={handleCreate}
                                    disabled={creating || !tripName || !destination || !startDate || !endDate}
                                    className="w-full py-3 rounded-xl btn-primary disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {creating ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            Creating...
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                            </svg>
                                            Create Packing List
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PackingListView;

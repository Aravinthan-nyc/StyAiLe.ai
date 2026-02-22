import React, { useState, useEffect } from 'react';
import { WardrobeItem, CapsuleWardrobe, ClothingCategory } from '../types';
import {
    getCapsuleWardrobes,
    saveCapsuleWardrobe,
    deleteCapsuleWardrobe,
    generateCapsuleWardrobe,
    getCapsuleProgress,
    getCapsuleStats
} from '../services/capsuleService';
import { hasFeature } from '../services/subscriptionService';
import {
    generateOutfit,
    GeneratedOutfit
} from '../services/outfitGeneratorService';

interface CapsuleWardrobeViewProps {
    wardrobe: WardrobeItem[];
    onBack: () => void;
    onNavigateToPlanner?: (items?: WardrobeItem[]) => void;
}

type Season = CapsuleWardrobe['season'];

const CapsuleWardrobeView: React.FC<CapsuleWardrobeViewProps> = ({ wardrobe, onBack, onNavigateToPlanner }) => {
    const [capsules, setCapsules] = useState<CapsuleWardrobe[]>([]);
    const [selectedCapsule, setSelectedCapsule] = useState<CapsuleWardrobe | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newName, setNewName] = useState('');
    const [newSeason, setNewSeason] = useState<Season>('all-season');
    const [editMode, setEditMode] = useState(false);
    const [builderMode, setBuilderMode] = useState(false); // New Builder Mode

    // Drag State
    const [draggedItem, setDraggedItem] = useState<WardrobeItem | null>(null);
    const [topSlot, setTopSlot] = useState<WardrobeItem | null>(null);
    const [bottomSlot, setBottomSlot] = useState<WardrobeItem | null>(null);

    // Recipe State
    const [recipes, setRecipes] = useState<GeneratedOutfit[]>([]);
    const [generatingRecipes, setGeneratingRecipes] = useState(false);
    const [showTransferModal, setShowTransferModal] = useState(false);
    const [selectedRecipe, setSelectedRecipe] = useState<GeneratedOutfit | null>(null);
    const [transferDate, setTransferDate] = useState<string>('');

    useEffect(() => {
        setCapsules(getCapsuleWardrobes());
    }, []);

    const seasons: { season: Season; label: string; icon: string }[] = [
        { season: 'spring', label: 'Spring', icon: '◇' },
        { season: 'summer', label: 'Summer', icon: '○' },
        { season: 'fall', label: 'Fall', icon: '△' },
        { season: 'winter', label: 'Winter', icon: '◆' },
        { season: 'all-season', label: 'All Season', icon: '●' }
    ];

    if (!hasFeature('hasCapsule')) {
        return (
            <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-8">
                <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mb-4 border border-white/20">
                    <span className="text-2xl">⬡</span>
                </div>
                <h2 className="text-2xl font-bold mb-2">Pro Feature</h2>
                <p className="text-gray-400 text-center mb-6">
                    Capsule wardrobe generator is available on Pro and Premium plans.
                </p>
                <button onClick={onBack} className="bg-white text-black font-bold px-6 py-3 rounded-xl">
                    Upgrade Now
                </button>
            </div>
        );
    }

    // Expanded Color Map
    const getColorStyle = (colorName: string) => {
        if (!colorName) return { backgroundColor: '#6b7280' };
        const lower = colorName.toLowerCase().trim();
        if (['multicolor', 'printed', 'pattern', 'multi'].includes(lower)) {
            return { background: 'linear-gradient(45deg, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff)' };
        }

        const colorMap: Record<string, string> = {
            'denim': '#1e40af', 'jeans': '#1e40af', 'indigo': '#4f46e5', 'navy': '#1e3a8a',
            'dark blue': '#1e3a8a', 'light blue': '#60a5fa', 'sky blue': '#7dd3fc', 'royal blue': '#2563eb',
            'grey': '#6b7280', 'gray': '#6b7280', 'beige': '#d4c5b9', 'cream': '#fffdd0',
            'burgundy': '#800020', 'maroon': '#800000', 'olive': '#808000', 'teal': '#008080',
            'lavender': '#e6e6fa', 'cyan': '#06b6d4', 'magenta': '#d946ef', 'lime': '#84cc16',
            'emerald': '#10b981', 'amber': '#f59e0b', 'rose': '#f43f5e', 'violet': '#8b5cf6',
            'fuchsia': '#d946ef', 'orange': '#f97316', 'purple': '#a855f7', 'pink': '#ec4899',
            'red': '#ef4444', 'green': '#22c55e', 'blue': '#3b82f6', 'yellow': '#eab308',
            'black': '#000000', 'white': '#ffffff', 'brown': '#78350f'
        };

        if (colorMap[lower]) return { backgroundColor: colorMap[lower] };

        const s = new Option().style;
        s.color = lower;
        return s.color && s.color !== 'initial' ? { backgroundColor: lower } : { backgroundColor: '#6b7280' };
    };

    const handleCreate = () => {
        if (!newName) return;
        const capsule = generateCapsuleWardrobe(newName, wardrobe, newSeason);
        setCapsules([capsule, ...capsules]);
        setSelectedCapsule(capsule);
        setShowCreateModal(false);
        setNewName('');
        setNewSeason('all-season');
        setEditMode(true);
    };

    const handleDelete = (id: string) => {
        if (!window.confirm('Delete this capsule wardrobe?')) return;
        deleteCapsuleWardrobe(id);
        setCapsules(capsules.filter(c => c.id !== id));
        if (selectedCapsule?.id === id) setSelectedCapsule(null);
    };

    const handleAddItem = (item: WardrobeItem) => {
        if (!selectedCapsule || selectedCapsule.itemIds.includes(item.id)) return;
        const updated = { ...selectedCapsule, itemIds: [...selectedCapsule.itemIds, item.id] };
        saveCapsuleWardrobe(updated);
        setSelectedCapsule(updated);
        setCapsules(capsules.map(c => c.id === updated.id ? updated : c));
    };

    const handleRemoveItem = (itemId: string) => {
        if (!selectedCapsule) return;
        const updated = { ...selectedCapsule, itemIds: selectedCapsule.itemIds.filter(id => id !== itemId) };
        saveCapsuleWardrobe(updated);
        setSelectedCapsule(updated);
        setCapsules(capsules.map(c => c.id === updated.id ? updated : c));
    };

    const handleGenerateRecipes = async () => {
        if (!selectedCapsule) return;
        setGeneratingRecipes(true);
        setRecipes([]);
        await new Promise(r => setTimeout(r, 1000));
        const capsuleItems = selectedCapsule.itemIds.map(id => getItemById(id)).filter(Boolean) as WardrobeItem[];
        const newRecipes: GeneratedOutfit[] = [];
        const uniqueKeys = new Set<string>();

        for (let i = 0; i < 5; i++) {
            const dummyDate = new Date().toISOString().split('T')[0];
            const outfit = generateOutfit(capsuleItems, dummyDate);
            if (outfit) {
                const key = outfit.itemIds.sort().join(',');
                if (!uniqueKeys.has(key)) {
                    uniqueKeys.add(key);
                    newRecipes.push({
                        ...outfit,
                        name: `Recipe #${newRecipes.length + 1}: ${outfit.name}`,
                        id: `recipe_${Date.now()}_${i}`
                    });
                }
            }
        }
        setRecipes(newRecipes);
        setGeneratingRecipes(false);
    };

    const handleTransferRecipe = () => {
        if (!selectedRecipe || !transferDate) return;
        const PLANNER_KEY = 'styaile_outfit_planner';
        try {
            const stored = localStorage.getItem(PLANNER_KEY);
            const plannedOutfits: GeneratedOutfit[] = stored ? JSON.parse(stored) : [];
            const newOutfit: GeneratedOutfit = { ...selectedRecipe, date: transferDate, id: `planned_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` };
            const updated = [...plannedOutfits.filter(o => o.date !== transferDate), newOutfit];
            localStorage.setItem(PLANNER_KEY, JSON.stringify(updated));
            setShowTransferModal(false);
            setSelectedRecipe(null);
            setTransferDate('');
            alert(`Outfit successfully scheduled for ${transferDate}!`);
        } catch (e) {
            console.error('Transfer failed:', e);
            alert('Failed to save to planner.');
        }
    };

    // --- Drag and Drop Logic ---
    const handleDragStart = (e: React.DragEvent, item: WardrobeItem) => {
        setDraggedItem(item);
        // Required for Firefox to allow drag
        e.dataTransfer.effectAllowed = 'copy';
        e.dataTransfer.setData('text/plain', JSON.stringify(item));
    };

    const handleDropSlot = (e: React.DragEvent, slot: 'top' | 'bottom') => {
        e.preventDefault();
        const itemData = e.dataTransfer.getData('text/plain');
        if (itemData) {
            try {
                const item = JSON.parse(itemData) as WardrobeItem;
                if (slot === 'top') setTopSlot(item);
                else setBottomSlot(item);
            } catch (err) {
                // Fallback if item set via state
                if (draggedItem) {
                    if (slot === 'top') setTopSlot(draggedItem);
                    else setBottomSlot(draggedItem);
                }
            }
        } else if (draggedItem) {
            if (slot === 'top') setTopSlot(draggedItem);
            else setBottomSlot(draggedItem);
        }
        setDraggedItem(null);
    };

    const handleSaveManualOutfit = () => {
        if (!topSlot || !bottomSlot) return;

        const manualOutfit: GeneratedOutfit = {
            id: `manual_${Date.now()}`,
            name: 'My Custom Capsule Look',
            itemIds: [topSlot.id, bottomSlot.id],
            reasoning: 'Curated by you from your capsule wardrobe.',
            date: new Date().toISOString().split('T')[0],
            occasion: 'casual', // Default
            score: 100 // Manual outfits are always 100% match!
        };
        setSelectedRecipe(manualOutfit);
        setShowTransferModal(true);
        setTransferDate(new Date().toISOString().split('T')[0]); // Default today
    };

    const getItemById = (id: string) => wardrobe.find(w => w.id === id);

    if (selectedCapsule) {
        const stats = getCapsuleStats(selectedCapsule, wardrobe);
        const capsuleItems = selectedCapsule.itemIds.map(id => getItemById(id)).filter(Boolean) as WardrobeItem[];

        // Group by category
        const byCategory: Record<ClothingCategory, WardrobeItem[]> = {} as any;
        capsuleItems.forEach(item => {
            if (!byCategory[item.category]) byCategory[item.category] = [];
            byCategory[item.category].push(item);
        });

        // Available items (not in capsule)
        const availableItems = wardrobe.filter(item =>
            !selectedCapsule.itemIds.includes(item.id) &&
            (newSeason === 'all-season' || item.season.includes(newSeason) || item.season.includes('all-season'))
        );

        return (
            <div className="min-h-screen bg-black text-white pb-24 font-sans">
                {/* Header */}
                <div className="sticky top-0 z-10 bg-black/90 backdrop-blur-xl border-b border-white/10 px-4 py-4 flex items-center justify-between">
                    <button onClick={() => { setSelectedCapsule(null); setEditMode(false); setBuilderMode(false); setRecipes([]); }} className="p-2 hover:bg-white/10 rounded-full">
                        <span className="text-xl">←</span>
                    </button>
                    <div className="text-center">
                        <h1 className="text-lg font-bold">{selectedCapsule.name}</h1>
                        <p className="text-xs text-gray-400">{stats.totalItems} Items • {stats.possibleOutfits} Mixes</p>
                    </div>
                    <button
                        onClick={() => setEditMode(!editMode)}
                        className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${editMode ? 'bg-white text-black' : 'bg-white/10 text-white'}`}
                    >
                        {editMode ? 'Done' : 'Edit'}
                    </button>
                </div>

                <div className="p-4 space-y-6">

                    {/* Mode Switcher */}
                    {!editMode && (
                        <div className="flex bg-white/5 p-1 rounded-xl mb-4">
                            <button
                                onClick={() => setBuilderMode(false)}
                                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${!builderMode ? 'bg-white/10 text-white' : 'text-gray-400'}`}
                            >
                                Overview
                            </button>
                            <button
                                onClick={() => setBuilderMode(true)}
                                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${builderMode ? 'bg-white/10 text-white' : 'text-gray-400'}`}
                            >
                                Outfit Builder
                            </button>
                        </div>
                    )}

                    {/* Builder Mode */}
                    {builderMode && !editMode ? (
                        <div className="animate-fade-in">
                            <div className="grid grid-cols-2 gap-4 h-[400px] mb-6">
                                {/* Top Slot */}
                                <div
                                    onDrop={(e) => handleDropSlot(e, 'top')}
                                    onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; }}
                                    className={`relative rounded-2xl border-2 border-dashed transition-all overflow-hidden flex items-center justify-center
                                        ${topSlot ? 'border-transparent' : 'border-white/20 bg-white/5 hover:bg-white/10'}`}
                                >
                                    {topSlot ? (
                                        <>
                                            <img src={topSlot.imageData} className="w-full h-full object-cover" />
                                            <button
                                                onClick={() => setTopSlot(null)}
                                                className="absolute top-2 right-2 w-8 h-8 bg-black/50 text-white rounded-full flex items-center justify-center backdrop-blur-md"
                                            >✕</button>
                                        </>
                                    ) : (
                                        <div className="text-center p-4">
                                            <span className="text-4xl block mb-2">👕</span>
                                            <span className="text-sm text-gray-400 font-medium">Drop Top Here</span>
                                        </div>
                                    )}
                                </div>

                                {/* Bottom Slot */}
                                <div
                                    onDrop={(e) => handleDropSlot(e, 'bottom')}
                                    onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; }}
                                    className={`relative rounded-2xl border-2 border-dashed transition-all overflow-hidden flex items-center justify-center
                                        ${bottomSlot ? 'border-transparent' : 'border-white/20 bg-white/5 hover:bg-white/10'}`}
                                >
                                    {bottomSlot ? (
                                        <>
                                            <img src={bottomSlot.imageData} className="w-full h-full object-cover" />
                                            <button
                                                onClick={() => setBottomSlot(null)}
                                                className="absolute top-2 right-2 w-8 h-8 bg-black/50 text-white rounded-full flex items-center justify-center backdrop-blur-md"
                                            >✕</button>
                                        </>
                                    ) : (
                                        <div className="text-center p-4">
                                            <span className="text-4xl block mb-2">👖</span>
                                            <span className="text-sm text-gray-400 font-medium">Drop Bottom Here</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Builder Controls */}
                            <div className="flex gap-3 mb-6">
                                <button
                                    disabled={!topSlot || !bottomSlot}
                                    onClick={handleSaveManualOutfit}
                                    className="flex-1 py-3 bg-white text-black font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 transition-colors"
                                >
                                    Save Look ✨
                                </button>
                                <button
                                    onClick={() => { setTopSlot(null); setBottomSlot(null); }}
                                    className="px-4 py-3 bg-white/10 text-white font-medium rounded-xl hover:bg-white/20"
                                >
                                    Clear
                                </button>
                            </div>

                            {/* Draggable Items List */}
                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Your Capsule Items</h3>
                            <div className="grid grid-cols-3 gap-2 pb-20">
                                {capsuleItems.map(item => (
                                    <div
                                        key={item.id}
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, item)}
                                        className="aspect-[3/4] rounded-xl overflow-hidden relative cursor-grab active:cursor-grabbing border border-white/10"
                                    >
                                        <img src={item.imageData} className="w-full h-full object-cover" loading="lazy" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        /* Overview Mode */
                        <div className="animate-fade-in">
                            {/* Action Buttons */}
                            <div className="grid grid-cols-2 gap-3 mb-6">
                                <button
                                    onClick={handleGenerateRecipes}
                                    disabled={generatingRecipes || capsuleItems.length < 2}
                                    className="py-4 bg-gradient-to-r from-pink-500/10 to-purple-500/10 border border-white/10 rounded-xl flex flex-col items-center justify-center gap-1 hover:bg-white/5 transition-all"
                                >
                                    {generatingRecipes ? <span className="animate-spin text-2xl">⌛</span> : <span className="text-2xl">🪄</span>}
                                    <span className="text-xs font-bold text-white uppercase tracking-wide">Generate Recipes</span>
                                </button>
                                <button
                                    onClick={() => setEditMode(true)}
                                    className="py-4 bg-white/5 border border-white/10 rounded-xl flex flex-col items-center justify-center gap-1 hover:bg-white/10 transition-all"
                                >
                                    <span className="text-2xl">➕</span>
                                    <span className="text-xs font-bold text-white uppercase tracking-wide">Add Items</span>
                                </button>
                            </div>

                            {/* Palette Analysis */}
                            {stats.topColors.length > 0 && (
                                <div className="mb-6">
                                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Color Palette</h3>
                                    <div className="flex gap-2">
                                        {stats.topColors.map(color => (
                                            <div
                                                key={color}
                                                className="w-8 h-8 rounded-full border border-white/20 shadow-lg"
                                                style={getColorStyle(color)}
                                                title={color}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Generated Recipes */}
                            {recipes.length > 0 && (
                                <div className="mb-8">
                                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">AI Suggestions</h3>
                                    <div className="flex overflow-x-auto gap-4 pb-4 no-scrollbar snap-x">
                                        {recipes.map((recipe) => (
                                            <div key={recipe.id} className="min-w-[260px] glass-card bg-zinc-900/80 rounded-2xl p-4 snap-center border border-white/10 flex-shrink-0">
                                                <div className="flex -space-x-3 mb-4 justify-center px-2">
                                                    {recipe.itemIds.slice(0, 3).map((itemId, i) => {
                                                        const item = getItemById(itemId);
                                                        if (!item) return null;
                                                        return (
                                                            <div key={itemId} className="w-16 h-16 rounded-xl border-2 border-zinc-900 overflow-hidden shadow-lg relative" style={{ zIndex: 10 - i }}>
                                                                <img src={item.imageData} className="w-full h-full object-cover" />
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                                <h4 className="font-bold text-center text-white text-sm mb-1">{recipe.name}</h4>
                                                <p className="text-xs text-gray-500 text-center mb-4 line-clamp-2">{recipe.reasoning}</p>
                                                <button
                                                    onClick={() => {
                                                        setSelectedRecipe(recipe);
                                                        setShowTransferModal(true);
                                                        const tomorrow = new Date();
                                                        tomorrow.setDate(tomorrow.getDate() + 1);
                                                        setTransferDate(tomorrow.toISOString().split('T')[0]);
                                                    }}
                                                    className="w-full py-2 bg-white text-black rounded-lg text-xs font-bold"
                                                >
                                                    Add to Planner
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Items Grid */}
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Collection</h3>
                            {Object.entries(byCategory).map(([category, categoryItems]) => (
                                <div key={category} className="mb-6">
                                    <h4 className="text-sm font-medium text-gray-300 mb-2 pl-1 heading-font">{category}</h4>
                                    <div className="grid grid-cols-3 gap-3">
                                        {categoryItems.map(item => (
                                            <div key={item.id} className="aspect-[3/4] rounded-xl overflow-hidden relative group border border-white/5 bg-white/5">
                                                <img src={item.imageData} alt={item.description} className="w-full h-full object-cover" loading="lazy" />
                                                {editMode && (
                                                    <button
                                                        onClick={() => handleRemoveItem(item.id)}
                                                        className="absolute top-1 right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        ✕
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Edit Mode Selection (Add Items) */}
                    {editMode && (
                        <div className="py-6 border-t border-white/10">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Available Wardrobe</h3>
                            <div className="grid grid-cols-3 gap-3">
                                {availableItems.slice(0, 20).map(item => (
                                    <button
                                        key={item.id}
                                        onClick={() => handleAddItem(item)}
                                        className="aspect-[3/4] rounded-xl overflow-hidden relative group border border-white/10 opacity-60 hover:opacity-100 transition-all"
                                    >
                                        <img src={item.imageData} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all" />
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100">
                                            <span className="text-2xl">➕</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Transfer Modal */}
                {showTransferModal && selectedRecipe && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-lg z-50 flex items-center justify-center p-4">
                        <div className="w-full max-w-sm bg-zinc-900 rounded-2xl overflow-hidden border border-white/10 shadow-2xl animate-fade-in">
                            <div className="p-4 border-b border-white/10 flex justify-between items-center">
                                <h3 className="font-bold text-white">Schedule Outfit</h3>
                                <button onClick={() => setShowTransferModal(false)} className="text-gray-400 hover:text-white">✕</button>
                            </div>
                            <div className="p-6">
                                <p className="text-sm text-gray-400 mb-4">When do you want to wear this look?</p>
                                <input
                                    type="date"
                                    value={transferDate}
                                    onChange={(e) => setTransferDate(e.target.value)}
                                    className="w-full bg-black border border-white/20 rounded-xl px-4 py-3 mb-6 text-white color-scheme-dark focus:border-white transition-colors"
                                    min={new Date().toISOString().split('T')[0]}
                                />
                                <button
                                    onClick={handleTransferRecipe}
                                    disabled={!transferDate}
                                    className="w-full py-3 bg-white text-black font-bold rounded-xl disabled:opacity-50"
                                >
                                    Confirm Schedule
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Create Capsule Modal */}
                {showCreateModal && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-lg z-50 flex items-center justify-center p-4">
                        <div className="w-full max-w-md bg-zinc-900 rounded-2xl overflow-hidden animate-slide-up border border-white/10">
                            <div className="p-5 border-b border-white/10">
                                <h3 className="text-lg font-bold text-white">New Capsule Wardrobe</h3>
                            </div>
                            <div className="p-5 space-y-5">
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Name</label>
                                    <input
                                        type="text"
                                        value={newName}
                                        onChange={(e) => setNewName(e.target.value)}
                                        placeholder="e.g., Summer Essentials"
                                        className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-white/50 transition-colors placeholder-gray-600"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Season</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {seasons.map(s => (
                                            <button
                                                key={s.season}
                                                onClick={() => setNewSeason(s.season)}
                                                className={`p-3 rounded-xl text-center transition-all border ${newSeason === s.season ? 'bg-white text-black border-white' : 'bg-black/50 border-white/10 text-gray-400 hover:bg-white/5'}`}
                                            >
                                                <div className="text-xl mb-1">{s.icon}</div>
                                                <div className="text-xs font-medium">{s.label}</div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="p-5 border-t border-white/10 flex gap-3">
                                <button onClick={() => setShowCreateModal(false)} className="flex-1 py-3 bg-white/5 hover:bg-white/10 rounded-xl font-semibold text-white transition-colors">Cancel</button>
                                <button onClick={handleCreate} disabled={!newName} className="flex-1 py-3 bg-white text-black rounded-xl font-bold disabled:opacity-50 hover:bg-gray-200 transition-colors">Create</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // Main List View
    return (
        <div className="min-h-screen bg-black text-white pb-24 font-sans">
            <div className="sticky top-0 z-10 bg-black/90 backdrop-blur-xl border-b border-white/10 p-4 flex items-center justify-between">
                <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-full">
                    <span className="text-xl">←</span>
                </button>
                <h1 className="text-xl font-bold">Capsule Wardrobes</h1>
                <button onClick={() => setShowCreateModal(true)} className="p-2 bg-white text-black rounded-full w-8 h-8 flex items-center justify-center font-bold pb-0.5">
                    +
                </button>
            </div>

            <div className="p-4">
                {/* Empty State */}
                {capsules.length === 0 && (
                    <div className="text-center py-20 animate-fade-in">
                        <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/10">
                            <span className="text-4xl">👗</span>
                        </div>
                        <h2 className="text-2xl font-bold mb-2 text-white">Create Your First Capsule</h2>
                        <p className="text-gray-400 mb-8 max-w-xs mx-auto">Build a minimal, versatile wardrobe for any season or trip.</p>
                        <button onClick={() => setShowCreateModal(true)} className="px-8 py-4 bg-white text-black rounded-full font-bold shadow-lg hover:scale-105 transition-transform">
                            Start Creating
                        </button>
                    </div>
                )}

                <div className="flex flex-col gap-4">
                    {capsules.map(capsule => {
                        const progress = getCapsuleProgress(capsule);
                        const stats = getCapsuleStats(capsule, wardrobe);
                        const icon = seasons.find(s => s.season === capsule.season)?.icon || '●';

                        return (
                            <button
                                key={capsule.id}
                                onClick={() => setSelectedCapsule(capsule)}
                                className="w-full glass-card bg-zinc-900/50 hover:bg-zinc-900 border border-white/10 rounded-2xl p-5 text-left transition-all group"
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-xl border border-white/10">
                                            {icon}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg text-white group-hover:text-blue-400 transition-colors">{capsule.name}</h3>
                                            <p className="text-xs text-gray-400">{seasons.find(s => s.season === capsule.season)?.label}</p>
                                        </div>
                                    </div>
                                    <div className="text-gray-500 group-hover:translate-x-1 transition-transform">→</div>
                                </div>

                                <div className="mt-4">
                                    <div className="flex justify-between text-xs text-gray-400 mb-1.5 font-medium">
                                        <span>{stats.totalItems} items</span>
                                        <span>{stats.possibleOutfits} outfits</span>
                                    </div>
                                    <div className="h-1.5 bg-black rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-white transition-all duration-500"
                                            style={{ width: `${Math.min(100, (stats.totalItems / capsule.targetCount) * 100)}%` }}
                                        />
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Create Modal (Same as above) */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-lg z-50 flex items-center justify-center p-4">
                    <div className="w-full max-w-md bg-zinc-900 rounded-2xl overflow-hidden animate-slide-up border border-white/10">
                        <div className="p-5 border-b border-white/10">
                            <h3 className="text-lg font-bold text-white">New Capsule Wardrobe</h3>
                        </div>
                        <div className="p-5 space-y-5">
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Name</label>
                                <input
                                    type="text"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    placeholder="e.g., Summer Essentials"
                                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-white/50 transition-colors placeholder-gray-600"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Season</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {seasons.map(s => (
                                        <button
                                            key={s.season}
                                            onClick={() => setNewSeason(s.season)}
                                            className={`p-3 rounded-xl text-center transition-all border ${newSeason === s.season ? 'bg-white text-black border-white' : 'bg-black/50 border-white/10 text-gray-400 hover:bg-white/5'}`}
                                        >
                                            <div className="text-xl mb-1">{s.icon}</div>
                                            <div className="text-xs font-medium">{s.label}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="p-5 border-t border-white/10 flex gap-3">
                            <button onClick={() => setShowCreateModal(false)} className="flex-1 py-3 bg-white/5 hover:bg-white/10 rounded-xl font-semibold text-white transition-colors">Cancel</button>
                            <button onClick={handleCreate} disabled={!newName} className="flex-1 py-3 bg-white text-black rounded-xl font-bold disabled:opacity-50 hover:bg-gray-200 transition-colors">Create</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CapsuleWardrobeView;

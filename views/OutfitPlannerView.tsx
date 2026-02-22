import React, { useState, useEffect } from 'react';
import { WardrobeItem, PlannedOutfit } from '../types';
import { hasFeature } from '../services/subscriptionService';
import {
    Sparkles,
    Shirt,
    Calendar,
    CheckCircle
} from '../components/Icons';
import {
    generateOutfit,
    generateWeekOutfits,
    getAvailableItems,
    getLaundryConfig,
    setLaundryConfig,
    lockItems,
    unlockItems,
    doLaundry,
    getLockedItems,
    GeneratedOutfit
} from '../services/outfitGeneratorService';

interface OutfitPlannerViewProps {
    wardrobe: WardrobeItem[];
    contextItems?: WardrobeItem[];
    onBack: () => void;
}

const PLANNER_KEY = 'styaile_outfit_planner';

const OutfitPlannerView: React.FC<OutfitPlannerViewProps> = ({ wardrobe, contextItems, onBack }) => {
    const [currentWeek, setCurrentWeek] = useState(0);
    const [plannedOutfits, setPlannedOutfits] = useState<GeneratedOutfit[]>([]);
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [generating, setGenerating] = useState(false);
    const [laundryConfig, setLaundryConfigState] = useState(getLaundryConfig());
    const [showLaundrySettings, setShowLaundrySettings] = useState(false);
    const [draggedDate, setDraggedDate] = useState<string | null>(null); // NEW: For drag-drop

    useEffect(() => {
        loadPlannedOutfits();
    }, []);

    const loadPlannedOutfits = () => {
        try {
            const stored = localStorage.getItem(PLANNER_KEY);
            if (stored) setPlannedOutfits(JSON.parse(stored));
        } catch (e) {
            console.error('Failed to load planner:', e);
        }
    };

    const savePlannedOutfits = (outfits: GeneratedOutfit[]) => {
        setPlannedOutfits(outfits);
        localStorage.setItem(PLANNER_KEY, JSON.stringify(outfits));
    };

    if (!hasFeature('hasExport')) {
        return (
            <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-8">
                <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mb-4 border border-white/20">
                    <span className="text-2xl">⬡</span>
                </div>
                <h2 className="text-2xl font-bold mb-2">Starter Feature</h2>
                <p className="text-gray-400 text-center mb-6">
                    Weekly outfit planner is available on Starter, Pro, and Premium plans.
                </p>
                <button onClick={onBack} className="btn-primary px-6 py-3 rounded-xl">
                    Upgrade Now
                </button>
            </div>
        );
    }

    const getWeekDates = (weekOffset: number) => {
        const today = new Date();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay() + (weekOffset * 7));

        return Array.from({ length: 7 }, (_, i) => {
            const date = new Date(startOfWeek);
            date.setDate(startOfWeek.getDate() + i);
            return date.toISOString().split('T')[0];
        });
    };

    const weekDates = getWeekDates(currentWeek);
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const getPlannedOutfit = (date: string) => {
        return plannedOutfits.find(p => p.date === date);
    };

    const getItemById = (id: string) => wardrobe.find(w => w.id === id);

    // Use context items if available (Capsule Mode)
    const effectiveWardrobe = contextItems && contextItems.length > 0 ? contextItems : wardrobe;
    const isCapsuleMode = !!(contextItems && contextItems.length > 0);

    const handlePlanWeek = async () => {
        if (effectiveWardrobe.length < 5) {
            alert(isCapsuleMode
                ? 'Your capsule needs at least 5 items to generate a full week plan!'
                : 'Add at least 5 items to your wardrobe to generate outfits!');
            return;
        }

        setGenerating(true);
        try {
            // Simulate AI thinking
            await new Promise(r => setTimeout(r, 1500));

            const startDate = weekDates[0];
            const newOutfits = generateWeekOutfits(effectiveWardrobe, startDate, 7);

            if (newOutfits.length === 0) {
                alert('Could not generate outfits. Try adding more variety!');
                return;
            }

            // Remove old outfits for this week and add new ones
            const otherOutfits = plannedOutfits.filter(o => !weekDates.includes(o.date));
            savePlannedOutfits([...otherOutfits, ...newOutfits]);
        } finally {
            setGenerating(false);
        }
    };

    const handlePlanDay = async (date: string) => {
        if (effectiveWardrobe.length < 3) {
            alert(isCapsuleMode
                ? 'Your capsule needs at least 3 items!'
                : 'Add at least 3 items to your wardrobe!');
            return;
        }

        setGenerating(true);
        try {
            await new Promise(r => setTimeout(r, 800));

            const outfit = generateOutfit(effectiveWardrobe, date);
            if (!outfit) {
                alert('Could not generate outfit. Not enough available items for this date.');
                return;
            }

            // Lock items
            lockItems(outfit.itemIds, date, outfit.id);

            // Replace outfit for this date
            const otherOutfits = plannedOutfits.filter(o => o.date !== date);
            savePlannedOutfits([...otherOutfits, outfit]);
        } finally {
            setGenerating(false);
        }
    };

    const handleDeleteOutfit = (date: string) => {
        const outfit = getPlannedOutfit(date);
        if (outfit) {
            unlockItems(outfit.itemIds);
            savePlannedOutfits(plannedOutfits.filter(o => o.date !== date));
        }
    };

    const handleWearOutfit = (date: string) => {
        const outfit = getPlannedOutfit(date);
        if (!outfit) return;

        // Mark items as worn (increment wear count would happen in wardrobe)
        savePlannedOutfits(plannedOutfits.map(o =>
            o.date === date ? { ...o, worn: true } : o
        ) as any);
    };

    const handleDoLaundry = () => {
        if (window.confirm('Mark laundry as done? This will unlock all items.')) {
            doLaundry();
            alert('Laundry done! All items are now available.');
        }
    };

    const handleChangeLaundryCycle = (days: number) => {
        const config = getLaundryConfig();
        config.cycleDays = days;
        setLaundryConfig(config);
        setLaundryConfigState(config);
        setShowLaundrySettings(false);
    };

    // Drag and drop handlers for moving outfits between dates
    const handleDragStart = (date: string) => {
        const outfit = getPlannedOutfit(date);
        if (outfit) {
            setDraggedDate(date);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handleDrop = (targetDate: string) => {
        if (!draggedDate || draggedDate === targetDate) {
            setDraggedDate(null);
            return;
        }

        const outfit = getPlannedOutfit(draggedDate);
        if (!outfit) {
            setDraggedDate(null);
            return;
        }

        // Move outfit to new date
        const updatedOutfits = plannedOutfits.map(o => {
            if (o.date === draggedDate) {
                return { ...o, date: targetDate };
            }
            // If target already has outfit, swap it
            if (o.date === targetDate) {
                return { ...o, date: draggedDate };
            }
            return o;
        });

        savePlannedOutfits(updatedOutfits);
        setDraggedDate(null);
    };

    const handleDragEnd = () => {
        setDraggedDate(null);
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.getDate();
    };

    const formatMonth = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    };

    const isToday = (dateStr: string) => {
        return dateStr === new Date().toISOString().split('T')[0];
    };

    const isPast = (dateStr: string) => {
        return dateStr < new Date().toISOString().split('T')[0];
    };

    const lockedItemsCount = getLockedItems().length;
    const weekHasOutfits = weekDates.some(date => getPlannedOutfit(date));

    // Outfit detail modal
    const selectedOutfit = selectedDate ? getPlannedOutfit(selectedDate) : null;
    const selectedItems = selectedOutfit
        ? selectedOutfit.itemIds.map(id => getItemById(id)).filter(Boolean) as WardrobeItem[]
        : [];

    return (
        <div className="min-h-screen bg-black text-white pb-24">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-black/90 backdrop-blur-xl border-b border-white/10">
                <div className="flex items-center justify-between p-4">
                    <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <h1 className="text-xl font-bold">Weekly Outfits</h1>
                    <button
                        onClick={() => setShowLaundrySettings(true)}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    </button>
                </div>

                {isCapsuleMode && (
                    <div className="mx-4 mb-3 px-3 py-2 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-center gap-2 animate-fade-in">
                        <Sparkles size={16} className="text-blue-400" />
                        <span className="text-xs text-blue-100 font-medium">Planning with {effectiveWardrobe.length} items from your capsule</span>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="px-4 pb-4 flex gap-3">
                    <button
                        onClick={handlePlanWeek}
                        disabled={generating}
                        className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-blue-500/20"
                    >
                        {generating ? (
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <>
                                <Sparkles size={20} />
                                Plan Week
                            </>
                        )}
                    </button>
                    <button
                        onClick={handleDoLaundry}
                        className="px-4 py-3 bg-white/10 rounded-xl font-semibold flex items-center gap-2 hover:bg-white/15 transition-colors"
                    >
                        <Shirt size={20} />
                        Laundry
                    </button>
                </div>
            </div>

            <div className="p-4">
                {/* Status Bar */}
                <div className="glass-card rounded-2xl p-4 mb-6 flex items-center justify-between">
                    <div>
                        <div className="text-sm text-gray-400">Laundry Cycle</div>
                        <div className="font-semibold">{laundryConfig.cycleDays} days</div>
                    </div>
                    <div>
                        <div className="text-sm text-gray-400">Locked Items</div>
                        <div className="font-semibold">{lockedItemsCount} items</div>
                    </div>
                    <div>
                        <div className="text-sm text-gray-400">Available</div>
                        <div className="font-semibold">{wardrobe.length - lockedItemsCount}</div>
                    </div>
                </div>

                {/* Week Navigation */}
                <div className="flex items-center justify-between mb-6">
                    <button
                        onClick={() => setCurrentWeek(w => w - 1)}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <div className="text-center">
                        <h2 className="font-semibold">{formatMonth(weekDates[0])}</h2>
                        <p className="text-sm text-gray-400">
                            {currentWeek === 0 ? 'This Week' : currentWeek > 0 ? `${currentWeek} week${currentWeek > 1 ? 's' : ''} ahead` : `${Math.abs(currentWeek)} week${Math.abs(currentWeek) > 1 ? 's' : ''} ago`}
                        </p>
                    </div>
                    <button
                        onClick={() => setCurrentWeek(w => w + 1)}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-2 mb-6">
                    {dayNames.map(day => (
                        <div key={day} className="text-center text-xs text-gray-400 font-medium py-2">
                            {day}
                        </div>
                    ))}
                    {weekDates.map(date => {
                        const outfit = getPlannedOutfit(date);
                        const items = outfit?.itemIds.slice(0, 2).map(id => getItemById(id)).filter(Boolean) as WardrobeItem[] | undefined;
                        const today = isToday(date);
                        const past = isPast(date);
                        const isDragging = draggedDate === date;
                        const isDropTarget = draggedDate && draggedDate !== date;

                        return (
                            <div
                                key={date}
                                draggable={!!outfit}
                                onDragStart={() => handleDragStart(date)}
                                onDragEnd={handleDragEnd}
                                onDragOver={handleDragOver}
                                onDrop={() => handleDrop(date)}
                                onClick={() => outfit ? setSelectedDate(date) : handlePlanDay(date)}
                                className={`aspect-square rounded-xl relative overflow-hidden transition-all cursor-pointer
                                    ${today ? 'ring-2 ring-white' : ''}
                                    ${past ? 'opacity-50' : ''}
                                    ${isDragging ? 'opacity-50 scale-95' : ''}
                                    ${isDropTarget ? 'ring-2 ring-blue-400 ring-offset-2 ring-offset-black' : ''}
                                    ${outfit ? 'bg-white/5 hover:bg-white/10' : 'glass-card hover:bg-white/5'}`}
                            >
                                {/* Date */}
                                <span className={`absolute top-1 left-1/2 -translate-x-1/2 text-xs font-medium z-10 ${today ? 'text-white' : 'text-gray-400'
                                    }`}>
                                    {formatDate(date)}
                                </span>

                                {/* Drag Handle - Only show if outfit exists */}
                                {outfit && !isDragging && (
                                    <div className="absolute top-1 right-1 z-10 bg-white/20 backdrop-blur-sm rounded-md px-1 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <span className="text-white text-xs font-bold">⋮⋮</span>
                                    </div>
                                )}

                                {items && items.length > 0 ? (
                                    <div className="absolute inset-0 top-6 p-1 flex gap-0.5">
                                        {items.map(item => (
                                            <div key={item.id} className="flex-1 rounded overflow-hidden">
                                                <img
                                                    src={item.imageData}
                                                    alt=""
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="absolute inset-0 top-6 flex items-center justify-center">
                                        <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                        </svg>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Empty State */}
                {!weekHasOutfits && (
                    <div className="text-center py-12 glass-card rounded-2xl border border-white/10 bg-white/5 mx-4">
                        <div className="bg-white/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Calendar size={40} className="text-gray-400" />
                        </div>
                        <h3 className="text-xl font-bold mb-2">Plan Your Week</h3>
                        <p className="text-gray-400 mb-6 max-w-xs mx-auto">
                            Let AI create coordinated outfits for the entire week
                        </p>
                        <button
                            onClick={handlePlanWeek}
                            disabled={generating}
                            className="bg-white text-black px-8 py-3 rounded-xl inline-flex items-center gap-2 font-semibold hover:bg-gray-200 transition-colors"
                        >
                            {generating ? 'Generating...' : 'Auto-Plan Week'}
                        </button>
                    </div>
                )}
            </div>

            {/* Outfit Detail Modal */}
            {selectedDate && selectedOutfit && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-lg z-50 flex flex-col">
                    <div className="flex items-center justify-between p-4 border-b border-white/10">
                        <button
                            onClick={() => setSelectedDate(null)}
                            className="p-2 hover:bg-white/10 rounded-full"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                        <h3 className="font-semibold">
                            {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                        </h3>
                        <button
                            onClick={() => { handleDeleteOutfit(selectedDate); setSelectedDate(null); }}
                            className="p-2 hover:bg-white/10 rounded-full text-red-400"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4">
                        {/* Outfit Name & Occasion */}
                        <div className="mb-6">
                            <h2 className="text-2xl font-bold mb-2">{selectedOutfit.name}</h2>
                            <div className="flex items-center gap-2">
                                <span className="px-3 py-1 bg-white/10 rounded-full text-sm capitalize">
                                    {selectedOutfit.occasion}
                                </span>
                                <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm">
                                    {selectedOutfit.score}% Match
                                </span>
                            </div>
                        </div>

                        {/* Items Grid */}
                        <div className="grid grid-cols-2 gap-3 mb-6">
                            {selectedItems.map(item => (
                                <div key={item.id} className="glass-card rounded-xl overflow-hidden">
                                    <img src={item.imageData} alt={item.description} className="w-full aspect-square object-cover" />
                                    <div className="p-3">
                                        <p className="font-medium text-sm truncate">{item.description}</p>
                                        <p className="text-xs text-gray-400">{item.category}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Reasoning */}
                        <div className="glass-card rounded-xl p-4 mb-6 border border-yellow-500/20 bg-yellow-500/5">
                            <h3 className="font-semibold mb-2 flex items-center gap-2 text-yellow-100">
                                <Sparkles size={16} className="text-yellow-400" /> Why This Works
                            </h3>
                            <p className="text-gray-300 text-sm leading-relaxed">{selectedOutfit.reasoning}</p>
                        </div>

                        {/* Actions */}
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => { handleWearOutfit(selectedDate); setSelectedDate(null); }}
                                className="py-3 rounded-xl bg-white text-black font-semibold flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors"
                            >
                                <CheckCircle size={20} /> Wear Today
                            </button>
                            <button
                                onClick={() => { handlePlanDay(selectedDate); setSelectedDate(null); }}
                                className="py-3 rounded-xl bg-white/10 font-semibold flex items-center justify-center gap-2 hover:bg-white/20 transition-colors"
                            >
                                <Sparkles size={20} /> Regenerate
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Laundry Settings Modal */}
            {showLaundrySettings && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-lg z-50 flex items-center justify-center p-4">
                    <div className="w-full max-w-md bg-zinc-900 rounded-2xl overflow-hidden">
                        <div className="p-4 border-b border-white/10">
                            <h3 className="text-lg font-semibold">Laundry Settings</h3>
                        </div>
                        <div className="p-4">
                            <p className="text-sm text-gray-400 mb-4">
                                How often do you do laundry? Items will be locked for this duration after use.
                            </p>
                            <div className="grid grid-cols-4 gap-2">
                                {[3, 5, 7, 14].map(days => (
                                    <button
                                        key={days}
                                        onClick={() => handleChangeLaundryCycle(days)}
                                        className={`p-3 rounded-xl text-center transition-all ${laundryConfig.cycleDays === days ? 'bg-white text-black' : 'glass-card hover:bg-white/10'
                                            }`}
                                    >
                                        <div className="text-lg font-bold">{days}</div>
                                        <div className="text-xs">days</div>
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="p-4 border-t border-white/10">
                            <button
                                onClick={() => setShowLaundrySettings(false)}
                                className="w-full py-3 rounded-xl btn-secondary"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OutfitPlannerView;

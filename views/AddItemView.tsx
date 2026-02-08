import React, { useState, useCallback } from 'react';
import { WardrobeItem, ClothingCategory, AppView } from '../types';
import { analyzeClothingImage } from '../services/unifiedAiService';
import { processImageForAI, ImageProcessingError, generateId, resizeImage } from '../utils';
import { Cloud, Camera, X, Plus } from '../components/Icons';

interface AddItemViewProps {
    onAddItem: (item: WardrobeItem) => void;
    setView: (view: AppView) => void;
}

type AddStep = 'upload' | 'analyzing' | 'review' | 'manual' | 'error';

interface AnalysisResult {
    category: ClothingCategory;
    description: string;
    colors: string[];
    tags: string[];
    occasions: string[];
    mood: string[];
    timing: string[];
    season: string[];
    aiAnalysis?: {
        summary: string;
        detectedType: string;
        styleParams: string[];
        detectedColors: string[];
        fabricGuess?: string;
        timestamp: number;
    };
}

const CATEGORY_OPTIONS = Object.values(ClothingCategory);
const OCCASION_OPTIONS = ['casual', 'formal', 'party', 'work', 'date', 'sports', 'everyday'];
const COLOR_OPTIONS = ['Black', 'White', 'Blue', 'Red', 'Green', 'Yellow', 'Pink', 'Purple', 'Orange', 'Brown', 'Gray', 'Navy', 'Beige'];

const AddItemView: React.FC<AddItemViewProps> = ({ onAddItem, setView }) => {
    const [step, setStep] = useState<AddStep>('upload');
    const [imageData, setImageData] = useState<string | null>(null);
    const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
    const [error, setError] = useState<string>('');
    const [isDragging, setIsDragging] = useState(false);

    // Manual entry fields
    const [manualCategory, setManualCategory] = useState<ClothingCategory>(ClothingCategory.TOP);
    const [manualDescription, setManualDescription] = useState('');
    const [manualColors, setManualColors] = useState<string[]>([]);
    const [manualOccasions, setManualOccasions] = useState<string[]>(['casual']);

    const handleFile = useCallback(async (file: File) => {
        try {
            setStep('analyzing');

            // Process image through the robust pipeline
            const processedImage = await processImageForAI(file);

            // Store data URL for display
            setImageData(processedImage.dataUrl);

            // Send to NVIDIA NIM for analysis
            const nimResult = await analyzeClothingImage(processedImage.base64);

            // Map NIM result to our AnalysisResult format
            const categoryMap: Record<string, ClothingCategory> = {
                'shirt': ClothingCategory.TOP,
                'top': ClothingCategory.TOP,
                't-shirt': ClothingCategory.TOP,
                'blouse': ClothingCategory.TOP,
                'pants': ClothingCategory.BOTTOM,
                'jeans': ClothingCategory.BOTTOM,
                'trousers': ClothingCategory.BOTTOM,
                'shorts': ClothingCategory.BOTTOM,
                'skirt': ClothingCategory.BOTTOM,
                'dress': ClothingCategory.DRESS,
                'shoes': ClothingCategory.SHOES,
                'sneakers': ClothingCategory.SHOES,
                'boots': ClothingCategory.SHOES,
                'jacket': ClothingCategory.OUTERWEAR,
                'coat': ClothingCategory.OUTERWEAR,
                'hoodie': ClothingCategory.OUTERWEAR,
                'sweater': ClothingCategory.OUTERWEAR,
                'accessory': ClothingCategory.ACCESSORY,
                'bag': ClothingCategory.ACCESSORY,
                'hat': ClothingCategory.ACCESSORY,
                'watch': ClothingCategory.ACCESSORY,
            };

            const detectedType = nimResult.detectedType.toLowerCase();
            let category = ClothingCategory.OTHER;
            for (const [key, cat] of Object.entries(categoryMap)) {
                if (detectedType.includes(key)) {
                    category = cat;
                    break;
                }
            }

            const result: AnalysisResult = {
                category,
                description: nimResult.summary.split('.')[0] || nimResult.detectedType,
                colors: nimResult.detectedColors,
                tags: nimResult.styleParams,
                occasions: nimResult.styleParams.includes('formal') ? ['formal', 'work'] : ['casual', 'everyday'],
                mood: nimResult.styleParams.includes('elegant') ? ['elegant', 'confident'] : ['relaxed'],
                timing: ['all-day'],
                season: ['all-season'],
                aiAnalysis: nimResult,
            };

            setAnalysis(result);
            setStep('review');
        } catch (err) {
            console.error('Analysis error:', err);

            if (err instanceof ImageProcessingError) {
                setError(err.message);
            } else {
                setError(err instanceof Error ? err.message : 'Failed to analyze image. Please try again.');
            }
            setStep('error');
        }
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFile(file);
    }, [handleFile]);

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleFile(file);
    };

    const handleManualFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            try {
                const resized = await resizeImage(file, 512);
                setImageData(resized);
                setStep('manual');
            } catch (err) {
                console.error('Error processing image:', err);
                setError('Could not process the image. Please try a different file.');
                setStep('error');
            }
        }
    };

    const handleConfirm = () => {
        if (!imageData || !analysis) return;

        const item: WardrobeItem = {
            id: generateId(),
            imageData,
            category: analysis.category,
            description: analysis.description,
            colors: analysis.colors,
            tags: analysis.tags,
            occasions: analysis.occasions,
            mood: analysis.mood,
            timing: analysis.timing,
            season: analysis.season,
            createdAt: Date.now(),
            aiAnalysis: analysis.aiAnalysis,
        };

        onAddItem(item);
        setView(AppView.WARDROBE);
    };

    const resetForm = () => {
        setStep('upload');
        setImageData(null);
        setAnalysis(null);
        setError('');
        setManualDescription('');
        setManualColors([]);
        setManualOccasions(['casual']);
        setManualCategory(ClothingCategory.TOP);
    };

    const switchToManualEntry = async (file?: File) => {
        if (file && !imageData) {
            try {
                const resized = await resizeImage(file, 512);
                setImageData(resized);
            } catch (e) {
                console.error('Could not process image for display:', e);
            }
        }
        setStep('manual');
    };

    const handleManualConfirm = () => {
        if (!imageData || !manualDescription.trim()) return;

        const item: WardrobeItem = {
            id: generateId(),
            imageData,
            category: manualCategory,
            description: manualDescription.trim(),
            colors: manualColors.length > 0 ? manualColors : ['Unknown'],
            tags: ['user-added'],
            occasions: manualOccasions,
            mood: ['relaxed'],
            timing: ['all-day'],
            season: ['all-season'],
            createdAt: Date.now(),
        };

        onAddItem(item);
        setView(AppView.WARDROBE);
    };

    const toggleColor = (color: string) => {
        setManualColors(prev =>
            prev.includes(color)
                ? prev.filter(c => c !== color)
                : [...prev, color]
        );
    };

    const toggleOccasion = (occasion: string) => {
        setManualOccasions(prev =>
            prev.includes(occasion)
                ? prev.filter(o => o !== occasion)
                : [...prev, occasion]
        );
    };

    return (
        <div className="min-h-screen pb-24 px-4 pt-6 bg-[#050505] text-white">
            {/* Header */}
            <div className="flex items-center justify-between mb-8 sticky top-0 bg-[#050505]/80 backdrop-blur-md z-10 py-2">
                <button
                    onClick={() => setView(AppView.WARDROBE)}
                    className="p-2 -ml-2 text-gray-400 hover:text-white btn-press transition-colors"
                >
                    <X size={24} />
                </button>
                <h1 className="text-xl font-bold text-white tracking-wide">Add New Item</h1>
                <div className="w-10" />
            </div>

            {/* Upload Step */}
            {step === 'upload' && (
                <div className="animate-fade-in space-y-6">
                    {/* Option 1: AI Analysis */}
                    <div
                        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={handleDrop}
                        className={`glass-card rounded-3xl p-8 flex flex-col items-center justify-center border-2 border-dashed transition-all duration-300 ${isDragging ? 'border-primary bg-primary/10' : 'border-white/10 hover:border-white/20'}`}
                    >
                        <div className="w-20 h-20 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full flex items-center justify-center mb-6 animate-pulse">
                            <Cloud size={32} className="text-primary" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">AI Analysis</h3>
                        <p className="text-sm text-gray-400 text-center mb-8 max-w-xs leading-relaxed">
                            Upload a photo and let our AI detect style, color, and category automatically.
                        </p>
                        <label className="cursor-pointer">
                            <input
                                type="file"
                                accept="image/jpeg,image/png,.jpg,.jpeg,.png"
                                onChange={handleFileInput}
                                className="hidden"
                            />
                            <span className="px-8 py-4 bg-gradient-to-r from-primary to-secondary text-black rounded-full font-bold shadow-lg shadow-primary/20 btn-press inline-block hover:shadow-primary/40 transition-shadow">
                                Upload Photo
                            </span>
                        </label>
                    </div>

                    <div className="relative py-2">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-white/10"></div>
                        </div>
                        <div className="relative flex justify-center">
                            <span className="px-4 bg-[#050505] text-sm text-gray-500 font-medium tracking-widest">OR</span>
                        </div>
                    </div>

                    {/* Option 2: Manual Entry */}
                    <div className="glass-card rounded-3xl p-6 flex flex-col items-center border border-white/5">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center">
                                <Camera size={20} className="text-gray-300" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-semibold text-white">Manual Entry</h3>
                                <p className="text-xs text-gray-400">Enter details yourself</p>
                            </div>
                        </div>
                        <label className="cursor-pointer w-full">
                            <input
                                type="file"
                                accept="image/jpeg,image/png,.jpg,.jpeg,.png"
                                onChange={handleManualFileInput}
                                className="hidden"
                            />
                            <span className="w-full block text-center py-3 bg-white/5 border border-white/10 text-white rounded-xl font-medium btn-press hover:bg-white/10 transition-colors">
                                Select Photo
                            </span>
                        </label>
                    </div>

                    {/* Tips */}
                    <div className="mt-8 bg-white/5 rounded-2xl p-4 border border-white/5">
                        <h4 className="text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider flex items-center gap-2">
                            <span className="text-primary">✨</span> Pro Tip
                        </h4>
                        <p className="text-sm text-gray-400">
                            For best results, use good lighting and a plain background. One item per photo works best!
                        </p>
                    </div>
                </div>
            )}

            {/* Analyzing Step */}
            {step === 'analyzing' && (
                <div className="flex flex-col items-center justify-center min-h-[50vh] animate-fade-in">
                    {imageData && (
                        <div className="relative">
                            <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full"></div>
                            <img
                                src={imageData}
                                alt="Uploading"
                                className="relative w-48 h-48 rounded-2xl object-cover mb-8 shadow-2xl border border-white/10"
                            />
                        </div>
                    )}
                    <h3 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-2 animate-pulse">
                        Analyzing...
                    </h3>
                    <p className="text-gray-400 text-sm">Detecting style, color & category</p>
                </div>
            )}

            {/* Review Step */}
            {step === 'review' && analysis && (
                <div className="animate-slide-up">
                    <div className="glass-card rounded-[32px] overflow-hidden border border-white/10 shadow-2xl">
                        {imageData && (
                            <div className="relative">
                                <img
                                    src={imageData}
                                    alt={analysis.description}
                                    className="w-full aspect-square object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                                <div className="absolute bottom-6 left-6 right-6">
                                    <span className="inline-block px-3 py-1 bg-primary/80 backdrop-blur-md rounded-full text-xs font-bold text-white mb-2 uppercase tracking-wide">
                                        {analysis.category}
                                    </span>
                                    <h3 className="text-2xl font-bold text-white leading-tight">{analysis.description}</h3>
                                </div>
                            </div>
                        )}
                        <div className="p-6 space-y-6">
                            {/* Color Palette */}
                            <div>
                                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Palette</p>
                                <div className="flex gap-2">
                                    {analysis.colors.map((color, i) => (
                                        <div key={i} className="flex items-center gap-2 bg-white/5 border border-white/5 px-3 py-1.5 rounded-full">
                                            <div
                                                className="w-3 h-3 rounded-full border border-white/20 shadow-sm"
                                                style={{ backgroundColor: color.toLowerCase() }}
                                            />
                                            <span className="text-xs text-gray-300 capitalize">{color}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Tags */}
                            <div>
                                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Style DNA</p>
                                <div className="flex flex-wrap gap-2">
                                    {analysis.tags.map((tag, i) => (
                                        <span key={i} className="px-3 py-1 bg-white/5 text-gray-400 text-xs rounded-lg border border-white/5">{tag}</span>
                                    ))}
                                </div>
                            </div>

                            {/* Stats */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-white/5 p-3 rounded-2xl border border-white/5">
                                    <p className="text-[10px] text-gray-500 uppercase mb-1">Occasion</p>
                                    <p className="text-sm text-gray-200 capitalize truncate">{analysis.occasions[0]}</p>
                                </div>
                                <div className="bg-white/5 p-3 rounded-2xl border border-white/5">
                                    <p className="text-[10px] text-gray-500 uppercase mb-1">Season</p>
                                    <p className="text-sm text-gray-200 capitalize truncate">{analysis.season[0]}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-4 mt-8">
                        <button
                            onClick={resetForm}
                            className="flex-1 py-4 bg-white/5 text-white rounded-2xl font-semibold btn-press hover:bg-white/10 transition-colors border border-white/5"
                        >
                            Retry
                        </button>
                        <button
                            onClick={handleConfirm}
                            className="flex-[2] py-4 bg-white text-black rounded-2xl font-bold shadow-[0_0_20px_rgba(255,255,255,0.2)] btn-press hover:bg-gray-200 transition-colors"
                        >
                            Confirm & Add
                        </button>
                    </div>
                </div>
            )}

            {/* Error Step */}
            {step === 'error' && (
                <div className="flex flex-col items-center justify-center min-h-[50vh] animate-fade-in text-center px-4">
                    <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
                        <X size={32} className="text-red-500" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Analysis Failed</h3>
                    <p className="text-gray-400 mb-8 max-w-sm">{error}</p>
                    <div className="flex flex-col gap-3 w-full max-w-xs">
                        <button
                            onClick={resetForm}
                            className="w-full py-4 bg-white/5 text-white rounded-2xl font-medium btn-press"
                        >
                            Try Again
                        </button>
                        {imageData && (
                            <button
                                onClick={() => switchToManualEntry()}
                                className="w-full py-4 bg-gradient-to-r from-primary to-secondary text-white rounded-2xl font-bold shadow-lg btn-press"
                            >
                                Enter Manually
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Manual Entry Step */}
            {step === 'manual' && (
                <div className="animate-slide-up">
                    {imageData && (
                        <div className="flex justify-center mb-8">
                            <img
                                src={imageData}
                                alt="Your clothing item"
                                className="w-40 h-40 rounded-3xl object-cover shadow-2xl border border-white/10"
                            />
                        </div>
                    )}

                    <div className="space-y-6">
                        {/* Description */}
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                                Description
                            </label>
                            <input
                                type="text"
                                value={manualDescription}
                                onChange={(e) => setManualDescription(e.target.value)}
                                placeholder="e.g., Blue Denim Jacket"
                                className="glass-input w-full px-5 py-4 rounded-2xl focus:ring-2 focus:ring-primary/50"
                            />
                        </div>

                        {/* Category */}
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                                Category
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {CATEGORY_OPTIONS.map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => setManualCategory(cat)}
                                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${manualCategory === cat
                                            ? 'bg-white text-black font-bold shadow-lg'
                                            : 'bg-white/5 text-gray-400 hover:bg-white/10'
                                            }`}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Colors */}
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                                Colors
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {COLOR_OPTIONS.map(color => (
                                    <button
                                        key={color}
                                        onClick={() => toggleColor(color)}
                                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${manualColors.includes(color)
                                            ? 'bg-primary text-white shadow-lg shadow-primary/20'
                                            : 'bg-white/5 text-gray-400 hover:bg-white/10'
                                            }`}
                                    >
                                        {color}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Occasions */}
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                                Occasions
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {OCCASION_OPTIONS.map(occ => (
                                    <button
                                        key={occ}
                                        onClick={() => toggleOccasion(occ)}
                                        className={`px-4 py-2 rounded-full text-sm font-medium capitalize transition-all ${manualOccasions.includes(occ)
                                            ? 'bg-secondary text-white shadow-lg shadow-secondary/20'
                                            : 'bg-white/5 text-gray-400 hover:bg-white/10'
                                            }`}
                                    >
                                        {occ}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-4 mt-8">
                        <button
                            onClick={resetForm}
                            className="flex-1 py-4 bg-white/5 text-white rounded-2xl font-medium btn-press hover:bg-white/10"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleManualConfirm}
                            disabled={!manualDescription.trim()}
                            className={`flex-[2] py-4 rounded-2xl font-bold shadow-lg btn-press ${manualDescription.trim()
                                ? 'bg-white text-black hover:bg-gray-200'
                                : 'bg-white/10 text-gray-500 cursor-not-allowed hidden'
                                }`}
                        >
                            Save Item
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AddItemView;

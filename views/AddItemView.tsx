import React, { useState, useCallback, useEffect, useRef } from 'react';
import { WardrobeItem, ClothingCategory, AppView } from '../types';
import { analyzeClothingImage } from '../services/unifiedAiService';
import { processImageForAI, ImageProcessingError, generateId, resizeImage } from '../utils';
import { Cloud, Camera, X, Plus, Clock, Check } from '../components/Icons';

interface AddItemViewProps {
    onAddItem: (item: WardrobeItem) => void;
    setView: (view: AppView) => void;
}

type AddMode = 'select' | 'camera' | 'gallery';
type ProcessingStep = 'upload' | 'analyzing' | 'review' | 'manual' | 'error';

interface QueuedImage {
    id: string;
    file: File;
    dataUrl: string;
    status: 'pending' | 'processing' | 'complete' | 'failed';
    error?: string;
}

interface AnalysisResult {
    category: ClothingCategory;
    description: string;
    colors: string[];
    tags: string[];
    occasions: string[];
    mood: string[];
    timing: string[];
    season: string[];
    aiAnalysis?: any;
}

const RATE_LIMIT_DELAY = 30000; // 30 seconds between uploads
const CATEGORY_OPTIONS = Object.values(ClothingCategory);
const OCCASION_OPTIONS = ['casual', 'formal', 'party', 'work', 'date', 'sports', 'everyday'];
const COLOR_OPTIONS = ['Black', 'White', 'Blue', 'Red', 'Green', 'Yellow', 'Pink', 'Purple', 'Orange', 'Brown', 'Gray', 'Navy', 'Beige'];

const AddItemView: React.FC<AddItemViewProps> = ({ onAddItem, setView }) => {
    const [mode, setMode] = useState<AddMode>('select');
    const [step, setStep] = useState<ProcessingStep>('upload');

    // Queue management
    const [imageQueue, setImageQueue] = useState<QueuedImage[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [nextUploadTime, setNextUploadTime] = useState<number | null>(null);
    const processingRef = useRef(false);

    // Single image state (for review/manual)
    const [imageData, setImageData] = useState<string | null>(null);
    const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
    const [error, setError] = useState<string>('');

    // Manual entry
    const [manualCategory, setManualCategory] = useState<ClothingCategory>(ClothingCategory.TOP);
    const [manualDescription, setManualDescription] = useState('');
    const [manualColors, setManualColors] = useState<string[]>([]);
    const [manualOccasions, setManualOccasions] = useState<string[]>(['casual']);

    // Timer for visual countdown
    const [countdown, setCountdown] = useState(0);

    // Countdown timer effect
    useEffect(() => {
        if (!nextUploadTime) return;

        const interval = setInterval(() => {
            const remaining = Math.max(0, Math.floor((nextUploadTime - Date.now()) / 1000));
            setCountdown(remaining);

            if (remaining === 0) {
                setNextUploadTime(null);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [nextUploadTime]);

    // Process queue automatically
    useEffect(() => {
        if (processingRef.current || imageQueue.length === 0) return;
        if (nextUploadTime && Date.now() < nextUploadTime) return;

        const nextPending = imageQueue.find(img => img.status === 'pending');
        if (!nextPending) return;

        processNextImage();
    }, [imageQueue, nextUploadTime]);

    const processNextImage = async () => {
        if (processingRef.current) return;

        const pending = imageQueue.find(img => img.status === 'pending');
        if (!pending) return;

        processingRef.current = true;
        setImageQueue(prev => prev.map(img =>
            img.id === pending.id ? { ...img, status: 'processing' } : img
        ));

        try {
            const file = pending.file;
            const processedImage = await processImageForAI(file);
            const nimResult = await analyzeClothingImage(processedImage.base64);

            // Map to category
            const categoryMap: Record<string, ClothingCategory> = {
                'shirt': ClothingCategory.TOP,
                'top': ClothingCategory.TOP,
                'pants': ClothingCategory.BOTTOM,
                'jeans': ClothingCategory.BOTTOM,
                'dress': ClothingCategory.DRESS,
                'shoes': ClothingCategory.SHOES,
                'jacket': ClothingCategory.OUTERWEAR,
                'accessory': ClothingCategory.ACCESSORY,
            };

            const detectedType = nimResult.detectedType.toLowerCase();
            let category = ClothingCategory.OTHER;
            for (const [key, cat] of Object.entries(categoryMap)) {
                if (detectedType.includes(key)) {
                    category = cat;
                    break;
                }
            }

            // Create item directly
            const item: WardrobeItem = {
                id: generateId(),
                imageData: processedImage.dataUrl,
                category,
                description: nimResult.summary.split('.')[0] || nimResult.detectedType,
                colors: nimResult.detectedColors,
                tags: nimResult.styleParams,
                occasions: nimResult.styleParams.includes('formal') ? ['formal', 'work'] : ['casual'],
                mood: ['relaxed'],
                timing: ['all-day'],
                season: ['all-season'],
                createdAt: Date.now(),
                aiAnalysis: nimResult,
            };

            onAddItem(item);

            setImageQueue(prev => prev.map(img =>
                img.id === pending.id ? { ...img, status: 'complete' } : img
            ));

            // Set rate limit delay (30s)
            const nextTime = Date.now() + RATE_LIMIT_DELAY;
            setNextUploadTime(nextTime);

        } catch (err) {
            console.error('Failed to process image:', err);
            setImageQueue(prev => prev.map(img =>
                img.id === pending.id ? {
                    ...img,
                    status: 'failed',
                    error: err instanceof Error ? err.message : 'Failed to process'
                } : img
            ));
        } finally {
            processingRef.current = false;
        }
    };

    const handleCameraCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const resized = await resizeImage(file, 512);
            setImageData(resized);
            setStep('analyzing');

            const processedImage = await processImageForAI(file);
            const nimResult = await analyzeClothingImage(processedImage.base64);

            const categoryMap: Record<string, ClothingCategory> = {
                'shirt': ClothingCategory.TOP,
                'top': ClothingCategory.TOP,
                'pants': ClothingCategory.BOTTOM,
                'jeans': ClothingCategory.BOTTOM,
                'dress': ClothingCategory.DRESS,
                'shoes': ClothingCategory.SHOES,
                'jacket': ClothingCategory.OUTERWEAR,
                'accessory': ClothingCategory.ACCESSORY,
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
                occasions: nimResult.styleParams.includes('formal') ? ['formal', 'work'] : ['casual'],
                mood: ['relaxed'],
                timing: ['all-day'],
                season: ['all-season'],
                aiAnalysis: nimResult,
            };

            setAnalysis(result);
            setStep('review');
        } catch (err) {
            console.error('Camera capture error:', err);
            setError(err instanceof Error ? err.message : 'Failed to process image');
            setStep('error');
        }
    };

    const handleGallerySelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        const newImages: QueuedImage[] = await Promise.all(
            files.map(async (file) => {
                const dataUrl = await resizeImage(file, 512);
                return {
                    id: generateId(),
                    file,
                    dataUrl,
                    status: 'pending' as const,
                };
            })
        );

        setImageQueue(newImages);
        setMode('gallery');
    };

    const removeFromQueue = (id: string) => {
        setImageQueue(prev => prev.filter(img => img.id !== id));
    };

    const retryImage = (id: string) => {
        setImageQueue(prev => prev.map(img =>
            img.id === id ? { ...img, status: 'pending', error: undefined } : img
        ));
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

    const resetForm = () => {
        setMode('select');
        setStep('upload');
        setImageData(null);
        setAnalysis(null);
        setError('');
        setImageQueue([]);
        setNextUploadTime(null);
    };

    const toggleColor = (color: string) => {
        setManualColors(prev =>
            prev.includes(color) ? prev.filter(c => c !== color) : [...prev, color]
        );
    };

    const toggleOccasion = (occasion: string) => {
        setManualOccasions(prev =>
            prev.includes(occasion) ? prev.filter(o => o !== occasion) : [...prev, occasion]
        );
    };

    // Calculate stats
    const completedCount = imageQueue.filter(img => img.status === 'complete').length;
    const failedCount = imageQueue.filter(img => img.status === 'failed').length;
    const pendingCount = imageQueue.filter(img => img.status === 'pending').length;

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
                <h1 className="text-xl font-bold text-white tracking-wide">Add Items</h1>
                <div className="w-10" />
            </div>

            {/* Mode Selection */}
            {mode === 'select' && step === 'upload' && (
                <div className="animate-fade-in space-y-6">
                    {/* Camera Mode (Single, Instant) */}
                    <div className="glass-card rounded-3xl p-8 flex flex-col items-center border-2 border-white/10">
                        <div className="w-20 h-20 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full flex items-center justify-center mb-6">
                            <Camera size={32} className="text-primary" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Camera (Recommended)</h3>
                        <p className="text-sm text-gray-400 text-center mb-8 max-w-xs">
                            Take a photo instantly - no rate limits!
                        </p>
                        <label className="cursor-pointer">
                            <input
                                type="file"
                                accept="image/*"
                                capture="environment"
                                onChange={handleCameraCapture}
                                className="hidden"
                            />
                            <span className="px-8 py-4 bg-white text-black rounded-full font-bold shadow-lg btn-press inline-block">
                                Open Camera
                            </span>
                        </label>
                    </div>

                    <div className="relative py-2">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-white/10"></div>
                        </div>
                        <div className="relative flex justify-center">
                            <span className="px-4 bg-[#050505] text-sm text-gray-500 font-medium">OR</span>
                        </div>
                    </div>

                    {/* Gallery Mode (Multiple, Throttled) */}
                    <div className="glass-card rounded-3xl p-6 flex flex-col items-center border border-white/5">
                        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                            <Cloud size={24} className="text-gray-300" />
                        </div>
                        <h3 className="font-semibold text-white mb-1">Gallery (Multiple)</h3>
                        <p className="text-xs text-gray-500 text-center mb-2">3 images per 90 seconds</p>
                        <p className="text-xs text-gray-400 text-center mb-6">Select multiple & we'll process automatically</p>
                        <label className="cursor-pointer w-full">
                            <input
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={handleGallerySelect}
                                className="hidden"
                            />
                            <span className="w-full block text-center py-3 bg-white/5 border border-white/10 text-white rounded-xl font-medium btn-press">
                                Select Photos
                            </span>
                        </label>
                    </div>
                </div>
            )}

            {/* Queue View (Gallery Mode) */}
            {mode === 'gallery' && imageQueue.length > 0 && (
                <div className="animate-fade-in">
                    {/* Progress Bar */}
                    <div className="glass-card rounded-2xl p-6 mb-6 border border-white/10">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="font-bold text-white">Processing Queue</h3>
                                <p className="text-xs text-gray-400">
                                    {completedCount} complete • {pendingCount} pending • {failedCount} failed
                                </p>
                            </div>
                            {countdown > 0 && (
                                <div className="flex items-center gap-2 bg-white/5 px-3 py-2 rounded-full">
                                    <Clock size={16} className="text-gray-400" />
                                    <span className="text-sm font-mono text-gray-300">{countdown}s</span>
                                </div>
                            )}
                        </div>
                        <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-500"
                                style={{ width: `${(completedCount / imageQueue.length) * 100}%` }}
                            />
                        </div>
                    </div>

                    {/* Queue Grid */}
                    <div className="grid grid-cols-3 gap-3 mb-6">
                        {imageQueue.map((img) => (
                            <div key={img.id} className="relative">
                                <img
                                    src={img.dataUrl}
                                    alt="Queued"
                                    className="w-full aspect-square object-cover rounded-xl border border-white/10"
                                />
                                <div className="absolute inset-0 bg-black/60 rounded-xl flex items-center justify-center">
                                    {img.status === 'pending' && (
                                        <div className="text-center">
                                            <Clock size={20} className="text-gray-400 mx-auto mb-1" />
                                            <p className="text-[10px] text-gray-400">Waiting</p>
                                        </div>
                                    )}
                                    {img.status === 'processing' && (
                                        <div className="text-center">
                                            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-1" />
                                            <p className="text-[10px] text-white">Processing</p>
                                        </div>
                                    )}
                                    {img.status === 'complete' && (
                                        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                                            <Check size={16} className="text-white" />
                                        </div>
                                    )}
                                    {img.status === 'failed' && (
                                        <div className="text-center">
                                            <button onClick={() => retryImage(img.id)} className="text-red-400 hover:text-red-300">
                                                Retry
                                            </button>
                                        </div>
                                    )}
                                </div>
                                {img.status !== 'processing' && img.status !== 'complete' && (
                                    <button
                                        onClick={() => removeFromQueue(img.id)}
                                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center"
                                    >
                                        <X size={12} className="text-white" />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={resetForm}
                        className="w-full py-4 bg-white/5 text-white rounded-2xl font-medium btn-press"
                    >
                        Done
                    </button>
                </div>
            )}

            {/* Analyzing Step (Camera Mode) */}
            {mode === 'camera' && step === 'analyzing' && (
                <div className="flex flex-col items-center justify-center min-h-[50vh] animate-fade-in">
                    {imageData && (
                        <img
                            src={imageData}
                            alt="Uploading"
                            className="w-48 h-48 rounded-2xl object-cover mb-8 shadow-2xl border border-white/10"
                        />
                    )}
                    <h3 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-2 animate-pulse">
                        Analyzing...
                    </h3>
                    <p className="text-gray-400 text-sm">Detecting style, color & category</p>
                </div>
            )}

            {/* Review Step (Camera Mode) */}
            {mode === 'camera' && step === 'review' && analysis && (
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
                                    <span className="inline-block px-3 py-1 bg-primary/80 backdrop-blur-md rounded-full text-xs font-bold text-white mb-2">
                                        {analysis.category}
                                    </span>
                                    <h3 className="text-2xl font-bold text-white">{analysis.description}</h3>
                                </div>
                            </div>
                        )}
                        <div className="p-6 space-y-4">
                            <div>
                                <p className="text-xs font-bold text-gray-500 uppercase mb-2">Colors</p>
                                <div className="flex flex-wrap gap-2">
                                    {analysis.colors.map((color, i) => (
                                        <span key={i} className="px-3 py-1 bg-white/5 rounded-full text-xs">{color}</span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-4 mt-8">
                        <button onClick={resetForm} className="flex-1 py-4 bg-white/5 text-white rounded-2xl font-semibold btn-press">
                            Retry
                        </button>
                        <button onClick={handleConfirm} className="flex-[2] py-4 bg-white text-black rounded-2xl font-bold btn-press">
                            Confirm & Add
                        </button>
                    </div>
                </div>
            )}

            {/* Error Step */}
            {step === 'error' && (
                <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4">
                    <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
                        <X size={32} className="text-red-500" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Analysis Failed</h3>
                    <p className="text-gray-400 mb-8">{error}</p>
                    <button onClick={resetForm} className="px-8 py-4 bg-white/5 text-white rounded-2xl font-medium btn-press">
                        Try Again
                    </button>
                </div>
            )}
        </div>
    );
};

export default AddItemView;

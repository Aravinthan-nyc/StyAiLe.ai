import React, { useMemo } from 'react';
import { WardrobeItem, WardrobeAnalytics, ClothingCategory } from '../types';
import { calculateAnalytics, getInsights, getShoppingRecommendations, calculateStyleScore, formatCurrency } from '../services/analyticsService';
import { hasFeature } from '../services/subscriptionService';

interface AnalyticsViewProps {
    wardrobe: WardrobeItem[];
    onBack: () => void;
}

const AnalyticsView: React.FC<AnalyticsViewProps> = ({ wardrobe, onBack }) => {
    const analytics = useMemo(() => calculateAnalytics(wardrobe), [wardrobe]);
    const insights = useMemo(() => getInsights(analytics), [analytics]);
    const recommendations = useMemo(() => getShoppingRecommendations(analytics), [analytics]);
    const styleScore = useMemo(() => calculateStyleScore(analytics), [analytics]);

    // Color style helper
    const getColorStyle = (colorName: string) => {
        const lower = colorName.toLowerCase().trim();
        if (['multicolor', 'printed', 'pattern', 'multi'].includes(lower)) {
            return { background: 'linear-gradient(45deg, #ff0000, #00ff00, #0000ff)' };
        }
        if (['denim', 'jeans'].includes(lower)) {
            return { backgroundColor: '#1e3a8a' };
        }
        // Check if valid CSS color
        const s = new Option().style;
        s.color = lower;
        if (s.color !== '') {
            return { backgroundColor: lower };
        }
        // Fallback for unknown
        return { backgroundColor: '#555' };
    };

    // Feature gate
    if (!hasFeature('hasAnalytics')) {
        return (
            <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-8">
                <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mb-4 border border-white/20">
                    <span className="text-2xl">⬡</span>
                </div>
                <h2 className="text-2xl font-bold mb-2">Premium Feature</h2>
                <p className="text-gray-400 text-center mb-6">
                    Advanced analytics is available on Premium plan.
                </p>
                <button onClick={onBack} className="btn-primary px-6 py-3 rounded-xl">
                    Upgrade Now
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white pb-24">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-black/80 backdrop-blur-xl border-b border-white/10">
                <div className="flex items-center justify-between p-4">
                    <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-full">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <h1 className="text-xl font-bold">Analytics</h1>
                    <div className="w-10" />
                </div>
            </div>

            <div className="p-4">
                {/* Style Score */}
                <div className="glass-card rounded-2xl p-6 mb-6 text-center">
                    <div className="relative w-32 h-32 mx-auto mb-4">
                        <svg className="w-full h-full -rotate-90">
                            <circle cx="64" cy="64" r="56" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="12" />
                            <circle
                                cx="64" cy="64" r="56"
                                fill="none"
                                stroke="url(#scoreGradient)"
                                strokeWidth="12"
                                strokeLinecap="round"
                                strokeDasharray={`${styleScore * 3.52} 352`}
                            />
                            <defs>
                                <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" stopColor="#e5e5e5" />
                                    <stop offset="100%" stopColor="#737373" />
                                </linearGradient>
                            </defs>
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-4xl font-bold">{styleScore}</span>
                            <span className="text-sm text-gray-400">Style Score</span>
                        </div>
                    </div>
                    <p className="text-gray-400 text-sm">
                        {styleScore >= 80 ? 'Excellent! Your wardrobe is well-curated' :
                            styleScore >= 60 ? 'Good variety! Room for improvement' :
                                'Build more variety in your collection'}
                    </p>
                </div>

                {/* Overview Stats */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="glass-card rounded-xl p-4 text-center">
                        <div className="text-3xl font-bold">{analytics.totalItems}</div>
                        <div className="text-sm text-gray-400">Total Items</div>
                    </div>
                    <div className="glass-card rounded-xl p-4 text-center">
                        <div className="text-3xl font-bold">{formatCurrency(analytics.totalValue)}</div>
                        <div className="text-sm text-gray-400">Total Value</div>
                    </div>
                    <div className="glass-card rounded-xl p-4 text-center">
                        <div className="text-3xl font-bold">{analytics.itemsNeverWorn}</div>
                        <div className="text-sm text-gray-400">Never Worn</div>
                    </div>
                    <div className="glass-card rounded-xl p-4 text-center">
                        <div className="text-3xl font-bold">{analytics.averageItemAge}d</div>
                        <div className="text-sm text-gray-400">Avg Age</div>
                    </div>
                </div>

                {/* Insights */}
                <div className="glass-card rounded-2xl p-4 mb-6">
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <span className="text-gray-400">●</span> Insights
                    </h3>
                    <ul className="space-y-2">
                        {insights.map((insight, i) => (
                            <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                                <span className="text-gray-500">•</span>
                                {insight}
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Category Breakdown */}
                <div className="glass-card rounded-2xl p-4 mb-6">
                    <h3 className="font-semibold mb-4">Category Breakdown</h3>
                    <div className="space-y-3">
                        {analytics.categoryBreakdown.map(cat => {
                            const label = {
                                'Top': 'Tops',
                                'Bottom': 'Bottoms',
                                'Shoes': 'Footwear',
                                'Accessory': 'Accessories',
                                'Other': 'Miscellaneous',
                                'Outerwear': 'Outerwear',
                                'Dress': 'Dresses'
                            }[cat.category] || cat.category;

                            return (
                                <div key={cat.category}>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span>{label}</span>
                                        <span className="text-gray-400">{cat.count} ({cat.percentage}%)</span>
                                    </div>
                                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-white/80 to-gray-500 rounded-full"
                                            style={{ width: `${cat.percentage}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Color Distribution */}
                <div className="glass-card rounded-2xl p-4 mb-6">
                    <h3 className="font-semibold mb-4">Color Distribution</h3>
                    <div className="flex flex-wrap gap-2">
                        {analytics.colorDistribution.map(color => (
                            <div key={color.color} className="flex items-center gap-2 glass-card rounded-lg px-3 py-2">
                                <div
                                    className="w-4 h-4 rounded-full border border-white/20 shadow-lg"
                                    style={getColorStyle(color.color)}
                                />
                                <span className="text-sm capitalize">{color.color}</span>
                                <span className="text-xs text-gray-400">{color.count}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Most Worn */}
                {analytics.mostWornItems.length > 0 && (
                    <div className="glass-card rounded-2xl p-4 mb-6">
                        <h3 className="font-semibold mb-4">Most Worn Items</h3>
                        <div className="space-y-3">
                            {analytics.mostWornItems.slice(0, 5).map(({ item, wearCount }) => (
                                <div key={item.id} className="flex items-center gap-3">
                                    <img src={item.imageData} alt={item.description} className="w-12 h-12 rounded-lg object-cover" />
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium truncate">{item.description}</p>
                                        <p className="text-sm text-gray-400">{wearCount} wears</p>
                                    </div>
                                    <div className="text-white font-medium">★</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Cost Per Wear */}
                {analytics.costPerWear.length > 0 && (
                    <div className="glass-card rounded-2xl p-4 mb-6">
                        <h3 className="font-semibold mb-4">Best Value (Low Cost Per Wear)</h3>
                        <div className="space-y-3">
                            {analytics.costPerWear.slice(0, 5).map(({ item, cost }) => (
                                <div key={item.id} className="flex items-center gap-3">
                                    <img src={item.imageData} alt={item.description} className="w-12 h-12 rounded-lg object-cover" />
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium truncate">{item.description}</p>
                                        <p className="text-sm text-gray-400">{formatCurrency(item.purchasePrice || 0)} total</p>
                                    </div>
                                    <div className="text-gray-300 font-medium">{formatCurrency(cost)}/wear</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Season Breakdown */}
                <div className="glass-card rounded-2xl p-4 mb-6">
                    <h3 className="font-semibold mb-4">Season Coverage</h3>
                    <div className="grid grid-cols-2 gap-3">
                        {analytics.seasonBreakdown.map(s => (
                            <div key={s.season} className="flex items-center gap-2 p-3 bg-white/5 rounded-xl">
                                <span className="text-xl">
                                    {s.season === 'summer' ? '☀️' : s.season === 'winter' ? '❄️' :
                                        s.season === 'spring' ? '🌸' : s.season === 'fall' ? '🍂' : '🌍'}
                                </span>
                                <div>
                                    <span className="capitalize font-medium">{s.season}</span>
                                    <span className="text-sm text-gray-400 ml-2">{s.count}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Shopping Recommendations */}
                {recommendations.length > 0 && (
                    <div className="glass-card rounded-2xl p-4 border-blue-500/30">
                        <h3 className="font-semibold mb-3 flex items-center gap-2">
                            <span className="text-blue-400">🛍️</span> Shopping Suggestions
                        </h3>
                        <ul className="space-y-2">
                            {recommendations.map((rec, i) => (
                                <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                                    <span className="text-blue-400">•</span>
                                    {rec}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AnalyticsView;

// Analytics Service - Wardrobe insights and statistics
import { WardrobeItem, WardrobeAnalytics, ClothingCategory } from '../types';

// Calculate complete wardrobe analytics
export function calculateAnalytics(wardrobe: WardrobeItem[]): WardrobeAnalytics {
    if (wardrobe.length === 0) {
        return {
            totalItems: 0,
            totalValue: 0,
            mostWornItems: [],
            leastWornItems: [],
            costPerWear: [],
            categoryBreakdown: [],
            colorDistribution: [],
            seasonBreakdown: [],
            averageItemAge: 0,
            itemsNeverWorn: 0
        };
    }

    // Total items and value
    const totalItems = wardrobe.length;
    const totalValue = wardrobe.reduce((sum, item) => sum + (item.purchasePrice || 0), 0);

    // Sort by wear count
    const sortedByWear = [...wardrobe]
        .filter(item => item.wearCount !== undefined)
        .sort((a, b) => (b.wearCount || 0) - (a.wearCount || 0));

    const mostWornItems = sortedByWear.slice(0, 5).map(item => ({
        item,
        wearCount: item.wearCount || 0
    }));

    const leastWornItems = sortedByWear.slice(-5).reverse().map(item => ({
        item,
        wearCount: item.wearCount || 0
    }));

    // Cost per wear
    const costPerWear = wardrobe
        .filter(item => item.purchasePrice && item.wearCount && item.wearCount > 0)
        .map(item => ({
            item,
            cost: Math.round((item.purchasePrice || 0) / (item.wearCount || 1))
        }))
        .sort((a, b) => a.cost - b.cost)
        .slice(0, 10);

    // Category breakdown
    const categoryCount: Partial<Record<ClothingCategory, number>> = {};
    wardrobe.forEach(item => {
        categoryCount[item.category] = (categoryCount[item.category] || 0) + 1;
    });

    const categoryBreakdown = Object.entries(categoryCount).map(([category, count]) => ({
        category: category as ClothingCategory,
        count: count || 0,
        percentage: Math.round(((count || 0) / totalItems) * 100)
    })).sort((a, b) => b.count - a.count);

    // Color distribution
    const colorCount: Record<string, number> = {};
    wardrobe.forEach(item => {
        item.colors.forEach(color => {
            const normalizedColor = color.toLowerCase();
            colorCount[normalizedColor] = (colorCount[normalizedColor] || 0) + 1;
        });
    });

    const totalColorTags = Object.values(colorCount).reduce((a, b) => a + b, 0);
    const colorDistribution = Object.entries(colorCount)
        .map(([color, count]) => ({
            color,
            count,
            percentage: Math.round((count / totalColorTags) * 100)
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

    // Season breakdown
    const seasonCount: Record<string, number> = {};
    wardrobe.forEach(item => {
        item.season.forEach(season => {
            seasonCount[season] = (seasonCount[season] || 0) + 1;
        });
    });

    const seasonBreakdown = Object.entries(seasonCount).map(([season, count]) => ({
        season,
        count
    })).sort((a, b) => b.count - a.count);

    // Average item age
    const now = Date.now();
    const ages = wardrobe.map(item => now - item.createdAt);
    const averageItemAge = Math.round(ages.reduce((a, b) => a + b, 0) / ages.length / (1000 * 60 * 60 * 24));

    // Items never worn
    const itemsNeverWorn = wardrobe.filter(item => !item.wearCount || item.wearCount === 0).length;

    return {
        totalItems,
        totalValue,
        mostWornItems,
        leastWornItems,
        costPerWear,
        categoryBreakdown,
        colorDistribution,
        seasonBreakdown,
        averageItemAge,
        itemsNeverWorn
    };
}

// Get insights based on analytics
export function getInsights(analytics: WardrobeAnalytics): string[] {
    const insights: string[] = [];

    if (analytics.totalItems === 0) {
        return ['Start adding items to your wardrobe to see insights!'];
    }

    // Value insight
    if (analytics.totalValue > 0) {
        const avgValue = Math.round(analytics.totalValue / analytics.totalItems);
        insights.push(`Your wardrobe is worth ₹${analytics.totalValue.toLocaleString()} (avg ₹${avgValue}/item)`);
    }

    // Most worn insight
    if (analytics.mostWornItems.length > 0) {
        const topItem = analytics.mostWornItems[0];
        insights.push(`"${topItem.item.description}" is your favorite item with ${topItem.wearCount} wears!`);
    }

    // Never worn insight
    if (analytics.itemsNeverWorn > 0) {
        const percentage = Math.round((analytics.itemsNeverWorn / analytics.totalItems) * 100);
        insights.push(`${analytics.itemsNeverWorn} items (${percentage}%) have never been worn`);
    }

    // Best value insight
    if (analytics.costPerWear.length > 0) {
        const bestValue = analytics.costPerWear[0];
        insights.push(`Best value: "${bestValue.item.description}" at ₹${bestValue.cost}/wear`);
    }

    // Category dominance
    if (analytics.categoryBreakdown.length > 0) {
        const topCategory = analytics.categoryBreakdown[0];
        if (topCategory.percentage > 40) {
            insights.push(`Your wardrobe is ${topCategory.percentage}% ${topCategory.category.toLowerCase()}s - consider diversifying!`);
        }
    }

    // Color insight
    if (analytics.colorDistribution.length > 0) {
        const topColors = analytics.colorDistribution.slice(0, 3).map(c => c.color).join(', ');
        insights.push(`Top colors: ${topColors}`);
    }

    return insights;
}

// Generate shopping recommendations
export function getShoppingRecommendations(analytics: WardrobeAnalytics): string[] {
    const recommendations: string[] = [];

    // Find underrepresented categories
    const allCategories = Object.values(ClothingCategory);
    const existingCategories = new Set(analytics.categoryBreakdown.map(c => c.category));

    allCategories.forEach(cat => {
        if (!existingCategories.has(cat)) {
            recommendations.push(`Add some ${cat.toLowerCase()}s to your wardrobe`);
        }
    });

    // Season gaps
    const seasons = ['summer', 'winter', 'spring', 'fall'];
    const existingSeasons = new Set(analytics.seasonBreakdown.map(s => s.season));
    seasons.forEach(season => {
        if (!existingSeasons.has(season)) {
            recommendations.push(`Consider adding ${season} pieces`);
        }
    });

    // Neutral base
    const neutralColors = ['black', 'white', 'gray', 'navy', 'beige'];
    const hasNeutrals = analytics.colorDistribution.some(c =>
        neutralColors.includes(c.color.toLowerCase())
    );
    if (!hasNeutrals) {
        recommendations.push('Add neutral basics (black, white, gray) for versatility');
    }

    return recommendations.slice(0, 5);
}

// Format currency
export function formatCurrency(amount: number): string {
    return `₹${amount.toLocaleString('en-IN')}`;
}

// Calculate style score
export function calculateStyleScore(analytics: WardrobeAnalytics): number {
    let score = 50; // Base score

    // Variety bonus
    score += Math.min(analytics.categoryBreakdown.length * 5, 15);

    // Color diversity bonus
    score += Math.min(analytics.colorDistribution.length * 2, 10);

    // Season coverage bonus
    score += Math.min(analytics.seasonBreakdown.length * 3, 12);

    // Utilization bonus (fewer unworn items = better)
    const utilization = 1 - (analytics.itemsNeverWorn / analytics.totalItems);
    score += Math.round(utilization * 13);

    return Math.min(100, score);
}

// Capsule Wardrobe Service - Minimal wardrobe generator
import { CapsuleWardrobe, WardrobeItem, ClothingCategory } from '../types';

const CAPSULE_KEY = 'styaile_capsules';

// Ideal capsule composition
const CAPSULE_TEMPLATE = {
    'spring': {
        [ClothingCategory.TOP]: 6,
        [ClothingCategory.BOTTOM]: 4,
        [ClothingCategory.DRESS]: 2,
        [ClothingCategory.OUTERWEAR]: 2,
        [ClothingCategory.SHOES]: 3,
        [ClothingCategory.ACCESSORY]: 3
    },
    'summer': {
        [ClothingCategory.TOP]: 7,
        [ClothingCategory.BOTTOM]: 4,
        [ClothingCategory.DRESS]: 3,
        [ClothingCategory.OUTERWEAR]: 1,
        [ClothingCategory.SHOES]: 3,
        [ClothingCategory.ACCESSORY]: 4
    },
    'fall': {
        [ClothingCategory.TOP]: 6,
        [ClothingCategory.BOTTOM]: 4,
        [ClothingCategory.DRESS]: 2,
        [ClothingCategory.OUTERWEAR]: 3,
        [ClothingCategory.SHOES]: 3,
        [ClothingCategory.ACCESSORY]: 3
    },
    'winter': {
        [ClothingCategory.TOP]: 5,
        [ClothingCategory.BOTTOM]: 4,
        [ClothingCategory.DRESS]: 1,
        [ClothingCategory.OUTERWEAR]: 4,
        [ClothingCategory.SHOES]: 3,
        [ClothingCategory.ACCESSORY]: 4
    },
    'all-season': {
        [ClothingCategory.TOP]: 8,
        [ClothingCategory.BOTTOM]: 5,
        [ClothingCategory.DRESS]: 3,
        [ClothingCategory.OUTERWEAR]: 3,
        [ClothingCategory.SHOES]: 4,
        [ClothingCategory.ACCESSORY]: 5
    }
};

// Get all capsule wardrobes
export function getCapsuleWardrobes(): CapsuleWardrobe[] {
    try {
        const stored = localStorage.getItem(CAPSULE_KEY);
        if (stored) {
            return JSON.parse(stored);
        }
    } catch (e) {
        console.error('Failed to get capsules:', e);
    }
    return [];
}

// Save capsule wardrobe
export function saveCapsuleWardrobe(capsule: CapsuleWardrobe): void {
    const capsules = getCapsuleWardrobes();
    const index = capsules.findIndex(c => c.id === capsule.id);
    if (index >= 0) {
        capsules[index] = capsule;
    } else {
        capsules.unshift(capsule);
    }
    localStorage.setItem(CAPSULE_KEY, JSON.stringify(capsules));
}

// Delete capsule wardrobe
export function deleteCapsuleWardrobe(id: string): void {
    const capsules = getCapsuleWardrobes().filter(c => c.id !== id);
    localStorage.setItem(CAPSULE_KEY, JSON.stringify(capsules));
}

// Analyze gap in wardrobe
export function analyzeGap(
    wardrobe: WardrobeItem[],
    season: CapsuleWardrobe['season']
): CapsuleWardrobe['gapAnalysis'] {
    const template = CAPSULE_TEMPLATE[season];
    const missingCategories: ClothingCategory[] = [];
    const suggestions: string[] = [];

    // Filter items by season
    const seasonItems = wardrobe.filter(item =>
        item.season.includes(season) || item.season.includes('all-season')
    );

    // Count by category
    const counts: Partial<Record<ClothingCategory, number>> = {};
    for (const item of seasonItems) {
        counts[item.category] = (counts[item.category] || 0) + 1;
    }

    // Find gaps
    for (const [cat, needed] of Object.entries(template)) {
        const category = cat as ClothingCategory;
        const have = counts[category] || 0;
        const diff = needed - have;

        if (diff > 0) {
            missingCategories.push(category);
            if (diff === 1) {
                suggestions.push(`Add 1 more ${category.toLowerCase()}`);
            } else {
                suggestions.push(`Add ${diff} more ${category.toLowerCase()}s`);
            }
        }
    }

    // Color variety check
    const colorSet = new Set<string>();
    seasonItems.forEach(item => item.colors.forEach(c => colorSet.add(c)));
    if (colorSet.size < 5) {
        suggestions.push('Consider adding items in more diverse colors');
    }

    // Neutral base check
    const neutralColors = ['black', 'white', 'gray', 'navy', 'beige', 'brown', 'khaki'];
    const neutralItems = seasonItems.filter(item =>
        item.colors.some(c => neutralColors.includes(c.toLowerCase()))
    );
    if (neutralItems.length < 5) {
        suggestions.push('Add more neutral base pieces for versatility');
    }

    return { missingCategories, suggestions };
}

// Generate capsule wardrobe from existing items
export function generateCapsuleWardrobe(
    name: string,
    wardrobe: WardrobeItem[],
    season: CapsuleWardrobe['season']
): CapsuleWardrobe {
    const template = CAPSULE_TEMPLATE[season];
    const targetCount = Object.values(template).reduce((a, b) => a + b, 0);

    // Filter and score items
    const seasonItems = wardrobe
        .filter(item => item.season.includes(season) || item.season.includes('all-season'))
        .map(item => {
            let score = 0;

            // Versatility score
            score += item.occasions.length;

            // Neutral color bonus
            const neutralColors = ['black', 'white', 'gray', 'navy', 'beige', 'brown'];
            if (item.colors.some(c => neutralColors.includes(c.toLowerCase()))) {
                score += 2;
            }

            // Wear count (prefer well-loved items)
            if (item.wearCount) {
                score += Math.min(item.wearCount / 5, 3);
            }

            // Favorite bonus
            if (item.isFavorite) score += 3;

            return { item, score };
        })
        .sort((a, b) => b.score - a.score);

    // Select items by category
    const selectedIds: string[] = [];
    for (const [cat, count] of Object.entries(template)) {
        const category = cat as ClothingCategory;
        const categoryItems = seasonItems
            .filter(s => s.item.category === category)
            .slice(0, count);
        categoryItems.forEach(s => selectedIds.push(s.item.id));
    }

    const gapAnalysis = analyzeGap(wardrobe, season);

    const capsule: CapsuleWardrobe = {
        id: `capsule_${Date.now()}`,
        name,
        season,
        itemIds: selectedIds,
        targetCount,
        gapAnalysis,
        createdAt: Date.now()
    };

    saveCapsuleWardrobe(capsule);
    return capsule;
}

// Get capsule progress
export function getCapsuleProgress(capsule: CapsuleWardrobe): number {
    return Math.min(100, Math.round((capsule.itemIds.length / capsule.targetCount) * 100));
}

// Get capsule statistics
export function getCapsuleStats(capsule: CapsuleWardrobe, wardrobe: WardrobeItem[]): {
    totalItems: number;
    byCategory: { category: ClothingCategory; count: number }[];
    topColors: string[];
    possibleOutfits: number;
} {
    const items = wardrobe.filter(w => capsule.itemIds.includes(w.id));

    // Count by category
    const categoryCount: Partial<Record<ClothingCategory, number>> = {};
    items.forEach(item => {
        categoryCount[item.category] = (categoryCount[item.category] || 0) + 1;
    });

    const byCategory = Object.entries(categoryCount).map(([category, count]) => ({
        category: category as ClothingCategory,
        count: count || 0
    }));

    // Top colors
    const colorCount: Record<string, number> = {};
    items.forEach(item => {
        item.colors.forEach(c => {
            colorCount[c] = (colorCount[c] || 0) + 1;
        });
    });
    const topColors = Object.entries(colorCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([color]) => color);

    // Calculate possible outfits (simplified)
    const tops = categoryCount[ClothingCategory.TOP] || 0;
    const bottoms = categoryCount[ClothingCategory.BOTTOM] || 0;
    const dresses = categoryCount[ClothingCategory.DRESS] || 0;
    const possibleOutfits = (tops * bottoms) + dresses;

    return {
        totalItems: items.length,
        byCategory,
        topColors,
        possibleOutfits
    };
}

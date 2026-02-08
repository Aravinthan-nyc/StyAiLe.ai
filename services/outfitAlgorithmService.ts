/**
 * Outfit Recommendation Algorithm Service (Simplified)
 * Matches clothes based on category, color, and occasion
 * No user profile required - works with existing wardrobe data
 */

import {
    WardrobeItem,
    OccasionType,
    AlgorithmOutfitSuggestion,
    ClothingCategory,
} from '../types';

// ============================================
// Color Compatibility Data
// ============================================

// Neutral colors that match with everything
const NEUTRAL_COLORS = ['black', 'white', 'gray', 'grey', 'navy', 'beige', 'cream', 'brown', 'khaki', 'tan'];

// Complementary color pairs
const COLOR_HARMONIES: Record<string, string[]> = {
    blue: ['orange', 'white', 'cream', 'brown', 'gold'],
    red: ['white', 'black', 'cream', 'navy', 'gold'],
    green: ['brown', 'cream', 'white', 'gold', 'burgundy'],
    yellow: ['purple', 'navy', 'brown', 'black', 'grey'],
    pink: ['grey', 'navy', 'white', 'cream', 'black'],
    purple: ['yellow', 'cream', 'gold', 'grey', 'white'],
    orange: ['blue', 'navy', 'brown', 'cream', 'white'],
    maroon: ['cream', 'white', 'gold', 'beige', 'pink'],
    teal: ['cream', 'coral', 'brown', 'gold', 'white'],
};

// ============================================
// Occasion Configuration
// ============================================

interface OccasionConfig {
    label: string;
    emoji: string;
    preferredTags: string[];
    preferredMoods: string[];
    formalityLevel: number; // 1-10
}

const OCCASION_CONFIG: Record<OccasionType, OccasionConfig> = {
    COLLEGE: {
        label: 'College',
        emoji: '🎓',
        preferredTags: ['casual', 'comfortable', 'relaxed', 'sporty', 'everyday'],
        preferredMoods: ['relaxed', 'energetic', 'fun'],
        formalityLevel: 2,
    },
    FEST: {
        label: 'Festival',
        emoji: '🎉',
        preferredTags: ['trendy', 'bold', 'statement', 'colorful', 'fun'],
        preferredMoods: ['energetic', 'fun', 'vibrant'],
        formalityLevel: 3,
    },
    FAMILY_FUNCTION: {
        label: 'Family Function',
        emoji: '👨‍👩‍👧‍👦',
        preferredTags: ['formal', 'elegant', 'traditional', 'ethnic', 'classy'],
        preferredMoods: ['elegant', 'professional', 'warm'],
        formalityLevel: 7,
    },
    PARTY: {
        label: 'Party',
        emoji: '🎊',
        preferredTags: ['party', 'bold', 'trendy', 'statement', 'glam'],
        preferredMoods: ['fun', 'energetic', 'confident'],
        formalityLevel: 5,
    },
    CASUAL: {
        label: 'Casual',
        emoji: '☀️',
        preferredTags: ['casual', 'comfortable', 'everyday', 'relaxed'],
        preferredMoods: ['relaxed', 'comfortable', 'easy'],
        formalityLevel: 1,
    },
    WORK: {
        label: 'Work',
        emoji: '💼',
        preferredTags: ['formal', 'professional', 'office', 'business', 'smart'],
        preferredMoods: ['professional', 'confident', 'elegant'],
        formalityLevel: 8,
    },
    DATE: {
        label: 'Date Night',
        emoji: '💕',
        preferredTags: ['romantic', 'elegant', 'chic', 'stylish', 'classy'],
        preferredMoods: ['romantic', 'elegant', 'confident'],
        formalityLevel: 6,
    },
};

// ============================================
// Helper Functions
// ============================================

/**
 * Check if a color is neutral
 */
function isNeutralColor(color: string): boolean {
    const lowerColor = color.toLowerCase();
    return NEUTRAL_COLORS.some(n => lowerColor.includes(n));
}

/**
 * Check if two items have compatible colors
 */
function areColorsCompatible(colors1: string[], colors2: string[]): boolean {
    const c1 = colors1.map(c => c.toLowerCase());
    const c2 = colors2.map(c => c.toLowerCase());

    // Neutral + anything = compatible
    if (c1.some(isNeutralColor) || c2.some(isNeutralColor)) {
        return true;
    }

    // Same color family = compatible
    if (c1.some(color => c2.some(c => c.includes(color) || color.includes(c)))) {
        return true;
    }

    // Check color harmonies
    for (const color of c1) {
        const harmonies = Object.entries(COLOR_HARMONIES).find(([key]) => color.includes(key));
        if (harmonies && c2.some(c => harmonies[1].some(h => c.includes(h)))) {
            return true;
        }
    }

    return false;
}

/**
 * Check if two categories can be worn together
 */
function areCategoriesCompatible(cat1: ClothingCategory, cat2: ClothingCategory): boolean {
    const incompatible = [
        [ClothingCategory.TOP, ClothingCategory.TOP],
        [ClothingCategory.BOTTOM, ClothingCategory.BOTTOM],
        [ClothingCategory.DRESS, ClothingCategory.TOP],
        [ClothingCategory.DRESS, ClothingCategory.BOTTOM],
        [ClothingCategory.SHOES, ClothingCategory.SHOES],
    ];

    return !incompatible.some(
        ([a, b]) => (cat1 === a && cat2 === b) || (cat1 === b && cat2 === a)
    );
}

/**
 * Score how well an item matches an occasion
 */
function scoreOccasionMatch(item: WardrobeItem, occasion: OccasionType): number {
    const config = OCCASION_CONFIG[occasion];
    let score = 0;

    // Check if item occasions include this occasion
    const occasionLabel = config.label.toLowerCase();
    if (item.occasions.some(o => o.toLowerCase().includes(occasionLabel))) {
        score += 40;
    }

    // Check tag matches
    for (const tag of item.tags) {
        if (config.preferredTags.some(pt => tag.toLowerCase().includes(pt))) {
            score += 10;
        }
    }

    // Check mood matches
    for (const mood of item.mood) {
        if (config.preferredMoods.some(pm => mood.toLowerCase().includes(pm))) {
            score += 10;
        }
    }

    return Math.min(100, score);
}

/**
 * Score color compatibility between items
 */
function scoreColorMatch(item1: WardrobeItem, item2: WardrobeItem): number {
    if (areColorsCompatible(item1.colors, item2.colors)) {
        // Both neutrals = 70, one neutral = 80, complementary = 90
        const bothNeutral = item1.colors.some(c => isNeutralColor(c)) &&
            item2.colors.some(c => isNeutralColor(c));
        if (bothNeutral) return 70;

        const oneNeutral = item1.colors.some(c => isNeutralColor(c)) ||
            item2.colors.some(c => isNeutralColor(c));
        if (oneNeutral) return 80;

        return 90; // Complementary colors
    }
    return 30; // Not compatible
}

// ============================================
// Outfit Construction
// ============================================

interface ScoredOutfit {
    items: WardrobeItem[];
    totalScore: number;
    occasionScore: number;
    colorScore: number;
}

/**
 * Build outfit combinations from wardrobe
 */
function buildOutfitCombinations(
    wardrobe: WardrobeItem[],
    occasion: OccasionType
): ScoredOutfit[] {
    const outfits: ScoredOutfit[] = [];

    // Group items by category
    const tops = wardrobe.filter(i => i.category === ClothingCategory.TOP);
    const bottoms = wardrobe.filter(i => i.category === ClothingCategory.BOTTOM);
    const dresses = wardrobe.filter(i => i.category === ClothingCategory.DRESS);
    const shoes = wardrobe.filter(i => i.category === ClothingCategory.SHOES);
    const outerwear = wardrobe.filter(i => i.category === ClothingCategory.OUTERWEAR);
    const accessories = wardrobe.filter(i => i.category === ClothingCategory.ACCESSORY);

    // Strategy 1: Top + Bottom combinations
    for (const top of tops) {
        for (const bottom of bottoms) {
            const occasionScore = (scoreOccasionMatch(top, occasion) + scoreOccasionMatch(bottom, occasion)) / 2;
            const colorScore = scoreColorMatch(top, bottom);
            const totalScore = (occasionScore * 0.6) + (colorScore * 0.4);

            const outfit: ScoredOutfit = {
                items: [top, bottom],
                totalScore,
                occasionScore,
                colorScore,
            };

            // Try adding shoes
            const bestShoe = shoes.find(s => areColorsCompatible(s.colors, [...top.colors, ...bottom.colors]));
            if (bestShoe) {
                outfit.items.push(bestShoe);
                outfit.totalScore += 5; // Bonus for complete outfit
            }

            outfits.push(outfit);
        }
    }

    // Strategy 2: Dress outfits
    for (const dress of dresses) {
        const occasionScore = scoreOccasionMatch(dress, occasion);
        const colorScore = 80; // Dresses are self-coordinated

        const outfit: ScoredOutfit = {
            items: [dress],
            totalScore: (occasionScore * 0.6) + (colorScore * 0.4),
            occasionScore,
            colorScore,
        };

        // Try adding accessories or shoes
        const bestShoe = shoes.find(s => areColorsCompatible(s.colors, dress.colors));
        if (bestShoe) {
            outfit.items.push(bestShoe);
            outfit.totalScore += 5;
        }

        const accessory = accessories.find(a => areColorsCompatible(a.colors, dress.colors));
        if (accessory) {
            outfit.items.push(accessory);
            outfit.totalScore += 3;
        }

        outfits.push(outfit);
    }

    // Strategy 3: Layered outfits (Top + Bottom + Outerwear)
    for (const top of tops) {
        for (const outer of outerwear) {
            if (areColorsCompatible(top.colors, outer.colors)) {
                const bottom = bottoms.find(b =>
                    areColorsCompatible(b.colors, top.colors) &&
                    areColorsCompatible(b.colors, outer.colors)
                );

                if (bottom) {
                    const occasionScore = (
                        scoreOccasionMatch(top, occasion) +
                        scoreOccasionMatch(bottom, occasion) +
                        scoreOccasionMatch(outer, occasion)
                    ) / 3;
                    const colorScore = (
                        scoreColorMatch(top, outer) +
                        scoreColorMatch(top, bottom)
                    ) / 2;

                    outfits.push({
                        items: [top, bottom, outer],
                        totalScore: (occasionScore * 0.6) + (colorScore * 0.4) + 8, // Bonus for layered look
                        occasionScore,
                        colorScore,
                    });
                }
            }
        }
    }

    return outfits;
}

/**
 * Generate creative outfit name
 */
function generateOutfitName(outfit: ScoredOutfit, occasion: OccasionType, index: number): string {
    const config = OCCASION_CONFIG[occasion];

    const nameTemplates: Record<OccasionType, string[]> = {
        COLLEGE: ['Campus Cool', 'Study Buddy', 'Chill Vibes', 'Easy Day'],
        FEST: ['Festival Ready', 'Party Mode', 'Stand Out', 'Vibe Check'],
        FAMILY_FUNCTION: ['Classic Elegance', 'Family Fab', 'Graceful Look', 'Timeless Style'],
        PARTY: ['Night Owl', 'Party Perfect', 'Dance Floor', 'Show Stopper'],
        CASUAL: ['Weekend Ease', 'Everyday Chic', 'Comfort Zone', 'Relaxed Fit'],
        WORK: ['Power Move', 'Office Ready', 'Pro Style', 'Business Mode'],
        DATE: ['Romantic Edge', 'Sweet Look', 'Date Ready', 'Charming Style'],
    };

    const names = nameTemplates[occasion];
    return names[index % names.length];
}

/**
 * Generate reasoning for outfit
 */
function generateReasoning(outfit: ScoredOutfit, occasion: OccasionType): string {
    const reasons: string[] = [];

    if (outfit.colorScore >= 80) {
        reasons.push('Colors complement each other beautifully');
    } else if (outfit.colorScore >= 60) {
        reasons.push('Nice color coordination');
    }

    if (outfit.occasionScore >= 60) {
        reasons.push(`perfect for ${OCCASION_CONFIG[occasion].label.toLowerCase()}`);
    }

    if (outfit.items.length >= 3) {
        reasons.push('complete look with multiple pieces');
    }

    // Mention key items
    const descriptions = outfit.items.slice(0, 2).map(i => i.description);
    if (descriptions.length > 0) {
        reasons.push(`featuring ${descriptions.join(' with ')}`);
    }

    return reasons.length > 0
        ? reasons.join(' — ') + '.'
        : 'A solid outfit combination!';
}

// ============================================
// Main Entry Point
// ============================================

/**
 * Get outfit recommendations based on wardrobe and occasion
 */
export function getAlgorithmRecommendations(
    wardrobe: WardrobeItem[],
    occasion: OccasionType,
    limit: number = 3
): { suggestions: AlgorithmOutfitSuggestion[]; message: string } {
    // Cold start check
    if (wardrobe.length < 2) {
        return {
            suggestions: [],
            message: "Add at least 2 items to your wardrobe to get outfit suggestions! Start with a top and bottom, or a versatile dress.",
        };
    }

    // Build and score all possible combinations
    const outfits = buildOutfitCombinations(wardrobe, occasion);

    if (outfits.length === 0) {
        return {
            suggestions: [],
            message: "Couldn't create outfits with your current wardrobe. Try adding more variety — tops, bottoms, or dresses!",
        };
    }

    // Sort by score and take top K
    const sorted = outfits.sort((a, b) => b.totalScore - a.totalScore);
    const topOutfits = sorted.slice(0, limit);

    // Convert to suggestions
    const suggestions: AlgorithmOutfitSuggestion[] = topOutfits.map((outfit, index) => ({
        name: generateOutfitName(outfit, occasion, index),
        itemIds: outfit.items.map(i => i.id),
        reasoning: generateReasoning(outfit, occasion),
        compatibilityScore: Math.round(outfit.totalScore),
    }));

    const config = OCCASION_CONFIG[occasion];
    return {
        suggestions,
        message: `${config.emoji} Here are my top picks for ${config.label}!`,
    };
}

/**
 * Get occasion config for UI
 */
export function getOccasionOptions(): Array<{ id: OccasionType; label: string; emoji: string }> {
    return Object.entries(OCCASION_CONFIG).map(([id, config]) => ({
        id: id as OccasionType,
        label: config.label,
        emoji: config.emoji,
    }));
}

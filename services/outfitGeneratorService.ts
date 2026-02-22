// Outfit Generator Service - Smart outfit planning with laundry cycle management
import { WardrobeItem, OutfitSuggestion, ClothingCategory } from '../types';

export interface GeneratedOutfit {
    id: string;
    date: string;
    itemIds: string[];
    name: string;
    occasion: string;
    reasoning: string;
    score: number; // How well items match
}

export interface LaundryConfig {
    cycleDays: number; // How often user does laundry (default 7)
    lastLaundryDate: string; // ISO date
}

const LAUNDRY_CONFIG_KEY = 'styaile_laundry_config';
const ITEM_LOCKS_KEY = 'styaile_item_locks';

// Item lock tracking
interface ItemLock {
    itemId: string;
    lockedUntil: string; // ISO date
    usedInOutfit: string; // outfit ID
}

// Get laundry configuration
export function getLaundryConfig(): LaundryConfig {
    try {
        const stored = localStorage.getItem(LAUNDRY_CONFIG_KEY);
        if (stored) return JSON.parse(stored);
    } catch (e) {
        console.error('Failed to load laundry config:', e);
    }

    return {
        cycleDays: 7,
        lastLaundryDate: new Date().toISOString().split('T')[0]
    };
}

// Set laundry configuration
export function setLaundryConfig(config: LaundryConfig): void {
    localStorage.setItem(LAUNDRY_CONFIG_KEY, JSON.stringify(config));
}

// Get locked items
export function getLockedItems(): ItemLock[] {
    try {
        const stored = localStorage.getItem(ITEM_LOCKS_KEY);
        if (stored) {
            const locks = JSON.parse(stored) as ItemLock[];
            // Filter out expired locks
            const today = new Date().toISOString().split('T')[0];
            const activeLocks = locks.filter(lock => lock.lockedUntil >= today);
            // Save filtered list
            localStorage.setItem(ITEM_LOCKS_KEY, JSON.stringify(activeLocks));
            return activeLocks;
        }
    } catch (e) {
        console.error('Failed to load item locks:', e);
    }
    return [];
}

// Lock items for a date range
export function lockItems(itemIds: string[], startDate: string, outfitId: string): void {
    const config = getLaundryConfig();
    const locks = getLockedItems();

    // Calculate lock end date (start date + laundry cycle)
    const start = new Date(startDate);
    const lockedUntil = new Date(start);
    lockedUntil.setDate(lockedUntil.getDate() + config.cycleDays - 1);

    // Add new locks
    const newLocks: ItemLock[] = itemIds.map(itemId => ({
        itemId,
        lockedUntil: lockedUntil.toISOString().split('T')[0],
        usedInOutfit: outfitId
    }));

    // Merge with existing (remove old locks for same items)
    const otherLocks = locks.filter(lock => !itemIds.includes(lock.itemId));
    const allLocks = [...otherLocks, ...newLocks];

    localStorage.setItem(ITEM_LOCKS_KEY, JSON.stringify(allLocks));
}

// Unlock items (manual unlock or laundry day)
export function unlockItems(itemIds: string[]): void {
    const locks = getLockedItems();
    const remaining = locks.filter(lock => !itemIds.includes(lock.itemId));
    localStorage.setItem(ITEM_LOCKS_KEY, JSON.stringify(remaining));
}

// Check if item is available on a date
export function isItemAvailable(itemId: string, date: string): boolean {
    const locks = getLockedItems();
    const itemLock = locks.find(lock => lock.itemId === itemId);
    if (!itemLock) return true;
    return date > itemLock.lockedUntil;
}

// Get available items for a date
export function getAvailableItems(wardrobe: WardrobeItem[], date: string): WardrobeItem[] {
    return wardrobe.filter(item => isItemAvailable(item.id, date));
}

// Smart outfit generation algorithm
export function generateOutfit(
    wardrobe: WardrobeItem[],
    date: string,
    occasion?: string,
    weather?: 'hot' | 'warm' | 'cool' | 'cold'
): GeneratedOutfit | null {
    const availableItems = getAvailableItems(wardrobe, date);

    if (availableItems.length < 3) {
        return null; // Not enough items
    }

    // Determine season from date
    const dateObj = new Date(date);
    const month = dateObj.getMonth();
    let season: 'spring' | 'summer' | 'fall' | 'winter';
    if (month >= 2 && month <= 4) season = 'spring';
    else if (month >= 5 && month <= 7) season = 'summer';
    else if (month >= 8 && month <= 10) season = 'fall';
    else season = 'winter';

    // Filter by season if no weather specified
    const seasonalItems = weather
        ? availableItems
        : availableItems.filter(item => item.season.includes(season) || item.season.includes('all-season'));

    if (seasonalItems.length < 3) {
        return null;
    }

    // Determine outfit structure based on what's available
    const tops = seasonalItems.filter(i => i.category === ClothingCategory.TOP);
    const bottoms = seasonalItems.filter(i => i.category === ClothingCategory.BOTTOM);
    const dresses = seasonalItems.filter(i => i.category === ClothingCategory.DRESS);
    const shoes = seasonalItems.filter(i => i.category === ClothingCategory.SHOES);
    const outerwear = seasonalItems.filter(i => i.category === ClothingCategory.OUTERWEAR);
    const accessories = seasonalItems.filter(i => i.category === ClothingCategory.ACCESSORY);

    let selectedItems: WardrobeItem[] = [];
    let outfitType = '';

    // Try dress-based outfit first
    if (dresses.length > 0) {
        const dress = selectRandomWeighted(dresses);
        selectedItems.push(dress);
        outfitType = 'Dress';

        // Add shoes if available
        if (shoes.length > 0) {
            const matchingShoes = findBestMatch(dress, shoes);
            selectedItems.push(matchingShoes);
        }

        // Add outerwear if cool/cold
        if ((weather === 'cool' || weather === 'cold' || season === 'fall' || season === 'winter') && outerwear.length > 0) {
            const matchingOuterwear = findBestMatch(dress, outerwear);
            selectedItems.push(matchingOuterwear);
        }

        // Add accessory
        if (accessories.length > 0) {
            selectedItems.push(selectRandomWeighted(accessories));
        }
    }
    // Top + bottom outfit
    else if (tops.length > 0 && bottoms.length > 0) {
        const top = selectRandomWeighted(tops);
        const bottom = findBestMatch(top, bottoms);
        selectedItems.push(top, bottom);
        outfitType = 'Separates';

        // Add shoes
        if (shoes.length > 0) {
            const matchingShoes = findBestMatch(top, shoes);
            selectedItems.push(matchingShoes);
        }

        // Add outerwear if needed
        if ((weather === 'cool' || weather === 'cold' || season === 'fall' || season === 'winter') && outerwear.length > 0) {
            const matchingOuterwear = findBestMatch(top, outerwear);
            selectedItems.push(matchingOuterwear);
        }

        // Add accessory
        if (accessories.length > 0) {
            selectedItems.push(selectRandomWeighted(accessories));
        }
    } else {
        return null; // Can't create complete outfit
    }

    // Calculate outfit score
    const score = calculateOutfitScore(selectedItems);

    // Generate outfit name and reasoning
    const name = generateOutfitName(selectedItems, occasion, season);
    const reasoning = generateReasoning(selectedItems, occasion, season);

    const outfitId = `outfit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    return {
        id: outfitId,
        date,
        itemIds: selectedItems.map(i => i.id),
        name,
        occasion: occasion || determineOccasion(selectedItems),
        reasoning,
        score
    };
}

// Generate multiple outfits for a week
export function generateWeekOutfits(
    wardrobe: WardrobeItem[],
    startDate: string,
    days: number = 7
): GeneratedOutfit[] {
    const outfits: GeneratedOutfit[] = [];
    const start = new Date(startDate);
    const usedItemIds = new Set<string>(); // Track items used in this week's plan

    for (let i = 0; i < days; i++) {
        const currentDate = new Date(start);
        currentDate.setDate(start.getDate() + i);
        const dateStr = currentDate.toISOString().split('T')[0];

        // Determine occasion based on day of week
        const dayOfWeek = currentDate.getDay();
        let occasion = 'casual';
        if (dayOfWeek >= 1 && dayOfWeek <= 5) occasion = 'work'; // Weekdays
        else if (dayOfWeek === 6) occasion = 'casual'; // Saturday
        else occasion = 'casual'; // Sunday

        // Filter wardrobe to exclude items used in previous days (simulating laundry cycle)
        // Check if item is available (not locked from previous laundry cycles) AND not used in current week
        const availableWardrobe = wardrobe.filter(item => isItemAvailable(item.id, dateStr) && !usedItemIds.has(item.id));

        const outfit = generateOutfit(availableWardrobe, dateStr, occasion);
        if (outfit) {
            outfits.push(outfit);
            // Track used items to prevent reuse in the same week
            outfit.itemIds.forEach(id => usedItemIds.add(id));
        }
    }

    // Lock all items AFTER generating all outfits
    outfits.forEach(outfit => {
        lockItems(outfit.itemIds, outfit.date, outfit.id);
    });

    return outfits;
}

// Helper: Select item with preference for less-worn items
function selectRandomWeighted(items: WardrobeItem[]): WardrobeItem {
    // Prefer items worn less
    const weights = items.map(item => {
        const wearCount = item.wearCount || 0;
        return Math.max(1, 10 - wearCount); // Higher weight for less-worn items
    });

    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    let random = Math.random() * totalWeight;

    for (let i = 0; i < items.length; i++) {
        random -= weights[i];
        if (random <= 0) return items[i];
    }

    return items[items.length - 1];
}

// Helper: Find item that matches best with given item
function findBestMatch(baseItem: WardrobeItem, candidates: WardrobeItem[]): WardrobeItem {
    // Score each candidate
    const scored = candidates.map(candidate => {
        let score = 0;

        // Color harmony (shared colors = good)
        const sharedColors = baseItem.colors.filter(c =>
            candidate.colors.some(cc => cc.toLowerCase() === c.toLowerCase())
        );
        score += sharedColors.length * 3;

        // Neutral colors always match
        const neutrals = ['black', 'white', 'gray', 'grey', 'beige', 'cream', 'navy'];
        const hasNeutral = candidate.colors.some(c =>
            neutrals.some(n => c.toLowerCase().includes(n))
        );
        if (hasNeutral) score += 2;

        // Occasion match
        const sharedOccasions = baseItem.occasions.filter(o => candidate.occasions.includes(o));
        score += sharedOccasions.length * 2;

        // Season match
        const sharedSeasons = baseItem.season.filter(s => candidate.season.includes(s));
        score += sharedSeasons.length;

        // Prefer less worn items
        score += Math.max(0, 5 - (candidate.wearCount || 0));

        return { item: candidate, score };
    });

    // Sort by score and pick best
    scored.sort((a, b) => b.score - a.score);
    return scored[0].item;
}

// Calculate how well outfit items work together
function calculateOutfitScore(items: WardrobeItem[]): number {
    let score = 50; // Base score

    // Check color harmony
    const allColors = items.flatMap(i => i.colors);
    const uniqueColors = new Set(allColors.map(c => c.toLowerCase()));

    // Penalize too many colors
    if (uniqueColors.size > 4) score -= (uniqueColors.size - 4) * 5;

    // Bonus for coordinated colors
    const colorCounts = new Map<string, number>();
    allColors.forEach(c => {
        const lower = c.toLowerCase();
        colorCounts.set(lower, (colorCounts.get(lower) || 0) + 1);
    });
    const repeatedColors = Array.from(colorCounts.values()).filter(count => count > 1).length;
    score += repeatedColors * 5;

    // Check occasion consistency
    const occasions = items.flatMap(i => i.occasions);
    const occasionCounts = new Map<string, number>();
    occasions.forEach(o => occasionCounts.set(o, (occasionCounts.get(o) || 0) + 1));
    const dominantOccasion = Math.max(...occasionCounts.values());
    if (dominantOccasion >= items.length * 0.6) score += 10;

    // Bonus for having complete outfit
    const categories = new Set(items.map(i => i.category));
    if (categories.has(ClothingCategory.SHOES)) score += 10;
    if (categories.has(ClothingCategory.ACCESSORY)) score += 5;

    return Math.min(100, Math.max(0, score));
}

// Generate outfit name
function generateOutfitName(items: WardrobeItem[], occasion?: string, season?: string): string {
    const categories = items.map(i => i.category);
    const hasDress = categories.includes(ClothingCategory.DRESS);

    const adjectives = ['Chic', 'Casual', 'Smart', 'Elegant', 'Comfy', 'Stylish', 'Cool', 'Fresh'];
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];

    if (hasDress) {
        return `${adj} Dress Outfit`;
    }

    if (occasion === 'work') {
        return `${adj} Work Look`;
    } else if (occasion === 'party') {
        return `${adj} Party Outfit`;
    } else if (occasion === 'formal') {
        return 'Formal Ensemble';
    }

    return `${adj} ${season || 'Day'} Look`;
}

// Generate reasoning
function generateReasoning(items: WardrobeItem[], occasion?: string, season?: string): string {
    const colors = [...new Set(items.flatMap(i => i.colors))].slice(0, 3);
    const colorStr = colors.join(', ').toLowerCase();

    const reasons = [
        `Perfect ${season || 'seasonal'} combination with ${colorStr} tones that complement each other beautifully.`,
        `Great for ${occasion || 'any occasion'} - the ${colorStr} palette creates a cohesive, polished look.`,
        `These pieces work together harmoniously with their ${colorStr} color scheme, creating an effortlessly stylish outfit.`,
        `A well-balanced outfit featuring ${colorStr} - versatile enough for ${occasion || 'various activities'}.`
    ];

    return reasons[Math.floor(Math.random() * reasons.length)];
}

// Determine occasion from items
function determineOccasion(items: WardrobeItem[]): string {
    const occasions = items.flatMap(i => i.occasions);
    const counts = new Map<string, number>();
    occasions.forEach(o => counts.set(o, (counts.get(o) || 0) + 1));

    let maxCount = 0;
    let dominant = 'casual';
    counts.forEach((count, occasion) => {
        if (count > maxCount) {
            maxCount = count;
            dominant = occasion;
        }
    });

    return dominant;
}

// Clear all locks (e.g., after laundry day)
export function clearAllLocks(): void {
    localStorage.removeItem(ITEM_LOCKS_KEY);
}

// Mark laundry day and unlock all items
export function doLaundry(): void {
    const config = getLaundryConfig();
    config.lastLaundryDate = new Date().toISOString().split('T')[0];
    setLaundryConfig(config);
    clearAllLocks();
}

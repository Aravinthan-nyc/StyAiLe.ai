// Packing List Service - Smart travel packing assistant
import { PackingList, WardrobeItem, ClothingCategory } from '../types';

const PACKING_KEY = 'styaile_packing_lists';

// Get all packing lists
export function getPackingLists(): PackingList[] {
    try {
        const stored = localStorage.getItem(PACKING_KEY);
        if (stored) {
            return JSON.parse(stored);
        }
    } catch (e) {
        console.error('Failed to get packing lists:', e);
    }
    return [];
}

// Save packing list
export function savePackingList(list: PackingList): void {
    const lists = getPackingLists();
    const index = lists.findIndex(l => l.id === list.id);
    if (index >= 0) {
        lists[index] = list;
    } else {
        lists.unshift(list);
    }
    localStorage.setItem(PACKING_KEY, JSON.stringify(lists));
}

// Delete packing list
export function deletePackingList(id: string): void {
    const lists = getPackingLists().filter(l => l.id !== id);
    localStorage.setItem(PACKING_KEY, JSON.stringify(lists));
}

// Generate smart packing suggestions based on trip details
export function generatePackingSuggestions(
    wardrobe: WardrobeItem[],
    tripType: PackingList['tripType'],
    duration: number, // days
    weather?: { avgTemp: number; conditions: string[] }
): string[] {
    const suggestions: string[] = [];
    const days = duration;

    // Calculate quantities based on trip length
    const topsNeeded = Math.min(wardrobe.filter(i => i.category === ClothingCategory.TOP).length, Math.ceil(days * 0.7));
    const bottomsNeeded = Math.min(wardrobe.filter(i => i.category === ClothingCategory.BOTTOM).length, Math.ceil(days * 0.5));
    const shoesNeeded = Math.min(3, Math.ceil(days / 3));

    // Filter by season/weather
    let seasonFilter: string[] = ['all-season'];
    if (weather) {
        if (weather.avgTemp < 15) seasonFilter.push('winter', 'fall');
        else if (weather.avgTemp > 25) seasonFilter.push('summer');
        else seasonFilter.push('spring', 'fall');
    }

    // Filter by trip type
    let occasionFilter: string[] = [];
    switch (tripType) {
        case 'business':
            occasionFilter = ['work', 'formal', 'professional'];
            break;
        case 'beach':
            occasionFilter = ['beach', 'casual', 'summer'];
            break;
        case 'adventure':
            occasionFilter = ['sports', 'casual', 'outdoor'];
            break;
        case 'leisure':
            occasionFilter = ['casual', 'relaxed'];
            break;
        case 'winter':
            occasionFilter = ['casual', 'winter'];
            seasonFilter = ['winter', 'fall', 'all-season'];
            break;
        default:
            occasionFilter = ['casual', 'formal'];
    }

    // Score and sort items
    const scoredItems = wardrobe.map(item => {
        let score = 0;

        // Season match
        if (item.season.some(s => seasonFilter.includes(s))) score += 3;

        // Occasion match
        if (item.occasions.some(o => occasionFilter.includes(o.toLowerCase()))) score += 2;

        // Versatility (more tags = more versatile)
        score += Math.min(item.occasions.length, 3);

        // Recent wear (prefer less worn items)
        if (item.wearCount && item.wearCount < 5) score += 1;

        return { item, score };
    }).sort((a, b) => b.score - a.score);

    // Pick items by category
    const picked = new Set<string>();

    // Tops
    scoredItems
        .filter(s => s.item.category === ClothingCategory.TOP)
        .slice(0, topsNeeded)
        .forEach(s => picked.add(s.item.id));

    // Bottoms
    scoredItems
        .filter(s => s.item.category === ClothingCategory.BOTTOM)
        .slice(0, bottomsNeeded)
        .forEach(s => picked.add(s.item.id));

    // Shoes
    scoredItems
        .filter(s => s.item.category === ClothingCategory.SHOES)
        .slice(0, shoesNeeded)
        .forEach(s => picked.add(s.item.id));

    // Outerwear (if needed)
    if (weather && weather.avgTemp < 20) {
        scoredItems
            .filter(s => s.item.category === ClothingCategory.OUTERWEAR)
            .slice(0, 2)
            .forEach(s => picked.add(s.item.id));
    }

    // Accessories
    scoredItems
        .filter(s => s.item.category === ClothingCategory.ACCESSORY)
        .slice(0, 3)
        .forEach(s => picked.add(s.item.id));

    // Dresses (for specific occasions)
    if (tripType === 'leisure' || tripType === 'beach') {
        scoredItems
            .filter(s => s.item.category === ClothingCategory.DRESS)
            .slice(0, 2)
            .forEach(s => picked.add(s.item.id));
    }

    return Array.from(picked);
}

// Create a new packing list with AI suggestions
export function createPackingList(
    name: string,
    destination: string,
    startDate: string,
    endDate: string,
    tripType: PackingList['tripType'],
    wardrobe: WardrobeItem[]
): PackingList {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const duration = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    const suggestedItemIds = generatePackingSuggestions(wardrobe, tripType, duration);

    const list: PackingList = {
        id: `pack_${Date.now()}`,
        name,
        destination,
        startDate,
        endDate,
        tripType,
        itemIds: [],
        suggestedItemIds,
        checkedItems: [],
        createdAt: Date.now()
    };

    savePackingList(list);
    return list;
}

// Toggle item check status
export function toggleItemCheck(listId: string, itemId: string): void {
    const lists = getPackingLists();
    const list = lists.find(l => l.id === listId);
    if (!list) return;

    const index = list.checkedItems.indexOf(itemId);
    if (index >= 0) {
        list.checkedItems.splice(index, 1);
    } else {
        list.checkedItems.push(itemId);
    }

    savePackingList(list);
}

// Add item to packing list
export function addItemToList(listId: string, itemId: string): void {
    const lists = getPackingLists();
    const list = lists.find(l => l.id === listId);
    if (!list) return;

    if (!list.itemIds.includes(itemId)) {
        list.itemIds.push(itemId);
        savePackingList(list);
    }
}

// Remove item from packing list
export function removeItemFromList(listId: string, itemId: string): void {
    const lists = getPackingLists();
    const list = lists.find(l => l.id === listId);
    if (!list) return;

    list.itemIds = list.itemIds.filter(id => id !== itemId);
    list.suggestedItemIds = list.suggestedItemIds.filter(id => id !== itemId);
    list.checkedItems = list.checkedItems.filter(id => id !== itemId);
    savePackingList(list);
}

// Get packing progress
export function getPackingProgress(list: PackingList): number {
    const totalItems = list.itemIds.length + list.suggestedItemIds.length;
    if (totalItems === 0) return 0;
    return Math.round((list.checkedItems.length / totalItems) * 100);
}

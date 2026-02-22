/**
 * Saved Outfits Service
 * Manages saved outfit collections using localStorage
 */

export interface SavedOutfit {
    id: string;
    name: string;
    itemIds: string[];
    occasion?: string;
    isFavorite: boolean;
    createdAt: string;
    updatedAt: string;
}

const STORAGE_KEY = 'styaile_saved_outfits';

/**
 * Generate unique ID
 */
function generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * Get all saved outfits
 */
export function getSavedOutfits(): SavedOutfit[] {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    } catch {
        return [];
    }
}

/**
 * Save a new outfit
 */
export function saveOutfit(
    itemIds: string[],
    name: string,
    occasion?: string
): SavedOutfit {
    const outfits = getSavedOutfits();

    const newOutfit: SavedOutfit = {
        id: generateId(),
        name: name.trim() || `Outfit ${outfits.length + 1}`,
        itemIds,
        occasion,
        isFavorite: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };

    outfits.unshift(newOutfit);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(outfits));

    return newOutfit;
}

/**
 * Get outfit by ID
 */
export function getOutfitById(id: string): SavedOutfit | undefined {
    const outfits = getSavedOutfits();
    return outfits.find(o => o.id === id);
}

/**
 * Update an existing outfit
 */
export function updateOutfit(
    id: string,
    updates: Partial<Omit<SavedOutfit, 'id' | 'createdAt'>>
): SavedOutfit | null {
    const outfits = getSavedOutfits();
    const index = outfits.findIndex(o => o.id === id);

    if (index === -1) return null;

    outfits[index] = {
        ...outfits[index],
        ...updates,
        updatedAt: new Date().toISOString(),
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(outfits));
    return outfits[index];
}

/**
 * Toggle favorite status
 */
export function toggleFavorite(id: string): SavedOutfit | null {
    const outfit = getOutfitById(id);
    if (!outfit) return null;

    return updateOutfit(id, { isFavorite: !outfit.isFavorite });
}

/**
 * Delete an outfit
 */
export function deleteOutfit(id: string): boolean {
    const outfits = getSavedOutfits();
    const filtered = outfits.filter(o => o.id !== id);

    if (filtered.length === outfits.length) return false;

    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    return true;
}

/**
 * Get outfit count
 */
export function getOutfitCount(): number {
    return getSavedOutfits().length;
}

/**
 * Get favorite outfits
 */
export function getFavoriteOutfits(): SavedOutfit[] {
    return getSavedOutfits().filter(o => o.isFavorite);
}

/**
 * Search outfits by name
 */
export function searchOutfits(query: string): SavedOutfit[] {
    const lowerQuery = query.toLowerCase();
    return getSavedOutfits().filter(o =>
        o.name.toLowerCase().includes(lowerQuery) ||
        o.occasion?.toLowerCase().includes(lowerQuery)
    );
}

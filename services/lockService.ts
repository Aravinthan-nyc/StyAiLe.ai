/**
 * Lock Service
 * Manages wardrobe item locking for laundry tracking
 */

import { WardrobeItem } from '../types';

const DEFAULT_LOCK_DAYS = 2;

/**
 * Check if an item is currently locked
 */
export function isItemLocked(item: WardrobeItem): boolean {
    if (!item.lockedUntil) return false;
    return Date.now() < item.lockedUntil;
}

/**
 * Get remaining lock time in hours for display
 */
export function getRemainingLockTime(item: WardrobeItem): { hours: number; days: number } | null {
    if (!item.lockedUntil || !isItemLocked(item)) return null;

    const remaining = item.lockedUntil - Date.now();
    const hours = Math.ceil(remaining / (1000 * 60 * 60));
    const days = Math.ceil(remaining / (1000 * 60 * 60 * 24));

    return { hours, days };
}

/**
 * Lock an item for a specified number of days
 */
export function lockItem(item: WardrobeItem, days: number = DEFAULT_LOCK_DAYS): WardrobeItem {
    return {
        ...item,
        lockedUntil: Date.now() + (days * 24 * 60 * 60 * 1000),
        lastWornAt: Date.now(),
        wearCount: (item.wearCount || 0) + 1,
    };
}

/**
 * Unlock an item (remove lock)
 */
export function unlockItem(item: WardrobeItem): WardrobeItem {
    return {
        ...item,
        lockedUntil: undefined,
    };
}

/**
 * Lock multiple items (for outfit confirmation)
 */
export function lockItems(items: WardrobeItem[], days: number = DEFAULT_LOCK_DAYS): WardrobeItem[] {
    return items.map(item => lockItem(item, days));
}

/**
 * Get all locked items from wardrobe
 */
export function getLockedItems(wardrobe: WardrobeItem[]): WardrobeItem[] {
    return wardrobe.filter(isItemLocked);
}

/**
 * Get all available (unlocked) items from wardrobe
 */
export function getAvailableItems(wardrobe: WardrobeItem[]): WardrobeItem[] {
    return wardrobe.filter(item => !isItemLocked(item));
}

/**
 * Get lock status text for display
 */
export function getLockStatusText(item: WardrobeItem): string {
    const remaining = getRemainingLockTime(item);
    if (!remaining) return '';

    if (remaining.hours < 24) {
        return `Locked for ${remaining.hours}h`;
    }
    return `Locked for ${remaining.days}d`;
}

/**
 * Supabase Service Layer
 * CRUD operations for wardrobe items with RLS compliance
 * All queries are scoped to the authenticated user
 */

import { supabase, getCurrentUserId } from './supabaseClient';
import { WardrobeItem, ClothingCategory } from '../types';
import { generateId } from '../utils';

// Storage bucket name for wardrobe images
const STORAGE_BUCKET = 'wardrobe-images';

// Table name
const TABLE_NAME = 'wardrobe_items';

/**
 * Database row type for wardrobe items
 */
interface WardrobeItemDB {
    id: string;
    user_id: string;
    image_path: string;
    category: string;
    description: string;
    colors: string[];
    tags: string[];
    occasions: string[];
    mood: string[];
    timing: string[];
    season: string[];
    created_at: string;
}

/**
 * Upload image to Supabase Storage
 * @param base64Data - Base64 encoded image data (with or without data URL prefix)
 * @param userId - User ID for organizing storage
 * @returns The storage path of the uploaded image
 */
export async function uploadImage(base64Data: string, userId: string): Promise<string> {
    if (!supabase) {
        throw new Error('Supabase not configured. Please add credentials in Settings.');
    }

    // Remove data URL prefix if present
    const base64 = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;

    // Convert base64 to Blob
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'image/jpeg' });

    // Generate unique filename
    const filename = `${userId}/${generateId()}.jpg`;

    // First attempt
    let result = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(filename, blob, {
            contentType: 'image/jpeg',
            upsert: false
        });

    // Retry once if failed
    if (result.error) {
        console.log('Upload failed, retrying...');
        result = await supabase.storage
            .from(STORAGE_BUCKET)
            .upload(filename, blob, {
                contentType: 'image/jpeg',
                upsert: false
            });
    }

    if (result.error) {
        console.error('Error uploading image (RLS/Auth issue), falling back to local storage:', result.error);
        // Fallback: Return the original base64 data to store in DB directly
        // This allows the app to work even if storage is blocked/misconfigured
        return base64Data;
    }

    return result.data.path;
}

/**
 * Get public URL for an image in storage
 * @param imagePath - The storage path of the image
 * @returns Public URL for the image
 */
export function getImageUrl(imagePath: string): string {
    // If it's a data URI (fallback mode), return as-is
    if (imagePath.startsWith('data:') || imagePath.startsWith('blob:')) {
        return imagePath;
    }

    if (!supabase) {
        // Return the path as-is for local/base64 images
        return imagePath;
    }

    const { data } = supabase.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(imagePath);

    return data.publicUrl;
}

/**
 * Convert database row to WardrobeItem
 */
function dbToWardrobeItem(row: WardrobeItemDB): WardrobeItem {
    return {
        id: row.id,
        imageData: getImageUrl(row.image_path),
        category: row.category as ClothingCategory,
        description: row.description,
        colors: row.colors || [],
        tags: row.tags || [],
        occasions: row.occasions || [],
        mood: row.mood || [],
        timing: row.timing || [],
        season: row.season || [],
        createdAt: new Date(row.created_at).getTime(),
    };
}

/**
 * Fetch all wardrobe items for the current user
 * @returns Array of wardrobe items
 */
export async function fetchWardrobeItems(): Promise<WardrobeItem[]> {
    if (!supabase) {
        // Return empty array when not configured - app will use localStorage
        return [];
    }

    const userId = await getCurrentUserId();

    // First attempt
    let result = await supabase
        .from(TABLE_NAME)
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    // Retry once if failed
    if (result.error) {
        console.log('Fetch failed, retrying...');
        result = await supabase
            .from(TABLE_NAME)
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
    }

    if (result.error) {
        console.error('Error fetching wardrobe items:', result.error);
        throw new Error('Failed to load wardrobe. Please refresh the page.');
    }

    return (result.data || []).map((row) => dbToWardrobeItem(row as WardrobeItemDB));
}

/**
 * Add a new wardrobe item
 * @param item - The wardrobe item to add (with base64 image data)
 * @returns The added item with cloud storage URL
 */
export async function addWardrobeItem(item: WardrobeItem): Promise<WardrobeItem> {
    const userId = await getCurrentUserId();

    // Upload image to storage first
    const imagePath = await uploadImage(item.imageData, userId);

    // Insert item into database
    const dbItem = {
        id: item.id,
        user_id: userId,
        image_path: imagePath,
        category: item.category,
        description: item.description,
        colors: item.colors,
        tags: item.tags,
        occasions: item.occasions,
        mood: item.mood,
        timing: item.timing,
        season: item.season,
        created_at: new Date(item.createdAt).toISOString(),
    };

    // First attempt
    let result = await supabase
        .from(TABLE_NAME)
        .insert(dbItem)
        .select()
        .single();

    // Retry once if failed
    if (result.error) {
        console.log('Insert failed, retrying...');
        result = await supabase
            .from(TABLE_NAME)
            .insert(dbItem)
            .select()
            .single();
    }

    if (result.error) {
        console.error('Error adding wardrobe item:', result.error);
        throw new Error('Failed to save item. Please try again.');
    }

    return dbToWardrobeItem(result.data as WardrobeItemDB);
}

/**
 * Update an existing wardrobe item (for lock status, etc.)
 * @param item - The wardrobe item to update
 * @returns The updated item
 */
export async function updateWardrobeItem(item: WardrobeItem): Promise<WardrobeItem> {
    const userId = await getCurrentUserId();
    if (!userId) {
        throw new Error('Not authenticated');
    }

    const updateData = {
        category: item.category,
        description: item.description,
        colors: item.colors,
        tags: item.tags,
        occasions: item.occasions,
        mood: item.mood,
        timing: item.timing,
        season: item.season,
        locked_until: item.lockedUntil ? new Date(item.lockedUntil).toISOString() : null,
        last_worn_at: item.lastWornAt ? new Date(item.lastWornAt).toISOString() : null,
        wear_count: item.wearCount || 0,
    };

    let result = await supabase
        .from(TABLE_NAME)
        .update(updateData)
        .eq('id', item.id)
        .eq('user_id', userId)
        .select()
        .single();

    if (result.error) {
        console.log('Update failed, retrying...');
        result = await supabase
            .from(TABLE_NAME)
            .update(updateData)
            .eq('id', item.id)
            .eq('user_id', userId)
            .select()
            .single();
    }

    if (result.error) {
        console.error('Error updating wardrobe item:', result.error);
        throw new Error('Failed to update item. Please try again.');
    }

    return {
        ...item,
        ...updateData,
    };
}

/**
 * Delete a wardrobe item
 * @param id - The ID of the item to delete
 */
export async function deleteWardrobeItem(id: string): Promise<void> {
    const userId = await getCurrentUserId();

    // First, get the item to find the image path
    const { data: item } = await supabase
        .from(TABLE_NAME)
        .select('image_path')
        .eq('id', id)
        .eq('user_id', userId)
        .single();

    // Delete the database record - first attempt
    let result = await supabase
        .from(TABLE_NAME)
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

    // Retry once if failed
    if (result.error) {
        console.log('Delete failed, retrying...');
        result = await supabase
            .from(TABLE_NAME)
            .delete()
            .eq('id', id)
            .eq('user_id', userId);
    }

    if (result.error) {
        console.error('Error deleting wardrobe item:', result.error);
        throw new Error('Failed to delete item. Please try again.');
    }

    // Also delete the image from storage (best effort, don't fail if this fails)
    if (item?.image_path) {
        try {
            await supabase.storage
                .from(STORAGE_BUCKET)
                .remove([item.image_path]);
        } catch (e) {
            console.warn('Could not delete image from storage:', e);
        }
    }
}

/**
 * Check if Supabase connection is working
 * @returns true if connected, false otherwise
 */
export async function checkConnection(): Promise<boolean> {
    if (!supabase) {
        return false;
    }

    try {
        const { error } = await supabase.from(TABLE_NAME).select('id').limit(1);
        return !error;
    } catch {
        return false;
    }
}

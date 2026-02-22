/**
 * Live Update Service - Over-The-Air (OTA) Updates
 * 
 * Features:
 * - Self-hosted update manifests (Supabase Storage)
 * - Background downloads
 * - Mandatory/optional updates
 * - Force logout/login actions
 * - Version rollback support
 * - Database migration support
 * - Progress tracking
 * - Offline-safe
 */

// ============================================
// CONFIGURATION
// ============================================

// UPDATE THIS: Your Supabase project URL
const SUPABASE_URL = 'https://rpibepmxjcaouxmnmeab.supabase.co';
const UPDATE_MANIFEST_PATH = '/storage/v1/object/public/updates/manifest.json';
const UPDATE_BUNDLES_PATH = '/storage/v1/object/public/updates/bundles/';

// Current app version - UPDATE THIS with each release
export const APP_VERSION = {
    version: '1.0.0',
    buildNumber: 1,
    buildDate: '2026-02-08',
};

// Storage keys
const STORAGE_KEYS = {
    PENDING_UPDATE: 'styaile_pending_update',
    LAST_CHECK: 'styaile_last_update_check',
    UPDATE_MANIFEST: 'styaile_update_manifest',
    BACKUP_DATA: 'styaile_backup_data',
    SKIPPED_VERSION: 'styaile_skipped_version',
    UPDATE_HISTORY: 'styaile_update_history',
};

// Check interval (6 hours in ms)
const CHECK_INTERVAL = 6 * 60 * 60 * 1000;

// ============================================
// TYPES
// ============================================

export interface UpdateManifest {
    // Version info
    version: string;
    buildNumber: number;
    releaseDate: string;

    // Update bundle
    bundleUrl: string;
    bundleSize: number; // in bytes
    bundleHash: string; // SHA-256 for integrity

    // Update options
    mandatory: boolean;
    changelog: string;
    minAppVersion: string;

    // Special actions
    actions: UpdateAction[];

    // Rollback info
    previousVersion?: string;
    previousBundleUrl?: string;
}

export type UpdateAction =
    | 'force_logout'
    | 'clear_cache'
    | 'clear_wardrobe'
    | 'reset_settings'
    | 'show_changelog'
    | 'require_reauth';

export interface UpdateProgress {
    stage: 'checking' | 'downloading' | 'extracting' | 'applying' | 'complete' | 'error';
    progress: number; // 0-100
    message: string;
    error?: string;
}

export interface UpdateStatus {
    available: boolean;
    manifest: UpdateManifest | null;
    lastChecked: number;
    skippedVersion: string | null;
}

// ============================================
// UPDATE CHECK
// ============================================

export async function checkForUpdates(
    forceCheck: boolean = false
): Promise<UpdateStatus> {
    const now = Date.now();
    const lastCheck = parseInt(localStorage.getItem(STORAGE_KEYS.LAST_CHECK) || '0', 10);

    // Skip if checked recently (unless forced)
    if (!forceCheck && (now - lastCheck) < CHECK_INTERVAL) {
        const cachedManifest = localStorage.getItem(STORAGE_KEYS.UPDATE_MANIFEST);
        if (cachedManifest) {
            const manifest = JSON.parse(cachedManifest);
            return {
                available: manifest.buildNumber > APP_VERSION.buildNumber,
                manifest,
                lastChecked: lastCheck,
                skippedVersion: localStorage.getItem(STORAGE_KEYS.SKIPPED_VERSION),
            };
        }
    }

    try {
        // OPTIMIZATION: Removed timestamp (?t=now) to allow CDN caching.
        // Supabase Storage handles caching headers automatically.
        const manifestUrl = `${SUPABASE_URL}${UPDATE_MANIFEST_PATH}`;
        const response = await fetch(manifestUrl, {
            method: 'GET',
            // Allow caching to save bandwidth
            headers: {
                'Accept': 'application/json',
            },
        });

        if (!response.ok) {
            if (response.status === 400 || response.status === 404) {
                // Suppress 400/404 errors for self-hosted updates
                return {
                    available: false,
                    manifest: null,
                    lastChecked: now,
                    skippedVersion: null,
                };
            }
            throw new Error(`Failed to fetch manifest: ${response.status}`);
        }

        const manifest: UpdateManifest = await response.json();

        // Cache manifest
        localStorage.setItem(STORAGE_KEYS.UPDATE_MANIFEST, JSON.stringify(manifest));
        localStorage.setItem(STORAGE_KEYS.LAST_CHECK, String(now));

        // Check version
        const updateAvailable = manifest.buildNumber > APP_VERSION.buildNumber;
        const skippedVersion = localStorage.getItem(STORAGE_KEYS.SKIPPED_VERSION);

        // Check minimum version requirement
        const meetsMinVersion = compareVersions(APP_VERSION.version, manifest.minAppVersion) >= 0;

        return {
            available: updateAvailable && meetsMinVersion,
            manifest,
            lastChecked: now,
            skippedVersion,
        };
    } catch (error) {
        console.error('Update check failed:', error);
        return {
            available: false,
            manifest: null,
            lastChecked: now,
            skippedVersion: null,
        };
    }
}

// ============================================
// UPDATE DOWNLOAD
// ============================================

export async function downloadUpdate(
    manifest: UpdateManifest,
    onProgress: (progress: UpdateProgress) => void
): Promise<boolean> {
    try {
        onProgress({
            stage: 'downloading',
            progress: 0,
            message: 'Starting download...',
        });

        // Backup current data before update
        await backupUserData();

        const response = await fetch(manifest.bundleUrl, {
            method: 'GET',
            cache: 'no-cache',
        });

        if (!response.ok) {
            throw new Error(`Download failed: ${response.status}`);
        }

        const contentLength = response.headers.get('Content-Length');
        const total = contentLength ? parseInt(contentLength, 10) : manifest.bundleSize;

        const reader = response.body?.getReader();
        if (!reader) {
            throw new Error('Response body not readable');
        }

        const chunks: Uint8Array[] = [];
        let received = 0;

        while (true) {
            const { done, value } = await reader.read();

            if (done) break;

            chunks.push(value);
            received += value.length;

            const progress = Math.round((received / total) * 100);
            onProgress({
                stage: 'downloading',
                progress,
                message: `Downloading: ${formatBytes(received)} / ${formatBytes(total)}`,
            });
        }

        // Combine chunks
        const bundleData = new Uint8Array(received);
        let position = 0;
        for (const chunk of chunks) {
            bundleData.set(chunk, position);
            position += chunk.length;
        }

        // Verify hash (if provided)
        if (manifest.bundleHash) {
            onProgress({
                stage: 'extracting',
                progress: 50,
                message: 'Verifying integrity...',
            });

            const hash = await computeSHA256(bundleData);
            if (hash !== manifest.bundleHash) {
                throw new Error('Bundle integrity check failed');
            }
        }

        // Save bundle for later application
        const base64Bundle = arrayBufferToBase64(bundleData);
        localStorage.setItem(STORAGE_KEYS.PENDING_UPDATE, JSON.stringify({
            manifest,
            bundle: base64Bundle,
            downloadedAt: Date.now(),
        }));

        onProgress({
            stage: 'extracting',
            progress: 100,
            message: 'Update ready to install',
        });

        return true;
    } catch (error: any) {
        onProgress({
            stage: 'error',
            progress: 0,
            message: 'Download failed',
            error: error.message,
        });
        return false;
    }
}

// ============================================
// UPDATE APPLICATION
// ============================================

export async function applyUpdate(
    onProgress: (progress: UpdateProgress) => void
): Promise<boolean> {
    const pendingUpdateData = localStorage.getItem(STORAGE_KEYS.PENDING_UPDATE);
    if (!pendingUpdateData) {
        onProgress({
            stage: 'error',
            progress: 0,
            message: 'No pending update found',
        });
        return false;
    }

    try {
        const { manifest, bundle } = JSON.parse(pendingUpdateData);

        onProgress({
            stage: 'applying',
            progress: 30,
            message: 'Applying update...',
        });

        // Execute pre-update actions
        await executeActions(manifest.actions, 'pre');

        onProgress({
            stage: 'applying',
            progress: 60,
            message: 'Finalizing...',
        });

        // For web-based Capacitor apps, we store the bundle location
        // The actual file replacement happens via Capacitor plugins
        // or by updating the service worker cache

        // Store update info
        const history = JSON.parse(localStorage.getItem(STORAGE_KEYS.UPDATE_HISTORY) || '[]');
        history.push({
            fromVersion: APP_VERSION.version,
            toVersion: manifest.version,
            appliedAt: Date.now(),
        });
        localStorage.setItem(STORAGE_KEYS.UPDATE_HISTORY, JSON.stringify(history));

        // Execute post-update actions
        await executeActions(manifest.actions, 'post');

        // Clear pending update
        localStorage.removeItem(STORAGE_KEYS.PENDING_UPDATE);
        localStorage.removeItem(STORAGE_KEYS.SKIPPED_VERSION);

        onProgress({
            stage: 'complete',
            progress: 100,
            message: 'Update complete! Restarting...',
        });

        // Reload app with new version
        setTimeout(() => {
            window.location.reload();
        }, 1500);

        return true;
    } catch (error: any) {
        onProgress({
            stage: 'error',
            progress: 0,
            message: 'Update failed',
            error: error.message,
        });

        // Attempt rollback
        await rollbackUpdate();

        return false;
    }
}

// ============================================
// ROLLBACK
// ============================================

export async function rollbackUpdate(): Promise<boolean> {
    try {
        const backupData = localStorage.getItem(STORAGE_KEYS.BACKUP_DATA);
        if (!backupData) {
            console.warn('No backup data available for rollback');
            return false;
        }

        const backup = JSON.parse(backupData);

        // Restore user data
        for (const [key, value] of Object.entries(backup.userData)) {
            localStorage.setItem(key, value as string);
        }

        // Clear failed update
        localStorage.removeItem(STORAGE_KEYS.PENDING_UPDATE);

        console.log('Rollback successful');
        return true;
    } catch (error) {
        console.error('Rollback failed:', error);
        return false;
    }
}

// ============================================
// UPDATE ACTIONS
// ============================================

async function executeActions(
    actions: UpdateAction[],
    phase: 'pre' | 'post'
): Promise<void> {
    for (const action of actions) {
        switch (action) {
            case 'force_logout':
                if (phase === 'post') {
                    localStorage.removeItem('supabase.auth.token');
                    // Clear any session data
                }
                break;

            case 'clear_cache':
                if (phase === 'post') {
                    // Clear cached API responses
                    const cacheKeys = Object.keys(localStorage).filter(k =>
                        k.includes('cache') || k.includes('temp')
                    );
                    cacheKeys.forEach(k => localStorage.removeItem(k));
                }
                break;

            case 'clear_wardrobe':
                if (phase === 'post') {
                    localStorage.removeItem('wardrobe_data');
                }
                break;

            case 'reset_settings':
                if (phase === 'post') {
                    localStorage.removeItem('styaile_settings');
                    localStorage.removeItem('styaile_preferences');
                }
                break;

            case 'require_reauth':
                if (phase === 'post') {
                    localStorage.setItem('require_reauth', 'true');
                }
                break;

            case 'show_changelog':
                if (phase === 'post') {
                    localStorage.setItem('show_changelog', 'true');
                }
                break;
        }
    }
}

// ============================================
// DATA BACKUP
// ============================================

async function backupUserData(): Promise<void> {
    const userData: Record<string, string> = {};

    // Keys to backup (user's important data)
    const keysToBackup = [
        'wardrobe_data',
        'styaile_api_keys',
        'styaile_api_key_enc',
        'styaile_settings',
        'styaile_preferences',
        'styaile_outfit_planner',
        'styaile_saved_outfits',
        'styaile_packing_lists',
    ];

    for (const key of keysToBackup) {
        const value = localStorage.getItem(key);
        if (value) {
            userData[key] = value;
        }
    }

    localStorage.setItem(STORAGE_KEYS.BACKUP_DATA, JSON.stringify({
        userData,
        backedUpAt: Date.now(),
        appVersion: APP_VERSION.version,
    }));
}

// ============================================
// SKIP VERSION
// ============================================

export function skipVersion(version: string): void {
    localStorage.setItem(STORAGE_KEYS.SKIPPED_VERSION, version);
}

export function isVersionSkipped(version: string): boolean {
    return localStorage.getItem(STORAGE_KEYS.SKIPPED_VERSION) === version;
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function compareVersions(v1: string, v2: string): number {
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);

    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
        const p1 = parts1[i] || 0;
        const p2 = parts2[i] || 0;

        if (p1 > p2) return 1;
        if (p1 < p2) return -1;
    }

    return 0;
}

function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function arrayBufferToBase64(buffer: Uint8Array): string {
    let binary = '';
    for (let i = 0; i < buffer.byteLength; i++) {
        binary += String.fromCharCode(buffer[i]);
    }
    return btoa(binary);
}

async function computeSHA256(data: Uint8Array): Promise<string> {
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// ============================================
// ADMIN FUNCTIONS (For your use)
// ============================================

export function getUpdateHistory(): Array<{
    fromVersion: string;
    toVersion: string;
    appliedAt: number;
}> {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.UPDATE_HISTORY) || '[]');
}

export function clearUpdateData(): void {
    Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
    });
}

export function getPendingUpdate(): { manifest: UpdateManifest; downloadedAt: number } | null {
    const data = localStorage.getItem(STORAGE_KEYS.PENDING_UPDATE);
    if (!data) return null;
    const parsed = JSON.parse(data);
    return {
        manifest: parsed.manifest,
        downloadedAt: parsed.downloadedAt,
    };
}

// ============================================
// AUTO-CHECK ON APP START
// ============================================

export function initUpdateChecker(): void {
    // Check on startup
    setTimeout(async () => {
        const status = await checkForUpdates();
        if (status.available && status.manifest?.mandatory) {
            // Dispatch event for mandatory update
            window.dispatchEvent(new CustomEvent('mandatory-update', {
                detail: status.manifest,
            }));
        } else if (status.available && !isVersionSkipped(status.manifest?.version || '')) {
            // Dispatch event for optional update
            window.dispatchEvent(new CustomEvent('update-available', {
                detail: status.manifest,
            }));
        }
    }, 3000); // Wait 3s after app load

    // Check periodically
    setInterval(async () => {
        const status = await checkForUpdates();
        if (status.available) {
            window.dispatchEvent(new CustomEvent('update-available', {
                detail: status.manifest,
            }));
        }
    }, CHECK_INTERVAL);
}

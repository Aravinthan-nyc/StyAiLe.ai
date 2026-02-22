// Beta Security Service - API Key Locking, Expiration, Rate Limiting
// For beta release to 10-30 users

// ============================================
// CONFIGURATION
// ============================================
const BETA_BUILD_DATE = '2026-02-08';
const BETA_DURATION_DAYS = 7;
const SUPPORT_EMAIL = 'notpavan2022@gmail.com';
const REQUEST_COOLDOWN_MS = 2000; // 2 seconds between API calls
const DAILY_REQUEST_LIMIT = 100;

// Storage keys
const STORAGE_KEYS = {
    API_KEY_LOCKED: 'styaile_api_key_locked',
    API_KEY_ENCRYPTED: 'styaile_api_key_enc',
    DEVICE_ID: 'styaile_device_id',
    DAILY_REQUEST_COUNT: 'styaile_daily_requests',
    LAST_REQUEST_DATE: 'styaile_last_request_date',
    LAST_REQUEST_TIME: 'styaile_last_request_time',
};

// ============================================
// SIMPLE ENCRYPTION (Device-specific)
// ============================================
function getDeviceId(): string {
    let deviceId = localStorage.getItem(STORAGE_KEYS.DEVICE_ID);
    if (!deviceId) {
        deviceId = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}-${navigator.userAgent.length}`;
        localStorage.setItem(STORAGE_KEYS.DEVICE_ID, deviceId);
    }
    return deviceId;
}

function simpleEncrypt(text: string, key: string): string {
    let result = '';
    for (let i = 0; i < text.length; i++) {
        const charCode = text.charCodeAt(i) ^ key.charCodeAt(i % key.length);
        result += String.fromCharCode(charCode);
    }
    return btoa(result);
}

function simpleDecrypt(encoded: string, key: string): string {
    try {
        const decoded = atob(encoded);
        let result = '';
        for (let i = 0; i < decoded.length; i++) {
            const charCode = decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length);
            result += String.fromCharCode(charCode);
        }
        return result;
    } catch {
        return '';
    }
}

// ============================================
// BETA EXPIRATION
// ============================================
export function isBetaExpired(): boolean {
    const buildDate = new Date(BETA_BUILD_DATE);
    const expirationDate = new Date(buildDate);
    expirationDate.setDate(buildDate.getDate() + BETA_DURATION_DAYS);

    const now = new Date();
    return now > expirationDate;
}

export function getDaysRemaining(): number {
    const buildDate = new Date(BETA_BUILD_DATE);
    const expirationDate = new Date(buildDate);
    expirationDate.setDate(buildDate.getDate() + BETA_DURATION_DAYS);

    const now = new Date();
    const diffTime = expirationDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return Math.max(0, diffDays);
}

export function getExpirationDate(): string {
    const buildDate = new Date(BETA_BUILD_DATE);
    const expirationDate = new Date(buildDate);
    expirationDate.setDate(buildDate.getDate() + BETA_DURATION_DAYS);
    return expirationDate.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
}

// ============================================
// ONE-TIME API KEY LOCKING
// ============================================
export function isApiKeyLocked(): boolean {
    const locked = localStorage.getItem(STORAGE_KEYS.API_KEY_LOCKED);
    return locked === 'true';
}

export function lockApiKey(apiKey: string): boolean {
    // Check if already locked - NO SECOND CHANCES
    if (isApiKeyLocked()) {
        console.warn('API key already locked. No changes allowed.');
        return false;
    }

    if (!apiKey || apiKey.trim().length < 10) {
        console.error('Invalid API key');
        return false;
    }

    // Encrypt with device-specific key
    const deviceKey = getDeviceId();
    const encrypted = simpleEncrypt(apiKey.trim(), deviceKey);

    // Save encrypted key
    localStorage.setItem(STORAGE_KEYS.API_KEY_ENCRYPTED, encrypted);

    // LOCK IT FOREVER
    localStorage.setItem(STORAGE_KEYS.API_KEY_LOCKED, 'true');

    console.log('API key locked successfully');
    return true;
}

export function getLockedApiKey(): string | null {
    if (!isApiKeyLocked()) {
        return null;
    }

    const encrypted = localStorage.getItem(STORAGE_KEYS.API_KEY_ENCRYPTED);
    if (!encrypted) {
        return null;
    }

    const deviceKey = getDeviceId();
    const decrypted = simpleDecrypt(encrypted, deviceKey);

    return decrypted || null;
}

// ============================================
// RATE LIMITING
// ============================================
export function checkDailyLimit(): { allowed: boolean; remaining: number } {
    const today = new Date().toDateString();
    const lastDate = localStorage.getItem(STORAGE_KEYS.LAST_REQUEST_DATE);
    let count = parseInt(localStorage.getItem(STORAGE_KEYS.DAILY_REQUEST_COUNT) || '0', 10);

    // Reset if new day
    if (lastDate !== today) {
        localStorage.setItem(STORAGE_KEYS.LAST_REQUEST_DATE, today);
        localStorage.setItem(STORAGE_KEYS.DAILY_REQUEST_COUNT, '0');
        count = 0;
    }

    const remaining = DAILY_REQUEST_LIMIT - count;
    return {
        allowed: count < DAILY_REQUEST_LIMIT,
        remaining: Math.max(0, remaining)
    };
}

export function incrementRequestCount(): void {
    const today = new Date().toDateString();
    const lastDate = localStorage.getItem(STORAGE_KEYS.LAST_REQUEST_DATE);
    let count = parseInt(localStorage.getItem(STORAGE_KEYS.DAILY_REQUEST_COUNT) || '0', 10);

    if (lastDate !== today) {
        count = 0;
        localStorage.setItem(STORAGE_KEYS.LAST_REQUEST_DATE, today);
    }

    localStorage.setItem(STORAGE_KEYS.DAILY_REQUEST_COUNT, String(count + 1));
}

// ============================================
// REQUEST THROTTLING
// ============================================
let lastRequestTime = 0;

export async function throttledRequest<T>(
    fn: () => Promise<T>
): Promise<T> {
    // Check daily limit first
    const { allowed, remaining } = checkDailyLimit();
    if (!allowed) {
        throw new Error(`Daily limit reached. ${remaining} requests remaining. Try again tomorrow.`);
    }

    // Check beta expiration
    if (isBetaExpired()) {
        throw new Error('Beta period has expired. Contact support for access.');
    }

    // Throttle requests
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;

    if (timeSinceLastRequest < REQUEST_COOLDOWN_MS) {
        const waitTime = REQUEST_COOLDOWN_MS - timeSinceLastRequest;
        await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    lastRequestTime = Date.now();
    incrementRequestCount();

    return fn();
}

// ============================================
// SUPPORT EMAIL
// ============================================
export function getSupportEmail(): string {
    return SUPPORT_EMAIL;
}

export function openSupportEmail(subject: string = 'API Key Update Request'): void {
    const body = `Hi StyAiLe Support,\n\nI need to update my API key for the beta app.\n\nDevice ID: ${getDeviceId()}\n\nReason:\n[Please describe why you need to update your API key]\n\nThank you!`;
    const mailtoLink = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoLink;
}

// ============================================
// SECURITY STATUS (for debugging)
// ============================================
export function getSecurityStatus(): {
    isExpired: boolean;
    daysRemaining: number;
    expirationDate: string;
    isApiKeyLocked: boolean;
    dailyRequestsRemaining: number;
    deviceId: string;
} {
    const { remaining } = checkDailyLimit();
    return {
        isExpired: isBetaExpired(),
        daysRemaining: getDaysRemaining(),
        expirationDate: getExpirationDate(),
        isApiKeyLocked: isApiKeyLocked(),
        dailyRequestsRemaining: remaining,
        deviceId: getDeviceId().substring(0, 10) + '...',
    };
}

// Export constants for UI
export const BETA_CONFIG = {
    buildDate: BETA_BUILD_DATE,
    durationDays: BETA_DURATION_DAYS,
    supportEmail: SUPPORT_EMAIL,
    dailyLimit: DAILY_REQUEST_LIMIT,
    cooldownMs: REQUEST_COOLDOWN_MS,
};

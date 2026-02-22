// Subscription Service - Manages user subscriptions and feature access
import { PlanTier, UserSubscription, PlanLimits, PLAN_LIMITS, UsageStats } from '../types';

const SUBSCRIPTION_KEY = 'styaile_subscription';
const USAGE_KEY = 'styaile_usage';

// ⚡ DEV MODE: Set to true to unlock ALL Premium features for testing
const DEV_MODE_UNLOCK_ALL = true;

// Initialize Premium subscription for testing (call this on app start)
export function initializePremiumForTesting(): void {
    if (DEV_MODE_UNLOCK_ALL) {
        const premiumSub: UserSubscription = {
            tier: 'premium',
            status: 'active',
            startDate: Date.now(),
            endDate: Date.now() + (365 * 24 * 60 * 60 * 1000), // 1 year
            isYearly: true,
            razorpaySubscriptionId: 'dev_testing_mode'
        };
        localStorage.setItem(SUBSCRIPTION_KEY, JSON.stringify(premiumSub));
        console.log('🔓 DEV MODE: Premium features UNLOCKED for testing!');
    }
}

// Auto-initialize on module load
initializePremiumForTesting();

// Get current subscription (from localStorage for demo, would be from backend in production)
export function getSubscription(): UserSubscription {
    // DEV MODE: Always return premium
    if (DEV_MODE_UNLOCK_ALL) {
        return {
            tier: 'premium',
            status: 'active',
            startDate: Date.now(),
            endDate: Date.now() + (365 * 24 * 60 * 60 * 1000),
            isYearly: true,
            razorpaySubscriptionId: 'dev_testing_mode'
        };
    }

    try {
        const stored = localStorage.getItem(SUBSCRIPTION_KEY);
        if (stored) {
            const sub = JSON.parse(stored) as UserSubscription;
            // Check if expired
            if (sub.endDate && sub.endDate < Date.now() && sub.tier !== 'free') {
                // Auto-downgrade to free
                const freeSub: UserSubscription = {
                    tier: 'free',
                    status: 'active',
                    startDate: Date.now(),
                    endDate: 0,
                    isYearly: false
                };
                localStorage.setItem(SUBSCRIPTION_KEY, JSON.stringify(freeSub));
                return freeSub;
            }
            return sub;
        }
    } catch (e) {
        console.error('Failed to get subscription:', e);
    }

    // Default to free tier
    return {
        tier: 'free',
        status: 'active',
        startDate: Date.now(),
        endDate: 0,
        isYearly: false
    };
}

// Set subscription (called after payment success)
export function setSubscription(tier: PlanTier, isYearly: boolean = false, razorpayId?: string): UserSubscription {
    const now = Date.now();
    const duration = isYearly ? 365 * 24 * 60 * 60 * 1000 : 30 * 24 * 60 * 60 * 1000;

    const subscription: UserSubscription = {
        tier,
        status: 'active',
        startDate: now,
        endDate: tier === 'free' ? 0 : now + duration,
        razorpaySubscriptionId: razorpayId,
        isYearly
    };

    localStorage.setItem(SUBSCRIPTION_KEY, JSON.stringify(subscription));
    return subscription;
}

// Get plan limits for current subscription
export function getPlanLimits(): PlanLimits {
    const sub = getSubscription();
    return PLAN_LIMITS[sub.tier];
}

// Check if a feature is available
export function hasFeature(feature: keyof PlanLimits): boolean {
    const limits = getPlanLimits();
    const value = limits[feature];
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value !== 0;
    return false;
}

// Check if user can add more items
export function canAddItem(currentCount: number): boolean {
    const limits = getPlanLimits();
    if (limits.wardrobeItems === -1) return true;
    return currentCount < limits.wardrobeItems;
}

// Check if user can use AI analysis
export function canUseAI(): boolean {
    const limits = getPlanLimits();
    if (limits.aiAnalysesPerMonth === -1) return true;

    const usage = getUsageStats();
    return usage.aiAnalysesThisMonth < limits.aiAnalysesPerMonth;
}

// Get usage stats
export function getUsageStats(): UsageStats {
    try {
        const stored = localStorage.getItem(USAGE_KEY);
        if (stored) {
            const stats = JSON.parse(stored) as UsageStats;

            // Check if we need to reset monthly counter
            const today = new Date().toISOString().split('T')[0];
            const lastReset = new Date(stats.lastResetDate);
            const now = new Date();

            if (lastReset.getMonth() !== now.getMonth() || lastReset.getFullYear() !== now.getFullYear()) {
                // Reset monthly stats
                stats.aiAnalysesThisMonth = 0;
                stats.lastResetDate = today;
                localStorage.setItem(USAGE_KEY, JSON.stringify(stats));
            }

            return stats;
        }
    } catch (e) {
        console.error('Failed to get usage stats:', e);
    }

    return {
        aiAnalysesThisMonth: 0,
        lastResetDate: new Date().toISOString().split('T')[0],
        totalOutfitsGenerated: 0,
        totalChatMessages: 0,
        wardrobeItemsCount: 0
    };
}

// Increment AI usage
export function incrementAIUsage(): void {
    const stats = getUsageStats();
    stats.aiAnalysesThisMonth++;
    localStorage.setItem(USAGE_KEY, JSON.stringify(stats));
}

// Update usage stats
export function updateUsageStats(updates: Partial<UsageStats>): void {
    const stats = getUsageStats();
    const updated = { ...stats, ...updates };
    localStorage.setItem(USAGE_KEY, JSON.stringify(updated));
}

// Get remaining AI analyses
export function getRemainingAnalyses(): number | 'unlimited' {
    const limits = getPlanLimits();
    if (limits.aiAnalysesPerMonth === -1) return 'unlimited';

    const usage = getUsageStats();
    return Math.max(0, limits.aiAnalysesPerMonth - usage.aiAnalysesThisMonth);
}

// Get remaining wardrobe slots
export function getRemainingSlots(currentCount: number): number | 'unlimited' {
    const limits = getPlanLimits();
    if (limits.wardrobeItems === -1) return 'unlimited';
    return Math.max(0, limits.wardrobeItems - currentCount);
}

// Format plan name
export function formatPlanName(tier: PlanTier): string {
    return tier.charAt(0).toUpperCase() + tier.slice(1);
}

// Get plan color
export function getPlanColor(tier: PlanTier): string {
    switch (tier) {
        case 'free': return '#6b7280'; // gray
        case 'starter': return '#3b82f6'; // blue
        case 'pro': return '#f59e0b'; // amber
        case 'premium': return '#8b5cf6'; // violet
        default: return '#ffffff';
    }
}

// Calculate days remaining
export function getDaysRemaining(): number | 'lifetime' {
    const sub = getSubscription();
    if (sub.tier === 'free' || sub.endDate === 0) return 'lifetime';

    const remaining = sub.endDate - Date.now();
    if (remaining <= 0) return 0;
    return Math.ceil(remaining / (24 * 60 * 60 * 1000));
}

// Check if subscription is expiring soon (within 7 days)
export function isExpiringSoon(): boolean {
    const days = getDaysRemaining();
    if (days === 'lifetime') return false;
    return days <= 7 && days > 0;
}

// Demo: Upgrade subscription (would call Razorpay in production)
export function upgradeSubscription(tier: PlanTier, isYearly: boolean = false): Promise<UserSubscription> {
    return new Promise((resolve) => {
        // Simulate payment delay
        setTimeout(() => {
            const sub = setSubscription(tier, isYearly, `demo_${Date.now()}`);
            resolve(sub);
        }, 1500);
    });
}

// Demo: Cancel subscription
export function cancelSubscription(): Promise<void> {
    return new Promise((resolve) => {
        const sub = getSubscription();
        if (sub.tier !== 'free') {
            sub.status = 'cancelled';
            localStorage.setItem(SUBSCRIPTION_KEY, JSON.stringify(sub));
        }
        resolve();
    });
}

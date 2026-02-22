import React, { useState, useEffect } from 'react';
import {
    PlanTier,
    PLAN_LIMITS,
    PLAN_PRICES,
    UserSubscription
} from '../types';
import {
    getSubscription,
    upgradeSubscription,
    cancelSubscription,
    formatPlanName,
    getDaysRemaining,
    getUsageStats,
    getRemainingAnalyses,
    getRemainingSlots
} from '../services/subscriptionService';

interface SubscriptionViewProps {
    onBack: () => void;
    wardrobeCount: number;
}

const SubscriptionView: React.FC<SubscriptionViewProps> = ({ onBack, wardrobeCount }) => {
    const [subscription, setSubscription] = useState<UserSubscription>(getSubscription());
    const [loading, setLoading] = useState<PlanTier | null>(null);
    const [selectedBilling, setSelectedBilling] = useState<'monthly' | 'yearly'>('monthly');
    const [showSuccess, setShowSuccess] = useState(false);

    const usage = getUsageStats();
    const remainingAnalyses = getRemainingAnalyses();
    const remainingSlots = getRemainingSlots(wardrobeCount);
    const daysRemaining = getDaysRemaining();

    const handleUpgrade = async (tier: PlanTier) => {
        if (tier === subscription.tier) return;

        setLoading(tier);
        try {
            // In production, this would open Razorpay checkout
            const newSub = await upgradeSubscription(tier, selectedBilling === 'yearly');
            setSubscription(newSub);
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
        } catch (e) {
            console.error('Upgrade failed:', e);
        } finally {
            setLoading(null);
        }
    };

    const handleCancel = async () => {
        if (!window.confirm('Are you sure you want to cancel your subscription? You will lose access to premium features at the end of your billing period.')) {
            return;
        }
        await cancelSubscription();
        setSubscription(getSubscription());
    };

    const plans: { tier: PlanTier; name: string; description: string; highlight?: boolean }[] = [
        { tier: 'free', name: 'Free', description: 'Get started with basics' },
        { tier: 'starter', name: 'Starter', description: 'For fashion enthusiasts' },
        { tier: 'pro', name: 'Pro', description: 'Power user features', highlight: true },
        { tier: 'premium', name: 'Premium', description: 'VIP experience' }
    ];

    return (
        <div className="min-h-screen bg-black text-white pb-24">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-black/80 backdrop-blur-xl border-b border-white/10">
                <div className="flex items-center justify-between p-4">
                    <button
                        onClick={onBack}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <h1 className="text-xl font-bold">Subscription</h1>
                    <div className="w-10" />
                </div>
            </div>

            {/* Success Toast */}
            {showSuccess && (
                <div className="fixed top-20 left-4 right-4 bg-green-500/90 backdrop-blur-lg text-white px-4 py-3 rounded-xl z-50 animate-slide-up">
                    <div className="flex items-center gap-3">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="font-medium">Subscription updated successfully!</span>
                    </div>
                </div>
            )}

            {/* Current Plan Status */}
            <div className="p-4">
                <div className="glass-card rounded-2xl p-5 mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <p className="text-gray-400 text-sm">Current Plan</p>
                            <h2 className="text-2xl font-bold">{formatPlanName(subscription.tier)}</h2>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-sm font-medium ${subscription.status === 'active' ? 'bg-green-500/20 text-green-400' :
                                subscription.status === 'cancelled' ? 'bg-red-500/20 text-red-400' :
                                    'bg-yellow-500/20 text-yellow-400'
                            }`}>
                            {subscription.status}
                        </div>
                    </div>

                    {daysRemaining !== 'lifetime' && daysRemaining > 0 && (
                        <p className="text-gray-400 text-sm">
                            {daysRemaining} days remaining
                        </p>
                    )}
                </div>

                {/* Usage Stats */}
                <div className="glass-card rounded-2xl p-5 mb-6">
                    <h3 className="font-semibold mb-4">Usage This Month</h3>
                    <div className="space-y-4">
                        {/* Wardrobe Items */}
                        <div>
                            <div className="flex justify-between text-sm mb-1">
                                <span className="text-gray-400">Wardrobe Items</span>
                                <span>{wardrobeCount} / {remainingSlots === 'unlimited' ? '∞' : wardrobeCount + remainingSlots}</span>
                            </div>
                            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-white rounded-full transition-all"
                                    style={{
                                        width: remainingSlots === 'unlimited' ? '30%' :
                                            `${Math.min(100, (wardrobeCount / (wardrobeCount + remainingSlots)) * 100)}%`
                                    }}
                                />
                            </div>
                        </div>

                        {/* AI Analyses */}
                        <div>
                            <div className="flex justify-between text-sm mb-1">
                                <span className="text-gray-400">AI Analyses</span>
                                <span>{usage.aiAnalysesThisMonth} / {remainingAnalyses === 'unlimited' ? '∞' : usage.aiAnalysesThisMonth + remainingAnalyses}</span>
                            </div>
                            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-white rounded-full transition-all"
                                    style={{
                                        width: remainingAnalyses === 'unlimited' ? '30%' :
                                            `${Math.min(100, (usage.aiAnalysesThisMonth / (usage.aiAnalysesThisMonth + remainingAnalyses)) * 100)}%`
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Billing Toggle */}
                <div className="flex items-center justify-center gap-3 mb-6">
                    <button
                        onClick={() => setSelectedBilling('monthly')}
                        className={`px-4 py-2 rounded-lg transition-all ${selectedBilling === 'monthly'
                                ? 'bg-white text-black'
                                : 'text-gray-400 hover:text-white'
                            }`}
                    >
                        Monthly
                    </button>
                    <button
                        onClick={() => setSelectedBilling('yearly')}
                        className={`px-4 py-2 rounded-lg transition-all ${selectedBilling === 'yearly'
                                ? 'bg-white text-black'
                                : 'text-gray-400 hover:text-white'
                            }`}
                    >
                        Yearly
                        <span className="ml-2 text-xs text-green-400">Save 15%</span>
                    </button>
                </div>

                {/* Plan Cards */}
                <div className="space-y-4">
                    {plans.map(plan => {
                        const limits = PLAN_LIMITS[plan.tier];
                        const prices = PLAN_PRICES[plan.tier];
                        const price = selectedBilling === 'yearly' ? prices.yearly : prices.monthly;
                        const isCurrentPlan = subscription.tier === plan.tier;
                        const isUpgrade = plans.findIndex(p => p.tier === plan.tier) > plans.findIndex(p => p.tier === subscription.tier);

                        return (
                            <div
                                key={plan.tier}
                                className={`glass-card rounded-2xl p-5 transition-all ${plan.highlight ? 'border-white/30 ring-1 ring-white/20' : ''
                                    } ${isCurrentPlan ? 'border-green-500/50' : ''}`}
                            >
                                {plan.highlight && (
                                    <div className="text-xs font-semibold text-amber-400 mb-2">MOST POPULAR</div>
                                )}

                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <h3 className="text-xl font-bold">{plan.name}</h3>
                                        <p className="text-gray-400 text-sm">{plan.description}</p>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-2xl font-bold">₹{price}</span>
                                        {price > 0 && (
                                            <span className="text-gray-400 text-sm">/{selectedBilling === 'yearly' ? 'year' : 'mo'}</span>
                                        )}
                                    </div>
                                </div>

                                {/* Features */}
                                <ul className="space-y-2 mb-4">
                                    <li className="flex items-center gap-2 text-sm">
                                        <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                        <span>{limits.wardrobeItems === -1 ? 'Unlimited' : limits.wardrobeItems} wardrobe items</span>
                                    </li>
                                    <li className="flex items-center gap-2 text-sm">
                                        <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                        <span>{limits.aiAnalysesPerMonth === -1 ? 'Unlimited' : limits.aiAnalysesPerMonth} AI analyses/mo</span>
                                    </li>
                                    {limits.hasExport && (
                                        <li className="flex items-center gap-2 text-sm">
                                            <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                            <span>Export wardrobe data</span>
                                        </li>
                                    )}
                                    {limits.hasPacking && (
                                        <li className="flex items-center gap-2 text-sm">
                                            <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                            <span>Smart packing lists</span>
                                        </li>
                                    )}
                                    {limits.hasCapsule && (
                                        <li className="flex items-center gap-2 text-sm">
                                            <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                            <span>Capsule wardrobe</span>
                                        </li>
                                    )}
                                    {limits.hasBodyAnalysis && (
                                        <li className="flex items-center gap-2 text-sm">
                                            <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                            <span>Body & color analysis</span>
                                        </li>
                                    )}
                                    {limits.hasAnalytics && (
                                        <li className="flex items-center gap-2 text-sm">
                                            <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                            <span>Advanced analytics</span>
                                        </li>
                                    )}
                                    {limits.hasCloudBackup && (
                                        <li className="flex items-center gap-2 text-sm">
                                            <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                            <span>Cloud backup</span>
                                        </li>
                                    )}
                                </ul>

                                {/* Action Button */}
                                {isCurrentPlan ? (
                                    <div className="flex items-center justify-center gap-2 py-3 bg-green-500/20 rounded-xl text-green-400">
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                        <span className="font-medium">Current Plan</span>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => handleUpgrade(plan.tier)}
                                        disabled={loading !== null}
                                        className={`w-full py-3 rounded-xl font-semibold transition-all ${isUpgrade
                                                ? 'bg-white text-black hover:bg-gray-200'
                                                : 'bg-white/10 text-white hover:bg-white/20'
                                            } disabled:opacity-50`}
                                    >
                                        {loading === plan.tier ? (
                                            <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin mx-auto" />
                                        ) : (
                                            isUpgrade ? 'Upgrade' : plan.tier === 'free' ? 'Downgrade' : 'Downgrade'
                                        )}
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Cancel Subscription */}
                {subscription.tier !== 'free' && subscription.status === 'active' && (
                    <button
                        onClick={handleCancel}
                        className="w-full mt-6 py-3 text-red-400 hover:text-red-300 text-sm"
                    >
                        Cancel Subscription
                    </button>
                )}

                {/* FAQ */}
                <div className="mt-8 glass-card rounded-2xl p-5">
                    <h3 className="font-semibold mb-4">Frequently Asked Questions</h3>
                    <div className="space-y-4 text-sm">
                        <div>
                            <p className="text-gray-400 mb-1">How do payments work?</p>
                            <p>We use Razorpay for secure payments. You can pay using UPI, cards, or net banking.</p>
                        </div>
                        <div>
                            <p className="text-gray-400 mb-1">Can I cancel anytime?</p>
                            <p>Yes! You can cancel anytime. You'll keep access until your current period ends.</p>
                        </div>
                        <div>
                            <p className="text-gray-400 mb-1">What happens when I upgrade?</p>
                            <p>You get instant access to all new features. We'll prorate any remaining time.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SubscriptionView;

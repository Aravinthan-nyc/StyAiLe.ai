import { AdMob, RewardAdOptions, AdLoadInfo, RewardAdPluginEvents, AdMobRewardItem } from '@capacitor-community/admob';
import { supabase } from './supabaseClient';

export class AdMobService {
    private static instance: AdMobService;
    private isInitialized = false;

    // Google Test Ad Unit ID for Android Rewarded Video
    // REPLACE THIS WITH YOUR REAL AD UNIT ID FOR PRODUCTION
    private readonly AD_UNIT_ID = 'ca-app-pub-3940256099942544/5224354917';

    private constructor() { }

    public static getInstance(): AdMobService {
        if (!AdMobService.instance) {
            AdMobService.instance = new AdMobService();
        }
        return AdMobService.instance;
    }

    public async initialize(): Promise<void> {
        if (this.isInitialized) return;

        try {
            await AdMob.initialize({
                requestTrackingAuthorization: true,
                testingDevices: ['2077ef9a63d2b398840261c8221a0c9b'], // Add your test device ID here if needed
                initializeForTesting: true,
            });
            this.isInitialized = true;
            console.log('AdMob Initialized');
        } catch (error) {
            console.error('AdMob Initialization Failed:', error);
        }
    }

    public async showRewardedAd(): Promise<boolean> {
        return new Promise(async (resolve) => {
            try {
                // 1. Prepare Ad Options
                const options: RewardAdOptions = {
                    adId: this.AD_UNIT_ID,
                    isTesting: true, // Set to false for production
                    // npa: true, // Non-personalized ads (GDPR compliance if needed)
                };

                // 2. Prepare Event Listeners
                let rewardEarned = false;

                // On Reward Earned (User watched enough)
                const onRewarded = await AdMob.addListener(RewardAdPluginEvents.Rewarded, (item: AdMobRewardItem) => {
                    console.log('Ad Reward Earned:', item);
                    rewardEarned = true;
                });

                // On Ad Dismissed (User closed ad)
                const onDismissed = await AdMob.addListener(RewardAdPluginEvents.Dismissed, async () => {
                    console.log('Ad Dismissed');
                    // Clean up listeners
                    await onRewarded.remove();
                    await onDismissed.remove();
                    await onFailed.remove();

                    if (rewardEarned) {
                        // Call Server to Add Credits
                        const success = await this.grantCredits(5, "watched_ad");
                        resolve(success);
                    } else {
                        resolve(false);
                    }
                });

                const onFailed = await AdMob.addListener(RewardAdPluginEvents.FailedToLoad, async (error: any) => {
                    console.error('Ad Failed to Load:', error);
                    await onRewarded.remove();
                    await onDismissed.remove();
                    await onFailed.remove();
                    resolve(false);
                });

                // 3. Prepare & Show Ad
                await AdMob.prepareRewardVideoAd(options);
                await AdMob.showRewardVideoAd();

            } catch (error) {
                console.error('Show Ad Failed:', error);
                resolve(false);
            }
        });
    }

    private async grantCredits(amount: number, reason: string): Promise<boolean> {
        try {
            // Generate a pseudo-transaction ID for idempotency
            // In production, AdMob SSV (Server-Side Verification) is better,
            // but for this MVP, we generate a unique client-side ID.
            const transactionId = `ad_${Date.now()}_${Math.random().toString(36).substring(7)}`;

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return false;

            // Call our Secure Edge Function to add credits
            const { error } = await supabase.functions.invoke('verify-ad-reward', {
                body: {
                    proofToken: "client_side_simulated_proof", // Simplified for MVP
                    transactionId: transactionId,
                    rewardAmount: amount
                }
            });

            if (error) {
                console.error("Failed to grant credits:", error);
                return false;
            }

            return true;

        } catch (e) {
            console.error("Grant Credit Error:", e);
            return false;
        }
    }
}

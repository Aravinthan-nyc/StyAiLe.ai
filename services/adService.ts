import { AdMob, RewardAdOptions, AdLoadInfo, RewardAdPluginEvents, AdMobRewardItem } from '@capacitor-community/admob';
import { supabase } from './supabaseClient';

// Test ID for Android Rewarded Video
const ADMOB_AD_UNIT_ID = 'ca-app-pub-3940256099942544/5224354917';

export const AdService = {

    async initialize() {
        try {
            await AdMob.initialize({
                requestTrackingAuthorization: true,
                initializeForTesting: true, // Remove in production
            });
            console.log('AdMob initialized');
        } catch (e) {
            console.error('AdMob init failed:', e);
        }
    },

    /**
     * Show a rewarded video ad and credit user on completion
     */
    async showRewardAd(): Promise<{ success: boolean, reward?: number }> {
        return new Promise(async (resolve) => {
            try {
                // 1. Prepare Ad
                const options: RewardAdOptions = {
                    adId: ADMOB_AD_UNIT_ID,
                    isTesting: true
                };

                await AdMob.prepareRewardVideoAd(options);

                // 2. Set up listeners
                const onReward = async (reward: AdMobRewardItem) => {
                    console.log('User earned reward:', reward);

                    // 3. Verify on Server (Secure)
                    const { data, error } = await supabase.functions.invoke('verify-ad-reward', {
                        body: {
                            rewardAmount: reward.amount > 0 ? reward.amount : 5,
                            proofToken: 'mock-proof-token' // In prod, get this from AdMob response if available
                        }
                    });

                    if (error) {
                        console.error('Server verification failed:', error);
                        resolve({ success: false });
                    } else {
                        resolve({ success: true, reward: data.newCredits });
                    }
                };

                const onDismiss = () => {
                    // Cleanup listeners if needed
                };

                // Hooks might be global, be careful with multiplelisteners in a real app
                // For simple MVP we just add/remove or assume singleton usage
                await AdMob.addListener(RewardAdPluginEvents.OnRewarded, onReward);

                // 4. Show Ad
                await AdMob.showRewardVideoAd();

            } catch (e) {
                console.error('Failed to show ad:', e);
                resolve({ success: false });
            }
        });
    }
};

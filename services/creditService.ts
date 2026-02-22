import { supabase } from './supabaseClient';

export interface CreditBalance {
    userId: string;
    balance: number;
}

export const CreditService = {
    /**
     * Get current user's credit balance
     */
    async getBalance(): Promise<number> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return 0;

        const { data, error } = await supabase
            .from('user_credits')
            .select('balance')
            .eq('user_id', user.id)
            .maybeSingle();

        if (error) {
            console.error('Error fetching credits:', error);
            return 0;
        }

        return data?.balance || 0;
    },

    /**
     * Subscribe to credit updates (real-time)
     */
    subscribeToBalance(callback: (balance: number) => void) {
        const subscription = supabase
            .channel('public:user_credits')
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'user_credits'
            }, (payload) => {
                // Optimistically update or fetch fresh
                if (payload.new && 'balance' in payload.new) {
                    callback(payload.new.balance as number);
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(subscription);
        };
    },

    /**
     * Deduct credits from user balance
     * Returns true if successful, false if insufficient credits or error
     */
    async deductCredits(amount: number, reason: string = 'usage'): Promise<boolean> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return false;

        // check current balance first
        const balance = await this.getBalance();
        if (balance < amount) {
            console.warn(`💰 Insufficient credits. Required: ${amount}, Available: ${balance}`);
            return false;
        }

        // Call RPC or update directly
        // Using RPC is safer for concurrency, but direct update works for MVP if RLS allows
        const { error } = await supabase.rpc('deduct_user_credits', {
            userid: user.id,
            amount: amount,
            reason: reason // Optional if RPC supports it
        });

        if (error) {
            console.error('❌ Failed to deduct credits:', error);
            // Fallback to direct update if RPC fails/doesn't exist
            const { error: updateError } = await supabase
                .from('user_credits')
                .update({ balance: balance - amount })
                .eq('user_id', user.id);

            if (updateError) {
                console.error('❌ Failed to deduct credits (fallback):', updateError);
                return false;
            }
        }

        console.log(`💰 Deducted ${amount} credits for ${reason}. New balance: ${balance - amount}`);
        return true;
    }
};

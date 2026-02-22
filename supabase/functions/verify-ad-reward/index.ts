import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        // 1. Create Supabase Client (Service Role needed to ADD credits securely)
        const supabaseAdmin = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );

        // 2. Get User from Header (Standard Auth)
        const supabaseClient = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_ANON_KEY") ?? "",
            { global: { headers: { Authorization: req.headers.get("Authorization")! } } }
        );
        const { data: { user } } = await supabaseClient.auth.getUser();

        if (!user) {
            throw new Error("Unauthorized");
        }

        const { rewardAmount = 5, proofToken, transactionId } = await req.json();

        // 3. Verify Proof (MOCKED FOR NOW)
        // In production: Verify `proofToken` signature from AdMob.
        if (!proofToken) {
            throw new Error("Missing ad proof");
        }

        // --- SECURITY: DAILY FREQUENCY CAP ---
        const MAX_ADS_PER_DAY = 5;
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

        // Count ads watched today
        const { count, error: countError } = await supabaseAdmin
            .from('processed_ad_transactions')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id.session?.user?.id || user.id) // Fallback for robustness
            .gte('created_at', `${today}T00:00:00Z`);

        if (countError) {
            console.error("Error checking ad limit:", countError);
            throw new Error("Service temporarily unavailable");
        }

        if ((count || 0) >= MAX_ADS_PER_DAY) {
            console.warn(`User ${user.id} hit daily ad limit (${count}/${MAX_ADS_PER_DAY})`);
            return new Response(JSON.stringify({
                success: false,
                message: "Daily ad limit reached. Come back tomorrow!",
                limitReached: true
            }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 403 // Forbidden
            });
        }

        // 3a. Idempotency Check (Prevent Replay Attacks)
        // Use the transactionId from the client/ad-network (or hash the proofToken if no ID)
        const uniqueId = transactionId || proofToken;

        // Check if already processed
        const { data: existing } = await supabaseAdmin
            .from('processed_ad_transactions')
            .select('id')
            .eq('transaction_id', uniqueId)
            .maybeSingle();

        if (existing) {
            console.log(`Duplicate transaction ${uniqueId} - treating as success (idempotent)`);
            return new Response(JSON.stringify({ success: true, newCredits: 0, message: "Already processed" }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        console.log(`Verifying ad reward for user ${user.id} (${(count || 0) + 1}/${MAX_ADS_PER_DAY})`);

        // 4. Record Transaction FIRST (Atomic-ish via insert)
        const { error: insertError } = await supabaseAdmin
            .from('processed_ad_transactions')
            .insert({
                transaction_id: uniqueId,
                user_id: user.id,
                reward_amount: rewardAmount
            });

        if (insertError) {
            // If unique constraint fails, it's a race condition/replay
            if (insertError.code === '23505') { // Unique violation
                return new Response(JSON.stringify({ success: true, newCredits: 0, message: "Already processed" }), {
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                });
            }
            throw insertError;
        }

        // 5. Add Credits via RPC
        const { error } = await supabaseAdmin.rpc("add_credits", {
            target_user_id: user.id,
            amount: rewardAmount,
            reason: `ad_reward:${uniqueId}`,
        });

        if (error) {
            // Failed to credit, strictly we might want to rollback the transaction record
            // But for now, we log it. User can contact support.
            console.error("Failed to credit user", error);
            throw error;
        }

        return new Response(JSON.stringify({ success: true, newCredits: rewardAmount }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
        });
    }
});

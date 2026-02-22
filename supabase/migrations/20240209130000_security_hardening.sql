-- Create a table to track processed ad transactions (Idempotency)
create table if not exists public.processed_ad_transactions (
  id uuid default gen_random_uuid() primary key,
  transaction_id text not null unique, -- The ad network's transaction ID
  user_id uuid references auth.users not null,
  reward_amount int4 not null,
  processed_at timestamptz default now()
);

-- Enable RLS
alter table public.processed_ad_transactions enable row level security;

-- Policy: Service Role can do EVERYTHING (Insert/Select)
create policy "Service role can manage ad transactions"
  on public.processed_ad_transactions
  for all
  using ( auth.role() = 'service_role' );

-- Policy: Users can VIEW their own transactions (Audit log)
create policy "Users can view own ad transactions"
  on public.processed_ad_transactions
  for select
  using ( auth.uid() = user_id );

-- Policy: Users CANNOT insert/update/delete (ReadOnly)
-- (Implicit deny for other roles/actions)

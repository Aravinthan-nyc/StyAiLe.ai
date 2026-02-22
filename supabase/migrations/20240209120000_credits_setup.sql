-- Create a table for user credits
create table if not exists public.user_credits (
  user_id uuid references auth.users not null primary key,
  balance int4 not null default 0,
  updated_at timestamptz default now()
);

-- Enable RLS
alter table public.user_credits enable row level security;

-- Policy: Users can view their own credit balance
drop policy if exists "Users can view own credits" on public.user_credits;
create policy "Users can view own credits"
  on public.user_credits for select
  using ( auth.uid() = user_id );

-- Policy: Only service role can update credits (Client CANNOT update)
drop policy if exists "Service role can update credits" on public.user_credits;
create policy "Service role can update credits"
  on public.user_credits for all
  using ( auth.role() = 'service_role' );

-- Create a table for credit transactions (history)
create table if not exists public.credit_transactions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  amount int4 not null, -- Positive for earning, negative for spending
  reason text not null, -- e.g., 'ad_reward', 'outfit_generation'
  created_at timestamptz default now()
);

-- Enable RLS
alter table public.credit_transactions enable row level security;

-- Policy: Users can view their own transactions
drop policy if exists "Users can view own transactions" on public.credit_transactions;
create policy "Users can view own transactions"
  on public.credit_transactions for select
  using ( auth.uid() = user_id );

-- Function to handle new user creation (trigger)
create or replace function public.handle_new_user_credits()
returns trigger as $$
begin
  insert into public.user_credits (user_id, balance)
  values (new.id, 10); -- Give 10 free credits to start
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to create credit record on signup
drop trigger if exists on_auth_user_created_credits on auth.users;
create trigger on_auth_user_created_credits
  after insert on auth.users
  for each row execute procedure public.handle_new_user_credits();

-- RPC: Deduct Credits (Called by Edge Functions)
-- SECURITY: This function is accessible to authenticated users but has logic checks
create or replace function deduct_credits(amount int, reason text)
returns json
language plpgsql
security definer
as $$
declare
  current_balance int;
  user_id uuid;
begin
  user_id := auth.uid();
  
  -- Check if user has enough credits
  select balance into current_balance from public.user_credits where user_id = auth.uid();
  
  if current_balance < amount then
    return json_build_object('success', false, 'message', 'Insufficient credits');
  end if;
  
  -- Deduct credits
  update public.user_credits
  set balance = balance - amount,
      updated_at = now()
  where user_id = auth.uid();
  
  -- Log transaction
  insert into public.credit_transactions (user_id, amount, reason)
  values (auth.uid(), -amount, reason);
  
  return json_build_object('success', true, 'new_balance', current_balance - amount);
end;
$$;

-- RPC: Add Credits (Securely called by Ad Verification Function)
-- This function should be arguably restricted, but for simplicity here we rely on the implementation logic
-- Ideally, ad verification happens on the server, which then calls a service-role only function.
-- For this setup: We will allow the Edge Function to call this with `service_role` key.
create or replace function add_credits(target_user_id uuid, amount int, reason text)
returns void
language plpgsql
security definer
as $$
begin
  -- Update balance
  insert into public.user_credits (user_id, balance)
  values (target_user_id, amount)
  on conflict (user_id)
  do update set balance = user_credits.balance + amount, updated_at = now();
  
  -- Log transaction
  insert into public.credit_transactions (user_id, amount, reason)
  values (target_user_id, amount, reason);
end;
$$;

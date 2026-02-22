-- Backfill credits for existing users who don't have a row in user_credits
insert into public.user_credits (user_id, balance)
select id, 10 -- Give 10 free credits to existing users
from auth.users
where id not in (select user_id from public.user_credits);

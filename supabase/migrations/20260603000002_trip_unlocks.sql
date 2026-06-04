create table trip_unlocks (
  id           uuid primary key default gen_random_uuid(),
  trip_id      uuid not null references trips(id) on delete cascade,
  user_id      uuid not null references profiles(id) on delete cascade,
  purchased_at timestamptz not null default now(),
  unique(trip_id, user_id)
);

alter table trip_unlocks enable row level security;

create policy "Users can view their own trip unlocks"
  on trip_unlocks for select
  using (auth.uid() = user_id);

create policy "Users can insert their own trip unlocks"
  on trip_unlocks for insert
  with check (auth.uid() = user_id);

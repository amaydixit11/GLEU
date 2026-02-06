-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Create players table
create table public.players (
  id uuid primary key default uuid_generate_v4(),
  name text unique not null,
  initial_elo integer default 1000,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Create games table
create table public.games (
  id uuid primary key default uuid_generate_v4(),
  played_at timestamp with time zone default timezone('utc'::text, now()) not null,
  total_players integer not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Create game_results table
create table public.game_results (
  id uuid primary key default uuid_generate_v4(),
  game_id uuid references public.games(id) on delete cascade not null,
  player_id uuid references public.players(id) on delete cascade not null,
  raw_positions integer[] not null, -- Array of positions (e.g. [4, 8] if rejoined)
  normalized_position numeric not null, -- Calculated average
  elo_before integer not null,
  elo_after integer not null,
  elo_change integer not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Create index for performance
create index idx_game_results_player_id on public.game_results(player_id);
create index idx_game_results_game_id on public.game_results(game_id);

-- 5. Enable Row Level Security (RLS) - Optional for now but good practice
alter table public.players enable row level security;
alter table public.games enable row level security;
alter table public.game_results enable row level security;

-- Create policies (Open for now, lock down later)
create policy "Enable read access for all users" on public.players for select using (true);
create policy "Enable insert for all users" on public.players for insert with check (true);
create policy "Enable update for all users" on public.players for update using (true); -- needed for elo updates

create policy "Enable read access for all users" on public.games for select using (true);
create policy "Enable insert for all users" on public.games for insert with check (true);

create policy "Enable read access for all users" on public.game_results for select using (true);
create policy "Enable insert for all users" on public.game_results for insert with check (true);

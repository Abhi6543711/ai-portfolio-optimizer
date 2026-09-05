-- Run this in Supabase SQL Editor (Project > SQL Editor > New Query)

create table if not exists portfolios (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null,
  portfolio_name text default 'My Portfolio',
  strategy text not null,
  expected_return numeric,
  volatility numeric,
  sharpe_ratio numeric,
  risk_score integer,
  risk_level text,
  tickers text[],
  created_at timestamptz default now()
);

create table if not exists portfolio_assets (
  id uuid primary key default gen_random_uuid(),
  portfolio_id uuid references portfolios(id) on delete cascade,
  ticker_symbol text not null,
  asset_weight numeric not null
);

create table if not exists predictions (
  id uuid primary key default gen_random_uuid(),
  portfolio_id uuid references portfolios(id) on delete cascade,
  ticker_symbol text not null,
  current_price numeric,
  predicted_next_close numeric,
  predicted_change_pct numeric,
  model_name text default 'random_forest',
  created_at timestamptz default now()
);

-- Row Level Security: users can only see/insert their own data
alter table portfolios enable row level security;
alter table portfolio_assets enable row level security;
alter table predictions enable row level security;

create policy "Users manage own portfolios" on portfolios
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users manage own portfolio assets" on portfolio_assets
  for all using (
    portfolio_id in (select id from portfolios where user_id = auth.uid())
  ) with check (
    portfolio_id in (select id from portfolios where user_id = auth.uid())
  );

create policy "Users manage own predictions" on predictions
  for all using (
    portfolio_id in (select id from portfolios where user_id = auth.uid())
  ) with check (
    portfolio_id in (select id from portfolios where user_id = auth.uid())
  );

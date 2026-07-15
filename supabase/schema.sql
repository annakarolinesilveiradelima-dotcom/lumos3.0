create table if not exists update_runs (
  id uuid primary key default gen_random_uuid(),
  started_at timestamptz default now(),
  date_from date not null,
  date_to date not null,
  status text not null default 'completed',
  total_items integer default 0
);
create table if not exists intelligence_items (
  id text primary key,
  run_id uuid references update_runs(id) on delete set null,
  title text not null,
  source text not null,
  source_kind text not null,
  url text not null,
  published_at timestamptz not null,
  week_id text not null,
  summary text,
  sentiment text,
  sentiment_reason text,
  risk_score integer,
  opportunity_score integer,
  relevance_score integer,
  tags text[],
  reach integer,
  region text,
  creator text,
  created_at timestamptz default now()
);
create table if not exists weekly_snapshots (
  week_id text primary key,
  start_date date not null,
  end_date date not null,
  total_items integer default 0,
  positive integer default 0,
  neutral integer default 0,
  negative integer default 0,
  buzz_score integer default 0,
  risk_score integer default 0,
  opportunity_score integer default 0,
  top_topics text[],
  key_narrative text,
  what_changed text,
  updated_at timestamptz default now()
);
create index if not exists intelligence_items_week_id_idx on intelligence_items(week_id);
create index if not exists intelligence_items_published_at_idx on intelligence_items(published_at);
create index if not exists intelligence_items_source_kind_idx on intelligence_items(source_kind);

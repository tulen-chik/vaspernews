-- Update news policies to allow authenticated users to create news
create policy "Users can create news"
  on news for insert
  with check ( auth.uid() = author_id );

create policy "Users can update own news"
  on news for update
  using ( auth.uid() = author_id );

create policy "Users can delete own news"
  on news for delete
  using ( auth.uid() = author_id );

-- Add statistics table
create table public.news_stats (
  id uuid default uuid_generate_v4() primary key,
  news_id uuid references public.news(id) on delete cascade,
  views integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add RLS for news_stats
alter table public.news_stats enable row level security;

create policy "News stats are viewable by everyone"
  on news_stats for select
  using ( true );

create policy "Only authors can update news stats"
  on news_stats for update
  using ( 
    auth.uid() in (
      select author_id from news where id = news_id
    )
  );


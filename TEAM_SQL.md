# Team SQL — Run in Supabase SQL Editor

Paste **one block per query tab** in order. The `teams` SELECT policy references `team_members`, so it must run last.

---

## 1. Sessions table (if not already created)

```sql
create table if not exists sessions (
  id text primary key,
  user_id uuid references auth.users not null,
  date date not null,
  state text not null,
  reset_completed boolean default false,
  outcome text,
  created_at timestamptz default now()
);

alter table sessions enable row level security;

create policy "Users see own sessions"
  on sessions for all
  using (auth.uid() = user_id);
```

---

## 2. Teams table — structure + insert/update policies only

⚠️ Do NOT include the SELECT policy yet — it references `team_members` which doesn't exist yet.

```sql
create table if not exists teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  invite_code text not null unique,
  owner_id uuid references auth.users not null,
  created_at timestamptz default now()
);

alter table teams enable row level security;

create policy "Owner can update team"
  on teams for update
  using (owner_id = auth.uid());

create policy "Authenticated users can insert teams"
  on teams for insert
  with check (auth.uid() = owner_id);
```

---

## 3. Team members table

```sql
create table if not exists team_members (
  team_id uuid references teams on delete cascade not null,
  user_id uuid references auth.users not null,
  joined_at timestamptz default now(),
  primary key (team_id, user_id)
);

alter table team_members enable row level security;

create policy "Members can view team roster"
  on team_members for select
  using (
    team_id in (
      select team_id from team_members where user_id = auth.uid()
    )
  );

create policy "Users can join teams"
  on team_members for insert
  with check (auth.uid() = user_id);

create policy "Users can leave teams"
  on team_members for delete
  using (auth.uid() = user_id);
```

---

## 4. Teams SELECT policy (run after team_members exists)

```sql
create policy "Members can view their team"
  on teams for select
  using (
    id in (
      select team_id from team_members where user_id = auth.uid()
    )
  );
```

---

## Known limitation (Wave 3)

Due to Supabase RLS, each user can only read their own rows in the `sessions` table.
The TeamPanel currently shows live streak + state data for the signed-in user only;
other team members display as placeholders. Wave 3 will add a Postgres function or
Edge Function to aggregate cross-user session stats server-side.
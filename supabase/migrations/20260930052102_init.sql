-- call_human() v1 schema. See PLAN.md section 3. Applied to project wsgnjawrmokkvrfgpmpl.
-- Browser clients get read access to their own rows only. Every write goes
-- through server code using the secret (service role) key.

-- ---------------------------------------------------------------------------
-- users: one row per auth user (anonymous or not), created by trigger
-- ---------------------------------------------------------------------------
create table public.users (
  id                 uuid primary key references auth.users (id) on delete cascade,
  paid               boolean not null default false,
  paid_at            timestamptz,
  stripe_customer_id text,
  email              text,
  created_at         timestamptz not null default now()
);

create function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.users (id, email) values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

-- ---------------------------------------------------------------------------
-- sessions / steps / attempts
-- ---------------------------------------------------------------------------
create table public.sessions (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references public.users (id) on delete cascade,
  title               text,
  problem             text not null check (char_length(problem) between 1 and 20000),
  language            text not null check (language in ('python', 'java', 'js', 'c')),
  status              text not null default 'active' check (status in ('active', 'done', 'abandoned')),
  current_step        int not null default 0,
  hints_used          int not null default 0,
  paste_count         int not null default 0,
  largest_paste       int not null default 0,
  trace_ok            boolean,
  replay_public       boolean not null default true,
  counts_toward_quota boolean not null default true,  -- false when refunded (planner failure)
  share_slug          text unique not null default substr(replace(gen_random_uuid()::text, '-', ''), 1, 12),
  started_at          timestamptz not null default now(),
  finished_at         timestamptz
);
create index sessions_user_started_idx on public.sessions (user_id, started_at desc);

create table public.steps (
  id               uuid primary key default gen_random_uuid(),
  session_id       uuid not null references public.sessions (id) on delete cascade,
  idx              int not null,
  task             text not null,
  success_criteria text not null,
  passed_at        timestamptz,
  unique (session_id, idx)
);

create table public.attempts (
  id            uuid primary key default gen_random_uuid(),
  session_id    uuid not null references public.sessions (id) on delete cascade,
  step_idx      int not null,
  kind          text not null check (kind in ('submit', 'hint')),
  hint_level    int check (hint_level between 1 and 3),
  code          text,
  status        text check (status in ('pass', 'retry')),
  feedback      text,
  highlight     jsonb,
  input_tokens  int,
  output_tokens int,
  latency_ms    int,
  created_at    timestamptz not null default now()
);
create index attempts_session_step_idx on public.attempts (session_id, step_idx);

-- ---------------------------------------------------------------------------
-- edit trace (PLAN.md section 7)
-- ---------------------------------------------------------------------------
create table public.trace_chunks (
  session_id uuid not null references public.sessions (id) on delete cascade,
  seq        int not null,
  step_idx   int not null,
  events     jsonb not null,
  created_at timestamptz not null default now(),
  primary key (session_id, seq)
);

-- ---------------------------------------------------------------------------
-- guardrail leak log
-- ---------------------------------------------------------------------------
create table public.leaks (
  id           uuid primary key default gen_random_uuid(),
  session_id   uuid references public.sessions (id) on delete set null,
  call_type    text not null check (call_type in ('plan', 'grade', 'hint')),
  attempt_no   int not null,
  detector     text not null,
  reason       text not null,
  raw_response text not null,
  created_at   timestamptz not null default now()
);
create index leaks_created_idx on public.leaks (created_at desc);

-- ---------------------------------------------------------------------------
-- payments
-- ---------------------------------------------------------------------------
create table public.founders (
  checkout_session_id text primary key,
  email               text,
  amount_total        int,
  currency            text,
  claimed_by          uuid references public.users (id) on delete set null,
  claimed_at          timestamptz,
  created_at          timestamptz not null default now()
);

create table public.stripe_events (
  id           text primary key,
  type         text not null,
  processed_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- free-tier limit by salted IP hash, per UTC day
-- ---------------------------------------------------------------------------
create table public.usage_ip (
  ip_hash text not null,
  day     date not null,
  count   int not null default 0,
  primary key (ip_hash, day)
);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.users         enable row level security;
alter table public.sessions      enable row level security;
alter table public.steps         enable row level security;
alter table public.attempts      enable row level security;
alter table public.trace_chunks  enable row level security;
alter table public.leaks         enable row level security;
alter table public.founders      enable row level security;
alter table public.stripe_events enable row level security;
alter table public.usage_ip      enable row level security;

create policy "read own user row" on public.users
  for select to authenticated using ((select auth.uid()) = id);

create policy "read own sessions" on public.sessions
  for select to authenticated using ((select auth.uid()) = user_id);

create policy "read own attempts" on public.attempts
  for select to authenticated using (
    exists (select 1 from public.sessions s
            where s.id = attempts.session_id and s.user_id = (select auth.uid()))
  );

-- steps, trace_chunks, leaks, founders, stripe_events, usage_ip: no policies.
-- Only the service role reads them (the plan must never reach the browser).

-- ---------------------------------------------------------------------------
-- start_session: quota check + insert in one transaction (PLAN.md section 3. Applied to project wsgnjawrmokkvrfgpmpl.
-- ---------------------------------------------------------------------------
create function public.start_session(
  p_user_id  uuid,
  p_ip_hash  text,
  p_problem  text,
  p_language text,
  p_limit    int default 3
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_today      date := (now() at time zone 'utc')::date;
  v_paid       boolean;
  v_user_count int;
  v_ip_count   int;
  v_session_id uuid;
begin
  -- Serialize concurrent starts for the same user and the same IP.
  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text, 0));
  perform pg_advisory_xact_lock(hashtextextended(p_ip_hash, 0));

  select paid into v_paid from public.users where id = p_user_id;
  if not found then
    return jsonb_build_object('ok', false, 'reason', 'no_user');
  end if;

  if not v_paid then
    select count(*) into v_user_count
      from public.sessions
     where user_id = p_user_id
       and counts_toward_quota
       and started_at >= v_today::timestamp at time zone 'utc';

    select coalesce(max(count), 0) into v_ip_count
      from public.usage_ip
     where ip_hash = p_ip_hash and day = v_today;

    if v_user_count >= p_limit or v_ip_count >= p_limit then
      return jsonb_build_object('ok', false, 'reason', 'limit');
    end if;

    insert into public.usage_ip (ip_hash, day, count) values (p_ip_hash, v_today, 1)
    on conflict (ip_hash, day) do update set count = public.usage_ip.count + 1;
  end if;

  insert into public.sessions (user_id, problem, language)
  values (p_user_id, p_problem, p_language)
  returning id into v_session_id;

  return jsonb_build_object('ok', true, 'session_id', v_session_id);
end;
$$;

-- refund_session: planner failed, give the free slot back.
create function public.refund_session(p_session_id uuid, p_ip_hash text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_day date;
begin
  update public.sessions
     set counts_toward_quota = false, status = 'abandoned'
   where id = p_session_id and counts_toward_quota
  returning (started_at at time zone 'utc')::date into v_day;

  if found then
    update public.usage_ip set count = greatest(count - 1, 0)
     where ip_hash = p_ip_hash and day = v_day;
  end if;
end;
$$;

revoke all on function public.start_session(uuid, text, text, text, int) from public, anon, authenticated;
revoke all on function public.refund_session(uuid, text) from public, anon, authenticated;
revoke all on function public.handle_new_auth_user() from public, anon, authenticated;
grant execute on function public.start_session(uuid, text, text, text, int) to service_role;
grant execute on function public.refund_session(uuid, text) to service_role;

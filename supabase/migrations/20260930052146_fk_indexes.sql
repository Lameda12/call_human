-- Covering indexes for foreign keys flagged by the Supabase performance advisor.
create index founders_claimed_by_idx on public.founders (claimed_by);
create index leaks_session_id_idx on public.leaks (session_id);

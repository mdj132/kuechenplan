-- Küchenplan: eine einfache Dokument-Tabelle für Pläne, Stimmen, Wünsche, Abwahlen und Rezepte
create table if not exists public.kv (
  collection text not null,
  id         text not null,
  data       jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (collection, id)
);
alter table public.kv replica identity full;
alter table public.kv enable row level security;
-- Ohne Passwort: jeder mit dem App-Link darf lesen und schreiben
drop policy if exists "kv_all" on public.kv;
create policy "kv_all" on public.kv for all to anon, authenticated using (true) with check (true);
-- Live-Updates
do $$ begin
  alter publication supabase_realtime add table public.kv;
exception when duplicate_object then null; end $$;
-- Startplan KW 44
insert into public.kv (collection, id, data) values
  ('plans','2026-W44','{"week":"2026-W44","days":["r10","r02","r26","r24","r05"],"by":"Marc"}')
on conflict do nothing;

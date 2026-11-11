-- Hız sınırlayıcı (lib/rate-limit.ts bunu çağırır).
-- Canlıda zaten var; bu dosya kayıttır, yeniden çalıştırmak gerekmez.
-- Canlıdan 11.11.2026'da okunarak yazıldı.

create table if not exists public.rate_limit_events (
  id bigserial primary key,
  bucket text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_rate_limit_events_bucket_time
  on public.rate_limit_events (bucket, created_at);

-- Politika tanımlı değil: tabloya yalnızca servis rolü ve aşağıdaki işlev erişir.
alter table public.rate_limit_events enable row level security;

create or replace function public.check_rate_limit(p_bucket text, p_max integer, p_window_seconds integer)
 returns boolean
 language plpgsql
 security definer
 set search_path to ''
as $function$
declare
  v_count int;
begin
  -- Nadiren de olsa eski kayitlari temizle (kucuk olcek icin yeterli)
  delete from public.rate_limit_events where created_at < now() - interval '2 hours';

  select count(*) into v_count
  from public.rate_limit_events
  where bucket = p_bucket
    and created_at > now() - make_interval(secs => p_window_seconds);

  if v_count >= p_max then
    return false;
  end if;

  insert into public.rate_limit_events(bucket) values (p_bucket);
  return true;
end;
$function$;

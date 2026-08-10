-- Hasta isimlerini Türkçe/ASCII büyük-küçük harf ve aksan farklarından bağımsız arar.
create or replace function public.tr_fold(t text)
returns text
language sql
immutable
parallel safe
as $$
  select translate(
    lower(translate(coalesce(t, ''), 'İIıi', 'iiii')),
    'şğüçöâîû',
    'sgucoaiu'
  );
$$;

create or replace function public.search_patients_tr(q text)
returns table(id uuid, full_name text, phone text, tc_no text, date_of_birth date)
language sql
stable
as $$
  select p.id, p.full_name, p.phone, p.tc_no, p.date_of_birth
  from public.patients p
  where p.is_blacklisted is distinct from true
    and (
      public.tr_fold(p.full_name) like '%' || public.tr_fold(q) || '%'
      or coalesce(p.tc_no, '') ilike trim(q) || '%'
      or coalesce(p.phone, '') ilike trim(q) || '%'
    )
  order by p.full_name
  limit 10;
$$;

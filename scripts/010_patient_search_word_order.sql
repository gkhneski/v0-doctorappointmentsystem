-- Hasta aramasini kelime sirasindan bagimsiz yapar:
-- "nurgul kaya ozmen" yazildiginda "Nurgül Özmen Kaya" da bulunur.
-- Telefon aramasi bosluk/tire/basta 0 farklarini yok sayar. Sonuc limiti 10 -> 30.
create or replace function public.search_patients_tr(q text)
returns table(id uuid, full_name text, phone text, tc_no text, date_of_birth date)
language sql
stable
as $$
  with words as (
    select w from regexp_split_to_table(public.tr_fold(trim(q)), '\s+') as w where w <> ''
  ),
  digits as (
    select ltrim(regexp_replace(coalesce(q, ''), '\D', '', 'g'), '0') as d
  )
  select p.id, p.full_name, p.phone, p.tc_no, p.date_of_birth
  from public.patients p, digits
  where p.is_blacklisted is distinct from true
    and (
      not exists (
        select 1 from words where public.tr_fold(p.full_name) not like '%' || words.w || '%'
      )
      or coalesce(p.tc_no, '') ilike trim(q) || '%'
      or (length(digits.d) >= 3 and regexp_replace(coalesce(p.phone, ''), '\D', '', 'g') like '%' || digits.d || '%')
    )
  order by p.full_name
  limit 30;
$$;

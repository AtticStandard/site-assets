-- TERMINAL, WEEK DETAIL (November 26, 2026). The Indexes view's week table, built once per index per
-- published week and stored, so any week back to the first published one opens instantly.
--   terminal_week_detail      one row per index per week: the finished detail for that week
--   build_terminal_week()     builds one row: models in the basket that week and the week before, with
--                             vendors counted and price moves (mv_index_attribution), every vendor's price
--                             on each leg in both weeks (v_fair_value), names, and the admission decisions
--                             that took effect that week
--   refresh_terminal_weeks()  builds every published week not yet stored, and always rebuilds the active
--                             week; the Monday publish flow runs it in node 16, after mv_index_attribution
--   terminal_index_week()     signed-in read of one stored week
-- Detail payload: { d, pd, att{dir{date:[[anchor, vendors, log_rel]]}}, vend{dir:"anchor>vendor~Typ~0:p,1:p|..."},
--                   names{anchor:[name, vendor]}, adm[{a,nm,st,r,rc,dt,vf,vt}] }; in vend, 0 is the week before, 1 this week.

create table if not exists public.terminal_week_detail (
  index_code text not null,
  gate_date  text not null,
  detail     jsonb not null,
  built_at   timestamptz not null default now(),
  primary key (index_code, gate_date)
);
alter table public.terminal_week_detail enable row level security;
revoke all on table public.terminal_week_detail from public, anon, authenticated;

create or replace function public.build_terminal_week(p_code text, p_date text)
returns jsonb language sql stable security definer set search_path = public as $$
with pd as (select max(gate_date) d from mv_index_attribution where index_code = p_code and gate_date < p_date),
wk as (select p_date d, 1 w union all select d, 0 from pd where d is not null),
att as (select a.direction k, a.gate_date d, a.anchor_id, a.model_name, a.creator, a.vendors, a.log_rel
        from mv_index_attribution a join wk on wk.d = a.gate_date where a.index_code = p_code),
attj as (select coalesce(jsonb_object_agg(k, j), '{}') j from (select k, jsonb_object_agg(d, e) j from (
          select k, d, jsonb_agg(jsonb_build_array(anchor_id, vendors, round(log_rel::numeric, 8))) e from att group by k, d) y group by k) x),
fv as (select f.direction, f.anchor_id a, f.vendor_name vn, left(f.vendor_type, 3) vt, wk.w, min(f.price) p
       from v_fair_value f join wk on wk.d = f.gate_date
       where f.anchor_id in (select distinct anchor_id from att) and f.direction in ('Input', 'Output', 'Cached Input') group by 1, 2, 3, 4, 5),
vend as (select coalesce(jsonb_object_agg(k, s), '{}') j from (select case direction when 'Input' then 'input' when 'Output' then 'output' else 'cached' end k, string_agg(r, '|' order by r) s from (
          select direction, a || '>' || vn || '~' || vt || '~' || string_agg(w || ':' || p::text, ',' order by w) r from fv group by direction, a, vn, vt) y group by direction) x),
adm0 as (select a.*, case when a.status = 'admitted' then a.valid_to else coalesce(a.valid_from, a.decided_at::date::text) end eff
         from model_index_admission a where a.index_code = p_code and a.anchor_id is not null and a.vendor_id is null),
adm as (select coalesce(jsonb_agg(jsonb_build_object('a', a.anchor_id, 'nm', coalesce(r.model_name, a.anchor_id), 'st', a.status, 'r', a.reason, 'rc', a.rule_code,
          'dt', a.decided_at::date::text, 'vf', a.valid_from, 'vt', a.valid_to) order by a.decided_at desc), '[]') j
        from adm0 a left join model_registry r on r.model_id = a.anchor_id
        where left(a.eff, 10) <= p_date and left(a.eff, 10) > coalesce((select d from pd), '0000')),
nm as (select coalesce(jsonb_object_agg(x.anchor_id, jsonb_build_array(x.model_name, x.creator)), '{}') j
       from (select distinct on (anchor_id) anchor_id, model_name, creator from att order by anchor_id, d desc) x)
select jsonb_build_object('d', p_date, 'pd', (select d from pd), 'att', (select j from attj), 'vend', (select j from vend),
  'names', (select j from nm), 'adm', (select j from adm))
$$;
revoke all on function public.build_terminal_week(text, text) from public, anon, authenticated;

create or replace function public.refresh_terminal_weeks(p_code text default null)
returns integer language plpgsql security definer set search_path = public as $$
declare g text; r record; n int := 0;
begin
  select active_date::text into g from site_config where id = 1;
  for r in
    select distinct a.index_code, a.gate_date
    from mv_index_attribution a join index_registry x on x.index_code = a.index_code and x.is_published
    where a.gate_date <= g and (p_code is null or a.index_code = p_code)
      and (a.gate_date = g or not exists (select 1 from terminal_week_detail t where t.index_code = a.index_code and t.gate_date = a.gate_date))
    order by 1, 2
  loop
    insert into terminal_week_detail (index_code, gate_date, detail, built_at)
    values (r.index_code, r.gate_date, build_terminal_week(r.index_code, r.gate_date), now())
    on conflict (index_code, gate_date) do update set detail = excluded.detail, built_at = excluded.built_at;
    n := n + 1;
  end loop;
  return n;
end;
$$;
revoke all on function public.refresh_terminal_weeks(text) from public, anon, authenticated;

create or replace function public.terminal_index_week(p_code text, p_date text)
returns jsonb language sql stable security definer set search_path = public as $$
select case when coalesce(auth.role(), '') <> 'authenticated' then null else (
  select t.detail from terminal_week_detail t join index_registry x on x.index_code = t.index_code and x.is_published
  where t.index_code = p_code and t.gate_date = p_date and t.gate_date <= (select active_date::text from site_config where id = 1)) end
$$;
revoke all on function public.terminal_index_week(text, text) from public, anon;
grant execute on function public.terminal_index_week(text, text) to authenticated;

-- TERMINAL, INDEX DETAIL (November 25, 2026). One call returns everything the Terminal's index page
-- draws for one index, every leg at once, as published:
--   ser   each leg's level series with its spot price and 25th to 75th percentile, for all models
--         (input, cached, output) and for the caching cohort (cin, cout), rebased the published way
--   spot  each leg's latest spot change on the week, the month and since base
--   att   each leg's model detail for the last 14 published weeks: model, vendors counted, price move
--   vend  every vendor's price for those models over those weeks, as change points
--   names, comp (by vendor type), beh (behavior with the range across all indexes), counts, adm
-- Signed-in users only.
create or replace function public.terminal_index_detail(p_code text)
returns jsonb language sql stable security definer set search_path = public as $$
with g as (select active_date::text d, active_date::date dd from site_config where id = 1),
reg as (select index_code, index_description, index_question, unit, currency from index_registry where index_code = p_code and is_published),
iv as (select v.* from index_values v, g where v.index_code = p_code and v.date <= g.d),
lt as (select * from iv order by date desc limit 1),
rb as (select r.direction k, r.date, r.level, r.wow from v_index_rebased r, g where r.index_code = p_code and r.date <= g.d),
cp as (select date, 'cin' k, cohort_input_price pr, cohort_input_wow w from iv where cohort_input_price > 0
       union all select date, 'cout', cohort_output_price, cohort_output_wow from iv where cohort_output_price > 0),
cb as (select k, coalesce(avg(pr) filter (where left(date, 7) = '2026-05'), (array_agg(pr order by date))[1]) base from cp group by k),
lv as (select k, date, level, wow from rb union all select cp.k, cp.date, cp.pr / cb.base * 100, cp.w from cp join cb using (k)),
sp as (select date, 'input' k, spot_input_price s, spot_input_p25 a, spot_input_p75 b from iv
       union all select date, 'output', spot_output_price, spot_output_p25, spot_output_p75 from iv
       union all select date, 'cached', spot_cached_price, spot_cached_p25, spot_cached_p75 from iv
       union all select date, 'cin', spot_cohort_input_price, spot_cohort_input_p25, spot_cohort_input_p75 from iv
       union all select date, 'cout', spot_cohort_output, spot_cohort_output_p25, spot_cohort_output_p75 from iv),
ser as (select jsonb_object_agg(k, j) j from (
          select lv.k, jsonb_agg(jsonb_build_array(lv.date, round(lv.level::numeric, 4), round(lv.wow::numeric, 4), sp.s, sp.a, sp.b) order by lv.date) j
          from lv left join sp on sp.k = lv.k and sp.date = lv.date group by lv.k) x),
spot as (select jsonb_build_object(
          'input', jsonb_build_array(spot_input_wow, spot_input_mom, spot_input_vs_base),
          'output', jsonb_build_array(spot_output_wow, spot_output_mom, spot_output_vs_base),
          'cached', jsonb_build_array(spot_cached_wow, spot_cached_mom, spot_cached_vs_base),
          'cin', jsonb_build_array(spot_cohort_input_wow, spot_cohort_input_mom, spot_cohort_input_vs_base),
          'cout', jsonb_build_array(spot_cohort_output_wow, spot_cohort_output_mom, spot_cohort_output_vs_base)) j from lt),
wk as (select gate_date d, (row_number() over (order by gate_date)) - 1 w from (select distinct a.gate_date from mv_index_attribution a, g
         where a.index_code = p_code and a.gate_date > (g.dd - 98)::text and a.gate_date <= g.d) x),
att as (select a.direction k, a.gate_date d, a.anchor_id, a.model_name, a.creator, a.vendors, a.log_rel from mv_index_attribution a join wk on wk.d = a.gate_date where a.index_code = p_code),
attj as (select jsonb_object_agg(k, j) j from (select k, jsonb_object_agg(d, e) j from (
          select k, d, jsonb_agg(jsonb_build_array(anchor_id, vendors, round(log_rel::numeric, 8))) e from att group by k, d) y group by k) x),
nm as (select jsonb_object_agg(x.anchor_id, jsonb_build_array(x.model_name, x.creator)) j from (select distinct on (anchor_id) anchor_id, model_name, creator from att order by anchor_id, d desc) x),
fv as (select f.direction, f.anchor_id a, f.vendor_name vn, left(f.vendor_type, 3) vt, wk.w, min(f.price) p
       from v_fair_value f join wk on wk.d = f.gate_date
       where f.anchor_id in (select distinct anchor_id from att) and f.direction in ('Input', 'Output', 'Cached Input') group by 1, 2, 3, 4, 5),
fs as (select fv.*, lag(p) over (partition by direction, a, vn order by w) pp, lag(w) over (partition by direction, a, vn order by w) pw from fv),
fe as (select direction, a, vn, vt, w, p from fs where pp is null or pp <> p or w > pw + 1
       union all select direction, a, vn, vt, pw + 1, null from fs where pw is not null and w > pw + 1
       union all select direction, a, vn, vt, mw + 1, null from (select direction, a, vn, vt, max(w) mw from fv group by 1, 2, 3, 4) z where mw < (select max(w) from wk)),
vend as (select jsonb_object_agg(k, s) j from (select case direction when 'Input' then 'input' when 'Output' then 'output' else 'cached' end k, string_agg(r, '|' order by r) s from (
          select direction, a || '>' || vn || '~' || vt || '~' || string_agg(w || ':' || coalesce(p::text, 'x'), ',' order by w) r from fe group by direction, a, vn, vt) y group by direction) x),
beh as (select jsonb_build_object('rows', (select jsonb_object_agg(case b.direction when 'Input' then 'input' when 'Output' then 'output' else 'cached' end,
            jsonb_build_array(b.dispersion, b.concentration_pct, b.repricing_pct, b.volatility_pct, b.top_vendor)) from index_behaviour_snapshot b
            where b.index_code = p_code and b.date = (select max(date) from index_behaviour_snapshot where index_code = p_code)),
          'range', (select jsonb_build_array(min(dispersion), max(dispersion), min(concentration_pct), max(concentration_pct), min(repricing_pct), max(repricing_pct), min(volatility_pct), max(volatility_pct))
            from index_behaviour_snapshot where date = (select max(date) from index_behaviour_snapshot))) j),
adm as (select coalesce(jsonb_agg(jsonb_build_object('a', a.anchor_id, 'nm', coalesce(r.model_name, a.anchor_id), 'st', a.status, 'r', a.reason, 'rc', a.rule_code, 'dt', a.decided_at::date::text, 'vf', a.valid_from, 'vt', a.valid_to) order by a.decided_at desc), '[]') j
        from (select * from model_index_admission where index_code = p_code and anchor_id is not null and vendor_id is null order by decided_at desc limit 80) a
        left join model_registry r on r.model_id = a.anchor_id)
select case when coalesce(auth.role(), '') <> 'authenticated' or not exists (select 1 from reg) then null else jsonb_build_object(
  'code', (select index_code from reg), 'desc', (select index_description from reg), 'q', (select index_question from reg), 'unit', (select unit from reg), 'cur', (select currency from reg),
  'date', (select d from g), 'weeks', (select jsonb_agg(d order by d) from wk),
  'n', (select jsonb_build_object('models', model_count, 'vendors', vendor_count, 'skus', sku_count, 'cmodels', cohort_model_count, 'cvendors', cohort_vendor_count, 'cskus', cohort_sku_count,
         'base', (select max(model_count) from iv where left(date, 7) = '2026-05'), 'cbase', (select max(cohort_model_count) from iv where left(date, 7) = '2026-05')) from lt),
  'comp', (select composition_type from lt), 'ser', (select j from ser), 'spot', (select j from spot), 'att', (select j from attj), 'names', (select j from nm),
  'vend', (select j from vend), 'beh', (select j from beh), 'adm', (select j from adm)) end
$$;
revoke all on function public.terminal_index_detail(text) from public, anon;
grant execute on function public.terminal_index_detail(text) to authenticated;

-- TERMINAL, INDEX LIST (updated November 25, 2026). Every published index with its family, legs, spot
-- prices and one-week changes, and now each leg's latest level, its change on the week and its last
-- 14 levels, which the pinned index cards draw. Signed-in users only.
create or replace function public.terminal_index_list()
returns jsonb language sql stable security definer set search_path = public as $$
with g as (select active_date::text d from site_config where id = 1),
rb as (select index_code, direction, date, level, wow, row_number() over (partition by index_code, direction order by date desc) rn from v_index_rebased, g where date <= g.d),
sk as (select index_code, jsonb_object_agg(direction, j) j from (select index_code, direction,
          jsonb_build_array(round((array_agg(level order by date desc))[1]::numeric, 4), round((array_agg(wow order by date desc))[1]::numeric, 4), jsonb_agg(round(level::numeric, 3) order by date)) j
          from rb where rn <= 14 group by 1, 2) x group by 1)
select case when coalesce(auth.role(), '') <> 'authenticated' then null else (
  select coalesce(jsonb_agg(jsonb_build_object('code', r.index_code, 'fam', r.index_category, 'desc', r.index_description, 'unit', r.unit, 'cur', r.currency,
    'flag', r.is_flagship, 'models', v.model_count, 'skus', v.sku_count, 'lv', sk.j,
    'legs', jsonb_strip_nulls(jsonb_build_object(
      'input', case when v.spot_input_price > 0 then jsonb_build_array(v.spot_input_price, v.spot_input_wow) end,
      'cached', case when v.spot_cached_price > 0 then jsonb_build_array(v.spot_cached_price, v.spot_cached_wow) end,
      'output', case when v.spot_output_price > 0 then jsonb_build_array(v.spot_output_price, v.spot_output_wow) end)))
    order by r.display_order nulls last, r.index_code), '[]')
  from index_registry r left join index_values v on v.index_code = r.index_code and v.date = (select d from g) left join sk on sk.index_code = r.index_code
  where r.is_published) end
$$;
revoke all on function public.terminal_index_list() from public, anon;
grant execute on function public.terminal_index_list() to authenticated;

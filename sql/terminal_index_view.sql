-- TERMINAL, INDEXES VIEW. One call returns everything the Terminal's index page draws for one
-- index and one leg, as published: the level series, the figures, what moved each week, the basket
-- down to the SKU, repricing, vendors and the admission record. Signed-in users only.
create or replace function public.terminal_index_view(p_code text, p_dir text)
returns jsonb language sql stable security definer set search_path = public as $$
with g as (select active_date::text d, active_date::date dd from site_config where id = 1),
dirs as (select lower(p_dir) l, case lower(p_dir) when 'input' then 'Input' when 'output' then 'Output' when 'cached' then 'Cached Input' end m),
reg as (select index_code, index_description, index_question, unit, index_category from index_registry where index_code = p_code and is_published),
iv as (select v.* from index_values v, g where v.index_code = p_code and v.date = g.d),
ser as (select coalesce(jsonb_agg(jsonb_build_object('d', r.date, 'l', round(r.level::numeric, 4), 'w', round(r.wow::numeric, 4)) order by r.date), '[]') j
        from v_index_rebased r, dirs, g where r.index_code = p_code and r.direction = dirs.l and r.date <= g.d),
att0 as (select a.gate_date d, a.anchor_id, a.model_name, a.creator, a.vendors, a.log_rel from mv_index_attribution a, dirs, g
         where a.index_code = p_code and a.direction = dirs.l and a.gate_date > (g.dd - 98)::text and a.gate_date <= g.d),
att1 as (select d, count(*) n, sum(log_rel) s from att0 group by d),
att as (select coalesce(jsonb_agg(jsonb_build_object('d', w.d, 'n', w.n, 's', round(w.s::numeric, 8),
          'm', (select coalesce(jsonb_agg(jsonb_build_object('a', x.anchor_id, 'nm', x.model_name, 'c', x.creator, 'v', x.vendors, 'lr', round(x.log_rel::numeric, 8)) order by abs(x.log_rel) desc), '[]')
                from att0 x where x.d = w.d and abs(x.log_rel) > 1e-9)) order by w.d), '[]') j from att1 w),
nm as (select distinct on (anchor_id) anchor_id, model_name, creator from att0 order by anchor_id, d desc),
mem as (select m.* from index_membership_snapshot m, dirs, g where m.index_code = p_code and m.direction = dirs.m and m.in_basket and m.verification_date = g.d),
hist as (select p.sku_id, p.verification_date d, p.normalized_price pr, p.sku_plan_name pl, p.normalized_price_unit u,
           lag(p.normalized_price) over (partition by p.sku_id order by p.verification_date) prev
         from (select distinct on (sku_id, verification_date) * from price_index where sku_id in (select sku_id from mem) and direction = (select m from dirs) order by sku_id, verification_date, id desc) p),
chg as (select h.sku_id, h.d, h.prev, h.pr from hist h where h.prev > 0 and h.pr > 0 and abs(h.pr / h.prev - 1) > 0.005),
sk as (select h.sku_id,
          max(h.pl) filter (where h.d = (select d from g)) pl, max(h.pr) filter (where h.d = (select d from g)) pr,
          max(h.u) filter (where h.d = (select d from g)) u, min(h.d) f
       from hist h group by h.sku_id),
lc as (select distinct on (sku_id) sku_id, d, round(((pr / prev - 1) * 100)::numeric, 2) pc from chg order by sku_id, d desc),
comp as (select coalesce(jsonb_agg(x.j order by x.n desc, x.nm), '[]') j from (
          select m.anchor_id, count(*) n, coalesce(max(fv.model_name), max(nm.model_name), max(m.model_name)) nm,
            jsonb_build_object('a', m.anchor_id, 'nm', coalesce(max(fv.model_name), max(nm.model_name), max(m.model_name)), 'c', coalesce(max(fv.creator), max(nm.creator)),
              'k', jsonb_agg(jsonb_build_object('s', m.sku_id, 'v', m.vendor_name, 't', m.vendor_type, 'pl', sk.pl, 'p', sk.pr, 'u', sk.u, 'f', sk.f, 'lcd', lc.d, 'lcp', lc.pc) order by sk.pr nulls last, m.vendor_name)) j
          from mem m left join sk on sk.sku_id = m.sku_id left join lc on lc.sku_id = m.sku_id
            left join nm on nm.anchor_id = m.anchor_id
            left join (select anchor_id, model_name, creator from v_fair_value_models where anchor_id in (select anchor_id from mem)) fv on fv.anchor_id = m.anchor_id
          group by m.anchor_id) x),
rep as (select coalesce(jsonb_agg(jsonb_build_object('d', c.d, 'v', m.vendor_name, 'a', m.anchor_id, 'from', c.prev, 'to', c.pr) order by c.d desc, abs(c.pr / c.prev - 1) desc), '[]') j
        from chg c join mem m on m.sku_id = c.sku_id, g where c.d > (g.dd - 182)::text),
ven as (select coalesce(jsonb_agg(jsonb_build_object('v', v.vendor_name, 't', v.t, 'k', v.k, 'm', v.mo, 'so', v.so) order by v.k desc, v.vendor_name), '[]') j from (
          select m.vendor_name, max(m.vendor_type) t, count(*) k, count(distinct m.anchor_id) mo,
            count(distinct m.anchor_id) filter (where (select count(distinct x.vendor_name) from mem x where x.anchor_id = m.anchor_id) = 1) so
          from mem m group by m.vendor_name) v),
adm as (select coalesce(jsonb_agg(jsonb_build_object('a', a.anchor_id, 'nm', coalesce(r.model_name, a.anchor_id), 'st', a.status, 'r', a.reason, 'rc', a.rule_code, 'dt', a.decided_at::date::text, 'vf', a.valid_from, 'vt', a.valid_to) order by a.decided_at desc), '[]') j
        from (select * from model_index_admission where index_code = p_code and anchor_id is not null and vendor_id is null order by decided_at desc limit 80) a
        left join model_registry r on r.model_id = a.anchor_id)
select case when coalesce(auth.role(), '') <> 'authenticated' or not exists (select 1 from reg) then null else jsonb_build_object(
  'code', (select index_code from reg), 'desc', (select index_description from reg), 'q', (select index_question from reg), 'unit', (select unit from reg),
  'date', (select d from g), 'leg', (select l from dirs),
  'fig', (select jsonb_build_object('models', model_count, 'vendors', vendor_count, 'skus', sku_count,
     'spot', case (select l from dirs) when 'input' then spot_input_price when 'output' then spot_output_price else spot_cached_price end,
     'spot_wow', case (select l from dirs) when 'input' then spot_input_wow when 'output' then spot_output_wow else spot_cached_wow end,
     'spot_base', case (select l from dirs) when 'input' then spot_input_vs_base when 'output' then spot_output_vs_base else spot_cached_vs_base end) from iv),
  'series', (select j from ser), 'moved', (select j from att), 'comp', (select j from comp), 'rep', (select j from rep), 'ven', (select j from ven), 'adm', (select j from adm)) end
$$;
revoke all on function public.terminal_index_view(text, text) from public, anon;
grant execute on function public.terminal_index_view(text, text) to authenticated;

-- TERMINAL, INDEX LIST. Every published index with its family, the legs it is published on and
-- each leg's spot price and one-week change at the latest publication. Signed-in users only.
create or replace function public.terminal_index_list()
returns jsonb language sql stable security definer set search_path = public as $$
select case when coalesce(auth.role(), '') <> 'authenticated' then null else (
  select coalesce(jsonb_agg(jsonb_build_object('code', r.index_code, 'fam', r.index_category, 'desc', r.index_description, 'unit', r.unit, 'cur', r.currency,
    'flag', r.is_flagship, 'models', v.model_count, 'skus', v.sku_count,
    'legs', jsonb_strip_nulls(jsonb_build_object(
      'input', case when v.spot_input_price > 0 then jsonb_build_array(v.spot_input_price, v.spot_input_wow) end,
      'cached', case when v.spot_cached_price > 0 then jsonb_build_array(v.spot_cached_price, v.spot_cached_wow) end,
      'output', case when v.spot_output_price > 0 then jsonb_build_array(v.spot_output_price, v.spot_output_wow) end)))
    order by r.display_order nulls last, r.index_code), '[]')
  from index_registry r left join index_values v on v.index_code = r.index_code and v.date = (select active_date::text from site_config where id = 1)
  where r.is_published) end
$$;
revoke all on function public.terminal_index_list() from public, anon;
grant execute on function public.terminal_index_list() to authenticated;

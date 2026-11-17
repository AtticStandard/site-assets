/* ═══ SIMULATED CONTRACTS, HOMEPAGE (#hpClause), option K (November 17, 2026) ═══
   The homepage shows what the Clause did for each buyer; the Clause page shows how each contract
   works. Five columns, one per simulated contract: the outcome to date, its share of the contract,
   and a small chart of the monthly bill against the fixed price at May levels. All five small charts
   share one scale, so they compare by shape. Each column opens that contract on the Clause page
   (/clause?contract=<name>#cla-s). The total sits above, the legend under it (site rule C). */
(function(){
  var AS = window.AS = window.AS || {};
  var MONTH = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  var ORDER = ['ILLUS-FLG-2026-06','ILLUS-CMP-2026-06','ILLUS-COR-2026-06','ILLUS-BLD-2026-06','ILLUS-DEV-2026-06'];
  var COPY = {
    'ILLUS-FLG-2026-06':{ tab:'Enterprise', terms:'$10M a year, flagship models' },
    'ILLUS-CMP-2026-06':{ tab:'Product team', terms:'$3M a year, compact models' },
    'ILLUS-COR-2026-06':{ tab:'AI agent company', terms:'$6M a year, core models' },
    'ILLUS-BLD-2026-06':{ tab:'Enterprise, three years', terms:'$25M a year minimum spend' },
    'ILLUS-DEV-2026-06':{ tab:'Software company', terms:'$5M a year, model developers' }};
  function $(id){ return document.getElementById(id); }
  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"]/g, function(c){ return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]; }); }
  function money(n){ return '$' + Math.round(Number(n)).toLocaleString('en-US'); }
  function mname(ym){ return MONTH[+String(ym).slice(5, 7) - 1]; }
  function slug(s){ return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
  function longDate(iso){ var p = String(iso).split('-'); return MONTH[+p[1] - 1] + ' ' + (+p[2]) + ', ' + p[0]; }

  function model(ct){
    var st = ct.months.filter(function(m){ return m.st && m.ix != null; });
    var min = !!(ct.terms && ct.terms.commitment === 'minimum_spend');
    var base = st.reduce(function(a, m){ return a + +m.fx; }, 0);
    var saved = st.reduce(function(a, m){ return a + (m.fx - m.ix); }, 0);
    var use = st.reduce(function(a, m){ return a + (m.set ? m.fx * (100 / m.set - 1) : m.fx * (m.fx / m.ix - 1)); }, 0);
    var out = min ? use : saved, last = st[st.length - 1], pc = (1 - last.ix / last.fx) * 100;
    /* A floor or cap is named only on a single-leg contract, as on the Clause page; a blended contract's legs are limited one by one. */
    var single = ct.months[0].legs && ct.months[0].legs.length === 1, lim = -1;
    if(single) st.some(function(m, i){ if(m.lim === 'floor' || m.lim === 'cap'){ lim = i; return true; } return false; });
    var note = lim >= 0 ? (st[lim].lim === 'floor' ? 'Floor' : 'Cap') + ' applied from ' + mname(st[lim].ym)
      : (+ct.reset > 1) ? 'Priced a quarter ahead'
      : mname(last.ym) + ' bill ' + Math.abs(pc).toFixed(1) + '% ' + (pc >= 0 ? 'below' : 'above');
    var c = COPY[ct.id] || { tab:ct.id, terms:ct.label || '' };
    out = Math.round(out);
    return { tab:c.tab, terms:c.terms, min:min, out:out, share:base ? out / base * 100 : 0, kind:min ? 'more usage' : out >= 0 ? 'saved' : 'paid above',
      pay:st.map(function(m){ return m.ix / m.fx * 100; }), mons:st.map(function(m){ return MON3[+String(m.ym).slice(5, 7) - 1]; }), note:note };
  }

  /* One small chart: the bill as a share of the fixed price, month by month, on the shared scale,
     with a tick at each month boundary; the month names sit under it as text, so they stay sharp. */
  var MON3 = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  function spark(p, lo, hi, mons){
    var W = 220, H = 62, n = p.length, i, pts = [], ax = 56;
    function x(k){ return W * k / n; }
    function y(v){ return 4 + (hi - v) / (hi - lo) * 46; }
    for(i = 0; i < n; i++) pts.push([x(i), y(p[i])], [x(i + 1), y(p[i])]);
    var yF = y(100).toFixed(1), path = pts.map(function(q){ return q[0].toFixed(1) + ',' + q[1].toFixed(1); }).join(' ');
    var e = pts[pts.length - 1], tk = '';
    for(i = 0; i <= n; i++) tk += '<line x1="' + x(i).toFixed(1) + '" x2="' + x(i).toFixed(1) + '" y1="' + ax + '" y2="' + (ax + 4) + '" class="as-s-axis" vector-effect="non-scaling-stroke"></line>';
    return '<span class="as-k5-ch"><svg viewBox="0 0 ' + W + ' ' + H + '" aria-hidden="true" focusable="false" style="overflow:visible">'
      + '<line x1="0" x2="' + W + '" y1="' + yF + '" y2="' + yF + '" class="as-s-hist" stroke-width="1.2" vector-effect="non-scaling-stroke"></line>'
      + '<polygon points="0,' + yF + ' ' + path + ' ' + W + ',' + yF + '" style="fill: var(--gold); fill-opacity: .12"></polygon>'
      + '<polyline points="' + path + '" fill="none" style="stroke: var(--gold)" stroke-width="2" stroke-linejoin="round" vector-effect="non-scaling-stroke"></polyline>'
      + '<circle cx="' + e[0].toFixed(1) + '" cy="' + e[1].toFixed(1) + '" r="3" style="fill: var(--gold)"></circle>'
      + '<line x1="0" x2="' + W + '" y1="' + ax + '" y2="' + ax + '" class="as-s-axis" vector-effect="non-scaling-stroke"></line>' + tk + '</svg>'
      + '<span class="as-k5-m">' + mons.map(function(m){ return '<i>' + m + '</i>'; }).join('') + '</span></span>';
  }

  function draw(p){
    var grid = $('hpClK'); if(!grid) return;
    var by = {}; (p.contracts || []).forEach(function(ct){ by[ct.id] = ct; });
    var ids = ORDER.filter(function(id){ return by[id]; }); (p.contracts || []).forEach(function(ct){ if(ids.indexOf(ct.id) < 0) ids.push(ct.id); });
    var L = ids.map(function(id){ return model(by[id]); });
    if(!L.length) return;
    var lo = 100, hi = 100.6; L.forEach(function(c){ c.pay.forEach(function(v){ lo = Math.min(lo, v); hi = Math.max(hi, v + 0.6); }); }); lo = Math.floor(lo - 0.6);
    grid.innerHTML = L.map(function(c){
      return '<a class="as-k5-c" href="/clause?contract=' + slug(c.tab) + '#cla-s" aria-label="' + esc(c.tab + ': ' + money(c.out) + ' ' + c.kind + '. See the contract on the Clause page') + '">'
        + '<span class="as-lbl">' + esc(c.tab) + '</span><span class="as-k5-t">' + esc(c.terms) + '</span>'
        + '<span class="as-k5-v">' + money(Math.abs(c.out)) + '</span>'
        + '<span class="as-k5-d">' + esc(c.kind) + ' &middot; <b>' + Math.abs(c.share).toFixed(1) + '%</b></span>'
        + spark(c.pay, lo, hi, c.mons)
        + '<span class="as-k5-n">' + esc(c.note) + '</span><span class="as-k5-go">See the contract &rarr;</span></a>';
    }).join('');
    var saved = L.filter(function(c){ return !c.min; }).reduce(function(a, c){ return a + c.out; }, 0);
    var use = L.filter(function(c){ return c.min; }).reduce(function(a, c){ return a + c.out; }, 0);
    var t = $('hpClTot');
    if(t) t.innerHTML = 'Five simulated contracts, settled each month on published index levels since June: <strong>' + money(saved) + ' saved</strong> against fixed prices at May levels'
      + (use ? ', and <strong>' + money(use) + ' more usage</strong> on the minimum-spend contract.' : '.');
    if(AS.chart && AS.chart.legend) AS.chart.legend($('hpClLg'), [{ k:'line', c:'var(--gold)', n:'Monthly bill on the Clause' }, { k:'line', c:'var(--series-history)', n:'Fixed price at May levels' }]);
  }

  function start(){
    if(!$('hpClK') || !AS.hp) return;
    AS.hp.then(draw).catch(function(e){ console.error('Attic Standard simulated contracts unavailable:', e); });
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();

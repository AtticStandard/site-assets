/* CLAUSE PAGE (staging): every figure filled from the published Clause payload, the
   simulated contract selector and chart, the contents highlight, the model clause
   wording. The print link #clPrint is handled by as-clause-pdf.js. The markup carries the November 9, 2026 figures, so the
   page reads correctly even if the data cannot be loaded. */
(function(){
  'use strict';
  var API = 'https://jonncmzxvxzwyaznokba.supabase.co/rest/v1/rpc/get_clause_page', KEY = 'sb_publishable_SHTwtIYuHKMP3W5fhrwx2A_Byi9IVtF';
  var MON = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  var MONTH = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  var NAMES = { FLG:'Flagship', CMP:'Compact', COR:'Core', DEV:'Model developers', EMB:'Embeddings', TXT:'Text', OSS:'Published weights' };
  var LEG = { output:'output', input:'input', cached:'cached' };
  var ORDER = ['ILLUS-FLG-2026-06','ILLUS-CMP-2026-06','ILLUS-COR-2026-06','ILLUS-BLD-2026-06','ILLUS-DEV-2026-06'];
  var COPY = {
    'ILLUS-FLG-2026-06':{ tab:'Enterprise', buyer:'An enterprise buying flagship models through a cloud marketplace', terms:'$10M a year, flagship models, priced by component' },
    'ILLUS-CMP-2026-06':{ tab:'Product team', buyer:'A product team buying compact models, at a fixed differential to the market', terms:'$3M a year, compact models, fixed differential' },
    'ILLUS-COR-2026-06':{ tab:'AI agent company', buyer:'An AI agent company, mostly cached input, priced a quarter ahead', terms:'$6M a year, core models, priced a quarter ahead' },
    'ILLUS-BLD-2026-06':{ tab:'Enterprise, three years', buyer:'An enterprise with a minimum spend and a substitution right', terms:'$25M a year minimum spend, blend of three indexes' },
    'ILLUS-DEV-2026-06':{ tab:'Software company', buyer:'A software company buying direct from model developers, at list price less 15%', terms:'$5M a year, model developers, 15% discount kept' }};
  var ARR = '<svg width="20" height="12" viewBox="0 0 20 12" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M0 6h18M13 1l5 5-5 5"/></svg>';

  function $(id){ return document.getElementById(id); }
  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"]/g, function(c){ return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]; }); }
  function int(n){ return Math.round(Number(n)).toLocaleString('en-US'); }
  function money(n){ return '$' + int(n); }
  function longDate(iso){ var p = String(iso).split('-'); return MONTH[+p[1] - 1] + ' ' + (+p[2]) + ', ' + p[0]; }
  function mname(ym){ return MONTH[+ym.slice(5, 7) - 1]; }
  function mil(n){ n = Number(n) / 1e6; return '$' + (n % 1 ? n.toFixed(1) : n) + 'M'; }
  function code(c){ var k = c.split(' ')[1]; return esc(NAMES[k] || k) + '&nbsp;<span class="cla-nw">(<a class="cla-ixc" href="/indexes?index=' + c.toLowerCase().replace(/\s+/g, '-') + '#atom-index-card">' + esc(c) + '</a>)</span>'; }
  function set(id, html){ var e = $(id); if(e) e.innerHTML = html; }

  /* ---------- simulated contracts ---------- */
  var LIST = [], GATE = null, cur = 0;
  function model(ct){
    var st = ct.months.filter(function(m){ return m.st && m.ix != null; });
    var fx = +ct.months[0].fx, min = ct.terms && ct.terms.commitment === 'minimum_spend';
    var saved = st.reduce(function(a, m){ return a + (m.fx - m.ix); }, 0);
    var use = st.reduce(function(a, m){ return a + (m.set ? m.fx * (100 / m.set - 1) : m.fx * (m.fx / m.ix - 1)); }, 0);
    var single = ct.legs && ct.legs.length === 1, lim = -1;
    if(single) st.some(function(m, i){ if(m.lim === 'floor' || m.lim === 'cap'){ lim = i; return true; } return false; });
    var unl = lim >= 0 ? st.map(function(m){ return (m.lim === 'floor' || m.lim === 'cap') && m.legs && m.legs[0] ? fx * Number(m.legs[0].idx) / 100 : null; }) : null;
    var legs = (ct.legs || []).map(function(l){ return l; }), idx;
    if(ct.index === 'BLEND') idx = legs.map(function(l){ return Math.round(l.share * 100) + '% ' + code(l.index); }).join(', ');
    else if(legs.length > 1) idx = code(ct.index) + ': ' + legs.map(function(l){ return Math.round(l.share * 100) + '% ' + (LEG[l.leg] || l.leg); }).join(', ');
    else idx = code(ct.index) + ', ' + (LEG[ct.leg] || ct.leg) + (ct.form === 'differential' ? ', at a fixed differential to the spot price' : '');
    var c = COPY[ct.id] || { tab:ct.id, buyer:ct.label, terms:ct.label };
    var start = String(ct.start || '2026-06-01');
    return { id:ct.id, c:c, fx:fx, st:st, min:min, saved:saved, use:use, unl:unl, lim:lim >= 0 ? [lim, st[lim].lim] : null,
      fixedTd:+ct.fixed_td, indTd:+ct.indexed_td, reset:+ct.reset || 1,
      commit:(min ? mil(ct.commit) + ' a year minimum spend' : mil(ct.commit) + ' a year') + ' for ' + ct.term + ' months, from ' + longDate(start), idx:idx };
  }

  function chart(C){
    var box = $('clChart'); if(!box) return;
    var W = Math.max(300, Math.round(box.getBoundingClientRect().width)), phone = W < 560;
    var H = phone ? 210 : 260, L = 8, R = phone ? 78 : 150, T = 26, B = 30;
    var pts = C.st.map(function(m){ return +m.ix; }), fx = C.fx, vals = pts.concat([fx]);
    (C.unl || []).forEach(function(u){ if(u != null) vals.push(u); });
    var lo = Math.min.apply(null, vals), hi = Math.max.apply(null, vals), pad = Math.max((hi - lo) * .12, fx * .01); lo -= pad; hi += pad;
    var n = pts.length, X = function(i){ return L + i * (W - L - R) / n; }, Y = function(v){ return T + (hi - v) / (hi - lo) * (H - T - B); };
    var fs = phone ? 11 : 12, line = [], i;
    for(i = 0; i < n; i++){ line.push(X(i).toFixed(1) + ',' + Y(pts[i]).toFixed(1), X(i + 1).toFixed(1) + ',' + Y(pts[i]).toFixed(1)); }
    var fy = Y(fx), ly = Y(pts[n - 1]), lx = W - R + 8;
    var s = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Monthly payment under the Clause against the fixed price, ' + esc(C.c.tab) + '">';
    s += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + fy.toFixed(1) + '" y2="' + fy.toFixed(1) + '" style="stroke:var(--l4)" stroke-width="1.5"/>';
    s += '<polygon points="' + X(0).toFixed(1) + ',' + fy.toFixed(1) + ' ' + line.join(' ') + ' ' + X(n).toFixed(1) + ',' + fy.toFixed(1) + '" style="fill:var(--gold);fill-opacity:.12"/>';
    if(C.unl){
      var up = []; for(i = 0; i < n; i++){ if(C.unl[i] == null) continue; up.push(X(i).toFixed(1) + ',' + Y(C.unl[i]).toFixed(1), X(i + 1).toFixed(1) + ',' + Y(C.unl[i]).toFixed(1)); }
      s += '<polyline points="' + up.join(' ') + '" fill="none" style="stroke:var(--l2)" stroke-width="1.5" stroke-dasharray="4 3"/>';
    }
    s += '<polyline points="' + line.join(' ') + '" fill="none" style="stroke:var(--gold)" stroke-width="2.5" stroke-linejoin="round"/>';
    s += '<circle cx="' + X(n).toFixed(1) + '" cy="' + ly.toFixed(1) + '" r="4.5" style="fill:var(--gold)"/>';
    var fyl = Math.abs(ly - fy) < 34 ? Math.min(fy, ly) - 22 : fy;
    s += '<text x="' + lx + '" y="' + (fyl - 2).toFixed(1) + '" font-size="' + fs + '" font-weight="600" letter-spacing="1" style="fill:var(--l4)">FIXED</text>';
    s += '<text x="' + lx + '" y="' + (fyl + 13).toFixed(1) + '" font-size="' + fs + '" style="fill:var(--l5)">' + money(fx) + '</text>';
    var lyl = Math.abs(ly - fy) < 34 ? Math.max(fy, ly) + 10 : ly;
    s += '<text x="' + lx + '" y="' + (lyl + 4).toFixed(1) + '" font-size="' + fs + '" font-weight="600" style="fill:var(--l1)">' + money(pts[n - 1]) + '</text>';
    s += '<text x="' + lx + '" y="' + (lyl + 19).toFixed(1) + '" font-size="' + fs + '" style="fill:var(--l5)">' + (C.reset > 1 ? 'Set for the quarter' : MON[+C.st[n - 1].ym.slice(5, 7) - 1] + ' to date') + '</text>';
    if(C.lim){ var k = C.lim[0]; s += '<text x="' + ((X(k) + X(k + 1)) / 2).toFixed(1) + '" y="' + (Y(pts[k]) - 8).toFixed(1) + '" font-size="' + fs + '" text-anchor="middle" style="fill:var(--l4)">' + (C.lim[1] === 'floor' ? 'Floor' : 'Cap') + ' applied from ' + MONTH[+C.st[k].ym.slice(5, 7) - 1] + '</text>'; }
    s += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + (H - B + 6) + '" y2="' + (H - B + 6) + '" style="stroke:var(--border)"/>';
    C.st.forEach(function(m, j){ s += '<text x="' + ((X(j) + X(j + 1)) / 2).toFixed(1) + '" y="' + (H - 8) + '" font-size="' + fs + '" text-anchor="middle" style="fill:var(--l5)">' + MON[+m.ym.slice(5, 7) - 1] + '</text>'; });
    box.innerHTML = s + '</svg>';
  }

  function show(i){
    cur = i; var C = LIST[i]; if(!C) return;
    [].slice.call(document.querySelectorAll('#clTabs .cla-vt-b')).forEach(function(b, n){ var on = n === i; b.classList.toggle('cla-on', on); b.setAttribute('aria-selected', on ? 'true' : 'false'); b.tabIndex = on ? 0 : -1; });
    var from = C.st.length ? mname(C.st[0].ym) : 'June', last = C.st[C.st.length - 1], date = longDate(GATE);
    if(C.min){
      set('clBig', money(C.use));
      set('clBigT', 'more usage from ' + from + ' to ' + date + ', for the same minimum spend, valued at the price at signing.');
    } else {
      var pc = last ? (1 - last.ix / C.fx) * 100 : 0, mo = C.reset > 1 ? 'This quarter&rsquo;s price' : 'This month&rsquo;s price';
      set('clBig', money(Math.abs(C.saved)));
      set('clBigT', (C.saved >= 0 ? 'saved' : 'paid above a fixed price') + ' from ' + from + ' to ' + date + (C.saved >= 0 ? ', against a fixed price at May levels. ' : '. ') +
        (Math.abs(pc) < 0.005 ? mo + ' is level with it.' : mo + ' is ' + Math.abs(pc).toFixed(2) + '% ' + (pc > 0 ? 'below' : 'above') + '&nbsp;it.'));
    }
    set('clKt', '<div>Buyer</div><div>' + esc(C.c.buyer) + '</div><div>Commitment</div><div>' + esc(C.commit) + '</div><div>Index</div><div>' + C.idx + '</div>');
    set('clLgd', '<span><i></i>' + (C.min ? 'Committed usage at the index price' : 'Monthly payment under the Clause') + '</span>' + (C.unl ? '<span><i class="cla-u"></i>Without the floor</span>' : '') + '<span><i class="cla-f"></i>Fixed price</span>');
    chart(C);
  }

  function table(){
    var h = '<div class="cla-h">Contract</div><div class="cla-h cla-x">Terms</div><div class="cla-h cla-r cla-x">At signing</div><div class="cla-h cla-r cla-x">Under the Clause</div><div class="cla-h cla-r">Difference</div>';
    LIST.forEach(function(C){
      h += '<div class="cla-nm">' + esc(C.c.tab) + '</div><div class="cla-x">' + esc(C.c.terms) + '</div><div class="cla-r cla-x">' + money(C.fixedTd) + '</div><div class="cla-r cla-x">' + money(C.min ? C.fixedTd : C.indTd) + '</div>' +
        '<div class="cla-r cla-sv">' + (C.min ? money(C.use) + ' more usage' : C.saved >= 0 ? money(C.saved) + ' saved' : money(-C.saved) + ' above') + '</div>';
    });
    set('clTbl', h);
  }

  /* ---------- the exposure ---------- */
  function drivers(p){
    var ser = p.series || {}, last = function(k){ var s = ser['AIPI TXT GLB|' + k]; return s && s.length ? +s[s.length - 1][1] - 100 : 0; };
    var tl = last('output'), dc = last('cached'), r = p.reprice || {}, L = p.listings || {};
    var pr = ((p.spread || {}).prices || []).map(Number).sort(function(a, b){ return a - b; }), ratio = pr.length ? pr[pr.length - 1] / pr[0] : 0;
    var D = [[Math.abs(tl).toFixed(2) + '%', (tl <= 0 ? 'Fall' : 'Rise') + ' in text output prices on the same models since May'],
             [int(r.n), 'List price changes in 13 weeks: ' + int(r.down) + ' cuts, ' + int(r.up) + ' rises'],
             [int(L.added_13w), 'Model listings added in 13 weeks, with ' + int(L.gone_13w) + ' withdrawn'],
             [Math.abs(dc).toFixed(2) + '%', (dc <= 0 ? 'Fall' : 'Rise') + ' in cached input prices since May'],
             [ratio.toFixed(1) + '&times;', 'Highest to lowest price for one model, ' + pr.length + ' vendors']];
    D.forEach(function(d, i){ var e = $('clD' + i); if(!e) return; e.querySelector('.cla-n').innerHTML = d[0]; e.querySelector('.cla-t').textContent = d[1]; });
    var gap = Math.round(Math.abs(tl) / 100 * 1e7 / 1000) * 1000;
    set('clScaleN', money(gap) + ' a year');
    set('clScaleT', 'What a $10 million contract held at May prices now pays ' + (tl <= 0 ? 'above' : 'below') + ' the market.');
    set('clFact', 'In the last 13 weeks, vendors added <b>' + int(L.added_13w) + '</b> model listings and withdrew&nbsp;<b>' + int(L.gone_13w) + '</b>.');
  }

  function fill(p){
    GATE = p.gate; var date = longDate(GATE);
    set('clPub', date);
    drivers(p);
    set('clSrcX', 'Source: Attic Standard, published index levels and listings to ' + date + '. Figures update with each index publication.');
    set('clSrcS', 'Source: Attic Standard, simulated contracts settled on published index levels to ' + date + '. Figures update with each index publication. The minimum-spend contract pays the same and receives more usage, valued at the price at signing.');
    var by = {}; (p.contracts || []).forEach(function(ct){ by[ct.id] = ct; });
    var ids = ORDER.filter(function(id){ return by[id]; }); (p.contracts || []).forEach(function(ct){ if(ids.indexOf(ct.id) < 0) ids.push(ct.id); });
    LIST = ids.map(function(id){ return model(by[id]); });
    var tabs = $('clTabs');
    if(tabs){ tabs.innerHTML = LIST.map(function(C, i){ return '<button class="cla-vt-b" type="button" role="tab" data-i="' + i + '">' + esc(C.c.tab) + '</button>'; }).join(''); }
    table(); show(0);
  }

  /* ---------- page behaviour ---------- */
  function init(){
    var tabs = $('clTabs');
    if(tabs){
      tabs.addEventListener('click', function(e){ var b = e.target.closest('.cla-vt-b'); if(b && b.hasAttribute('data-i')) show(+b.getAttribute('data-i')); });
      tabs.addEventListener('keydown', function(e){ if(!LIST.length || (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft')) return; e.preventDefault(); show((cur + (e.key === 'ArrowRight' ? 1 : LIST.length - 1)) % LIST.length); tabs.querySelectorAll('.cla-vt-b')[cur].focus(); });
    }
    var more = $('clMore'), mc = more && more.parentNode.querySelector('.cla-mc');
    if(more && mc) more.addEventListener('click', function(e){ e.preventDefault(); var open = mc.classList.toggle('cla-open'); $('clMoreT').textContent = open ? 'Hide the full wording' : 'Read the full wording'; });
    /* contents: mark the section in view */
    var links = [].slice.call(document.querySelectorAll('.cla-toc a, .cla-chips a')), chips = document.querySelector('.cla-chips');
    var ids = links.map(function(a){ return a.getAttribute('href').slice(1); }).filter(function(v, i, s){ return v && s.indexOf(v) === i; });
    var els = ids.map(function(id){ return document.getElementById(id); }).filter(Boolean);
    if(els.length && window.IntersectionObserver){
      var io = new IntersectionObserver(function(es){ es.forEach(function(en){ if(!en.isIntersecting) return; var id = en.target.id;
        links.forEach(function(a){ var hit = a.getAttribute('href') === '#' + id; a.classList.toggle('cla-on', hit);
          if(hit && chips && a.parentNode === chips && chips.scrollWidth > chips.clientWidth) chips.scrollTo({ left:a.offsetLeft - 16, behavior:'smooth' }); }); }); }, { rootMargin:'-30% 0px -60% 0px' });
      els.forEach(function(el){ io.observe(el); });
    }
    var tm = 0; window.addEventListener('resize', function(){ clearTimeout(tm); tm = setTimeout(function(){ if(LIST[cur]) chart(LIST[cur]); }, 150); });
    DATA.then(fill)
      .catch(function(e){ console.error('Attic Standard Clause data unavailable:', e); });
  }
  /* One request, shared with the Clause document (as-clause-pdf.js), which prints from #clPrint. */
  var DATA = window.ASClauseData = fetch(API, { method:'POST', headers:{ apikey:KEY, 'Content-Type':'application/json' }, body:'{}' })
    .then(function(r){ if(!r.ok) throw new Error('HTTP ' + r.status); return r.json(); });
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();

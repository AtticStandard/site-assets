/* ATTIC STANDARD · ONE-PAGE OVERVIEW (print to PDF)
   Built from the approved canvas mockup. The hero link [data-ov-pdf] prints this sheet
   alone, US Letter, filled from the homepage payloads so it is always current.
   Replaces the sheet in homepage embed 2, which stays hidden and is no longer printed. */
(function(){
  'use strict';
  var AS = window.AS || {}, CSS = ":host{all:initial;display:block}\n.sheet{font-size:13px;line-height:1.7;width:816px;height:1056px;background:#fff;flex:none;position:relative;overflow:hidden;\n  font-family:var(--font-sans,'Roboto',Arial,sans-serif);color:#1b1b1b;padding:40px 72px 0;box-sizing:border-box}\n.sheet *{box-sizing:border-box}\n.sheet p,.sheet h1,.sheet h2{margin:0}\n.rh{display:flex;justify-content:space-between;align-items:flex-end;font-size:10px;padding-bottom:9px;border-bottom:1px solid #CFCFCF;color:#555}\n.rh b{font-weight:500;letter-spacing:3.2px;color:#111}\n.sheet h1{font-size:31px;font-weight:900;color:#111;line-height:1.15;margin-top:28px;letter-spacing:-.2px}\n.sheet .sub{font-size:13.5px;line-height:1.55;color:#444;margin-top:10px;max-width:640px}\n.lb{font-size:9px;font-weight:700;letter-spacing:1.8px;color:#6b6b6b;text-transform:uppercase}\nh2{font-size:15px;font-weight:700;color:#111;line-height:1.3;margin-top:6px}\n.blk{margin-top:20px}\n.drv{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:16px;margin-top:12px}\n.drv div{border-top:1px solid #CFCFCF;padding-top:9px;display:flex;flex-direction:column;gap:3px}\n.drv .n{font-size:20px;font-weight:700;color:#111;line-height:1.1;font-variant-numeric:tabular-nums;white-space:nowrap}\n.drv .k{font-size:10px;font-weight:600;color:#111}\n.drv .t{font-size:9.5px;line-height:1.4;color:#555}\n.cl{display:grid;grid-template-columns:minmax(0,1fr) 196px;gap:26px;margin-top:14px;align-items:start}\n.fig .hd{display:flex;justify-content:space-between;align-items:baseline;gap:12px}\n.fig .sv{display:block;font-size:22px;line-height:1.1;font-weight:700;color:#8a6a2a;font-variant-numeric:tabular-nums}\n.fig .svt{font-size:9.5px;color:#555;line-height:1.4;margin-top:2px;max-width:280px}\n.key{display:flex;gap:16px;font-size:9px;color:#555;margin-top:8px}\n.key i{display:inline-block;width:14px;height:0;border-top:2px solid #B08A3E;vertical-align:middle;margin-right:5px}\n.key i.f{border-top:1px dashed #9AA0A8}\n.steps{display:flex;flex-direction:column;gap:12px;padding-top:2px}\n.steps div{display:grid;grid-template-columns:20px minmax(0,1fr);gap:8px}\n.steps em{font-style:normal;width:18px;height:18px;border:1px solid #9AA0A8;border-radius:50%;font-size:9.5px;font-weight:700;display:flex;align-items:center;justify-content:center;color:#111}\n.steps b{display:block;font-size:10.5px;color:#111;margin-bottom:2px}\n.steps span{display:block;font-size:9.5px;line-height:1.45;color:#555}\ntable{width:100%;border-collapse:collapse;margin-top:12px}\nth{font-size:8.5px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:#6b6b6b;text-align:left;padding:0 0 6px;border-bottom:1px solid #CFCFCF}\nth:last-child,td:last-child{text-align:right}\ntd{font-size:10px;color:#333;padding:4px 0;border-bottom:1px solid #ECECEC;vertical-align:baseline}\ntd:first-child{color:#111;font-weight:600;white-space:nowrap;padding-right:14px}\ntd:last-child{font-weight:700;color:#111;font-variant-numeric:tabular-nums;white-space:nowrap}\n.desks{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:16px;margin-top:12px}\n.desks div{border-top:1px solid #CFCFCF;padding-top:8px}\n.desks b{display:block;font-size:10.5px;color:#111;margin-bottom:3px}\n.desks span{display:block;font-size:9.5px;line-height:1.45;color:#555}\n.trust{display:flex;justify-content:space-between;gap:18px;margin-top:18px;padding:10px 0;border-top:1px solid #CFCFCF;border-bottom:1px solid #CFCFCF;font-size:9.5px;color:#333}\n.trust b{color:#111;font-weight:700}\n.cta{margin-top:16px;display:flex;justify-content:space-between;align-items:flex-end;gap:24px}\n.cta h2{font-size:19px;font-weight:900;margin:0}\n.cta p{font-size:11px;line-height:1.5;color:#444;margin-top:6px;max-width:440px}\n.cta a{text-decoration:none;font-size:11.5px;font-weight:700;color:#1F5FE0;border-bottom:1.5px solid #1F5FE0;padding-bottom:1px;white-space:nowrap}\n.ft{position:absolute;left:72px;right:72px;bottom:20px;display:flex;justify-content:space-between;font-size:9.5px;color:#333;border-top:1px solid #CFCFCF;padding-top:7px}\n\n.svgc text{font-family:inherit}";
  var MON = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  var MONTH = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  var ORDER = ['ILLUS-FLG-2026-06','ILLUS-BLD-2026-06','ILLUS-CMP-2026-06','ILLUS-DEV-2026-06','ILLUS-COR-2026-06'];
  var COPY = {
    'ILLUS-FLG-2026-06':['Enterprise','$10 million a year on flagship models, bought through a cloud marketplace'],
    'ILLUS-BLD-2026-06':['Enterprise, three years','$25 million a year minimum spend, on a blend of three indexes'],
    'ILLUS-CMP-2026-06':['Product team','$3 million a year on compact models, at a fixed differential to the market'],
    'ILLUS-DEV-2026-06':['Software company','$5 million a year bought direct from model developers, at list less 15%'],
    'ILLUS-COR-2026-06':['AI agent company','$6 million a year on core models, mostly cached input, priced a quarter ahead']};
  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"]/g, function(c){ return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]; }); }
  function int(n){ return Math.round(Number(n)).toLocaleString('en-US'); }
  function money(n){ return '$' + int(n); }
  function longDate(iso){ var p = String(iso).split('-'); return MONTH[+p[1] - 1] + ' ' + (+p[2]) + ', ' + p[0]; }
  function mname(ym){ return MONTH[+ym.slice(5, 7) - 1]; }

  /* Print styles live in the page head; the sheet sits in its own shadow root. */
  var ps = document.createElement('style'); ps.id = 'ov2Print';
  ps.textContent = '#ov2Host{display:none}'
    + '@media print{html.ov2-printing body>*:not(#ov2Host){display:none !important}'
    + 'html.ov2-printing,html.ov2-printing body{background:#fff !important;margin:0 !important;padding:0 !important;height:auto !important;min-height:0 !important;overflow:hidden !important}'
    + 'html.ov2-printing body::before,html.ov2-printing body::after{display:none !important;content:none !important}'
    + 'html.ov2-printing #ov2Host{display:block !important;width:816px !important;height:1050px !important;overflow:hidden !important;margin:0 !important;break-after:avoid !important;page-break-after:avoid !important}}';
  document.head.appendChild(ps);
  var host = document.createElement('div'); host.id = 'ov2Host'; host.setAttribute('aria-hidden', 'true');
  function mount(){ if(!host.parentNode) document.body.appendChild(host); }
  var SR = host.attachShadow({ mode:'open' });

  /* Monthly payment on the Enterprise contract against its fixed price. */
  function chart(pay){
    var W = 440, H = 128, L = 14, R = 70, T = 8, B = 20, fx = pay[0][1];
    var vals = pay.map(function(p){ return p[1]; });
    var lo = Math.min.apply(null, vals), hi = Math.max.apply(null, vals), pad = Math.max((hi - lo) * 0.12, fx * 0.01);
    lo -= pad; hi += pad;
    var xs = function(i){ return L + i * (W - L - R) / (pay.length - 1); };
    var ys = function(v){ return T + (hi - v) / (hi - lo) * (H - T - B); };
    var pts = [], i;
    for(i = 0; i < pay.length; i++){ if(i) pts.push(xs(i).toFixed(1) + ',' + ys(pay[i - 1][1]).toFixed(1)); pts.push(xs(i).toFixed(1) + ',' + ys(pay[i][1]).toFixed(1)); }
    var fy = ys(fx), n = pay.length - 1, last = pay[n][1], ly = ys(last), tx = 'font-size="9" fill="#555"';
    var labFix = Math.abs(ly - fy) < 22 && last >= fx ? fy - 8 : fy + 3;
    var s = '<svg class="svgc" width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '" style="display:block;margin-top:10px">';
    s += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + fy.toFixed(1) + '" y2="' + fy.toFixed(1) + '" stroke="#9AA0A8" stroke-dasharray="3 3"/>';
    s += '<polygon points="' + pts.join(' ') + ' ' + xs(n).toFixed(1) + ',' + fy.toFixed(1) + ' ' + L + ',' + fy.toFixed(1) + '" fill="rgba(176,138,62,.12)"/>';
    s += '<polyline points="' + pts.join(' ') + '" fill="none" stroke="#B08A3E" stroke-width="2"/>';
    s += '<circle cx="' + xs(n).toFixed(1) + '" cy="' + ly.toFixed(1) + '" r="3" fill="#B08A3E"/>';
    s += '<text x="' + (W - R + 6) + '" y="' + labFix.toFixed(1) + '" ' + tx + '>' + money(fx) + ' fixed</text>';
    s += '<text x="' + (W - R + 6) + '" y="' + (ly + 3).toFixed(1) + '" font-size="9" font-weight="700" fill="#8a6a2a">' + money(last) + '</text>';
    s += '<text x="' + (W - R + 6) + '" y="' + (ly + 14).toFixed(1) + '" font-size="8" fill="#6b6b6b">' + MON[+pay[n][0].slice(5, 7) - 1] + ' to date</text>';
    s += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + (H - B + 4) + '" y2="' + (H - B + 4) + '" stroke="#CFCFCF"/>';
    pay.forEach(function(p, i){ s += '<text x="' + xs(i).toFixed(1) + '" y="' + (H - 6) + '" font-size="8.5" fill="#6b6b6b" text-anchor="middle">' + MON[+p[0].slice(5, 7) - 1] + '</text>'; });
    return s + '</svg>';
  }

  function pct2(v){ return Math.abs(v).toFixed(2) + '%'; }

  function build(p, cov){
    var gate = p.gate, ser = p.series || {}, L = p.listings || {}, r = p.reprice || {}, sp = p.spread || {};
    var last = function(k){ var s = ser['AIPI TXT GLB|' + k]; return s && s.length ? +s[s.length - 1][1] - 100 : 0; };
    var tl = last('output'), dc = last('cached');
    var prices = (sp.prices || []).map(Number).sort(function(a, b){ return a - b; });
    var ratio = prices.length ? prices[prices.length - 1] / prices[0] : 0;
    var drv = [
      [pct2(tl), 'Price drift', (tl <= 0 ? 'Fall' : 'Rise') + ' in text output prices on the same models since May'],
      [int(r.n), 'Vendor repricing', 'List price changes in 13 weeks: ' + int(r.down) + ' cuts, ' + int(r.up) + ' rises'],
      [int(L.added_13w), 'Model turnover', 'Model listings added in 13 weeks, with ' + int(L.gone_13w) + ' withdrawn'],
      [pct2(dc), 'Component shifts', (dc <= 0 ? 'Fall' : 'Rise') + ' in cached input prices since May'],
      [ratio.toFixed(1) + '&times;', 'Vendor spread', 'Highest to lowest price for one model, ' + prices.length + ' vendors']];
    var cs = {}; (p.contracts || []).forEach(function(ct){
      var st = ct.months.filter(function(m){ return m.st && m.ix != null; });
      cs[ct.id] = { fx:+ct.months[0].fx, st:st, saved:st.reduce(function(a, m){ return a + (m.fx - m.ix); }, 0) };
    });
    var ids = ORDER.filter(function(id){ return cs[id]; });
    (p.contracts || []).forEach(function(ct){ if(ids.indexOf(ct.id) < 0) ids.push(ct.id); });
    var E = cs['ILLUS-FLG-2026-06'] || cs[ids[0]];
    var pay = [['2026-05', E.fx]].concat(E.st.map(function(m){ return [m.ym, +m.ix]; }));
    var from = E.st.length ? mname(E.st[0].ym) : 'June';
    var sv = function(c){ return c.saved >= 0 ? money(c.saved) : money(-c.saved) + ' above'; };
    var s = cov && cov.summary || {};
    var countries = s.Countries || (cov && cov.countries || []).filter(function(c){ return Number(c.vendors) > 0; }).length;
    var h = '<style>' + CSS + '</style><div class="sheet">'
      + '<div class="rh"><b>ATTIC STANDARD</b><span>Overview &middot; Data as of ' + esc(longDate(gate)) + '</span></div>'
      + '<h1>Protection against AI price volatility.</h1>'
      + '<p class="sub">Attic Standard is the independent price reporting agency for AI inference. We turn published vendor rates into indexes that buyers and sellers price their contracts against.</p>'
      + '<div class="blk"><p class="lb">The exposure</p><h2>How has the market changed since you signed your AI contract?</h2><div class="drv">'
      + drv.map(function(d){ return '<div><span class="n">' + d[0] + '</span><span class="k">' + d[1] + '</span><span class="t">' + d[2] + '</span></div>'; }).join('') + '</div></div>'
      + '<div class="blk"><p class="lb">The Attic Standard Clause</p><h2>Your contract and your bill follow the market price.</h2>'
      + '<div class="cl"><div class="fig"><div class="hd"><div><span class="sv">' + sv(E) + '</span><p class="svt">'
      + (E.saved >= 0 ? 'saved' : 'paid') + ' from ' + from + ' to ' + esc(longDate(gate)) + ' on a simulated $10 million a year contract, against a fixed price at May levels</p></div></div>'
      + chart(pay)
      + '<div class="key"><span><i></i>Monthly payment on the Clause</span><span><i class="f"></i>Fixed price</span></div></div>'
      + '<div class="steps">'
      + '<div><em>1</em><p><b>Pick your index</b><span>A single, blended, or custom index built around what you buy.</span></p></div>'
      + '<div><em>2</em><p><b>Settle each month</b><span>The price moves with the published index level, in either direction.</span></p></div>'
      + '<div><em>3</em><p><b>Terms already written</b><span>Fallback and model substitution are in the Clause, so nothing is reopened.</span></p></div>'
      + '</div></div></div>'
      + '<div class="blk"><p class="lb">Simulated contracts</p><h2>Five contracts settled on published index levels since May.</h2>'
      + '<table><tr><th>Contract</th><th>Terms</th><th>Saved to date</th></tr>'
      + ids.map(function(id){ var c = COPY[id] || [id, '']; return '<tr><td>' + esc(c[0]) + '</td><td>' + esc(c[1]) + '</td><td>' + sv(cs[id]) + '</td></tr>'; }).join('') + '</table></div>'
      + '<div class="trust"><span>Administered with reference to the <b>IOSCO Principles</b></span><span>Independent: sells no inference, holds no position</span>'
      + '<span><b>' + int(s.Vendors) + '</b> vendors &middot; <b>' + int(s.Models) + '</b> models &middot; <b>' + int(countries) + '</b> countries</span></div>'
      + '<div class="cta"><div><h2>Put the market price in your next AI contract.</h2>'
      + '<p>In a 30-minute call we compare the models you use with the benchmark and show how the Clause would have priced your spend.</p></div>'
      + '<a href="https://atticstandard.com/contact">atticstandard.com/contact</a></div>'
      + '<div class="ft"><span>atticstandard.com</span><span>&copy; ' + gate.slice(0, 4) + ' Attic Standard</span></div>'
      + '</div>';
    SR.innerHTML = h;
    return gate;
  }

  /* Print this sheet alone. The page size is set only for this print. */
  var ready = null, pending = false, title = null;
  function out(){ document.documentElement.classList.remove('ov2-printing'); var z = document.getElementById('ov2Page'); if(z) z.remove(); if(title != null){ document.title = title; title = null; } }
  function doPrint(gate){
    pending = false; mount();
    var st = document.createElement('style'); st.id = 'ov2Page'; st.textContent = '@page{size:letter;margin:0}'; document.head.appendChild(st);
    document.documentElement.classList.add('ov2-printing');
    title = document.title; document.title = 'Attic Standard Overview ' + (gate ? MONTH[+gate.slice(5, 7) - 1] + ' ' + gate.slice(0, 4) : '');
    setTimeout(function(){ window.print(); setTimeout(out, 1000); }, 80);
  }
  window.addEventListener('afterprint', out);
  /* Capture phase, so the older sheet in embed 2 never prints. */
  window.addEventListener('click', function(e){
    var a = e.target.closest ? e.target.closest('[data-ov-pdf]') : null; if(!a) return;
    e.preventDefault(); e.stopImmediatePropagation();
    if(ready) doPrint(ready); else { pending = true; setTimeout(function(){ if(pending) doPrint(ready); }, 3000); }
  }, true);
  if(!AS.hp){ console.error('Attic Standard overview: homepage data loader missing'); return; }
  Promise.all([AS.hp, AS.cov ? AS.cov.catch(function(){ return null; }) : null]).then(function(v){
    mount(); ready = build(v[0], v[1]); if(pending) doPrint(ready);
  }).catch(function(e){ console.error('Attic Standard overview data unavailable:', e); });
  window.ASOverview = { show:function(){ mount(); host.style.cssText = 'display:block;position:fixed;inset:0;z-index:99999;overflow:auto;background:#888;padding:20px'; }, hide:function(){ host.style.cssText = ''; } };
})();

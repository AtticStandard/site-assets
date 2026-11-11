/* TERMINAL PAGE: the published date, the live vendor, model and SKU counts, the contents highlight
   and the chips on phones. The rest of the page is static. */
(function(){
  'use strict';
  var MONTH = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  var API = 'https://jonncmzxvxzwyaznokba.supabase.co/rest/v1/rpc/get_coverage_page', KEY = 'sb_publishable_SHTwtIYuHKMP3W5fhrwx2A_Byi9IVtF';
  function $(id){ return document.getElementById(id); }
  function pub(){
    var b = $('trmPub'), d = window.AS && window.AS.activeDate; if(!b || !d || !d.then) return;
    d.then(function(v){ var p = String(v).slice(0, 10).split('-'); b.textContent = MONTH[+p[1] - 1] + ' ' + (+p[2]) + ', ' + p[0]; }).catch(function(){});
  }
  function counts(){
    if(!window.fetch || !$('trmV')) return;
    fetch(API, { method:'POST', headers:{ apikey:KEY, 'Content-Type':'application/json' }, body:'{}' }).then(function(r){ return r.ok ? r.json() : null; }).then(function(p){
      var s = p && p.summary; if(!s) return;
      [['trmV', s.Vendors], ['trmM', s.Models], ['trmS', s.SKUs]].forEach(function(x){ var e = $(x[0]); if(e && x[1] != null && !isNaN(+x[1])) e.textContent = (+x[1]).toLocaleString('en-US'); });
    }).catch(function(){});
  }
  /* One model across every vendor selling it, input per 1,000 tokens, one price per vendor, from the
     published week (get_terminal_strip). The static strip in the markup's text is the fallback. */
  var STRIP = 'https://jonncmzxvxzwyaznokba.supabase.co/rest/v1/rpc/get_terminal_strip';
  function money(v){ var s = (+v).toFixed(6).replace(/0+$/, '').replace(/\.$/, ''); return '$' + s; }
  function nice(mx){ var e = Math.pow(10, Math.floor(Math.log(mx) / Math.LN10)), st = [1, 2, 2.5, 5, 10].map(function(m){ return m * e / 2; }).filter(function(x){ return mx / x <= 4; })[0] || e; return { step:st, max:Math.ceil(mx / st) * st }; }
  function draw(d){
    var box = $('trmStrip'); if(!box || !d || !d.points || !d.points.length) return;
    var pts = d.points.map(function(x){ return { p:+x.p, dev:!!x.dev }; }), lo = pts[0].p, hi = pts[pts.length - 1].p;
    var ax = nice(hi * 1.04), pc = function(p){ return (100 * p / ax.max).toFixed(2) + '%'; }, h = '<i class="tml-ax"></i>';
    for(var t = 0, i = 0; t <= ax.max + 1e-12; t = ++i * ax.step){ var tr = i === 0 ? '0' : (Math.abs(t - ax.max) < 1e-12 ? '-100%' : '-50%');
      h += '<i class="tml-tk" style="left:' + pc(t) + '"></i><span class="tml-tl" style="left:' + pc(t) + ';transform:translateX(' + tr + ')">' + (t ? money(t) : '$0') + '</span>'; }
    var groups = {}; pts.forEach(function(x){ (groups[x.p] = groups[x.p] || []).push(x); });
    var mode = null; Object.keys(groups).forEach(function(k){ if(!mode || groups[k].length > groups[mode].length) mode = k; });
    Object.keys(groups).forEach(function(k){ var g = groups[k].sort(function(a, b){ return a.dev - b.dev; }), n = g.length, cols = n > 4 ? 4 : 1;
      g.forEach(function(x, j){ var c = j % cols, r = Math.floor(j / cols), off = (c - (cols - 1) / 2) * 11;
        h += '<b class="tml-dt' + (x.dev ? ' tml-dv' : '') + '" style="left:calc(' + pc(+k) + ' + ' + off + 'px);bottom:' + (34 + r * 11) + 'px"></b>'; }); });
    if(hi > lo) h += '<span class="tml-vl" style="left:' + pc(lo) + '">' + money(lo) + '</span><span class="tml-vl" style="left:' + pc(hi) + '">' + money(hi) + '</span>';
    var mg = groups[mode], devIn = mg.some(function(x){ return x.dev; });
    if(mg.length > 1) h += '<span class="tml-cl2" style="left:' + pc(+mode) + '">' + mg.length + ' vendors at ' + money(+mode) + (devIn ? ', its developer among them' : '') + '</span>';
    box.innerHTML = h;
    var n = pts.length, ratio = (hi / lo).toFixed(1).replace(/\.0$/, ''), sp = box.closest('.tml-sp');
    box.setAttribute('aria-label', d.model + ' input prices across ' + n + ' vendors, from ' + money(lo) + ' to ' + money(hi) + ' per 1,000 tokens');
    if(sp){
      var hd = sp.querySelector('.tml-sp-h b'), nt = sp.querySelector('.tml-nt'), src = sp.querySelector('.tml-src');
      if(hd) hd.textContent = d.model + ', input per 1,000 tokens';
      if(nt) nt.textContent = n + ' vendors sell the same model, and the highest charges ' + ratio + ' times the lowest. The Terminal names each one, with its plan and its price history.';
      if(src && d.week){ var w = String(d.week).slice(0, 10).split('-'); src.textContent = 'Source: Attic Standard, ' + d.model + ' input prices, ' + MONTH[+w[1] - 1] + ' ' + (+w[2]) + ', ' + w[0] + '. Figures update with each index publication.'; }
    }
  }
  var FALLBACK = { model:'GLM-5.3', week:'2026-11-09', points:[0.0005, 0.00075, 0.0009, 0.00117, 0.00119].concat(Array(15).fill(0.0014), [0.0014, 0.00168, 0.00175, 0.0028]).map(function(p, i){ return { p:p, dev:i === 20 }; }) };
  function strip(){
    draw(FALLBACK);
    if(!window.fetch) return;
    fetch(STRIP, { method:'POST', headers:{ apikey:KEY, 'Content-Type':'application/json' }, body:'{}' }).then(function(r){ return r.ok ? r.json() : null; }).then(function(d){ if(d && d.points) draw(d); }).catch(function(){});
  }
  function init(){
    pub(); counts(); strip();
    var links = [].slice.call(document.querySelectorAll('.tml-toc a, .tml-chips a')), chips = document.querySelector('.tml-chips');
    var ids = links.map(function(a){ return a.getAttribute('href').slice(1); }).filter(function(v, i, s){ return v && s.indexOf(v) === i; });
    var els = ids.map(function(id){ return document.getElementById(id); }).filter(Boolean);
    if(!els.length || !window.IntersectionObserver) return;
    var io = new IntersectionObserver(function(es){ es.forEach(function(en){ if(!en.isIntersecting) return; var id = en.target.id;
      links.forEach(function(a){ var hit = a.getAttribute('href') === '#' + id; a.classList.toggle('tml-on', hit);
        if(hit && chips && a.parentNode === chips && chips.scrollWidth > chips.clientWidth) chips.scrollTo({ left:a.offsetLeft - 16, behavior:'smooth' }); }); }); }, { rootMargin:'-30% 0px -60% 0px' });
    els.forEach(function(el){ io.observe(el); });
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();

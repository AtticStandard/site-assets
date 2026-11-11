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
  /* One model across every vendor selling it: GLM-5.3 input per 1,000 tokens, one price per vendor,
     as published November 9, 2026. */
  var PTS = [0.0005, 0.00075, 0.0009, 0.00117, 0.00119, 0.0014, 0.0014, 0.0014, 0.0014, 0.0014, 0.0014, 0.0014, 0.0014,
    0.0014, 0.0014, 0.0014, 0.0014, 0.0014, 0.0014, 0.0014, 0.0014, 0.00168, 0.00175, 0.0028], DEV = 0.0014, MAX = 0.003;
  function strip(){
    var box = $('trmStrip'); if(!box) return;
    var pc = function(p){ return (100 * p / MAX).toFixed(2) + '%'; }, h = '<i class="tml-ax"></i>', seen = {};
    [0, 0.001, 0.002, 0.003].forEach(function(t){ var tr = t === 0 ? '0' : (t === MAX ? '-100%' : '-50%');
      h += '<i class="tml-tk" style="left:' + pc(t) + '"></i><span class="tml-tl" style="left:' + pc(t) + ';transform:translateX(' + tr + ')">' + (t ? '$' + t.toFixed(3) : '$0') + '</span>'; });
    PTS.forEach(function(p){ var k = seen[p] || 0; seen[p] = k + 1;
      var n = PTS.filter(function(q){ return q === p; }).length, cols = n > 4 ? 4 : 1, c = k % cols, r = Math.floor(k / cols), off = (c - (cols - 1) / 2) * 11;
      h += '<b class="tml-dt' + (p === DEV && k === n - 1 ? ' tml-dv' : '') + '" style="left:calc(' + pc(p) + ' + ' + off + 'px);bottom:' + (34 + r * 11) + 'px"></b>'; });
    h += '<span class="tml-vl" style="left:' + pc(0.0005) + '">$0.0005</span><span class="tml-vl" style="left:' + pc(0.0028) + '">$0.0028</span>';
    h += '<span class="tml-cl2" style="left:' + pc(DEV) + '">16 vendors at $0.0014, its developer among them</span>';
    box.innerHTML = h;
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

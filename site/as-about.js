/* ABOUT PAGE: the published date, the live coverage figures, the contents highlight and the
   chips on phones. The rest of the page is static. */
(function(){
  'use strict';
  var MONTH = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  var API = 'https://jonncmzxvxzwyaznokba.supabase.co/rest/v1/rpc/get_coverage_page', KEY = 'sb_publishable_SHTwtIYuHKMP3W5fhrwx2A_Byi9IVtF';
  function $(id){ return document.getElementById(id); }
  function fmt(v){ var p = String(v).slice(0, 10).split('-'); return MONTH[+p[1] - 1] + ' ' + (+p[2]) + ', ' + p[0]; }
  function n(v){ return (+v).toLocaleString('en-US'); }
  function pub(){
    var d = window.AS && window.AS.activeDate; if(!d || !d.then) return;
    d.then(function(v){
      var b = $('aboPub'); if(b) b.textContent = fmt(v);
      var s = $('aboSrc'); if(s) s.textContent = 'Source: Attic Standard coverage, published ' + fmt(v) + '. Figures update with each publication.';
    }).catch(function(){});
  }
  function counts(){
    if(!window.fetch || !$('aboV')) return;
    fetch(API, { method:'POST', headers:{ apikey:KEY, 'Content-Type':'application/json' }, body:'{}' }).then(function(r){ return r.ok ? r.json() : null; }).then(function(p){
      var s = p && p.summary; if(!s) return;
      var ok = function(x){ return x != null && !isNaN(+x); };
      [['aboI', s.Indexes], ['aboV', s.Vendors], ['aboC', s.Countries], ['aboM', s.Models], ['aboS', s.SKUs]].forEach(function(x){ var e = $(x[0]); if(e && ok(x[1])) e.textContent = n(x[1]); });
      var c = $('aboCov'); if(c && ok(s.Vendors) && ok(s.Countries) && ok(s.Indexes)) c.textContent = n(s.Vendors) + ' vendors in ' + n(s.Countries) + ' countries, ' + n(s.Indexes) + ' indexes';
    }).catch(function(){});
  }
  function init(){
    pub(); counts();
    var links = [].slice.call(document.querySelectorAll('.abo-toc a, .abo-chips a')), chips = document.querySelector('.abo-chips');
    var ids = links.map(function(a){ return a.getAttribute('href').slice(1); }).filter(function(v, i, s){ return v && s.indexOf(v) === i; });
    var els = ids.map(function(id){ return document.getElementById(id); }).filter(Boolean);
    if(!els.length || !window.IntersectionObserver) return;
    var io = new IntersectionObserver(function(es){ es.forEach(function(en){ if(!en.isIntersecting) return; var id = en.target.id;
      links.forEach(function(a){ var hit = a.getAttribute('href') === '#' + id; a.classList.toggle('abo-on', hit);
        if(hit && chips && a.parentNode === chips && chips.scrollWidth > chips.clientWidth) chips.scrollTo({ left:a.offsetLeft - 16, behavior:'smooth' }); }); }); }, { rootMargin:'-30% 0px -60% 0px' });
    els.forEach(function(el){ io.observe(el); });
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();

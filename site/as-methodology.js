/* METHODOLOGY PAGE: the published date, the contents highlight and the chips on phones. The page
   itself is static. */
(function(){
  'use strict';
  var MONTH = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  function pub(){
    var b = document.getElementById('mthPub'), d = window.AS && window.AS.activeDate; if(!b || !d || !d.then) return;
    d.then(function(v){ var p = String(v).slice(0, 10).split('-'); b.textContent = MONTH[+p[1] - 1] + ' ' + (+p[2]) + ', ' + p[0]; }).catch(function(){});
  }
  function init(){
    pub();
    var links = [].slice.call(document.querySelectorAll('.mth-toc a, .mth-chips a')), chips = document.querySelector('.mth-chips');
    var ids = links.map(function(a){ return a.getAttribute('href').slice(1); }).filter(function(v, i, s){ return v && s.indexOf(v) === i; });
    var els = ids.map(function(id){ return document.getElementById(id); }).filter(Boolean);
    if(!els.length || !window.IntersectionObserver) return;
    var io = new IntersectionObserver(function(es){ es.forEach(function(en){ if(!en.isIntersecting) return; var id = en.target.id;
      links.forEach(function(a){ var hit = a.getAttribute('href') === '#' + id; a.classList.toggle('mth-on', hit);
        if(hit && chips && a.parentNode === chips && chips.scrollWidth > chips.clientWidth) chips.scrollTo({ left:a.offsetLeft - 16, behavior:'smooth' }); }); }); }, { rootMargin:'-30% 0px -60% 0px' });
    els.forEach(function(el){ io.observe(el); });
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();

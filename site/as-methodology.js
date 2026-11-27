/* METHODOLOGY PAGE: the published date, the contents highlight and the chips on phones. The page
   itself is static. */
(function(){
  'use strict';
  var MONTH = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  function pub(){
    var b = document.getElementById('mthPub'), d = window.AS && window.AS.activeDate; if(!b || !d || !d.then) return;
    d.then(function(v){ var p = String(v).slice(0, 10).split('-'); b.textContent = MONTH[+p[1] - 1] + ' ' + (+p[2]) + ', ' + p[0]; }).catch(function(){});
  }
  /* The IOSCO drawer cites the old section numbers; name the new sections instead. */
  var SEC = { '1.1':'Principles', '1.2':'Capture and verification', '1.3':'Capture and verification', '1.4':'Governance', '1.5':'Governance', '1.6':'Governance',
    '2.1':'Composition', '2.2':'Composition', '2.3':'Composition', '3.1':'Construction', '3.2':'Construction', '3.3':'Construction', '3.4':'Construction',
    '3.5':'Construction', '3.6':'Construction', '3.7':'Governance', '4.1':'Market measures', '4.2':'Market measures', '4.3':'Market measures',
    '5.1':'Scope and standards', '5.2':'Scope and standards', '6.1':'Scope and standards' };
  function refs(){
    [].slice.call(document.querySelectorAll('#ip-panel .ip-meta')).forEach(function(m){
      var t = m.firstChild; if(!t || t.nodeType !== 3 || !/\u00a7/.test(t.nodeValue)) return;
      var seen = [], names = (t.nodeValue.match(/\u00a7\s*\d+\.\d+/g) || []).map(function(x){ return SEC[x.replace(/[^\d.]/g, '')]; }).filter(function(n){ if(!n || seen.indexOf(n) >= 0) return false; seen.push(n); return true; });
      if(names.length) t.nodeValue = names.join(', ') + ' \u00b7 ';
    });
  }
  function init(){
    pub(); refs();
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

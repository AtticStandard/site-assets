/* Price index table D: units once per family, one-line names, drawn change arrows. */
(function(){
  var REN = { 'IMP GLB':'Image by area', 'VDC GLB':'Video by clip' }, ARW = { '▲':'up', '▼':'dn', '▬':'fl' };
  function marks(root){
    root.querySelectorAll('.as-hm-p, .as-hm-k > span').forEach(function(p){
      if(p.children.length) return;
      var m = /^([▲▼▬])\s*(.*)$/.exec(p.textContent); if(!m) return;
      p.innerHTML = '<i class="as-hm-a ' + ARW[m[1]] + '"></i>' + m[2];
    });
  }
  function tidy(){
    var hm = document.getElementById('hpHm'), g = hm && hm.querySelector('.as-hm-g');
    if(!g || g._d) return; g._d = 1;
    g.querySelectorAll('.as-hm').forEach(function(b){
      var fam = null, rows = [];
      function close(){
        if(!fam) return;
        var cnt = {}, top = '', n = 0, mixed = false;
        rows.forEach(function(r){ var u = r.querySelector('.as-hm-u'), t = u ? u.textContent : ''; cnt[t] = (cnt[t] || 0) + 1; if(cnt[t] > n){ n = cnt[t]; top = t; } });
        rows.forEach(function(r){ var u = r.querySelector('.as-hm-u'); if(!u) return; if(u.textContent === top) u.remove(); else mixed = true; });
        if(top){ var s = document.createElement('span'); s.className = 'as-hm-fu'; s.textContent = top + (mixed ? ' unless shown' : ''); fam.appendChild(s); }
        fam = null; rows = [];
      }
      [].slice.call(b.children).forEach(function(k){
        if(k.classList.contains('as-hm-f')){ close(); fam = k; }
        else if(fam && k.classList.contains('as-hm-r') && !k.classList.contains('as-hm-h')) rows.push(k);
      });
      close();
    });
    g.querySelectorAll('.as-hm-r').forEach(function(r){
      var c = r.querySelector('.as-code'), n = r.querySelector('.as-hm-n'); if(!c || !n) return;
      var t = n.firstChild; if(!t || t.nodeType !== 3) return;
      var s = document.createElement('span'); s.className = 'as-hm-nt'; s.textContent = REN[c.textContent.trim()] || t.nodeValue; n.replaceChild(s, t);
    });
    marks(hm);
  }
  function init(){ var hm = document.getElementById('hpHm'); if(!hm) return; tidy(); new MutationObserver(tidy).observe(hm, { childList:true }); }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();

/* Cap and floor are agreed in negotiation, like discounts, so the homepage leaves them out:
   the hero diagram loses its cap and floor lines, the Clause section its cap and floor copy,
   and the simulated contract chart its CAP and FLOOR rules. Where a floor or cap actually
   binds, the chart still notes it, since the flat payment needs explaining. */
(function(){
  var AS = window.AS;
  if(AS && AS.hp && !AS._noCf){
    AS._noCf = 1;
    AS.hp = AS.hp.then(function(p){ (p && p.contracts || []).forEach(function(c){ c.cap = 100; c.floor = 100; }); return p; });
    if(AS.chart){
      var tx = AS.chart.text, sv = AS.chart.svg;
      AS.chart.text = function(x, y, s){ if(s === 'CAP' || s === 'FLOOR') return ''; return tx.apply(this, arguments); };
      if(sv) AS.chart.svg = function(inner, label){ return sv.call(this, inner, label == null ? label : String(label).replace(/,? with its cap and floor/, '')); };
    }
  }
  function strip(){
    document.querySelectorAll('svg.as-vx').forEach(function(s){
      s.querySelectorAll('g.as-cf').forEach(function(g){ g.remove(); });
      s.querySelectorAll('line[stroke-dasharray]').forEach(function(l){ if(l.getAttribute('x1') === '800' && l.getAttribute('x2') === '1140') l.remove(); });
      s.querySelectorAll('rect').forEach(function(r){ if(r.getAttribute('x') === '800' && r.getAttribute('y') === '88') r.remove(); });
      /* The gold line ends in the market-adjusted bill: label it under the last dot. */
      var dot = s.querySelector('circle[style*="gold"]');
      if(dot && !s.querySelector('.as-mab')){
        var NS = 'http://www.w3.org/2000/svg', g = document.createElementNS(NS, 'g'), t = document.createElementNS(NS, 'text');
        g.setAttribute('class', 'as-mab'); g.setAttribute('font-family', 'Roboto, sans-serif'); g.setAttribute('font-size', '14.48');
        t.setAttribute('x', (+dot.getAttribute('cx') + 4.5).toFixed(1)); t.setAttribute('y', (+dot.getAttribute('cy') + 26).toFixed(1));
        t.setAttribute('text-anchor', 'end'); t.setAttribute('style', 'fill: var(--gold)'); t.textContent = 'Market-adjusted bill';
        g.appendChild(t); dot.parentNode.insertBefore(g, dot.nextSibling);
      }
      var f = s.closest('figure') || s.parentNode;
      f.querySelectorAll('.as-lg-m').forEach(function(d){ if(/cap and floor/i.test(d.textContent)) d.remove(); });
      [s].concat([].slice.call(f.querySelectorAll('[aria-label]'))).forEach(function(e){ var a = e.getAttribute('aria-label'); if(a && /cap and a floor/.test(a)) e.setAttribute('aria-label', a.replace(/ between a cap and a floor/, '')); });
    });
    var cl = document.getElementById('hpClause'); if(!cl) return;
    cl.querySelectorAll('p.as-ss').forEach(function(p){ if(/cap and a floor/i.test(p.textContent)) p.textContent = 'Your bill follows the index, month by month.'; });
    cl.querySelectorAll('li').forEach(function(li){ if(/^\s*cap and floor/i.test(li.textContent)) li.textContent = 'Priced on a single, blended or custom index'; });
  }
  strip();
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', strip);
})();

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
  /* The gold line ends in the market-adjusted bill: a filled gold tag over the last dot, with a
     ring around the dot, so the outcome reads apart from the contract price label. Sized from the
     label's own font size, which the hero type script rescales with the width. */
  var NS = 'http://www.w3.org/2000/svg';
  function lay(s){
    var g = s.querySelector('.as-mab'), dot = s.querySelector('circle[style*="fill: var(--gold)"]'); if(!g || !dot) return;
    var dl = s.querySelector('.as-dl'); g.style.display = dl && getComputedStyle(dl).display === 'none' ? 'none' : '';
    var t = g.querySelector('text'), r = g.querySelector('rect'), fs = +t.getAttribute('font-size') || 14.48;
    var cx = +dot.getAttribute('cx'), cy = +dot.getAttribute('cy'), px = fs * .7, h = fs * 1.75, w;
    var k = 1200 / (s.clientWidth || 1200), ring = s.querySelector('.as-mab-ring');
    dot.setAttribute('r', Math.max(4.5, 4 * k).toFixed(1));
    if(ring){ ring.setAttribute('r', Math.max(9, 8 * k).toFixed(1)); ring.setAttribute('stroke-width', Math.max(1.5, 1.4 * k).toFixed(1)); }
    try { w = t.getComputedTextLength(); } catch(e){ w = fs * 9.5; }
    var right = cx + w / 2 + px, bottom = cy - 13;
    if(right > 1200) s.style.overflow = 'visible';
    r.setAttribute('x', (right - w - 2 * px).toFixed(1)); r.setAttribute('y', (bottom - h).toFixed(1));
    r.setAttribute('width', (w + 2 * px).toFixed(1)); r.setAttribute('height', h.toFixed(1)); r.setAttribute('rx', (h / 2).toFixed(1));
    t.setAttribute('x', (right - px).toFixed(1)); t.setAttribute('y', (bottom - h / 2 + fs * .36).toFixed(1));
  }
  function mab(s){
    var dot = s.querySelector('circle[style*="fill: var(--gold)"]'); if(!dot || s.querySelector('.as-mab')) return;
    var ln = s.querySelector('polyline[style*="gold"]'), p0 = ln ? ln.getAttribute('points').trim().split(/\s+/)[0].split(',') : null;
    s.querySelectorAll('text').forEach(function(t){ if(t.textContent.trim() === 'Your contract price' && p0){ t.setAttribute('x', p0[0]); t.setAttribute('y', (+p0[1] - 12).toFixed(1)); } });
    var ring = document.createElementNS(NS, 'circle');
    ring.setAttribute('cx', dot.getAttribute('cx')); ring.setAttribute('cy', dot.getAttribute('cy')); ring.setAttribute('r', '9');
    ring.setAttribute('class', 'as-mab-ring'); ring.setAttribute('fill', 'none'); ring.setAttribute('stroke-width', '1.5'); ring.setAttribute('style', 'stroke: var(--gold); opacity: .45');
    dot.parentNode.insertBefore(ring, dot);
    var g = document.createElementNS(NS, 'g'), r = document.createElementNS(NS, 'rect'), t = document.createElementNS(NS, 'text');
    g.setAttribute('class', 'as-mab'); r.setAttribute('style', 'fill: var(--gold)');
    t.setAttribute('font-family', 'Roboto, sans-serif'); t.setAttribute('font-size', '14.48'); t.setAttribute('font-weight', '600');
    t.setAttribute('text-anchor', 'end'); t.setAttribute('style', 'fill: var(--bg, #15171B)'); t.textContent = 'Market-adjusted bill';
    g.appendChild(r); g.appendChild(t); dot.parentNode.insertBefore(g, dot.nextSibling);
    /* Phones show a legend instead of labels: add the bill to it. */
    var lgr = (s.closest('figure') || s.parentNode).querySelector('.as-lgr');
    if(lgr && !lgr.querySelector('.as-mab-lg')){ var it = document.createElement('div'); it.className = 'as-lg as-mab-lg';
      it.innerHTML = '<span class="as-lg-k" style="width:9px;height:9px;border-radius:50%;background:var(--gold);box-shadow:0 0 0 3px rgba(212,175,55,.3)"></span><b style="font-weight:600;color:var(--gold)">Market-adjusted bill</b>'; lgr.appendChild(it); }
    function later(){ requestAnimationFrame(function(){ requestAnimationFrame(function(){ lay(s); }); }); }
    lay(s); later();
    if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', later);
    if(document.fonts){ if(document.fonts.ready) document.fonts.ready.then(later); if(document.fonts.addEventListener) document.fonts.addEventListener('loadingdone', later); }
    window.addEventListener('load', later); setTimeout(later, 700); setTimeout(later, 2000);
    if(window.ResizeObserver) new ResizeObserver(later).observe(s);
    /* The hero type script rescales the label after load: lay the tag out again whenever it does. */
    if(window.MutationObserver) new MutationObserver(later).observe(t, { attributes:true, attributeFilter:['font-size'] });
  }
  function strip(){
    document.querySelectorAll('svg.as-vx').forEach(function(s){
      s.querySelectorAll('g.as-cf').forEach(function(g){ g.remove(); });
      s.querySelectorAll('line[stroke-dasharray]').forEach(function(l){ if(l.getAttribute('x1') === '800' && l.getAttribute('x2') === '1140') l.remove(); });
      s.querySelectorAll('rect').forEach(function(r){ if(r.getAttribute('x') === '800' && r.getAttribute('y') === '88') r.remove(); });
      mab(s);
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

/* Minimum-spend simulated contract: the buyer pays the same and receives more usage, so the
   homepage shows that usage, valued at the price at signing, exactly as the Clause page does. */
(function(){
  var AS = window.AS; if(!AS || !AS.hp) return;
  var MON = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  AS.hp.then(function(p){
    var ct = (p && p.contracts || []).filter(function(c){ return c.terms && c.terms.commitment === 'minimum_spend'; })[0]; if(!ct) return;
    var st = ct.months.filter(function(m){ return m.st && m.ix != null; });
    var use = Math.round(st.reduce(function(a, m){ return a + (m.set ? m.fx * (100 / m.set - 1) : m.fx * (m.fx / m.ix - 1)); }, 0));
    var g = String(p.gate).split('-'), date = MON[+g[1] - 1] + ' ' + (+g[2]) + ', ' + g[0], from = st.length ? MON[+st[0].ym.slice(5, 7) - 1] : 'June';
    var lbl = document.getElementById('hpClLbl'); if(!lbl) return;
    function fix(){
      if(!/three years/i.test(lbl.textContent)) return;
      var big = document.getElementById('hpClBig'), d = document.getElementById('hpClD');
      var t = '$' + use.toLocaleString('en-US'), dt = 'more usage from ' + from + ' to ' + date + ', for the same minimum spend, valued at the price at signing.';
      if(big && big.textContent !== t) big.textContent = t;
      if(d && d.textContent !== dt) d.textContent = dt;
    }
    new MutationObserver(fix).observe(lbl, { childList:true, characterData:true, subtree:true }); fix();
  });
})();

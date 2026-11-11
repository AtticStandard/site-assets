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

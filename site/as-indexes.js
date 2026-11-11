/* INDEXES PAGE: wording aligned with the rest of the site. The page's figures are drawn by its
   embeds, so the copy is corrected as it renders: no weekly-cadence wording, "1w" for the
   one-week change as in the ticker, and "weekly assessment" in lower case as on the homepage. */
(function(){
  var RULES = [
    [/\bWoW\b/g, '1w'],
    [/\bMoM\b/g, '1m'],
    [/ models priced this week/g, ' models priced'],
    [/Structure this week, behavior over the quarter/g, 'Structure now, behavior over 13 weeks'],
    [/ SKUs this week,/g, ' SKUs,'],
    [/Read the Weekly Assessment/g, 'Read the weekly assessment'],
    [/We compute every measure each week from/g, 'We compute every measure at each publication from'],
    [/History builds each week\./g, 'History builds with each publication.'],
    [/compare this week(?:’|')s basket with/g, 'compare the current basket with'],
    [/what the market charges this week,/g, 'what the market charges now,']];
  var ATTR = ['title', 'aria-label', 'data-tip', 'data-tooltip'];
  function fix(str){ var o = str; RULES.forEach(function(r){ if(r[0].test(o)) o = o.replace(r[0], r[1]); r[0].lastIndex = 0; }); return o; }
  function walk(root){
    if(!root) return;
    if(root.nodeType === 3){ var t = fix(root.nodeValue); if(t !== root.nodeValue) root.nodeValue = t; return; }
    if(root.nodeType !== 1 || /^(SCRIPT|STYLE|TEMPLATE)$/.test(root.tagName)) return;
    ATTR.forEach(function(a){ var v = root.getAttribute(a); if(v){ var f = fix(v); if(f !== v) root.setAttribute(a, f); } });
    var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT), n;
    while((n = w.nextNode())){
      if(n.nodeType === 3){ if(n.parentNode && /^(SCRIPT|STYLE|TEMPLATE)$/.test(n.parentNode.tagName)) continue; var x = fix(n.nodeValue); if(x !== n.nodeValue) n.nodeValue = x; }
      else ATTR.forEach(function(a){ var v = n.getAttribute(a); if(v){ var f = fix(v); if(f !== v) n.setAttribute(a, f); } });
    }
  }
  function init(){
    walk(document.body);
    new MutationObserver(function(ms){ ms.forEach(function(m){
      if(m.type === 'characterData') walk(m.target);
      else if(m.type === 'attributes') walk(m.target);
      else m.addedNodes.forEach(walk);
    }); }).observe(document.body, { childList:true, subtree:true, characterData:true, attributes:true, attributeFilter:ATTR });
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();

/* Standard inner-page header: Published, Covers, For, Standards, the same four rows on every page. */
(function(){
  function head(){
    var dl = document.querySelector('.ix-hero .ix-sheet'); if(!dl || dl._std) return;
    var rows = [].slice.call(dl.querySelectorAll('.r')), get = function(lbl){ var r = rows.filter(function(x){ var t = x.querySelector('dt'); return t && t.textContent.trim().toLowerCase() === lbl; })[0]; return r && r.querySelector('dd b') ? r.querySelector('dd b').textContent.trim() : ''; };
    var pub = dl.querySelector('#ixPub'), n = get('indexes') || '29', f = get('families') || '6';
    dl._std = 1; dl.innerHTML = '';
    function row(l, dd){ var r = document.createElement('div'); r.className = 'r'; var t = document.createElement('dt'); t.className = 'as-lbl'; t.textContent = l; r.appendChild(t); r.appendChild(dd); dl.appendChild(r); }
    var d1 = document.createElement('dd'); if(pub) d1.appendChild(pub); else { var b = document.createElement('b'); b.id = 'ixPub'; d1.appendChild(b); }
    row('Published', d1);
    var d2 = document.createElement('dd'); d2.textContent = n + ' indexes in ' + f + ' families'; row('Covers', d2);
    var d3 = document.createElement('dd'); d3.textContent = 'Procurement, finance, engineering and analysts'; row('For', d3);
    var d4 = document.createElement('dd'); d4.textContent = 'With reference to the IOSCO Principles'; row('Standards', d4);
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', head); else head();
})();

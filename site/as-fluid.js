/* FLUID CHARTS, staged on the new homepage; folds into the shared script (AS.chart).
   A chart is drawn on a frame as wide as its container, so the plot stretches
   while labels keep their set size. From 560px to 720px the frame stays 720
   wide and scales down. On phones (under 560px) the chart is redrawn at the
   real width: text keeps its set size, the right-hand label column moves under
   the plot as a list, and axis values sit inside the plot at its right edge.
   Charts redraw when their container changes width. */
(function(){
  var AS = window.AS = window.AS || {}, C = AS.chart;
  if(!C || C.mount) return;
  var BASE = C.W, MIN = 720, PHONE = 560, text = C.text, cap = null, boxes = [], tag = null;
  var AXV = /^[\u2212+\-]?\$?\d[\d.,]*%?$/, MORE = /^([a-z0-9$+\u2212\-]|Listings per week)/;
  C.fit = function(w){
    w = Math.round(w || BASE);
    if(w < PHONE){ C.phone = true; C.W = w; C.X0 = 6; C.X1 = w - 10; C.AL = 0; C.AR = w; C.LX = w + 400; }
    else { C.phone = false; var W = Math.max(MIN, w); C.W = W; C.X0 = 14; C.AL = 0; C.X1 = W - 170; C.LX = W - 146; C.AR = W - 156; }
    return C;
  };
  /* On phones, text set in the label column is collected for the list;
     axis values in that column are drawn inside the plot instead. */
  C.text = function pt(x, y, s, o){
    if(cap && x >= C.LX - 1){
      o = o || {};
      var str = String(s).trim();
      /* A line name in capitals (CAP, FLOOR) joins the value set under it as one tag on the line. */
      if(/^[A-Z]{2,}$/.test(str)){ tag = { y:y, s:str, o:o }; return ''; }
      if(AXV.test(str)){
        if(tag && y - tag.y > 0 && y - tag.y <= 16){ var t = tag; tag = null; return pt(0, t.y - 4, t.s + ' ' + str, { cls:t.o.cls, size:t.o.size, weight:t.o.weight }); }
        return pt(0, y - 8, s, { cls:o.cls, size:o.size });
      }
      cap.push({ y:y, s:String(s), cls:o.cls || 'as-f-l4', w:o.weight });
      return '';
    }
    if(cap){
      /* Keep text inside the frame, and skip a label that would touch its neighbour on the same line. */
      o = o || {};
      var a = o.anchor || 'start', tw = String(s).length * (o.size || 11) * 0.58, x0 = a === 'middle' ? x - tw / 2 : a === 'end' ? x - tw : x;
      if(x0 < 0){ x0 = 0; x = 0; a = 'start'; }
      else if(x0 + tw > C.W){ x0 = C.W - tw; x = C.W; a = 'end'; }
      var h = (o.size || 11) + 1;
      if(boxes.some(function(b){ return Math.abs(b[2] - y) < h && x0 < b[1] + 6 && x0 + tw > b[0] - 6; })) return '';
      boxes.push([x0, x0 + tw, y]);
      return text(x, y, s, { cls:o.cls, anchor:a, size:o.size, weight:o.weight });
    }
    return text.apply(this, arguments);
  };
  function un(s){ return String(s).replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&'); }
  function tone(cls){ var m = /l(\d)/.exec(cls || ''); return 'var(--l' + (m ? m[1] : 4) + ')'; }
  function list(items){
    if(!items.length) return '';
    items.sort(function(a, b){ return a.y - b.y; });
    var out = [], i, a, b;
    for(i = 0; i < items.length; i++){
      a = items[i]; b = items[i + 1];
      if(b && b.y - a.y > 0 && b.y - a.y <= 16 && (/l5/.test(b.cls) || MORE.test(un(b.s)))){ a.v = b.s; i++; }
      out.push(a);
    }
    return '<ul class="as-ch-list">' + out.map(function(it){
      var hi = /l[12]/.test(it.cls) || it.w;
      return '<li' + (hi ? ' class="on"' : '') + '><span style="color:' + tone(it.cls) + '">' + C.esc(un(it.s)) + '</span>' + (it.v ? '<span class="v">' + C.esc(un(it.v)) + '</span>' : '') + '</li>';
    }).join('') + '</ul>';
  }
  function render(el, force){
    var w = el.clientWidth;
    if(!w || (!force && w === el._asw) || !el._asdraw) return;
    el._asw = w; C.fit(w);
    try {
      cap = C.phone ? [] : null; boxes = [];
      tag = null;
      var html = el._asdraw() || '';
      if(tag){ cap.push({ y:tag.y, s:tag.s, cls:tag.o.cls || 'as-f-l4' }); tag = null; }
      if(C.phone){
        /* Leader lines that ran out to the label column are dropped. */
        html = html.replace(/<polyline[^>]*points="([^"]*)"[^>]*><\/polyline>/g, function(m, p){
          return p.trim().split(/\s+/).some(function(q){ return +q.split(',')[0] > C.W + 1; }) ? '' : m; });
        html += list(cap);
      }
      el.innerHTML = html;
    } catch(e){ console.error('Attic Standard chart:', e); }
    finally { cap = null; C.fit(BASE); }
  }
  /* Draw into el now, and again whenever el changes width. */
  C.mount = function(el, draw){
    if(!el) return;
    el._asdraw = draw;
    if(!draw){ el.innerHTML = ''; return; }
    render(el, true);
    if(!el._asro && window.ResizeObserver){
      el._asro = new ResizeObserver(function(){ cancelAnimationFrame(el._asraf); el._asraf = requestAnimationFrame(function(){ render(el); }); });
      el._asro.observe(el);
    }
  };

  /* Illustrations drawn on a fixed viewBox (the hero): the picture scales with
     the width, its labels are resized so they render at their set size. */
  var REF = 1360;
  function fixText(svg){
    var w = svg.clientWidth; if(!w) return;
    svg.querySelectorAll('[font-size]').forEach(function(t){
      if(t._fs == null){ t._fs = +t.getAttribute('font-size'); t._ls = t.getAttribute('letter-spacing'); }
      t.setAttribute('font-size', (t._fs * REF / w).toFixed(2));
      if(t._ls) t.setAttribute('letter-spacing', (+t._ls * REF / w).toFixed(2));
    });
  }
  function initText(){
    document.querySelectorAll('svg.as-vx').forEach(function(svg){
      fixText(svg);
      if(window.ResizeObserver) new ResizeObserver(function(){ fixText(svg); }).observe(svg);
    });
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initText); else initText();
})();

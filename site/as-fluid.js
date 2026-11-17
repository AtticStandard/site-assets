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
    /* No label column on any chart (site rule C, November 17, 2026): names and latest values sit in
       the legend above the chart, so the plot runs the full width. */
    else { C.phone = false; var W = Math.max(MIN, w); C.W = W; C.X0 = 14; C.AL = 0; C.X1 = W - 12; C.LX = W + 400; C.AR = W; }
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
  /* LEGEND WITH VALUES (site rule C). One row above every chart, left-aligned: a key drawn in the
     series' own style, its name, its latest value in bold and a short note. The chart itself carries
     no series names or values at line ends. items: [{ k:'line'|'thin'|'dash'|'dot'|'bar', c:css colour,
     n:name, v:value, note:note }]. */
  C.legend = function(el, items){
    if(!el) return;
    el.classList.add('as-lgv');
    el.innerHTML = (items || []).map(function(it){
      return '<span class="as-lg"><span class="as-lg-k k-' + (it.k || 'line') + '" style="--k:' + it.c + '"></span>' + C.esc(it.n)
        + (it.v != null && it.v !== '' ? ' <b>' + C.esc(it.v) + '</b>' : '') + (it.note ? ' <span class="as-lg-n">' + C.esc(it.note) + '</span>' : '') + '</span>';
    }).join('');
  };
  /* The legend row for a chart box: the element just before it, created if missing. */
  C.legendFor = function(box){
    if(!box) return null;
    var p = box.previousElementSibling;
    if(p && p.classList.contains('as-lgv')) return p;
    var d = document.createElement('div'); d.className = 'as-lgv'; box.parentNode.insertBefore(d, box); return d;
  };

  /* SIMULATED CONTRACT CHART, one drawing for the homepage and the Clause page. S: { fx (fixed monthly
     price), months (settled months, YYYY-MM), pay (monthly payments), unl (payments without the floor
     or cap, as % of fx, or null), lim ('floor'|'cap'), ann ([month index, text]), end ('May 2027'),
     note ('November to date'), gate (published date), from (first month name), min (minimum spend) }.
     Returns { svg, legend }. The fixed price sits 28px under the top edge on every contract; the
     legend carries every value, so the plot has no labels at line ends. */
  function fmon(ym){ var d = new Date(Date.UTC(+ym.slice(0, 4), +ym.slice(5, 7) - 1, 1)); while(d.getUTCDay() !== 1) d.setUTCDate(d.getUTCDate() + 1); return d.toISOString().slice(0, 10); }
  function nym(ym){ var y = +ym.slice(0, 4), m = +ym.slice(5, 7) + 1; if(m > 12){ m = 1; y++; } return y + '-' + (m < 10 ? '0' : '') + m; }
  function usd(n){ return '$' + Math.round(Number(n)).toLocaleString('en-US'); }
  var LONGM = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  C.contract = function(S){
    var c = C, fx = +S.fx, AX = C.axis('2026-05-04', S.gate), i;
    var pc = S.pay.map(function(p){ return p / fx * 100; }), un = (S.unl || []).filter(function(u){ return u != null; });
    var lo = Math.min.apply(null, [97].concat(pc.map(function(v){ return v - 1.5; }), un.map(function(u){ return u - 1.5; })));
    var hi = Math.max.apply(null, [100].concat(pc, un));
    var Y = function(v){ return Math.round((c.PB - (v / fx * 100 - lo) / (hi - lo) * (c.PB - c.PT - 28)) * 10) / 10; };
    var T = function(x, y, s, cls, anchor){ return c.text(x, y, s, { cls:cls || 'as-f-l4', anchor:anchor, size:11 }); };
    var g = [c.rule(Y(fx), { cls:'as-s-hist', width:1.5 }), T(c.X0, Y(fx) - 10, 'May: base period')];
    var pts = [];
    for(i = 0; i < S.months.length; i++){
      var a = fmon(S.months[i]), b = i < S.months.length - 1 ? fmon(S.months[i + 1]) : (fmon(nym(S.months[i])) <= S.gate ? fmon(nym(S.months[i])) : S.gate);
      pts.push([AX.x(a), Y(S.pay[i])], [AX.x(b), Y(S.pay[i])]);
    }
    var path = pts.map(function(p){ return p[0].toFixed(1) + ',' + p[1]; }).join(' ');
    g.push('<polygon points="' + pts[0][0].toFixed(1) + ',' + Y(fx) + ' ' + path + ' ' + pts[pts.length - 1][0].toFixed(1) + ',' + Y(fx) + '" style="fill: var(--gold); fill-opacity: .12"></polygon>');
    var lg = [];
    if(S.unl){
      var up = [];
      for(i = 0; i < S.months.length; i++){ if(S.unl[i] == null) continue; var y = Y(fx * S.unl[i] / 100); up.push([pts[2 * i][0], y], [pts[2 * i + 1][0], y]); }
      g.push('<polyline points="' + up.map(function(p){ return p[0].toFixed(1) + ',' + p[1]; }).join(' ') + '" fill="none" class="as-s-series" stroke-width="1.5" stroke-dasharray="4 3"></polyline>');
    }
    g.push('<polyline points="' + path + '" fill="none" style="stroke: var(--gold)" stroke-width="2.2" stroke-linejoin="round"></polyline>');
    var lx = pts[pts.length - 1][0], ly = pts[pts.length - 1][1];
    g.push('<circle cx="' + lx.toFixed(1) + '" cy="' + ly + '" r="4" style="fill: var(--gold)"></circle>');
    if(S.ann){ i = S.ann[0]; g.push(T((pts[2 * i][0] + pts[2 * i + 1][0]) / 2, Y(S.pay[i]) - 10, S.ann[1], 'as-f-l4', 'middle')); }
    g.push(T(c.X1, Y(fx) - 10, 'Term continues to ' + S.end, 'as-f-l4', 'end'));
    g.push(AX.svg());
    lg.push({ k:'line', c:'var(--gold)', n:S.min ? 'Usage at the index price' : 'On the Clause', v:usd(S.pay[S.pay.length - 1]), note:S.note });
    lg.push({ k:'line', c:'var(--series-history)', n:'Fixed price', v:usd(fx), note:'a month' });
    if(S.unl){ var lu = S.unl[S.unl.length - 1]; lg.push({ k:'dash', c:'var(--series)', n:'Without the ' + (S.lim || 'floor'), v:lu == null ? '' : usd(fx * lu / 100) }); }
    var ld = S.gate ? (function(p){ return LONGM[+p[1] - 1] + ' ' + (+p[2]) + ', ' + p[0]; })(String(S.gate).split('-')) : '';
    return { legend:lg, svg:c.svg(g.join(''), 'Monthly payments on the simulated contract under the Clause, ' + S.from + ' to ' + ld + ', against the fixed price set at May levels') };
  };

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

  /* Chart type scale (folded in from the homepage footer, November 17, 2026): names and labels
     inside charts 12px, axis ticks 11px, on every page that draws on the shared frame. */
  if(!C._scaled){
    C._scaled = true;
    var t0 = C.text;
    C.text = function(x, y, s, o){ o = o || {}; var z = o.size || 11, q = {}; for(var k in o) q[k] = o[k]; q.size = z <= 10 ? 11 : z === 11 ? 12 : z + 1; return t0(x, y, s, q); };
  }

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

/* PRICE INDEXES AT A GLANCE (homepage #hpHm). Every published index as one row, each component
   coloured by its change over the chosen period. Toggle buttons switch between index levels and
   spot prices; the change shown in every cell rotates on its own, like a market board, through
   since the base, year to date, 1 month and 1 week, with the period named above the table. Every figure is a published one:
   levels and spot prices from index_values, 1 week, 1 month and year-to-date changes from the
   change columns stored with each publication, and the change since the base worked out from the
   same series as before. Replaces the script that sat in homepage embed 4. */
(function(){
  'use strict';
  var AS = window.AS || {};
  var N = { TXT:'Text', MML:'Multimodal', IMG:'Image', VID:'Video', AUD:'Speech to text', VOC:'Text to speech', EMB:'Embeddings', IMP:'Image', VDC:'Video',
    DEV:'Model developers', CLD:'Cloud marketplaces', PLT:'Inference platforms', NCL:'Neoclouds', FLG:'Flagship', COR:'Core', CMP:'Compact',
    OSS:'Published weights', PRP:'Unpublished weights', OWC:'Restricted weights', CHN:'China', USA:'United States', RSN:'Reasoning', COD:'Coding' };
  var FAM = [['Modality', ['TXT GLB','MML GLB','IMG GLB','IMP GLB','VID GLB','VDC GLB','AUD GLB','VOC GLB','EMB GLB']],
    ['Channel', ['DEV GLB','CLD GLB','PLT GLB','NCL GLB']], ['Tier', ['FLG GLB','COR GLB','CMP GLB']],
    ['License', ['PRP GLB','OSS GLB','OWC GLB']], ['Origin', ['USA GLB','CHN GLB']], ['Use case', ['RSN GLB','COD GLB']],
    ['Regional', ['TXT EUR','MML EUR','TXT CNY','MML CNY','IMG CNY','VOC CNY']]];
  var LEGS = [['input','Input'], ['cached','Cached'], ['output','Output']];
  var UP = '53,208,127', DN = '229,72,77', FL = '229,163,61', SYM = { USD:'$', EUR:'€', CNY:'¥' };
  /* Periods, in the order the board steps through them. small and big set the colour scale and
     the legend for each view: a week's move is read on a finer scale than a move since the base. */
  var PER = [
    { k:'base', b:'Since base', lg:'Change since the base', lv:[2, 10], sp:[10, 50] },
    { k:'ytd',  b:'Year to date', lg:'Change year to date', lv:[2, 10], sp:[10, 50] },
    { k:'mom',  b:'1 month', lg:'Change over 1 month', lv:[1, 5], sp:[5, 25] },
    { k:'wow',  b:'1 week', lg:'Change over 1 week', lv:[0.5, 2], sp:[2, 10] }
  ];
  var TAIL = {
    levels:'Base: May 2026 = 100, regional indexes October 19, 2026 = 100. Year to date runs from the first publication of 2026 or, for a younger index, from its first publication. A dashed cell is a component not priced separately.',
    spot:'Spot price: the median list price across the models in each index, in its own unit and currency; its change also reflects models arriving and leaving. A dashed cell is a component not priced separately.' };
  var STEP = 6000, BY = {}, view = 'levels', per = 0, auto = true, timer = null, t0 = 0, paused = false, seen = true;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"]/g, function(c){ return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]; }); }
  function num(v){ return v == null || v === '' || isNaN(+v) ? null : +v; }
  function r1(v){ return Math.round(Math.abs(v) * 10) / 10; }
  function scale(){ return view === 'levels' ? PER[per].lv : PER[per].sp; }
  function heat(v){
    if(v == null) return 'rgba(255,255,255,.03)';
    var big = scale()[1];
    if(r1(v) === 0) return 'rgba(' + FL + ',.16)';
    return 'rgba(' + (v > 0 ? UP : DN) + ',' + (Math.min(Math.abs(v) / big, 1) * 0.55 + 0.08).toFixed(2) + ')';
  }
  function dir(v){ return v == null ? '' : r1(v) === 0 ? 'fl' : v > 0 ? 'up' : 'dn'; }
  function pct(v){ return v == null ? 'New' : r1(v).toFixed(1) + '%'; }
  function name(code){ var p = code.split(' '); return (N[p[0]] || p[0]) + (p[1] === 'EUR' ? ', euros' : p[1] === 'CNY' ? ', yuan' : ''); }
  function leg(i, k){ return view === 'levels' ? i.legs[k] : i.spot[k]; }
  function chg(L){ return L ? num(L[PER[per].k]) : null; }

  function cell(code, i, k){
    var L = leg(i, k);
    if(!L) return '<span class="as-hm-c as-hm-e"></span>';
    var v = chg(L), d = dir(v);
    var main = view === 'levels' ? L.level.toFixed(1) : (SYM[i.cur] || '') + L.median.toFixed(6);
    return '<span class="as-hm-c as-hm-q" data-c="' + code + '" data-k="' + k + '" style="background:' + heat(v) + '"><span class="as-hm-l">' + main + '</span>'
      + '<span class="as-hm-p">' + (d ? '<i class="as-hm-a ' + d + '"></i>' : '') + '<b>' + pct(v) + '</b></span></span>';
  }
  function block(fams){
    var h = '<div class="as-hm"><div class="as-hm-r as-hm-h"><span></span><span></span>' + LEGS.map(function(l){ return '<span class="as-th" style="text-align: center">' + l[1] + '</span>'; }).join('') + '</div>';
    fams.forEach(function(f){
      var rows = f[1].filter(function(c){ return BY[c]; });
      if(!rows.length) return;
      h += '<div class="as-lbl as-hm-f">' + f[0] + '</div>' + rows.map(function(c){ var i = BY[c];
        return '<div class="as-hm-r"><span class="as-code">' + c + '</span><span class="as-hm-n">' + name(c) + '<span class="as-hm-u">' + esc(i.unit) + '</span></span>'
          + LEGS.map(function(l){ return cell(c, i, l[0]); }).join('') + '</div>'; }).join('');
    });
    return h + '</div>';
  }
  function key(){
    var s = scale(), small = s[0], big = s[1], f = function(v){ return String(v).replace(/\.0$/, ''); };
    function sw(v, label, d){ return '<span class="as-hm-sw" style="background:' + heat(v) + '"></span><span><i class="as-hm-a ' + d + '"></i>' + label + '</span>'; }
    return '<span class="as-hm-k">'
      + sw(-big, f(big) + '% or more', 'dn') + sw(-small, f(small) + '%', 'dn') + sw(0, 'Unchanged', 'fl')
      + sw(small, f(small) + '%', 'up') + sw(big, f(big) + '% or more', 'up') + '</span>';
  }
  function legend(){ return '<div class="as-hm-lg"><span class="as-hm-kt" aria-live="polite">' + PER[per].lg + '<i class="as-hm-pg"></i></span>' + key() + '</div>'; }

  function draw(){
    var hm = document.getElementById('hpHm'); if(!hm) return;
    hm.innerHTML = legend() + '<div class="as-hm-g">' + block(FAM.slice(0, 3)) + block(FAM.slice(3)) + '</div>';
    note();
  }
  function note(){
    var n = document.getElementById('hpHmNote'); if(!n) return;
    n.setAttribute('data-fn-tail', TAIL[view]);
    if(AS.footnote) AS.footnote('published').then(function(t){ n.textContent = t + ' ' + TAIL[view]; }).catch(function(){});
  }

  /* A period change updates the board in place: each cell crossfades to its new colour, its
     figure counts to the new value and briefly lights up or down, row by row, like a quote board. */
  function count(el, from, to, sign){
    if(reduce || from == null || to == null){ el.textContent = pct(to); return; }
    var a = Math.abs(from), b = Math.abs(to), s = performance.now();
    (function f(t){ var p = Math.min(1, (t - s) / 450), e = 1 - Math.pow(1 - p, 3);
      el.textContent = (Math.round((a + (b - a) * e) * 10) / 10).toFixed(1) + '%'; if(p < 1) requestAnimationFrame(f); else el.textContent = pct(to); })(s);
  }
  function update(){
    var hm = document.getElementById('hpHm'); if(!hm) return;
    var lg = hm.querySelector('.as-hm-k'); if(lg) lg.outerHTML = key();
    var kt = hm.querySelector('.as-hm-kt'); if(kt && kt.firstChild) kt.firstChild.nodeValue = PER[per].lg;
    var rows = [].slice.call(hm.querySelectorAll('.as-hm-r'));
    hm.querySelectorAll('.as-hm-q').forEach(function(c){
      var i = BY[c.getAttribute('data-c')], L = i && leg(i, c.getAttribute('data-k')); if(!L) return;
      var v = chg(L), d = dir(v), p = c.querySelector('.as-hm-p'), b = p.querySelector('b'), a = p.querySelector('.as-hm-a');
      var old = b._v === undefined ? null : b._v; b._v = v;
      var delay = reduce ? 0 : rows.indexOf(c.parentNode) * 18;
      setTimeout(function(){
        c.style.background = heat(v);
        if(d){ if(!a){ a = document.createElement('i'); p.insertBefore(a, b); } a.className = 'as-hm-a ' + d; } else if(a){ a.remove(); }
        count(b, old, v);
        if(!reduce && d && d !== 'fl'){ c.classList.remove('fx-up', 'fx-dn'); void c.offsetWidth; c.classList.add(d === 'up' ? 'fx-up' : 'fx-dn'); }
      }, delay);
    });
  }
  function seed(){ document.querySelectorAll('#hpHm .as-hm-q').forEach(function(c){ var i = BY[c.getAttribute('data-c')], L = i && leg(i, c.getAttribute('data-k')); var b = c.querySelector('.as-hm-p b'); if(b) b._v = chg(L); }); }

  function go(n){ per = (n + PER.length) % PER.length; update(); t0 = performance.now(); }
  function stop(){ auto = false; if(timer){ cancelAnimationFrame(timer); timer = null; } var hm = document.getElementById('hpHm'); if(hm) hm.classList.add('as-hm-man'); }
  function loop(){
    if(!auto) return;
    timer = requestAnimationFrame(function(t){
      var hm = document.getElementById('hpHm');
      if(paused || !seen || document.hidden){ t0 = t - (hm && hm._el || 0); loop(); return; }
      var el = t - t0; if(hm) hm._el = el;
      var bar = hm && hm.querySelector('.as-hm-kt .as-hm-pg'); if(bar) bar.style.transform = 'scaleX(' + Math.min(1, el / STEP).toFixed(3) + ')';
      if(el >= STEP){ if(bar) bar.style.transform = 'scaleX(0)'; go(per + 1); }
      loop();
    });
  }
  function view_(v){
    view = v;
    var hm = document.getElementById('hpHm'); if(hm) hm.classList.toggle('as-hm-sp', v === 'spot');
    document.querySelectorAll('#hpHmTabs .as-vt-b').forEach(function(b){ var on = b.getAttribute('data-v') === v; b.setAttribute('aria-selected', on ? 'true' : 'false'); b.tabIndex = on ? 0 : -1; b.style.cssText = on ? 'color: var(--l1); background: var(--surface-chip)' : ''; });
    draw(); seed(); t0 = performance.now();
  }

  function all(path, off, acc){ off = off || 0; acc = acc || [];
    return AS.rest(path + '&limit=1000&offset=' + off).then(function(r){ acc = acc.concat(r || []); return r && r.length === 1000 ? all(path, off + 1000, acc) : acc; }); }

  function build(rows, reg, gate){
    var cur = {}; reg.forEach(function(r){ cur[r.index_code] = r.currency || 'USD'; });
    var by = {}; rows.forEach(function(r){ (by[r.index_code] = by[r.index_code] || []).push(r); });
    Object.keys(by).forEach(function(code){
      var rs = by[code].filter(function(r){ return r.date <= gate; }).sort(function(a, b){ return a.date < b.date ? -1 : 1; });
      if(!rs.length) return;
      var last = rs[rs.length - 1], glb = / GLB$/.test(code), short = code.replace(/^AIPI /, '');
      if(last.date !== gate) return;
      var y26 = rs.filter(function(r){ return r.date >= '2026-01-01'; });
      var i = { unit:last.unit || '', cur:cur[code] || 'USD', legs:{}, spot:{} };
      LEGS.forEach(function(l){
        var k = l[0], f = k + '_price', v = num(last[f]);
        if(v > 0){
          var base;
          if(glb){ var may = rs.filter(function(r){ return r.date.slice(0, 7) === '2026-05' && num(r[f]) > 0; }); base = may.length ? may.reduce(function(a, r){ return a + num(r[f]); }, 0) / may.length : null; }
          else { var f0 = rs.filter(function(r){ return num(r[f]) > 0; })[0]; base = f0 ? num(f0[f]) : null; }
          if(base){ var lv = v / base * 100; i.legs[k] = { level:lv, base:lv - 100, wow:num(last[k + '_wow']), mom:num(last[k + '_mom']), ytd:num(last[k + '_ytd']) }; }
        }
        var sp = num(last['spot_' + k + '_price']);
        if(sp > 0){
          var s0 = y26.filter(function(r){ return num(r['spot_' + k + '_price']) > 0; })[0], sy = s0 && s0 !== last ? (sp / num(s0['spot_' + k + '_price']) - 1) * 100 : null;
          i.spot[k] = { median:sp, base:num(last['spot_' + k + '_vs_base']), wow:num(last['spot_' + k + '_wow']), mom:num(last['spot_' + k + '_mom']), ytd:sy };
        }
      });
      BY[short] = i;
    });
  }

  function start(){
    var tabs = document.getElementById('hpHmTabs'), hm = document.getElementById('hpHm'); if(!tabs || !hm || !AS.rest) return;
    tabs.addEventListener('click', function(e){ var b = e.target.closest('.as-vt-b'); if(b) view_(b.getAttribute('data-v')); });
    hm.addEventListener('mouseenter', function(){ paused = true; }); hm.addEventListener('mouseleave', function(){ paused = false; });
    hm.addEventListener('focusin', function(){ paused = true; }); hm.addEventListener('focusout', function(){ paused = false; });
    if(window.IntersectionObserver) new IntersectionObserver(function(es){ seen = es[0].isIntersecting; }, { threshold:0.25 }).observe(hm);
    var cols = 'index_code,date,unit,input_price,cached_price,output_price,input_wow,input_mom,input_ytd,cached_wow,cached_mom,cached_ytd,output_wow,output_mom,output_ytd,'
      + 'spot_input_price,spot_cached_price,spot_output_price,spot_input_wow,spot_input_mom,spot_input_vs_base,spot_cached_wow,spot_cached_mom,spot_cached_vs_base,spot_output_wow,spot_output_mom,spot_output_vs_base';
    Promise.all([all('/index_values?select=' + cols + '&date=gte.2026-01-01&order=date.asc,index_code.asc'), AS.rest('/index_registry?select=index_code,currency'), AS.activeDate])
      .then(function(r){ build(r[0], r[1], String(r[2]).slice(0, 10)); draw(); seed(); if(reduce){ stop(); } else { t0 = performance.now(); loop(); } })
      .catch(function(e){ console.error('Attic Standard index table unavailable:', e); });
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();

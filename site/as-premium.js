/* TERMINAL (/premium). The subscriber dashboards, moved out of the page embeds into the shared
   library on November 24, 2026 and rebuilt on the site system (styles in as-premium.css):
     Masthead    TERMINAL beside the wordmark; no ticker band on this page (November 25, 2026).
     Pins        the pinned indexes open the page: level, change on the week and line for each.
     Switch      the site toggle, Indexes, Models and Contracts, between two rules; held under the
                 site header while the page scrolls.
     Indexes     one page per index (rebuilt November 25, 2026): baskets, composition, behavior,
                 one tile per leg, the chart, and the week's models on every leg down to each
                 vendor's price, from one signed-in call (terminal_index_detail).
     Contracts   every contract under the Clause: settled value and legs, terms, the monthly bill
                 (the same chart as the Clause page), the index and settled level, the history and
                 the rate card.
     Models      every model sold by two or more vendors: market median and every vendor's price,
                 the model profile, the price by week, the vendor table.
   Every chart is drawn on the shared chart frame (AS.chart, as-fluid.js) with the legend above it
   (site rule C) and no names or values inside the plot. Every dashboard ends on the standard source
   line. Reads with the signed-in session from as-premium-gate.js (window.atomAuthReady). */
(function(){
'use strict';
var AS = window.AS = window.AS || {};
var MN = ['January','February','March','April','May','June','July','August','September','October','November','December'];
var sb = null, GATE = null, ROOT = null;

function $(id){ return document.getElementById(id); }
function esc(s){ return s == null ? '' : String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function ldate(d){ var p = String(d).slice(0,10).split('-'); return MN[+p[1]-1]+' '+(+p[2])+', '+p[0]; }
function sdate(d){ var p = String(d).slice(0,10).split('-'); return MN[+p[1]-1].slice(0,3)+' '+(+p[2])+', '+p[0]; }
function mdate(d){ var p = String(d).slice(0,10).split('-'); return MN[+p[1]-1]+' '+(+p[2]); }
function mname(ym){ return MN[+ym.slice(5,7)-1]+' '+ym.slice(0,4); }
function utc(d){ var p = String(d).slice(0,10).split('-'); return Date.UTC(+p[0], +p[1]-1, +(p[2]||1)); }
function iso(t){ return new Date(t).toISOString().slice(0,10); }
function monday(t){ var d = new Date(t); while(d.getUTCDay() !== 1) d.setUTCDate(d.getUTCDate()+1); return d.getTime(); }
function addM(m, n){ var y = +m.slice(0,4), k = +m.slice(5,7)-1+n; y += Math.floor(k/12); k = ((k%12)+12)%12; return y+'-'+String(k+1).padStart(2,'0'); }
function med(a){ a = a.slice().sort(function(x,y){ return x-y; }); var n = a.length; if(!n) return null; var m = Math.floor(n/2); return n%2 ? a[m] : (a[m-1]+a[m])/2; }
function q(p){ return p.then(function(r){ if(r.error) throw r.error; return r.data || []; }); }
function all(make){ var out = [], N = 1000; function go(o){ return q(make().range(o, o+N-1)).then(function(r){ out = out.concat(r); return r.length === N ? go(o+N) : out; }); } return go(0); }
function int(n){ return Math.round(Number(n)).toLocaleString('en-US'); }
/* A change as the site writes it: coloured arrow and size, amber square when nothing moved. */
function chg(p, dp){ dp = dp == null ? 1 : dp; if(p == null || isNaN(p)) return ''; if(Math.abs(p) < 0.5*Math.pow(10,-dp)) return '<span class="tp-fl">&#9644; '+(0).toFixed(dp)+'%</span>';
  return '<span class="'+(p < 0 ? 'tp-dn' : 'tp-up')+'">'+(p < 0 ? '&#9660; ' : '&#9650; ')+Math.abs(p).toFixed(dp)+'%</span>'; }
function flash(b, t){ var o = b.textContent; b.textContent = t; setTimeout(function(){ b.textContent = o; }, 1600); }
function copy(b, t){ (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(function(){ flash(b, 'Copied'); }).catch(function(){ window.prompt('Copy the citation', t); }); }
/* Public copy counts Microsoft's Azure services as one vendor. */
function vgroup(n){ return /azure/i.test(n || '') ? 'Microsoft Azure' : n; }
var CHANNEL = { 'Inference Platform':'Inference platform', 'Model Developer':'Model developer', 'Cloud Marketplace':'Cloud marketplace', 'Neocloud':'Neocloud',
  'Inference platforms':'Inference platform', 'Model developers':'Model developer', 'Cloud marketplaces':'Cloud marketplace', 'Neoclouds':'Neocloud' };
function channel(t){ return CHANNEL[t] || (t ? String(t).charAt(0).toUpperCase()+String(t).slice(1).toLowerCase() : ''); }
function mark(){ var m = document.querySelector('#atomHeader svg.as-mark'); return m ? m.outerHTML.replace('class="as-mark"', '') : ''; }
function waiting(el){ el.className = 'tp-wait'; el.innerHTML = mark()+'<i></i>'; el.setAttribute('role','status'); el.setAttribute('aria-label','Loading'); el.hidden = false; }
function message(el, t){ el.className = 'tp-msg'; el.removeAttribute('role'); el.textContent = t; el.hidden = false; }
function C(){ return AS.chart; }
/* Chart text on the shared frame: size 10 is drawn at the 11px axis size by as-fluid.js. */
function T(x, y, s, cls, anchor){ return C().text(x, y, s, { cls:cls || 'as-f-l4', anchor:anchor, size:10 }); }
/* A scale of round steps for the y axis. */
function ticks(lo, hi, n){ var raw = (hi-lo)/(n||4), mag = Math.pow(10, Math.floor(Math.log10(raw))), r = raw/mag, st = (r < 1.5 ? 1 : r < 3 ? 2 : r < 7 ? 5 : 10)*mag, out = [];
  for(var v = Math.ceil(lo/st)*st; v <= hi + st*1e-9; v += st) out.push(+v.toPrecision(12)); return out; }
/* Hover on a chart drawn by AS.chart.mount: the box records each week's place as a share of the
   frame width when it draws, so the hover line and tooltip follow it at any width. */
function hover(wrap, box, tipFor){
  var hv = wrap.querySelector('.tp-hv'), tip = wrap.querySelector('.tp-tip');
  wrap.addEventListener('mousemove', function(e){
    var G = box._geo; if(!G || !G.pts.length) return;
    var r = box.getBoundingClientRect(), f = (e.clientX - r.left)/r.width, best = null, bd = 1e9;
    G.pts.forEach(function(p){ var d = Math.abs(p.f - f); if(d < bd){ bd = d; best = p; } });
    if(!best) return;
    var lx = best.f*r.width; hv.hidden = false; hv.style.left = lx+'px'; hv.style.height = (G.axis*r.height)+'px';
    tip.innerHTML = tipFor(best); tip.hidden = false;
    var w = tip.offsetWidth, left = lx + 12; if(left + w > r.width) left = lx - w - 12; tip.style.left = Math.max(0, left)+'px';
  });
  wrap.addEventListener('mouseleave', function(){ hv.hidden = true; tip.hidden = true; });
}
function mount(box, draw){ var c = C(); if(c && c.mount) c.mount(box, draw); else if(c) box.innerHTML = draw(); }

/* ═══ SHELL ═══ */
var DASH = [
  { key:'indexes', label:'Indexes', el:'tpIndexes' },
  { key:'models', label:'Models', el:'tpPricing' },
  { key:'contracts', label:'Contracts', el:'tpContracts' }];
var ALIAS = { clause:'contracts', value:'models', pricing:'models', index:'indexes' };
var cur = null, started = {};

function shell(){
  var h = '<div class="tp" id="atomTP">'
  + '<h1 class="tp-vh">Terminal</h1>'
  + '<div class="tp-bar" id="tpBar"><div class="as-vt" role="tablist" aria-label="Terminal dashboards" id="tpTabs"></div></div>'
  + indexesHTML() + pricingHTML() + contractsHTML() + '</div>';
  var d = document.createElement('div'); d.innerHTML = h; ROOT = d.firstChild;
  document.body.insertBefore(ROOT, document.body.firstChild);
  var row = $('tpTabs');
  row.innerHTML = DASH.map(function(t){ return '<button type="button" class="as-vt-b" role="tab" data-k="'+t.key+'" aria-controls="'+t.el+'" aria-selected="false" tabindex="-1">'+t.label+'</button>'; }).join('');
  row.addEventListener('click', function(e){ var b = e.target.closest('[data-k]'); if(b) show(b.dataset.k, true); });
  row.addEventListener('keydown', function(e){
    if(e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return; e.preventDefault();
    var i = DASH.findIndex(function(t){ return t.key === cur; }), n = DASH[(i + (e.key === 'ArrowRight' ? 1 : DASH.length - 1)) % DASH.length];
    show(n.key, true); row.querySelector('[data-k="'+n.key+'"]').focus();
  });
  window.addEventListener('scroll', place, { passive:true }); window.addEventListener('resize', place);
  /* The site header shrinks a moment after the page starts to scroll; follow its size as well, so
     the switch always sits flush under it. */
  var hd = $('atomHeader'); if(hd){ hd.addEventListener('transitionend', place); if(window.ResizeObserver) new ResizeObserver(place).observe(hd); }
  window.addEventListener('hashchange', function(){ var k = key(location.hash.slice(1)); if(k && k !== cur) show(k, false); });
  waiting($('ixMsg')); waiting($('csMsg')); waiting($('moMsg'));
  place();
  show(key(location.hash.slice(1)) || DASH[0].key, false);
}
function key(h){ h = ALIAS[h] || h; return DASH.some(function(t){ return t.key === h; }) ? h : null; }
/* The switch sits just under the site header, whose height changes once the page scrolls; the
   lists on the left sit just under the switch. */
var tick = false;
function place(){ if(tick) return; tick = true; requestAnimationFrame(function(){ tick = false;
  var hd = $('atomHeader'), hb = hd ? Math.max(0, Math.round(hd.getBoundingClientRect().bottom)) : 102, bar = $('tpBar');
  ROOT.style.setProperty('--tp-bar', hb+'px'); ROOT.style.setProperty('--tp-top', (hb + (bar ? bar.offsetHeight : 56) + 24)+'px');
  if(bar) bar.classList.toggle('stuck', bar.getBoundingClientRect().top <= hb + 1 && window.pageYOffset > 0); }); }
function show(k, push){
  var was = cur; cur = k;
  DASH.forEach(function(t){ var on = t.key === k; $(t.el).hidden = !on;
    var b = $('tpTabs').querySelector('[data-k="'+t.key+'"]'); b.setAttribute('aria-selected', on ? 'true' : 'false'); b.tabIndex = on ? 0 : -1; });
  if(push && history.replaceState) history.replaceState(null, '', '#'+k);
  if(was && was !== k){ var bar = $('tpBar'), y = window.pageYOffset + bar.getBoundingClientRect().top - (parseInt(ROOT.style.getPropertyValue('--tp-bar'), 10) || 102); if(window.pageYOffset > y) window.scrollTo(0, Math.max(0, y)); }
  if(!started[k]){ started[k] = true; (k === 'contracts' ? CS : k === 'models' ? MO : IX).start(); }
  place();
}
/* The masthead says where you are: a rule after the wordmark, then TERMINAL in the same lettering.
   The Terminal has no ticker band; the pinned indexes take its place. */
function masthead(){
  var m = document.querySelector('#atomHeader .as-mast'), a = m && m.querySelector('.atom-logo');
  if(!a || m.querySelector('.tp-mk')) return;
  a.insertAdjacentHTML('afterend', '<span class="tp-mk-d" aria-hidden="true"></span><a class="tp-mk" href="/premium">Terminal</a>');
  document.documentElement.classList.add('tp-page');
}

/* ═══ INDEXES ═══ */
/* One page per index, read top to bottom (rebuilt November 25, 2026, from the TermIx-D journey):
     Selector     Family, Index and Market, as on the public Indexes page.
     Header       code, name, question, and the two baskets as the public page counts them: all
                  models, and the caching cohort (the models with a cached input price).
     Profile      composition by vendor type and index behavior, as on the public page, with the
                  selected leg lit in the behavior rows.
     Legs         Index level or Spot price, All models or Caching cohort; one tile per leg, which is
                  also the leg selector, each with its own line.
     Chart        the selected leg over its history; the last 14 weeks carry model detail.
     The week     every model in the basket that week, each leg in its own block of columns
                  (median, change on the week, effect on the index), grouped by what it did: moved the
                  index, repriced with no effect, joined, no change, left, not admitted. A model opens
                  to every vendor's price on every leg, in the same columns.
   One signed-in call per index (terminal_index_detail), kept in memory; an index is fetched ahead when
   the pointer rests on it. While a new index loads the current one stays in place, dimmed. */
function indexesHTML(){
  return '<section class="tp-dash" id="tpIndexes" role="tabpanel" aria-label="Indexes" hidden>'
  + '<section class="tp-pins" id="tpPins" aria-label="Pinned indexes" hidden><div class="tp-bh"><p class="tp-lbl">Pinned indexes</p><span class="tp-bn" id="tpPinN"></span></div>'
  + '<div class="tp-pc" id="tpPc"></div><div class="tp-ppk" id="tpPick" hidden></div></section>'
  + '<div class="tp-sel" id="ixSel"><span class="tp-lbl">Family</span><div class="as-vt" id="ixFam" role="group" aria-label="Family"></div>'
  + '<span class="tp-lbl">Index</span><div class="as-vt" id="ixSeg" role="group" aria-label="Index"></div>'
  + '<span class="tp-lbl">Market</span><div class="as-vt" id="ixMkt" role="group" aria-label="Market"></div></div>'
  + '<div id="ixMsg"></div><div class="tp-ix" id="ixBody" hidden><div class="tp-prog" id="ixProg" hidden></div>'
  + '<div class="tp-ixh"><div class="tp-ixt"><p class="tp-code" id="ixCode"></p><h2 class="tp-h" id="ixName"></h2></div><div class="tp-cg" id="ixCg"></div></div>'
  + '<section class="tp-blk" id="ixComp"><div class="tp-bh"><p class="tp-lbl">Index composition by vendor type</p><span class="tp-bn">Share of SKUs in the index</span></div><div class="tp-ck" id="ixCk"></div><div class="tp-cb" id="ixCb"></div></section>'
  + '<section class="tp-blk" id="ixBehS"><div class="tp-bh"><p class="tp-lbl">Index behavior</p><span class="tp-bn">Structure now, behavior over 13 weeks &middot; bar shows the range across all indexes</span></div><div class="tp-b4" id="ixB4"></div></section>'
  + '<section class="tp-blk tp-lgs" id="ixLegsS"><div class="tp-ctl"><div class="as-vt" id="ixMode" role="group" aria-label="Measure"><button type="button" class="as-vt-b" data-m="lv">Index level</button><button type="button" class="as-vt-b" data-m="sp">Spot price</button></div>'
  + '<div class="as-vt" id="ixBk" role="group" aria-label="Basket"><button type="button" class="as-vt-b" data-b="all">All models</button><button type="button" class="as-vt-b" data-b="coh">Caching cohort</button></div><span class="tp-bn" id="ixCtlN"></span></div>'
  + '<div class="tp-tiles" id="ixTiles" role="group" aria-label="Price leg"></div>'
  + '<div class="tp-chw"><div class="as-lgv" id="ixLg"></div><div class="tp-ch" id="ixChW"><div id="ixCh"></div><div class="tp-hv" hidden></div><div class="tp-tip" hidden></div></div></div></section>'
  + '<section class="tp-wk" id="ixWk"><div class="tp-wkh"><button type="button" class="tp-stp" id="ixPrev" aria-label="Previous week"><svg viewBox="0 0 12 12" aria-hidden="true"><path d="M7.5 2.5 4 6l3.5 3.5"></path></svg></button>'
  + '<h3 class="tp-st" id="ixWkT"></h3><button type="button" class="tp-stp" id="ixNext" aria-label="Next week"><svg viewBox="0 0 12 12" aria-hidden="true"><path d="M4.5 2.5 8 6 4.5 9.5"></path></svg></button></div>'
  + '<div class="tp-tw tp-ltw"><table class="tp-tbl tp-lt" id="ixT"></table></div></section>'
  + '<div class="tp-foot"><p class="as-note" id="ixSrc"></p><div class="tp-ln"><button class="tp-link" id="ixCite" type="button">Copy citation</button><a class="tp-link" id="ixPub" href="/indexes">Open on the Indexes page &rarr;</a><a class="tp-link" href="/methodology">Read the methodology &rarr;</a></div></div>'
  + '</div></section>';
}

/* The index list, shared by the pinned cards and the Indexes view: one signed-in call. */
var LIST = null;
function list(){ if(!LIST) LIST = sb ? sb.rpc('terminal_index_list').then(function(r){ if(r.error) throw r.error; return r.data || []; }) : Promise.reject(new Error('Not signed in')); return LIST; }

var SEG = { TXT:'Text', MML:'Multimodal', IMG:'Image', IMP:'Image by area', VID:'Video', VDC:'Video by clip', AUD:'Speech to text', VOC:'Text to speech',
  EMB:'Embeddings', DEV:'Model developers', CLD:'Cloud marketplaces', PLT:'Inference platforms', NCL:'Neoclouds', FLG:'Flagship', COR:'Core',
  CMP:'Compact', PRP:'Unpublished weights', OSS:'Published weights', OWC:'Restricted weights', USA:'United States', CHN:'China', RSN:'Reasoning', COD:'Coding' };
var MKT = { GLB:'Global', EUR:'Europe', CNY:'China' };
function ixName(c){ var p = c.split(' '), s = SEG[p[1]] || p[1]; return s+(p[2] !== 'GLB' ? ', '+(MKT[p[2]] || p[2]) : ''); }
/* ═══ PINNED INDEXES ═══ */
/* The first row of the Indexes view: up to five indexes a subscriber follows. Each card carries the
   code, the name, what the index tracks, and every leg it has with its level and change on the week.
   An x unpins a card; while fewer than five are pinned, a dashed card opens a picker grouped by family.
   Pins are kept in this browser. */
var PINS = (function(){
  var DEF = ['AIPI FLG GLB', 'AIPI TXT GLB', 'AIPI MML GLB', 'AIPI PLT GLB'], MAX = 5, BY = {}, L = [], on = null, pick = false;
  var FAMO = ['Modality', 'Channel', 'Tier', 'License', 'Origin', 'Use case'], LK = [['input', 'Input'], ['cached', 'Cached'], ['output', 'Output']];
  function get(){ var p = null; try{ p = JSON.parse(localStorage.getItem('atPins') || 'null'); }catch(e){} return (Array.isArray(p) ? p : DEF).filter(function(c){ return BY[c]; }).slice(0, MAX); }
  function put(p){ try{ localStorage.setItem('atPins', JSON.stringify(p)); }catch(e){} }
  function short(c){ var p = c.split(' '); return p[1]+(p[2] !== 'GLB' ? ' '+p[2] : ''); }
  function card(c){ var x = BY[c], lv = x.lv || {}, sel = c === on, nm = ixName(c);
    return '<div class="tp-pcd'+(sel ? ' on' : '')+'" role="button" tabindex="0" data-pin="'+esc(c)+'" aria-pressed="'+sel+'">'
      + '<button type="button" class="tp-unpin" data-unpin="'+esc(c)+'" aria-label="Unpin '+esc(nm)+'"><svg viewBox="0 0 12 12" aria-hidden="true"><path d="M3 3l6 6M9 3l-6 6"></path></svg></button>'
      + '<p class="tp-code">'+esc(c)+'</p><p class="tp-pn">'+esc(nm)+'</p><p class="tp-pd">'+esc(x.desc || '')+'</p>'
      + '<div class="tp-plg">'+LK.filter(function(k){ return lv[k[0]]; }).map(function(k){ var v = lv[k[0]];
          return '<span class="tp-pk">'+k[1]+'</span><b>'+Number(v[0]).toFixed(2)+'</b>'+(chg(v[1] == null ? null : Number(v[1]), 2) || '<span></span>'); }).join('')+'</div></div>'; }
  function draw(){
    var el = $('tpPc'); if(!el) return; var P = get(), full = P.length >= MAX; if(full) pick = false;
    $('tpPinN').textContent = P.length+' of '+MAX;
    el.innerHTML = P.map(card).join('') + (full ? '' : '<button type="button" class="tp-padd'+(pick ? ' on' : '')+'" data-open="1" aria-expanded="'+pick+'" aria-controls="tpPick">+ Pin an index</button>');
    var k = $('tpPick'); k.hidden = !pick; if(!pick){ k.innerHTML = ''; return; }
    var fams = FAMO.filter(function(f){ return L.some(function(x){ return x.fam === f; }); });
    L.forEach(function(x){ if(fams.indexOf(x.fam) < 0) fams.push(x.fam); });
    k.innerHTML = '<div class="tp-bh"><p class="tp-lbl">Pin an index</p><span class="tp-bn">Up to five. Pinned indexes stay in this browser.</span><button type="button" class="tp-link" data-close="1">Close</button></div>'
      + '<div class="tp-ppg">'+fams.map(function(f){ return '<div class="tp-ppf"><p class="tp-lbl">'+esc(f)+'</p>'
        + L.filter(function(x){ return x.fam === f; }).map(function(x){ var pn = P.indexOf(x.code) > -1;
            return '<button type="button" class="tp-ppi"'+(pn ? ' disabled' : ' data-add="'+esc(x.code)+'"')+'><span class="tp-cd2">'+esc(short(x.code))+'</span><span>'+esc(ixName(x.code))+'</span><span class="tp-pin2">'+(pn ? 'Pinned' : '')+'</span></button>'; }).join('')
        + '</div>'; }).join('')+'</div>';
  }
  function go(c){ show('indexes', true); IX.pick(c); }
  function start(){
    var el = $('tpPc'), box = $('tpPins'); if(!el || !sb) return;
    list().then(function(R){ L = R; R.forEach(function(x){ BY[x.code] = x; }); box.hidden = false; draw(); }).catch(function(){ box.hidden = true; });
    box.addEventListener('click', function(e){
      var u = e.target.closest('[data-unpin]'); if(u){ e.stopPropagation(); put(get().filter(function(c){ return c !== u.dataset.unpin; })); draw(); return; }
      if(e.target.closest('[data-open]')){ pick = !pick; draw(); return; }
      if(e.target.closest('[data-close]')){ pick = false; draw(); return; }
      var a = e.target.closest('[data-add]'); if(a){ var p = get(); if(p.length < MAX && p.indexOf(a.dataset.add) < 0) p.push(a.dataset.add); put(p); pick = false; draw(); return; }
      var c = e.target.closest('[data-pin]'); if(c) go(c.dataset.pin); });
    el.addEventListener('keydown', function(e){ if(e.key !== 'Enter' && e.key !== ' ') return; var c = e.target.closest('[data-pin]'); if(!c || e.target.closest('[data-unpin]')) return; e.preventDefault(); go(c.dataset.pin); });
  }
  function mark(c){ on = c; draw(); }
  return { start:start, mark:mark };
})();

var IX = (function(){
  var MKO = ['GLB','EUR','CNY'], FAMO = ['Modality','Channel','Tier','License','Origin','Use case'];
  var NM = { input:'Input', cached:'Cached input', output:'Output', cin:'Input', cout:'Output' };
  var ROW = { input:'input', cin:'input', cached:'cached', output:'output', cout:'output' };
  var SW = { input:{ coh:'cin', all:'input' }, cin:{ coh:'cin', all:'input' }, output:{ coh:'cout', all:'output' }, cout:{ coh:'cout', all:'output' }, cached:{ coh:'cached', all:'output' } };
  var CH3 = { Mod:'Model developer', Clo:'Cloud marketplace', Inf:'Inference platform', Neo:'Neocloud' };
  var VT = { 'Inference Platforms':'Inference platforms', 'Neocloud':'Neoclouds', 'Neoclouds':'Neoclouds', 'Model Developers':'Model developers', 'Cloud Marketplaces':'Cloud marketplaces' };
  var SH = ['#E3E3E3', '#A8ADB5', '#71767E', '#454A52'];
  var SYM = { USD:'$', EUR:'€', CNY:'¥' };
  var RULE = { 'R2-SUPER':'Superseded', 'R3-SERVE':'Serving variant', 'R4-VARIANT':'Variant', 'R5-DERIV':'Third-party derivative', 'R7-LINEUP':'Not in the lineup',
    'R8-TASK':'Task-specific', 'R11-QUANT':'Quantized copy', 'R12-ALIAS':'Alias', 'R13-METER':'Metering band', 'R14-SIZE':'Sibling size', 'R16-UNVERIFIED':'Unverified',
    'R17-NOHOME':'No index home', 'R18-NOTAMODEL':'Not a model', 'R20-PROCESS':'Processing tool', 'R21-TASK':'Task-specific', 'R6-CURRENT':'Current model', 'R19-PRODUCT':'Priced product' };
  var BEH = [['Price Dispersion', 'Gap between the 25th and 75th percentile, as a multiple of the median price', 0, '×'],
    ['Vendor Concentration', 'Share of this index’s SKUs held by its largest single vendor', 1, '%'],
    ['Repricing Incidence', 'Share of SKUs priced now and 12 weeks ago that made a lasting price change', 2, '%'],
    ['Index Volatility', 'Standard deviation of the index’s weekly change, trailing 12 weeks', 3, '%']];
  var L = [], BY = {}, cur = null, D = null, reqN = 0, cache = {}, inflight = {}, famLast = {};
  var S = { bk:'all', leg:'output', mode:'lv', K:null, open:null, all:false };

  function seg(c){ return c.split(' ')[1]; }
  function mkt(c){ return c.split(' ')[2]; }
  function sym(){ return SYM[(D && D.cur) || (BY[cur] || {}).cur] || '$'; }
  function fx(v){ v = Number(v); if(!(v > 0)) return '0'; if(v >= 1) return v.toFixed(v >= 100 ? 2 : 4); var d = Math.max(6, Math.ceil(-Math.log10(v))+1); return v.toFixed(Math.min(d, 10)); }
  function px(v){ return v == null ? '' : sym()+fx(v); }
  function eff(v){ return (v < -1e-9 ? '&minus;' : v > 1e-9 ? '+' : '')+Math.abs(v).toFixed(2)+'%'; }
  function vt(items, on){ return items.map(function(it){ return '<button type="button" class="as-vt-b" data-k="'+esc(it[0])+'" aria-selected="'+(it[0] === on)+'">'+it[1]+'</button>'; }).join(''); }
  function cd(s){ return ' <span class="tp-cd">'+esc(s)+'</span>'; }
  function at(pts, k){ var p = null; pts.forEach(function(x){ if(x[0] <= k) p = x[1]; }); return p; }

  /* ── Selector ── */
  function selector(){
    var x = BY[cur], f = x.fam, sg = seg(cur), mk = mkt(cur);
    var fams = FAMO.filter(function(k){ return L.some(function(i){ return i.fam === k; }); });
    L.forEach(function(i){ if(fams.indexOf(i.fam) < 0) fams.push(i.fam); });
    $('ixFam').innerHTML = vt(fams.map(function(k){ return [k, esc(k)]; }), f);
    var segs = []; L.forEach(function(i){ if(i.fam === f && segs.indexOf(seg(i.code)) < 0) segs.push(seg(i.code)); });
    $('ixSeg').innerHTML = vt(segs.map(function(s){ return [s, esc(SEG[s] || s)+cd(s)]; }), sg);
    var mks = MKO.filter(function(m){ return BY['AIPI '+sg+' '+m] && BY['AIPI '+sg+' '+m].fam === f; });
    $('ixMkt').innerHTML = vt(mks.map(function(m){ return [m, MKT[m]+cd(m)]; }), mk);
  }
  function pickCode(c){ if(!BY[c] || c === cur) return; cur = c; famLast[BY[c].fam] = c; try{ localStorage.setItem('atIxCode', c); }catch(e){} selector(); PINS.mark(c); load(); }

  /* ── Data ── */
  function fetch(c){
    if(cache[c]) return Promise.resolve(cache[c]); if(inflight[c]) return inflight[c];
    inflight[c] = sb.rpc('terminal_index_detail', { p_code:c }).then(function(r){ delete inflight[c]; if(r.error) throw r.error; if(!r.data) throw new Error('No data'); cache[c] = prep(r.data); return cache[c]; },
      function(e){ delete inflight[c]; throw e; });
    return inflight[c];
  }
  function prefetch(c){ if(sb && BY[c]) fetch(c).catch(function(){}); }
  /* Each leg's series; each leg's model detail by week (the cohort's input and output are the models
     with a cached price that week); every vendor's price by model and leg. */
  function prep(d){
    var LG = {}, ser = d.ser || {};
    ['input','output','cached','cin','cout'].forEach(function(k){ var a = ser[k]; if(!a || !a.length) return;
      var A = a.map(function(r){ return { d:r[0], l:Number(r[1]), w:r[2] == null ? null : Number(r[2]), s:r[3] == null ? null : Number(r[3]), a:r[4] == null ? null : Number(r[4]), b:r[5] == null ? null : Number(r[5]) }; });
      var I = {}; A.forEach(function(s, i){ I[s.d] = i; }); LG[k] = { S:A, I:I }; });
    /* Every published week can be opened: the weeks are the longest leg's series. */
    var W = [], WI = {};
    Object.keys(LG).forEach(function(k){ if(LG[k].S.length > W.length) W = LG[k].S.map(function(x){ return x.d; }); });
    W = W.filter(function(x){ return !d.date || x <= d.date; }); W.forEach(function(x, i){ WI[x] = i; });
    d.LG = LG; d.W = W; d.WI = WI; d.WK = {};
    d.all = ['input','output'].filter(function(k){ return LG[k]; }); if(!d.all.length && LG.cached) d.all = ['cached'];
    d.coh = LG.cached && LG.cin && LG.cout && LG.input && LG.output ? ['cin','cached','cout'] : [];
    return d;
  }
  /* One week's model detail, built at each publish and stored (terminal_index_week); kept in memory. */
  function prepWeek(x){
    var att = x.att || {}, ds = [x.pd, x.d].filter(Boolean), E = {}, V = {};
    ['input','output','cached','cin','cout'].forEach(function(k){ var src = att[k === 'cin' ? 'input' : k === 'cout' ? 'output' : k] || {}, out = {};
      ds.forEach(function(dd){ var e = src[dd] || [];
        if(k === 'cin' || k === 'cout'){ var C = {}; ((att.cached || {})[dd] || []).forEach(function(r){ C[r[0]] = 1; }); e = e.filter(function(r){ return C[r[0]]; }); }
        out[dd] = e.map(function(r){ return { a:r[0], v:r[1], lr:r[2] == null ? null : Number(r[2]) }; }); });
      E[k] = out; });
    ['input','output','cached'].forEach(function(k){ var s = (x.vend || {})[k], M = {};
      if(s) s.split('|').forEach(function(r){ var i = r.indexOf('>'), a = r.slice(0, i), b = r.slice(i+1).split('~'); if(b.length < 3) return;
        (M[a] = M[a] || []).push({ v:vgroup(b[0]), t:CH3[b[1]] || b[1], pts:b[2].split(',').map(function(p){ var q = p.split(':'); return [Number(q[0]), q[1] === 'x' ? null : Number(q[1])]; }) }); });
      V[k] = M; });
    return { d:x.d, pd:x.pd || null, E:E, V:V, names:x.names || {}, adm:x.adm || [] };
  }
  function getWeek(c, d){ var o = cache[c]; if(!o) return Promise.reject(new Error('No index'));
    if(!o.WK[d]) o.WK[d] = sb.rpc('terminal_index_week', { p_code:c, p_date:d }).then(function(r){ if(r.error) throw r.error; return r.data ? prepWeek(r.data) : null; })
      .catch(function(e){ delete o.WK[d]; throw e; });
    return o.WK[d]; }
  function legs(){ return S.bk === 'coh' && D.coh.length ? D.coh : D.all; }
  function fixLeg(){ if(S.bk === 'coh' && !D.coh.length) S.bk = 'all'; var ls = legs(); if(ls.indexOf(S.leg) < 0){ var m = SW[S.leg] && SW[S.leg][S.bk]; S.leg = ls.indexOf(m) > -1 ? m : ls[ls.length-1]; } }
  function defWeek(){ var W = D.W, G = D.LG[S.leg]; S.K = W.length - 1;
    for(var i = W.length-1; i >= 0; i--){ var j = G && G.I[W[i]], s = j != null ? G.S[j] : null; if(s && s.w != null && Math.abs(s.w) >= 0.005){ S.K = i; break; } } }
  function load(){
    var c = cur, my = ++reqN, first = !D;
    if(first) waiting($('ixMsg')); else { $('ixBody').classList.add('busy'); $('ixProg').hidden = false; }
    fetch(c).then(function(d){ if(my !== reqN) return; D = d; fixLeg(); defWeek(); S.open = null; S.all = false;
      render(); $('ixMsg').hidden = true; $('ixBody').hidden = false; done(); })
    .catch(function(e){ if(my !== reqN) return; console.error('[Indexes]', e); done();
      if(first) message($('ixMsg'), 'This index could not be loaded. Refresh the page, or log in again if the problem persists.');
      else { $('ixProg').hidden = true; flash($('ixName'), 'Could not load '+c); } });
    function done(){ $('ixBody').classList.remove('busy'); $('ixProg').hidden = true; }
  }

  /* ── Header, composition, behavior ── */
  function render(){ head(); comp(); beh(); controls(); tiles(); chart(); week(); foot(); }
  function chips(t, v, m, b, k){ return '<span class="tp-cgl"><span class="tp-lbl">'+t+'</span><span class="tp-np"><b>'+int(v)+'</b> vendors</span><span class="tp-np"><b>'+int(m)+'</b> models'+(b ? ' ('+int(b)+' at base)' : '')+'</span><span class="tp-np"><b>'+int(k)+'</b> SKUs</span></span>'; }
  function head(){
    var n = D.n || {};
    $('ixCode').textContent = cur; $('ixName').textContent = ixName(cur);
    $('ixCg').innerHTML = (n.models != null ? chips('All models', n.vendors, n.models, n.base, n.skus) : '')
      + (D.coh.length && n.cmodels ? '<span class="tp-cgd" aria-hidden="true"></span>'+chips('Caching cohort', n.cvendors, n.cmodels, n.cbase, n.cskus) : '');
    $('ixPub').href = '/indexes?index='+cur.toLowerCase().replace(/\s+/g, '-')+'#atom-index-card';
  }
  function comp(){
    var C = (D.comp || []).slice().sort(function(a, b){ return b.share_pct - a.share_pct; });
    $('ixComp').hidden = !C.length;
    $('ixCk').innerHTML = C.map(function(c, i){ return '<span><i style="background:'+SH[Math.min(i, 3)]+'"></i>'+esc(VT[c.vendor_type] || c.vendor_type)+' <b>'+Number(c.share_pct).toFixed(1)+'%</b> <em>'+int(c.skus)+' SKUs, '+int(c.vendors)+' vendors</em></span>'; }).join('');
    $('ixCb').innerHTML = C.map(function(c, i){ return '<i style="flex:'+c.share_pct+';background:'+SH[Math.min(i, 3)]+'"></i>'; }).join('');
  }
  function beh(){
    var B = D.beh || {}, R = B.rows || {}, G = B.range || [], on = ROW[S.leg], ks = ['input','cached','output'].filter(function(k){ return R[k]; });
    $('ixBehS').hidden = !ks.length;
    $('ixB4').innerHTML = BEH.map(function(m){ var lo = Number(G[m[2]*2]), hi = Number(G[m[2]*2+1]), f = function(v){ return Number(v).toFixed(2)+m[3]; };
      return '<div><h4>'+m[0]+'</h4><p class="tp-bd">'+m[1]+'</p><div class="tp-bl">'+ks.map(function(k){ var v = Number(R[k][m[2]]), w = hi > lo ? Math.max(1.5, (v-lo)/(hi-lo)*100) : 1.5, o = k === on;
        return '<span class="k'+(o ? ' on' : '')+'">'+({ input:'Input', cached:'Cached', output:'Output' })[k]+'</span><b'+(o ? ' class="on"' : '')+'>'+f(v)+'</b><span class="t'+(o ? ' on' : '')+'"><i style="width:'+w.toFixed(1)+'%"></i></span>'; }).join('')
        + '</div><p class="tp-sc"><span>'+f(lo)+'</span><span>'+f(hi)+'</span></p></div>'; }).join('');
  }

  /* ── Legs: the switches and one tile per leg ── */
  function controls(){
    $('ixMode').querySelectorAll('[data-m]').forEach(function(b){ b.setAttribute('aria-selected', String(b.dataset.m === S.mode)); });
    $('ixBk').hidden = !D.coh.length; $('ixBk').querySelectorAll('[data-b]').forEach(function(b){ b.setAttribute('aria-selected', String(b.dataset.b === S.bk)); });
    $('ixCtlN').textContent = S.mode === 'lv' ? 'Base May 2026 = 100' : 'Median price, '+(D.unit || '');
  }
  function c1(v){ return v == null || isNaN(v) ? '' : chg(Number(v), 1); }
  function tiles(){
    var ls = legs(), lv = S.mode === 'lv', P = D.spot || {};
    $('ixTiles').className = 'tp-tiles n'+ls.length;
    $('ixTiles').innerHTML = ls.map(function(k){ var G = D.LG[k], A = G.S, l = A[A.length-1], m = A[Math.max(0, A.length-5)], on = k === S.leg, sp = P[k] || [];
      var ch = lv ? [['1 week', l.w], ['1 month', A.length > 4 ? (l.l/m.l-1)*100 : null], ['Since base', l.l-100]] : [['1 week', sp[0]], ['1 month', sp[1]], ['Since base', sp[2]]];
      return '<button type="button" class="tp-leg'+(on ? ' on' : '')+'" data-leg="'+k+'" aria-pressed="'+on+'"><span class="tp-lbl">'+NM[k]+'</span>'
        + '<span class="tp-lv">'+(lv ? l.l.toFixed(2) : px(l.s))+'</span><span class="tp-c3">'+ch.map(function(c){ return '<span><span class="tp-lbl">'+c[0]+'</span>'+c1(c[1])+'</span>'; }).join('')+'</span>'
        + (lv ? '' : '<span class="tp-ls">25th to 75th percentile '+px(l.a)+' to '+px(l.b)+'</span>')+'</button>'; }).join('');
  }

  /* ── Chart: the selected leg; weeks with model detail marked; select one ── */
  function chart(){
    var G = D.LG[S.leg], A = G.S, lv = S.mode === 'lv', box = $('ixCh'), bn = S.bk === 'coh' ? 'caching cohort' : 'all models', l = A[A.length-1];
    var lg = lv ? [{ k:'line', c:'var(--series)', n:NM[S.leg]+' index level, '+bn, v:l.l.toFixed(2) }, { k:'dash', c:'var(--l5)', n:'Base, May 2026 = 100' }]
                : [{ k:'line', c:'var(--series)', n:NM[S.leg]+' spot price, the median, '+bn, v:px(l.s) }, { k:'bar', c:'rgba(198,203,211,.3)', n:'25th to 75th percentile' }];
    lg.push({ k:'thin', c:'var(--l1)', n:'Selected week' });
    C().legend($('ixLg'), lg);
    if(A.length < 2){ box._geo = null; box.innerHTML = '<p class="tp-note tp-empty">Published for one week so far.</p>'; return; }
    mount(box, function(){
      var ch = C(), AX = ch.axis(iso(utc(A[0].d) - 14*864e5), A[A.length-1].d), vals = [];
      A.forEach(function(s){ if(lv) vals.push(s.l); else { if(s.s != null) vals.push(s.s); if(s.a != null) vals.push(s.a); if(s.b != null) vals.push(s.b); } });
      var lo = Math.min.apply(null, vals), hi = Math.max.apply(null, vals), pad = (hi-lo)*0.12 || Math.abs(hi)*0.1 || 1; lo -= pad; hi += pad; if(!lv) lo = Math.max(0, lo);
      var tk = ticks(lo, hi, 4), Y = ch.y(lo, hi), g = [], st = tk.length > 1 ? tk[1]-tk[0] : 1, dp = lv ? 0 : Math.max(0, -Math.floor(Math.log10(st)));
      tk.forEach(function(v){ if(v < lo || v > hi) return; g.push(ch.rule(Y(v), { cls:'as-s-grid' })); g.push(T(ch.X0, Y(v)-4, lv ? v.toFixed(0) : sym()+v.toFixed(dp))); });
      if(lv && 100 >= lo && 100 <= hi) g.push('<line x1="'+ch.X0+'" x2="'+ch.X1+'" y1="'+Y(100).toFixed(1)+'" y2="'+Y(100).toFixed(1)+'" class="as-s-axis" stroke-dasharray="4 4"></line>');
      if(!lv){ var up = A.filter(function(s){ return s.a != null && s.b != null; });
        if(up.length > 1) g.push('<polygon points="'+up.map(function(s){ return AX.x(s.d).toFixed(1)+','+Y(s.b).toFixed(1); }).concat(up.slice().reverse().map(function(s){ return AX.x(s.d).toFixed(1)+','+Y(s.a).toFixed(1); })).join(' ')+'" style="fill:rgba(198,203,211,.12)"></polygon>'); }
      var P = A.filter(function(s){ return (lv ? s.l : s.s) != null; });
      g.push('<polyline points="'+P.map(function(s){ return AX.x(s.d).toFixed(1)+','+Y(lv ? s.l : s.s).toFixed(1); }).join(' ')+'" class="as-s-series" style="fill:none;stroke-width:2;stroke-linejoin:round"></polyline>');
      var sel = D.W[S.K];
      var si = G.I[sel]; if(si != null){ var ss = A[si], sv = lv ? ss.l : ss.s, sx = AX.x(sel);
        g.push('<line x1="'+sx.toFixed(1)+'" x2="'+sx.toFixed(1)+'" y1="'+ch.PT+'" y2="'+ch.TA+'" style="stroke:var(--l1)"></line>');
        if(sv != null) g.push('<circle cx="'+sx.toFixed(1)+'" cy="'+Y(sv).toFixed(1)+'" r="5" style="fill:var(--l1);stroke:var(--bg);stroke-width:2"></circle>'); }
      g.push(AX.svg());
      box._geo = { axis:ch.TA/ch.H, pts:A.map(function(s){ return { f:AX.x(s.d)/ch.W, w:s }; }) };
      return ch.svg(g.join(''), ixName(cur)+', '+NM[S.leg].toLowerCase()+' '+(lv ? 'index level' : 'spot price')+', '+bn);
    });
  }
  function pickWeek(d){ var i = D.WI[d]; if(i == null || i === S.K) return; S.K = i; S.open = null; S.all = false; chart(); week(); }

  /* ── The week ── */
  var wkN = 0;
  function week(){
    var K = S.K, d = D.W[K], c = cur, my = ++wkN;
    $('ixWkT').textContent = d ? 'Week of '+ldate(d) : '';
    $('ixPrev').disabled = K <= 0; $('ixNext').disabled = K >= D.W.length-1;
    if(!d){ $('ixT').innerHTML = ''; return; }
    var o = cache[c] && cache[c].WK[d], t = $('ixT');
    if(!o || !o.done) t.classList.add('busy');
    /* Stepping quickly through weeks fetches only the one it settles on. */
    (o ? Promise.resolve() : new Promise(function(r){ setTimeout(r, 140); })).then(function(){ if(my !== wkN) return null; return getWeek(c, d); }).then(function(X){ if(my !== wkN) return; if(cache[c] && cache[c].WK[d]) cache[c].WK[d].done = true; t.classList.remove('busy');
      if(!X){ t.className = 'tp-tbl tp-lt'; t.innerHTML = '<tbody><tr><td class="d">No model detail is stored for this week.</td></tr></tbody>'; return; }
      weekDraw(X); })
    .catch(function(e){ if(my !== wkN) return; console.error('[Indexes week]', e); t.classList.remove('busy'); t.className = 'tp-tbl tp-lt'; t.innerHTML = '<tbody><tr><td class="d">This week could not be loaded. Try again.</td></tr></tbody>'; });
  }
  /* In a stored week, prices sit at 0 (the week before) and 1 (this week). */
  function pv(pts, k){ for(var i = 0; i < pts.length; i++) if(pts[i][0] === k) return pts[i][1]; return null; }
  function weekDraw(X){
    var K = S.K, d = X.d, LS = legs(), lv = S.mode === 'lv', cur2 = S.leg, R = {}, prevAny = {}, curAny = {}, IDX = {}, HP = !!X.pd;
    LS.forEach(function(g){
      var G = D.LG[g], s = G.S[G.I[d]] || {}, pd = X.pd, prev = pd ? X.E[g][pd] : null, inPrev = {}, sum = 0, VS = X.V[g === 'cin' ? 'input' : g === 'cout' ? 'output' : g] || {};
      if(prev) prev.forEach(function(e){ inPrev[e.a] = 1; prevAny[e.a] = 1; });
      var E = X.E[g][d] || [];
      E.forEach(function(e){ if(e.lr != null) sum += e.lr; curAny[e.a] = 1; });
      IDX[g] = s;
      E.forEach(function(e){
        var vs = (VS[e.a] || []).map(function(v){ return { v:v, p:pv(v.pts, 1), p0:HP ? pv(v.pts, 0) : null }; }).filter(function(x){ return x.p != null; });
        var ps = vs.map(function(x){ return x.p; }), r = R[e.a] || (R[e.a] = { a:e.a, L:{} });
        r.L[g] = { v:e.v, n:vs.length, vs:vs, md:med(ps), chg:e.lr == null ? null : (Math.exp(e.lr)-1)*100,
          ef:e.lr == null || s.w == null || Math.abs(sum) < 1e-9 ? 0 : s.w*e.lr/sum, isNew:!!prev && !inPrev[e.a],
          rep:vs.some(function(x){ return x.p0 != null && Math.abs(x.p/x.p0-1) > 0.005; }) };
      });
    });
    function nm(a){ var n = X.names[a]; return n ? n[0] : a; }
    function dev(a){ var n = X.names[a]; return n ? n[1] || '' : ''; }
    var rows = Object.keys(R).map(function(a){ var r = R[a], vn = {};
      LS.forEach(function(g){ if(r.L[g]) r.L[g].vs.forEach(function(x){ vn[x.v.v] = 1; }); });
      r.nv = Object.keys(vn).length; r.isNew = HP && !prevAny[a]; r.nm = nm(a); r.dev = dev(a);
      r.mx = Math.max.apply(null, LS.map(function(g){ return r.L[g] ? Math.abs(r.L[g].ef) : 0; }));
      r.moved = r.mx >= 0.005; r.rep = LS.some(function(g){ return r.L[g] && r.L[g].rep; }); return r; });
    var N = 3 + LS.length*3;
    function cl(g, i, base){ return (base || '')+(i === 0 ? ' g0' : '')+(g === cur2 ? ' on' : ' off'); }
    var h = '<thead><tr class="tp-hg"><th colspan="3" class="tp-hg0"></th>'+LS.map(function(g){ return '<th colspan="3" class="r g0'+(g === cur2 ? ' on' : ' off')+'">'+NM[g]+'</th>'; }).join('')+'</tr>'
      + '<tr><th>Model</th><th class="tp-dev">Developer</th><th class="r tp-vnc">Vendors</th>'+LS.map(function(g){ return '<th class="'+cl(g, 0, 'r')+'">Median</th><th class="'+cl(g, 1, 'r')+'">1 week</th><th class="'+cl(g, 2, 'r')+'">'+(lv ? 'Effect' : 'Vs spot')+'</th>'; }).join('')+'</tr></thead><tbody>';
    h += '<tr class="tp-ixr"><td>'+esc(ixName(cur))+(lv ? ' index level' : ' spot price')+'</td><td class="tp-dev d">'+(lv ? 'Base May 2026 = 100' : 'Median of every SKU')+'</td><td class="tp-vnc"></td>'
      + LS.map(function(g){ var s = IDX[g], G = D.LG[g], i = G.I[d], p = i > 0 ? G.S[i-1] : null, w = lv ? s.w : (p && p.s && s.s ? (s.s/p.s-1)*100 : null);
        return '<td class="'+cl(g, 0, 'r')+'"><b>'+(s.l == null ? '' : lv ? s.l.toFixed(2) : px(s.s))+'</b></td><td class="'+cl(g, 1, 'r')+'">'+(w == null ? '' : chg(w, lv ? 2 : 1))+'</td><td class="'+cl(g, 2, '')+'"></td>'; }).join('')+'</tr>';
    function cell(r, g){ var x = r.L[g];
      if(!x || !x.n) return '<td class="'+cl(g, 0, 'r')+' d">Not priced</td><td class="'+cl(g, 1, 'r')+'"></td><td class="'+cl(g, 2, 'r')+'"></td>';
      var s = IDX[g], dv = s.s ? (x.md/s.s-1)*100 : null, sig = Math.abs(x.ef) >= 0.005;
      var w = x.chg == null ? (x.isNew ? '<span class="d">New</span>' : '') : (Math.abs(x.chg) < 0.05 ? '' : chg(x.chg, 1));
      var e = lv ? (sig ? '<span class="'+(x.ef < 0 ? 'tp-dn' : 'tp-up')+'">'+eff(x.ef)+'</span>' : (r.moved ? '<span class="d">'+eff(0)+'</span>' : ''))
                 : (dv == null ? '' : '<span class="d">'+(Math.abs(dv) < 0.05 ? 'At spot' : Math.abs(dv).toFixed(1)+'% '+(dv > 0 ? 'above' : 'below'))+'</span>');
      return '<td class="'+cl(g, 0, 'r')+' w">'+px(x.md)+'</td><td class="'+cl(g, 1, 'r')+'">'+w+'</td><td class="'+cl(g, 2, 'r')+'">'+e+'</td>'; }
    function vrows(r){
      var V = {}, keys = [];
      LS.forEach(function(g){ if(r.L[g]) r.L[g].vs.forEach(function(q){ var k = q.v.v+'|'+q.v.t; if(!V[k]){ V[k] = { v:q.v.v, t:q.v.t, P:{} }; keys.push(k); } V[k].P[g] = q; }); });
      var out = keys.map(function(k){ var z = V[k]; z.sp = z.P[cur2] ? z.P[cur2].p : 1e9; z.isNew = HP && LS.every(function(g){ return !z.P[g] || z.P[g].p0 == null; }); return z; })
        .sort(function(a, b){ return a.sp - b.sp || a.v.localeCompare(b.v); });
      return out.map(function(z){ return '<tr class="tp-vr"><td><span class="tp-vn">'+esc(z.v)+(z.isNew ? '<span class="tp-nw">New</span>' : '')+'</span></td><td class="tp-dev d">'+esc(z.t)+'</td><td class="tp-vnc"></td>'
        + LS.map(function(g){ var q = z.P[g], c = q && q.p0 != null && Math.abs(q.p/q.p0-1) > 0.005 ? chg((q.p/q.p0-1)*100, 1) : '';
          return '<td class="'+cl(g, 0, 'r')+'">'+(q ? px(q.p) : '')+'</td><td class="'+cl(g, 1, 'r')+'">'+c+'</td><td class="'+cl(g, 2, '')+'"></td>'; }).join('')+'</tr>'; }).join('')
        + (r.nv >= 2 ? '<tr class="tp-vr tp-vgo"><td colspan="'+N+'"><button class="tp-link" type="button" data-go="'+esc(r.a)+'">Open '+esc(r.nm)+' in Models &rarr;</button></td></tr>' : '');
    }
    function mrow(r){ var o = S.open === r.a;
      return '<tr class="pick'+(o ? ' sel' : '')+'" tabindex="0" data-a="'+esc(r.a)+'" aria-expanded="'+o+'"><td><svg class="tp-chev'+(o ? ' open' : '')+'" viewBox="0 0 12 12" aria-hidden="true"><path d="M4.5 2.5 8 6 4.5 9.5"></path></svg>'+esc(r.nm)+(r.isNew ? '<span class="tp-nw">New</span>' : '')+'</td>'
        + '<td class="tp-dev d">'+esc(r.dev)+'</td><td class="r tp-vnc">'+r.nv+'</td>'+LS.map(function(g){ return cell(r, g); }).join('')+'</tr>'+(o ? vrows(r) : ''); }
    function grp(t, n, note, rowsH, fold){ return '<tr class="tp-gr"><td colspan="'+N+'"><span class="tp-lbl">'+t+'</span><span class="c">'+n+'</span>'+(note ? '<span class="hn">'+note+'</span>' : '')+(fold || '')+'</td></tr>'+rowsH; }
    var w = X.d, lo = X.pd || '0000';
    function when(a){ return a.st === 'admitted' ? a.vt : a.vf || a.dt; }
    var adm = (X.adm || []).filter(function(a){ var x = when(a); return x && String(x).slice(0, 10) <= w && String(x).slice(0, 10) > lo; });
    var left = adm.filter(function(a){ return (a.st === 'admitted' && a.vt) || (a.st === 'excluded' && a.vf); }).map(function(a){ return { nm:a.nm, rule:RULE[a.rc] || '', why:clean(a.r) }; });
    Object.keys(prevAny).forEach(function(a){ if(!curAny[a] && !left.some(function(x){ return x.nm === nm(a); })) left.push({ nm:nm(a), rule:'', why:'Out of the basket from this week.' }); });
    var away = adm.filter(function(a){ return a.st === 'excluded' && !a.vf; }).map(function(a){ return { nm:a.nm, rule:RULE[a.rc] || '', why:clean(a.r) }; });
    function xrows(X){ return X.map(function(x){ return '<tr class="tp-xr"><td>'+esc(x.nm)+'</td><td colspan="'+(N-1)+'" class="tp-xw">'+(x.rule ? '<span class="tp-tag2">'+esc(x.rule)+'</span>' : '')+esc(x.why)+'</td></tr>'; }).join(''); }
    if(lv){
      var se = function(r){ return r.L[cur2] ? Math.abs(r.L[cur2].ef) : 0; }, by = function(a, b){ return se(b) - se(a) || b.mx - a.mx || b.nv - a.nv || a.nm.localeCompare(b.nm); };
      var mv = rows.filter(function(r){ return r.moved; }).sort(by), nw = rows.filter(function(r){ return !r.moved && r.isNew; }).sort(by);
      var rp = rows.filter(function(r){ return !r.moved && !r.isNew && r.rep; }).sort(by), ns = rows.filter(function(r){ return !r.moved && !r.isNew && !r.rep; }).sort(by);
      if(mv.length) h += grp('Moved the index', mv.length, '', mv.map(mrow).join(''));
      if(rp.length) h += grp('Repriced at a vendor, no effect on the level', rp.length, '', rp.map(mrow).join(''));
      if(nw.length) h += grp('Joined the basket', nw.length, '', nw.map(mrow).join(''));
      var keep = mv.length || rp.length || nw.length ? 0 : 6, all = S.all;
      if(ns.length) h += grp('No change', ns.length, 'no price change at any vendor, on any leg', (all ? ns : ns.slice(0, keep)).map(mrow).join(''),
        ns.length > keep ? '<button class="tp-link tp-fold" type="button" data-fold="1">'+(all ? 'Hide' : keep ? 'Show all '+ns.length : 'Show')+'</button>' : '');
    } else {
      var sm = function(r){ return r.L[cur2] ? r.L[cur2].md || -1 : -1; };
      h += grp('In the basket, by '+NM[cur2].toLowerCase()+' price', rows.length, '', rows.slice().sort(function(a, b){ return sm(b) - sm(a) || a.nm.localeCompare(b.nm); }).map(mrow).join(''));
    }
    if(left.length) h += grp('Left the basket', left.length, '', xrows(left));
    if(away.length) h += grp('Not admitted', away.length, '', xrows(away));
    $('ixT').className = 'tp-tbl tp-lt n'+LS.length;
    $('ixT').innerHTML = h+'</tbody>';
  }
  function clean(r){ r = String(r || '');
    r = r.replace(/\s*\([^)]*(AUDIT|sweep|previously)[^)]*\)/gi, '').replace(/;?\s*admitted elsewhere under R\d+[^.]*/gi, '');
    r = r.replace(/^Same (basis|treatment) as [^:]+:\s*/i, '').replace(/\s*Same (basis|treatment) as [^.]*\./gi, '');
    r = r.replace(/\s*Tracked in AIPI [A-Z]{3} [A-Z]{3}\.?/g, '').replace(/\s*\((?:[A-Z]\d+|R\d+[A-Z-]*)\)/g, '').replace(/\s*under R\d+[A-Z-]*/g, '');
    r = r.replace(/\b(\d{4})-(\d{2})-(\d{2})\b/g, function(x){ return ldate(x); });
    return r.trim(); }

  /* ── Close ── */
  function foot(){
    $('ixSrc').textContent = 'Source: Attic Standard, index levels, spot prices and vendor prices published '+ldate(D.date)+'. Figures update with each index publication. Unit: '+(sym() === '$' ? 'USD ' : sym() === '€' ? 'EUR ' : 'CNY ')+(D.unit || '')+'.';
  }
  function cite(b){ if(!D) return; var G = D.LG[S.leg], l = G.S[G.S.length-1];
    copy(b, 'Attic Standard, '+cur+' ('+ixName(cur)+'), '+NM[S.leg].toLowerCase()+' leg, '+(S.bk === 'coh' ? 'caching cohort' : 'all models')+', '+ldate(D.date)+': index level '+l.l.toFixed(2)+(l.s != null ? ', spot price '+sym()+fx(l.s)+' '+(D.unit || '') : '')+'. atticstandard.com'); }

  function pick(c){ if(!L.length){ try{ localStorage.setItem('atIxCode', c); }catch(e){} return; } pickCode(c); }
  function start(){
    waiting($('ixMsg'));
    function row(id, fn){ var el = $(id);
      el.addEventListener('click', function(e){ var b = e.target.closest('[data-k]'); if(b) fn(b.dataset.k); });
      el.addEventListener('pointerover', function(e){ var b = e.target.closest('[data-k]'); if(b && b._pf !== 1){ b._pf = 1; var c = target(id, b.dataset.k); if(c) prefetch(c); } }); }
    function target(id, k){ var x = BY[cur]; if(!x) return null;
      if(id === 'ixFam') return famLast[k] || (L.filter(function(i){ return i.fam === k; })[0] || {}).code;
      if(id === 'ixSeg'){ var c = 'AIPI '+k+' '+mkt(cur); return BY[c] ? c : (L.filter(function(i){ return seg(i.code) === k && i.fam === x.fam; })[0] || {}).code; }
      return 'AIPI '+seg(cur)+' '+k; }
    row('ixFam', function(k){ pickCode(target('ixFam', k)); });
    row('ixSeg', function(k){ pickCode(target('ixSeg', k)); });
    row('ixMkt', function(k){ pickCode(target('ixMkt', k)); });
    $('ixMode').addEventListener('click', function(e){ var b = e.target.closest('[data-m]'); if(!b || b.dataset.m === S.mode || !D) return; S.mode = b.dataset.m; S.open = null; S.all = false; controls(); tiles(); chart(); week(); });
    $('ixBk').addEventListener('click', function(e){ var b = e.target.closest('[data-b]'); if(!b || b.dataset.b === S.bk || !D) return; S.leg = SW[S.leg][b.dataset.b]; S.bk = b.dataset.b; fixLeg(); S.open = null; S.all = false; render(); });
    $('ixTiles').addEventListener('click', function(e){ var b = e.target.closest('[data-leg]'); if(!b || b.dataset.leg === S.leg) return; S.leg = b.dataset.leg; S.open = null; S.all = false; beh(); tiles(); chart(); week(); });
    $('ixPrev').addEventListener('click', function(){ if(D && S.K > 0) pickWeek(D.W[S.K-1]); });
    $('ixNext').addEventListener('click', function(){ if(D && S.K < D.W.length-1) pickWeek(D.W[S.K+1]); });
    hover($('ixChW'), $('ixCh'), function(p){ var s = p.w, lv = S.mode === 'lv', inW = D.WI[s.d] != null;
      return '<div class="t">Week of '+ldate(s.d)+'</div>'+NM[S.leg]+(lv ? ' index <b>'+s.l.toFixed(2)+'</b> '+(s.w == null ? '' : chg(s.w, 2)) : ' spot <b>'+px(s.s)+'</b>')
        +'<br><span class="t">'+(!inW ? '' : D.WI[s.d] === S.K ? 'Selected' : 'Select to see the models')+'</span>'; });
    $('ixChW').addEventListener('click', function(e){ var G = $('ixCh')._geo; if(!G) return; var r = $('ixCh').getBoundingClientRect(), f = (e.clientX - r.left)/r.width, best = null, bd = 1e9;
      G.pts.forEach(function(p){ var x = Math.abs(p.f - f); if(x < bd){ bd = x; best = p; } }); if(best) pickWeek(best.w.d); });
    $('ixChW').tabIndex = 0; $('ixChW').setAttribute('aria-label', 'Chart. Use the left and right arrow keys to choose a week.');
    $('ixChW').addEventListener('keydown', function(e){ if(!D || (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight')) return; e.preventDefault(); var n = D.W[S.K + (e.key === 'ArrowRight' ? 1 : -1)]; if(n) pickWeek(n); });
    function toggle(tr){ S.open = S.open === tr.dataset.a ? null : tr.dataset.a; week(); var n = $('ixT').querySelector('tr[data-a="'+tr.dataset.a+'"]'); if(n) n.focus({ preventScroll:true }); }
    $('ixT').addEventListener('click', function(e){
      var f = e.target.closest('[data-fold]'); if(f){ S.all = !S.all; week(); return; }
      var g = e.target.closest('[data-go]'); if(g){ try{ localStorage.setItem('atMoModel', g.dataset.go); }catch(x){} MO.open(g.dataset.go); show('models', true); return; }
      var tr = e.target.closest('tr[data-a]'); if(tr) toggle(tr); });
    $('ixT').addEventListener('keydown', function(e){ if(e.key !== 'Enter' && e.key !== ' ') return; var tr = e.target.closest('tr[data-a]'); if(!tr) return; e.preventDefault(); toggle(tr); });
    $('ixCite').addEventListener('click', function(){ cite(this); });
    if(!sb){ message($('ixMsg'), 'Indexes load once you are logged in.'); return; }
    list().then(function(R){
      L = R; if(!L.length){ message($('ixMsg'), 'No index is published yet.'); return; }
      L.forEach(function(i){ BY[i.code] = i; });
      var keep = null; try{ keep = localStorage.getItem('atIxCode'); }catch(e){}
      cur = BY[keep] ? keep : (BY['AIPI FLG GLB'] ? 'AIPI FLG GLB' : L[0].code); famLast[BY[cur].fam] = cur;
      selector(); PINS.mark(cur); load();
    }).catch(function(e){ console.error('[Indexes]', e); message($('ixMsg'), 'Indexes could not be loaded. Refresh the page, or log in again if the problem persists.'); });
  }
  function count(){ return L.length; }
  return { start:start, count:count, pick:pick };
})();

/* ═══ CONTRACTS ═══ */
function contractsHTML(){
  return '<section class="tp-dash" id="tpContracts" role="tabpanel" aria-label="Contracts" hidden><div class="tp-wrap">'
  + '<aside class="tp-rail"><label class="tp-lbl" for="csQ">Contracts</label>'
  + '<input class="tp-in" id="csQ" type="text" autocomplete="off" spellcheck="false" placeholder="Search contracts">'
  + '<div class="tp-list" id="csList" role="listbox" aria-label="Contracts"></div><p class="tp-note" id="csListNote"></p></aside>'
  + '<div class="tp-main"><div id="csMsg"></div><div id="csBody" hidden>'
  + '<div class="tp-top"><div><div class="tp-ttl"><h2 class="tp-h" id="csName"></h2><span class="tp-tag" id="csSim" hidden>Simulated</span></div><p class="tp-meta" id="csMeta"></p></div></div>'
  + '<div class="tp-hero"><div class="tp-hl2"><p class="tp-lbl" id="csValT"></p><div class="tp-bigrow"><div class="tp-big" id="csVal"></div><div class="tp-chg" id="csValChg"></div></div><div class="tp-legs" id="csLegs"></div></div>'
  + '<div class="tp-hr2"><p class="tp-lbl">Contract terms</p><dl class="tp-dl" id="csTerms"></dl><div class="tp-el" id="csEl"></div></div></div>'
  + '<div class="tp-notice" id="csNote" hidden></div>'
  + '<section class="tp-sec" id="csBillSec"><p class="tp-lbl">Monthly bill</p><p class="tp-note sub" id="csBillN"></p>'
  + '<div class="tp-chw"><div class="as-lgv" id="csBillLg"></div><div class="tp-ch"><div id="csBill"></div></div></div></section>'
  + '<section class="tp-sec"><div class="tp-sech"><div><p class="tp-lbl">Index and settled level</p><p class="tp-note sub" id="csLvN"></p></div><div class="as-vt" id="csSeg" role="group" aria-label="Leg"></div></div>'
  + '<div class="tp-chw"><div class="as-lgv" id="csLvLg"></div><div class="tp-ch" id="csLvW"><div id="csLv"></div><div class="tp-hv" hidden></div><div class="tp-tip" hidden></div></div></div></section>'
  + '<section class="tp-sec"><p class="tp-lbl">Settlement history</p><p class="tp-note sub">Settled level on each leg and the month’s value, newest first.</p>'
  + '<div class="tp-tw"><table class="tp-tbl"><thead id="csHiH"></thead><tbody id="csHi"></tbody></table></div></section>'
  + '<section class="tp-sec" id="csRcSec"><p class="tp-lbl" id="csRcT"></p><p class="tp-note sub">Settled rate per model and leg. Share is each model’s part of the signed commitment. Select a model to compare it with its market.</p>'
  + '<div class="tp-tw"><table class="tp-tbl"><thead id="csRcH"></thead><tbody id="csRc"></tbody></table></div></section>'
  + '<div class="tp-foot"><p class="as-note" id="csSrc"></p><div class="tp-ln"><button class="tp-link" id="csCite" type="button">Copy citation</button><a class="tp-link" href="/clause">How the Clause works &rarr;</a></div></div>'
  + '</div></div></div></section>';
}

var CS = (function(){
  var ORDER = ['input','cached','output'], LEG = { input:'Input', cached:'Cached input', output:'Output' }, FVD = { input:'Input', cached:'Cached Input', output:'Output' };
  var RULE = { monthly_average:'Monthly average', quarterly_in_advance:'Quarterly, in advance' }, LIMIT = { floor:'Floor', cap:'Cap', band:'Threshold' }, NEAR = 2;
  var L = [], c0 = null, reqN = 0, D = null, leg = null, open = null;
  function num(v){ return v == null ? null : Number(v); }
  function usd(v){ return '$'+Math.round(Math.abs(Number(v))).toLocaleString('en-US'); }
  function big(v){ v = Number(v); return v >= 1e6 && v%1e5 === 0 ? '$'+(v/1e6)+'M' : usd(v); }
  function rate(v){ return '$'+Number(v).toFixed(6); }
  function lv(v){ return Number(v).toFixed(2); }
  function chg2(d){ return chg(d, 2); }

  function rail(){
    var k = $('csQ').value.trim().toLowerCase();
    var R = L.filter(function(c){ return !k || (c.label+' '+c.index_code+' '+c.contract_id).toLowerCase().indexOf(k) > -1; });
    $('csList').innerHTML = R.map(function(c){ var n = c._settled != null ? 'month '+c._settled+' of '+c.term_months : c.term_months+' months';
      return '<button type="button" role="option" aria-selected="'+(c === c0)+'" class="tp-row tp-c'+(c === c0 ? ' on' : '')+'" data-id="'+esc(c.contract_id)+'"><span>'+esc(c.label)+'</span><span class="s"><span class="tp-code">'+esc(c.index_code)+'</span> &middot; '+n+'</span></button>'; }).join('')
      || '<p class="tp-note" style="padding:var(--s3) var(--s2)">No contract matches that search.</p>';
    var sim = L.filter(function(c){ return c.is_illustrative; }).length;
    $('csListNote').textContent = sim ? (sim === L.length ? 'Simulated contracts' : sim+' simulated contracts')+' follow the same settlement rules as signed ones.' : '';
  }
  function load(c){
    c0 = c; open = null; rail(); waiting($('csMsg')); $('csBody').hidden = true; var my = ++reqN;
    try{ localStorage.setItem('atCsContract', c.contract_id); }catch(e){}
    Promise.all([
      q(sb.from('v_clause_settlement').select('direction,share,month_no,ym,weeks,index_level,settled_level,fixed_usd,indexed_usd,limit_applied,provisional').eq('contract_id', c.contract_id).order('month_no')),
      q(sb.from('clause_contract_model').select('anchor_id,direction,signing_rate,unit,spend_share').eq('contract_id', c.contract_id)).catch(function(){ return []; }),
      q(sb.from('v_index_rebased').select('date,direction,level').eq('index_code', c.index_code).gte('date', c.base_period+'-01').lte('date', GATE).order('date')).catch(function(){ return []; })
    ]).then(function(r){ if(my !== reqN) return;
      var ids = {}; r[1].forEach(function(x){ if(x.anchor_id && x.anchor_id !== '*') ids[x.anchor_id] = 1; }); ids = Object.keys(ids);
      var more = ids.length ? Promise.all([
        q(sb.from('v_fair_value_models').select('anchor_id,model_name,display_name,creator,vendors').in('anchor_id', ids)),
        q(sb.from('v_fair_value').select('anchor_id,vendor_id,direction,price').in('anchor_id', ids).eq('gate_date', GATE).limit(5000))
      ]).catch(function(){ return [[],[]]; }) : Promise.resolve([[],[]]);
      return more.then(function(m){ if(my !== reqN) return; D = build(c, r[0], r[1], r[2], m[0], m[1]); c._settled = D.months.length; rail(); render(); });
    }).catch(function(e){ if(my !== reqN) return; console.error('[Contracts]', e); message($('csMsg'), 'The contract could not be loaded. Refresh the page, or log in again if the problem persists.'); });
  }
  /* Months with every leg settled, weekly levels rebased to the contract base, covered models with
     the latest market. A model row of * is the whole index and has no rate of its own. */
  function build(c, S, CM, WR, MD, FV){
    var legs = ORDER.filter(function(k){ return S.some(function(r){ return r.direction === k; }); });
    var byM = {}; S.forEach(function(r){ (byM[r.ym] = byM[r.ym] || { ym:r.ym, weeks:r.weeks, L:{} }).L[r.direction] = r; });
    var rows = Object.keys(byM).sort().map(function(k){ return byM[k]; });
    function done(m){ return legs.every(function(k){ var r = m.L[k]; return r && r.settled_level != null && !r.provisional; }); }
    function part(m){ return legs.some(function(k){ var r = m.L[k]; return r && r.settled_level != null; }); }
    var months = rows.filter(done), prov = rows.filter(function(m){ return !done(m) && part(m); })[0] || null;
    months.forEach(function(m){ m.fx = 0; m.ix = 0; legs.forEach(function(k){ m.fx += num(m.L[k].fixed_usd); m.ix += num(m.L[k].indexed_usd); }); });
    var W = {}; legs.forEach(function(k){
      var w = WR.filter(function(x){ return String(x.direction).toLowerCase() === k; }).map(function(x){ return { d:String(x.date).slice(0,10), v:Number(x.level) }; }).filter(function(x){ return !isNaN(x.v); });
      var b = w.filter(function(x){ return x.d.slice(0,7) === c.base_period; }), avg = b.length ? b.reduce(function(s, x){ return s + x.v; }, 0)/b.length : null;
      W[k] = avg ? w.map(function(x){ return { d:x.d, v:x.v/avg*100 }; }) : []; });
    var info = {}; MD.forEach(function(x){ info[x.anchor_id] = x; });
    var mk = {}; FV.forEach(function(x){ var k = x.anchor_id+'|'+x.direction, p = Number(x.price); if(!(p > 0)) return; var v = (mk[k] = mk[k] || {}); if(v[x.vendor_id] == null || p < v[x.vendor_id]) v[x.vendor_id] = p; });
    var mods = {}, unit = null;
    CM.forEach(function(x){ unit = unit || x.unit; if(!x.anchor_id || x.anchor_id === '*' || x.signing_rate == null) return;
      var m = mods[x.anchor_id] = mods[x.anchor_id] || { id:x.anchor_id, r:{}, share:0 };
      m.r[x.direction] = { signed:Number(x.signing_rate), share:Number(x.spend_share) || 0 }; m.share += Number(x.spend_share) || 0;
      var ps = mk[x.anchor_id+'|'+FVD[x.direction]]; ps = ps ? Object.keys(ps).map(function(v){ return ps[v]; }) : [];
      m.r[x.direction].mkt = ps.length ? { med:med(ps), lo:Math.min.apply(null, ps), hi:Math.max.apply(null, ps), n:ps.length } : null; });
    var M = Object.keys(mods).map(function(k){ var m = mods[k], i = info[k] || {}; m.name = i.display_name || i.model_name || k; m.dev = i.creator || ''; m.vendors = num(i.vendors) || 0; return m; })
      .sort(function(a, b){ return b.share - a.share || a.name.localeCompare(b.name); });
    return { c:c, legs:legs, months:months, prov:prov, W:W, M:M, unit:unit || 'per 1,000 tokens' };
  }
  function last(){ return D.months[D.months.length-1]; }
  function render(){
    var c = D.c, m = last(), fl = num(c.floor_level), cp = num(c.cap_level), th = num(c.threshold_pct);
    var startM = String(c.effective_date).slice(0,7), endM = addM(startM, c.term_months-1);
    if(!leg || D.legs.indexOf(leg) < 0) leg = D.legs[0];
    $('csName').textContent = c.label;
    $('csSim').hidden = !c.is_illustrative;
    $('csMeta').textContent = (m ? 'Settled through '+mname(m.ym) : 'Not yet settled')+' · USD '+D.unit;
    if(m){
      $('csValT').textContent = MN[+m.ym.slice(5,7)-1]+' settled value';
      $('csVal').textContent = usd(m.ix);
      $('csValChg').innerHTML = chg2((m.ix/m.fx-1)*100)+'<em>against '+usd(m.fx)+' signed</em>';
    } else { $('csValT').textContent = 'Settled value'; $('csVal').textContent = 'Not yet'; $('csValChg').innerHTML = '<em>The first month settles once its weeks are published.</em>'; }
    legRows();
    var T2 = [['Reference index', c.index_code === 'BLEND' ? 'A blend of three indexes' : '<a href="/indexes?index='+esc(String(c.index_code).toLowerCase().replace(/\s+/g,'-'))+'#atom-index-card"><span class="tp-code" style="color:inherit">'+esc(c.index_code)+'</span></a>'],
      ['Form', (c.form === 'differential' ? 'Differential' : 'Ratio')+(D.legs.length > 1 ? ', '+['','one','two','three'][D.legs.length]+' legs' : ', '+LEG[D.legs[0]].toLowerCase())],
      ['Base', esc(mname(c.base_period))+' = 100'], ['Settlement', esc(c.reset_months > 1 ? 'Quarterly, in advance' : (RULE[c.settlement_rule] || c.settlement_rule))],
      ['Floor and cap', fl != null && cp != null ? fl+' and '+cp : fl != null ? 'Floor '+fl : cp != null ? 'Cap '+cp : 'None'],
      ['Term', ldate(c.effective_date)+' to '+ldate(iso(utc(addM(endM,1)+'-01') - 864e5))],
      ['Commitment', c.annual_commitment_usd != null ? big(c.annual_commitment_usd)+' a year'+(c.terms && c.terms.commitment === 'minimum_spend' ? ', minimum spend' : '') : 'None']];
    if(th != null) T2.push(['Threshold', th+'% either side of base']);
    if(D.M.length) T2.push(['Models', String(D.M.length)]);
    T2.push(['Substitution', 'A successor keeps the rate']);
    $('csTerms').innerHTML = T2.map(function(t){ return '<div><dt>'+t[0]+'</dt><dd>'+t[1]+'</dd></div>'; }).join('');
    var s = D.months.length, cells = ''; for(var i = 0; i < c.term_months; i++) cells += '<i'+(i < s ? ' class="on"' : '')+'></i>';
    $('csEl').innerHTML = '<div class="h">Term elapsed<b>'+s+' of '+c.term_months+' months</b></div><div class="tp-cells">'+cells+'</div>';
    notice(); bill(); seg(); levels(); history(); card(); foot();
    $('csMsg').hidden = true; $('csBody').hidden = false;
  }
  function legRows(){
    var m = last(), fl = num(D.c.floor_level), cp = num(D.c.cap_level); if(!m){ $('csLegs').innerHTML = ''; return; }
    var lim = fl != null ? 'floor' : cp != null ? 'cap' : null;
    var h = '<div class="tp-lg tp-lgh"><span>Leg</span><span class="r">Level</span><span class="r">Vs base</span><span>'+(lim ? 'Room to '+lim : '')+'</span><span class="r">Value</span></div>';
    D.legs.forEach(function(k){ var r = m.L[k], v = num(r.settled_level), room = lim === 'floor' ? (v-fl)/v*100 : lim === 'cap' ? (cp-v)/v*100 : null;
      var bar = room != null ? '<svg width="72" height="6" viewBox="0 0 72 6" aria-hidden="true"><rect y="1" width="72" height="4" rx="2" fill="var(--border)"/><rect y="1" width="'+Math.max(3, Math.min(72, room/10*72)).toFixed(1)+'" height="4" rx="2" fill="var(--l4)"/></svg>'+room.toFixed(1)+'%' : '';
      h += '<button type="button" class="tp-lg tp-lgb'+(k === leg ? ' on' : '')+'" data-leg="'+k+'" aria-pressed="'+(k === leg)+'"><span>'+LEG[k]+(r.limit_applied ? '<span class="tp-flag">'+LIMIT[r.limit_applied]+'</span>' : '')+'</span><span class="r lv">'+lv(v)+'</span><span class="r">'+chg2(v-100)+'</span><span class="tp-rm">'+bar+'</span><span class="r vl">'+usd(r.indexed_usd)+'</span></button>'; });
    $('csLegs').innerHTML = h;
  }
  function pickLeg(k){ if(!k || k === leg) return; leg = k; legRows(); seg(); levels(); card(); }
  /* One line, only when a leg settled at its floor or cap, or within 2% of it. */
  function notice(){
    var m = last(), fl = num(D.c.floor_level), cp = num(D.c.cap_level), el = $('csNote'), h = '';
    if(m) D.legs.some(function(k){ var r = m.L[k], v = num(r.settled_level), w = D.W[k][D.W[k].length-1], t = '';
      if(r.limit_applied === 'floor' || r.limit_applied === 'cap') t = LEG[k]+' settled at its '+r.limit_applied+' in '+MN[+m.ym.slice(5,7)-1]+', '+lv(v)+' against an index average of '+lv(r.index_level)+'.';
      else if(fl != null && (v-fl)/v*100 < NEAR) t = LEG[k]+' settled '+((v-fl)/v*100).toFixed(1)+'% above its floor.';
      else if(cp != null && (cp-v)/v*100 < NEAR) t = LEG[k]+' settled '+((cp-v)/v*100).toFixed(1)+'% below its cap.';
      if(!t) return false;
      h = '<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="7" fill="none" stroke="currentColor" stroke-width="1.4"/><line x1="8" y1="4.5" x2="8" y2="9" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><circle cx="8" cy="11.5" r="0.9" fill="currentColor"/></svg><p>'+t+(w ? ' <span>The week of '+ldate(w.d)+' closed at '+lv(w.v)+'.</span>' : '')+'</p>';
      return true; });
    el.innerHTML = h; el.hidden = !h;
  }
  /* The monthly bill: the shared simulated contract chart, the same drawing as on the Clause page. */
  function bill(){
    var sec = $('csBillSec'), ac = C(); if(!D.months.length || !ac || !ac.contract){ sec.hidden = true; return; } sec.hidden = false;
    var c = D.c, single = D.legs.length === 1, li = -1, fx = D.months[0].fx;
    if(single) D.months.some(function(m, i){ var a = m.L[D.legs[0]].limit_applied; if(a === 'floor' || a === 'cap'){ li = i; return true; } return false; });
    var lim = li >= 0 ? D.months[li].L[D.legs[0]].limit_applied : null;
    var S = { fx:fx, months:D.months.map(function(m){ return m.ym; }), pay:D.months.map(function(m){ return m.ix; }),
      unl:li >= 0 ? D.months.map(function(m){ var r = m.L[D.legs[0]]; return r.limit_applied ? num(r.index_level) : null; }) : null, lim:lim,
      gate:GATE, from:MN[+D.months[0].ym.slice(5,7)-1], min:!!(c.terms && c.terms.commitment === 'minimum_spend') };
    var tot = D.months.reduce(function(a, m){ return a + (m.fx - m.ix); }, 0);
    $('csBillN').textContent = 'What the contract paid each month under the Clause, against the fixed price set at '+MN[+c.base_period.slice(5,7)-1]+' levels: '+(tot >= 0 ? usd(tot)+' less' : usd(tot)+' more')+' since '+S.from+'.';
    mount($('csBill'), function(){ var r = ac.contract(S); ac.legend($('csBillLg'), r.legend); return r.svg; });
  }
  function seg(){
    var s = $('csSeg'); s.hidden = D.legs.length < 2;
    s.innerHTML = D.legs.length > 1 ? D.legs.map(function(k){ return '<button type="button" class="as-vt-b" data-leg="'+k+'" aria-selected="'+(k === leg)+'">'+LEG[k]+'</button>'; }).join('') : '';
  }
  /* The weekly index on the contract base and the monthly settled level, floor and cap dashed. */
  function levels(){
    var c = D.c, W = D.W[leg] || [], st = D.months, fl = num(c.floor_level), cp = num(c.cap_level), base = c.base_period;
    $('csLvN').textContent = LEG[leg]+' leg. Base '+mname(base)+' = 100'+(fl != null || cp != null ? '; '+[fl != null ? 'floor '+fl : '', cp != null ? 'cap '+cp : ''].filter(Boolean).join(', ') : '')+'. The settled level is the level the month is paid at.';
    var lg = [];
    if(W.length) lg.push({ k:'thin', c:'var(--series)', n:'Weekly index' });
    lg.push({ k:'line', c:'var(--l1)', n:'Settled level' });
    if(fl != null || cp != null) lg.push({ k:'dash', c:'var(--l4)', n:fl != null && cp != null ? 'Floor and cap' : fl != null ? 'Floor' : 'Cap' });
    C().legend($('csLvLg'), lg);
    var box = $('csLv');
    mount(box, function(){
      var ch = C(), first = monday(utc(base+'-01')), lastT = Math.max(W.length ? utc(W[W.length-1].d) : first, utc(GATE)), AX = ch.axis(iso(first), iso(monday(lastT - 6*864e5)));
      var vals = W.map(function(w){ return w.v; }).concat(st.map(function(m){ return num(m.L[leg].settled_level); }), [100]);
      if(fl != null) vals.push(fl); if(cp != null) vals.push(cp);
      var lo = Math.min.apply(null, vals) - 2, hi = Math.max.apply(null, vals) + 2, tk = ticks(lo, hi, 4); lo = Math.min(lo, tk[0]); hi = Math.max(hi, tk[tk.length-1]);
      var Y = ch.y(lo, hi), g = [], x0 = ch.X0, x1 = ch.X1;
      function X(t){ return Math.max(x0, Math.min(x1, AX.x(iso(t)))); }
      var bx = X(monday(utc(addM(base,1)+'-01')));
      g.push('<rect x="'+x0+'" y="'+ch.PT+'" width="'+(bx-x0).toFixed(1)+'" height="'+(ch.PB-ch.PT)+'" style="fill:rgba(255,255,255,.025)"></rect>');
      tk.forEach(function(v){ g.push(ch.rule(Y(v), { cls:'as-s-grid' })); g.push(T(x0, Y(v)-4, String(v))); });
      [fl, cp].forEach(function(v){ if(v != null) g.push(ch.rule(Y(v), { cls:'as-s-bar3', dash:'6 4' })); });
      if(W.length) g.push('<polyline fill="none" class="as-s-series" stroke-width="1.5" stroke-linejoin="round" points="'+W.map(function(w){ return X(utc(w.d)).toFixed(1)+','+Y(w.v).toFixed(1); }).join(' ')+'"></polyline>');
      st.forEach(function(m){ var a = X(monday(utc(m.ym+'-01'))) + 3, b = X(monday(utc(addM(m.ym,1)+'-01'))) - 3, y = Y(num(m.L[leg].settled_level)).toFixed(1);
        if(b > a) g.push('<line x1="'+a.toFixed(1)+'" x2="'+b.toFixed(1)+'" y1="'+y+'" y2="'+y+'" stroke="var(--l1)" stroke-width="3" stroke-linecap="round"></line>'); });
      if(W.length){ var lw = W[W.length-1]; g.push('<circle cx="'+X(utc(lw.d)).toFixed(1)+'" cy="'+Y(lw.v).toFixed(1)+'" r="4" class="as-f-series"></circle>'); }
      g.push(AX.svg());
      box._geo = { axis:ch.TA/ch.H, pts:W.map(function(w){ return { f:X(utc(w.d))/ch.W, w:w }; }) };
      return ch.svg(g.join(''), LEG[leg]+': weekly index level on the contract base and the monthly settled level'+(fl != null || cp != null ? ', with floor and cap' : ''));
    });
  }
  function history(){
    var Lg = D.legs;
    $('csHiH').innerHTML = '<tr><th>Month</th><th class="r">Weeks</th>'+Lg.map(function(k){ return '<th class="r">'+LEG[k]+'</th>'; }).join('')+'<th class="r">Signed value</th><th class="r">Settled value</th><th class="r">Vs signed</th></tr>';
    var h = '', fx = 0, ix = 0;
    if(D.prov) h += '<tr class="prov"><td>'+mname(D.prov.ym)+(D.c.reset_months > 1 ? ', being set' : ', to date')+'</td><td class="r">'+(D.prov.weeks || '')+'</td>'+Lg.map(function(k){ var r = D.prov.L[k]; return '<td class="r">'+(r && r.settled_level != null ? lv(r.settled_level) : '')+'</td>'; }).join('')+'<td></td><td></td><td></td></tr>';
    D.months.slice().reverse().forEach(function(m){ fx += m.fx; ix += m.ix;
      h += '<tr><td>'+mname(m.ym)+'</td><td class="r d">'+(m.weeks || '')+'</td>'+Lg.map(function(k){ var r = m.L[k]; return '<td class="r">'+lv(r.settled_level)+(r.limit_applied ? '<span class="tp-flag">'+LIMIT[r.limit_applied]+'</span>' : '')+'</td>'; }).join('')
        +'<td class="r d">'+usd(m.fx)+'</td><td class="r w">'+usd(m.ix)+'</td><td class="r">'+chg2((m.ix/m.fx-1)*100)+'</td></tr>'; });
    if(D.months.length) h += '<tr class="tot"><td colspan="'+(Lg.length+2)+'">Contract year to date</td><td class="r">'+usd(fx)+'</td><td class="r">'+usd(ix)+'</td><td class="r">'+chg2((ix/fx-1)*100)+'</td></tr>';
    $('csHi').innerHTML = h || '<tr><td colspan="'+(Lg.length+5)+'">No month has settled yet.</td></tr>';
  }
  /* Rate card: every covered model on every leg. Contracts on the whole index have none. */
  function card(){
    var sec = $('csRcSec'), m = last(); if(!D.M.length || !m){ sec.hidden = true; return; } sec.hidden = false;
    $('csRcT').textContent = MN[+m.ym.slice(5,7)-1]+' rate card';
    $('csRcH').innerHTML = '<tr><th>Model</th><th class="r">Share</th>'+D.legs.map(function(k){ return '<th class="r">'+LEG[k]+'<span class="lv">'+lv(m.L[k].settled_level)+'</span></th>'; }).join('')+'<th class="r">Signed value</th><th class="r">Settled value</th><th class="r">Vs signed</th></tr>';
    var h = '';
    D.M.forEach(function(x){ var isO = open === x.id, fx = 0, ix = 0;
      D.legs.forEach(function(k){ var r = x.r[k], Lk = m.L[k]; if(!r || !(num(Lk.share) > 0)) return; var f = num(Lk.fixed_usd)*r.share/num(Lk.share); fx += f; ix += f*num(Lk.indexed_usd)/num(Lk.fixed_usd); });
      h += '<tr class="pick'+(isO ? ' sel' : '')+'" tabindex="0" data-id="'+esc(x.id)+'" aria-expanded="'+isO+'"><td><span class="tp-x" aria-hidden="true">'+(isO ? '&minus;' : '+')+'</span>'+esc(x.name)+(x.dev ? ' <span class="d">'+esc(x.dev)+'</span>' : '')+'</td><td class="r">'+Math.round(x.share*100)+'%</td>'
        + D.legs.map(function(k){ var r = x.r[k]; return r ? '<td class="r'+(k === leg ? ' w' : '')+'">'+rate(r.signed*num(m.L[k].settled_level)/100)+'</td>' : '<td class="r d">Not covered</td>'; }).join('')
        + '<td class="r d">'+usd(fx)+'</td><td class="r w">'+usd(ix)+'</td><td class="r">'+(fx ? chg2((ix/fx-1)*100) : '')+'</td></tr>';
      if(isO){
        var rows = D.legs.filter(function(k){ return x.r[k]; }).map(function(k){ var r = x.r[k], sv = r.signed*num(m.L[k].settled_level)/100, mk = r.mkt;
          return '<tr><td>'+LEG[k]+'</td><td>'+rate(r.signed)+'</td><td class="w">'+rate(sv)+'</td><td>'+(mk ? rate(mk.med) : '&mdash;')+'</td><td>'+(mk ? (mk.lo === mk.hi ? 'Single price' : rate(mk.lo)+' to '+rate(mk.hi)) : '&mdash;')+'</td><td>'+(mk ? mk.n : '&mdash;')+'</td><td>'+(mk ? chg2((sv/mk.med-1)*100) : '&mdash;')+'</td></tr>'; }).join('');
        h += '<tr class="tp-dt"><td colspan="'+(D.legs.length+5)+'"><table class="tp-dtt"><thead><tr><th>Leg</th><th>Signed rate</th><th>Settled rate</th><th>Market median</th><th>Market range</th><th>Vendors</th><th>Settled vs median</th></tr></thead><tbody>'+rows+'</tbody></table>'
          + (x.vendors >= 2 ? '<button class="tp-link" type="button" style="margin-top:var(--s3)" data-go="'+esc(x.id)+'">Open '+esc(x.name)+' in Models &rarr;</button>' : '')+'</td></tr>';
      }
    });
    $('csRc').innerHTML = h;
  }
  function foot(){
    var m = last();
    $('csSrc').textContent = 'Source: Attic Standard, index levels published '+ldate(GATE)+'. Figures update with each index publication. Settlement: '+(D.c.reset_months > 1 ? 'the average of the last 12 published weeks, set a quarter in advance' : 'the average of the published weeks in each month')+'; base '+mname(D.c.base_period)+' = 100.';
    $('csCite').disabled = !m;
  }
  function start(){
    waiting($('csMsg'));
    $('csQ').addEventListener('input', rail);
    $('csList').addEventListener('click', function(e){ var b = e.target.closest('.tp-row'); if(!b) return; L.forEach(function(c){ if(c.contract_id === b.dataset.id && c !== c0) load(c); }); });
    $('csLegs').addEventListener('click', function(e){ var b = e.target.closest('[data-leg]'); if(b) pickLeg(b.dataset.leg); });
    $('csSeg').addEventListener('click', function(e){ var b = e.target.closest('[data-leg]'); if(b) pickLeg(b.dataset.leg); });
    $('csRc').addEventListener('click', function(e){
      var g = e.target.closest('[data-go]');
      if(g){ try{ localStorage.setItem('atMoModel', g.dataset.go); }catch(x){} MO.open(g.dataset.go); show('models', true); return; }
      var r = e.target.closest('tr[data-id]'); if(!r) return; open = open === r.dataset.id ? null : r.dataset.id; card(); });
    $('csRc').addEventListener('keydown', function(e){ if(e.key !== 'Enter' && e.key !== ' ') return; var r = e.target.closest('tr[data-id]'); if(!r) return; e.preventDefault(); open = open === r.dataset.id ? null : r.dataset.id; card(); });
    hover($('csLvW'), $('csLv'), function(p){ var w = p.w, m = D.months.filter(function(s){ return s.ym === w.d.slice(0,7); })[0], isBase = w.d.slice(0,7) === D.c.base_period;
      return '<div class="t">Week of '+ldate(w.d)+'</div>Index <b>'+lv(w.v)+'</b>'+(m ? '<br>'+MN[+m.ym.slice(5,7)-1]+' settled <b>'+lv(m.L[leg].settled_level)+'</b>' : isBase ? '<br>Base month' : '<br>Month not yet settled'); });
    $('csCite').addEventListener('click', function(){ if(!D || !D.months.length) return; var m = last();
      copy(this, 'Attic Standard, '+D.c.label+' ('+D.c.contract_id+'), '+mname(m.ym)+' settlement against '+D.c.index_code+': '+D.legs.map(function(k){ return LEG[k].toLowerCase()+' '+lv(m.L[k].settled_level); }).join(', ')+' (base '+mname(D.c.base_period)+' = 100). Settled value '+usd(m.ix)+' against '+usd(m.fx)+' at signed rates. Data through '+ldate(GATE)+'. atticstandard.com'); });
    if(!sb){ message($('csMsg'), 'Contracts load once you are logged in.'); return; }
    q(sb.from('clause_contract').select('*').order('sort_order', { ascending:true }).order('created_at', { ascending:true })).then(function(rows){
      L = rows; if(!L.length){ message($('csMsg'), 'No contracts are on file yet.'); return; }
      var keep = null; try{ keep = localStorage.getItem('atCsContract'); }catch(e){}
      load(L.filter(function(c){ return c.contract_id === keep; })[0] || L[0]);
    }).catch(function(e){ console.error('[Contracts]', e); message($('csMsg'), 'Contracts could not be loaded. Refresh the page, or log in again if the problem persists.'); });
  }
  return { start:start };
})();

/* ═══ PRICING INTELLIGENCE ═══ */
function pricingHTML(){
  return '<section class="tp-dash" id="tpPricing" role="tabpanel" aria-label="Models" hidden><div class="tp-wrap">'
  + '<aside class="tp-rail"><label class="tp-lbl" for="moQ">Models</label>'
  + '<input class="tp-in" id="moQ" type="text" autocomplete="off" spellcheck="false" placeholder="Search models">'
  + '<div class="tp-g2"><div class="tp-dd" id="moVen"></div><div class="tp-dd" id="moMod"></div></div>'
  + '<div class="tp-cnt"><span>Model</span><span>Vendors</span></div>'
  + '<div class="tp-list" id="moList" role="listbox" aria-label="Models"></div><p class="tp-note" id="moListNote"></p></aside>'
  + '<div class="tp-main"><div id="moMsg"></div><div id="moBody" hidden>'
  + '<div class="tp-top"><div><h2 class="tp-h" id="moName"></h2><p class="tp-meta" id="moMeta"></p></div><div class="tp-acts"><div class="as-vt" id="moLegs" role="group" aria-label="Price leg"></div><div class="as-vt" id="moUnits" role="group" aria-label="Unit" hidden></div></div></div>'
  + '<div class="tp-hero"><div class="tp-hl2"><p class="tp-lbl">Market median</p><div class="tp-bigrow"><div class="tp-big" id="moMed"></div><div class="tp-chg" id="moMedSub"></div></div><div class="tp-dist" id="moDist"></div><div class="tp-stats" id="moStats"></div></div>'
  + '<div class="tp-hr2"><p class="tp-lbl">Model profile</p><dl class="tp-dl" id="moProf"></dl><p class="tp-note" id="moPnote" style="margin-top:var(--s4)"></p></div></div>'
  + '<section class="tp-sec"><p class="tp-lbl" id="moChT"></p><p class="tp-note sub" id="moChN"></p>'
  + '<div class="tp-chw"><div class="as-lgv" id="moLg"></div><div class="tp-ch" id="moChW"><div id="moCh"></div><div class="tp-hv" hidden></div><div class="tp-tip" hidden></div></div></div></section>'
  + '<section class="tp-sec"><p class="tp-lbl">Vendors</p><p class="tp-note sub">Each vendor’s lowest published price, low to high. Select a vendor to draw it on the chart.</p>'
  + '<div class="tp-tw"><table class="tp-tbl"><thead><tr><th>Vendor</th><th>Channel</th><th class="r">Price</th><th class="r">Vs median</th><th class="r">Since first priced</th><th class="r">Last change</th><th>Position</th></tr></thead><tbody id="moTbl"></tbody></table></div>'
  + '<p class="tp-note" id="moStale" style="margin-top:var(--s4)"></p></section>'
  + '<div class="tp-foot"><p class="as-note" id="moSrc"></p><div class="tp-ln"><button class="tp-link" id="moCite" type="button">Copy citation</button><a class="tp-link" href="/methodology">Read the methodology &rarr;</a></div></div>'
  + '</div></div></div></section>';
}

var MO = (function(){
  var TIER = { FTR:'Flagship', FLG:'Flagship', MID:'Core', COR:'Core', BDG:'Compact', CMP:'Compact', TASK:'Task-specific' };
  var LEGS = [['Input','Input'],['Cached Input','Cached input'],['Output','Output']];
  var WEIGHTS = { open:'Published', 'open-weight':'Published, restricted license', 'non-commercial':'Published, non-commercial', proprietary:'Unpublished' };
  var MODELS = [], PUB = {}, model = null, ROWS = [], leg = null, unit = null, selV = null, CUR = null, reqN = 0, IDX = null, pending = null, ddVen, ddMod;
  function fx(v){ v = Number(v); if(!(v > 0)) return '0'; if(v >= 1) return v.toFixed(v >= 100 ? 2 : 4); var d = Math.max(6, Math.ceil(-Math.log10(v))+1); return v.toFixed(Math.min(d, 10)); }
  function px(v){ return v == null ? '&mdash;' : '$'+fx(v); }
  function ax$(v){ return '$'+Number(v).toFixed(10).replace(/0+$/,'').replace(/\.$/,''); }
  function legName(l){ for(var i = 0; i < LEGS.length; i++) if(LEGS[i][0] === l) return LEGS[i][1]; return l; }
  var CARET = '<svg width="11" height="7" viewBox="0 0 11 7" aria-hidden="true"><path d="M1 1 L5.5 5.5 L10 1" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  function DD(el, label, onChange){
    var d = { val:'', opts:[['', label]] };
    el.innerHTML = '<button type="button" class="tp-ddb" aria-haspopup="listbox" aria-expanded="false"><span></span>'+CARET+'</button><div class="tp-ddl" role="listbox" hidden></div>';
    var b = el.firstChild, Lb = el.lastChild, act = -1;
    function paint(){ b.firstChild.textContent = (d.opts.filter(function(o){ return o[0] === d.val; })[0] || d.opts[0])[1]; }
    function open(){ Lb.innerHTML = d.opts.map(function(o, i){ return '<button type="button" role="option" data-i="'+i+'" aria-selected="'+(o[0] === d.val)+'">'+esc(o[1])+'</button>'; }).join('');
      Lb.hidden = false; el.classList.add('open'); b.setAttribute('aria-expanded','true'); act = -1; var s = Lb.querySelector('[aria-selected=true]'); if(s) Lb.scrollTop = s.offsetTop - Lb.clientHeight/2; }
    function close(){ Lb.hidden = true; el.classList.remove('open'); b.setAttribute('aria-expanded','false'); }
    function set(i){ d.val = d.opts[i][0]; paint(); close(); onChange(); }
    b.addEventListener('click', function(){ Lb.hidden ? open() : close(); });
    Lb.addEventListener('click', function(e){ var o = e.target.closest('button'); if(o) set(+o.dataset.i); });
    el.addEventListener('keydown', function(e){ if(Lb.hidden){ if(e.key === 'ArrowDown'){ e.preventDefault(); open(); } return; }
      var bs = Lb.querySelectorAll('button');
      if(e.key === 'Escape'){ close(); b.focus(); }
      else if(e.key === 'ArrowDown' || e.key === 'ArrowUp'){ e.preventDefault(); act = Math.max(0, Math.min(bs.length-1, act + (e.key === 'ArrowDown' ? 1 : -1))); bs.forEach(function(x, i){ x.classList.toggle('act', i === act); }); bs[act].scrollIntoView({ block:'nearest' }); }
      else if(e.key === 'Enter' && act > -1){ e.preventDefault(); set(act); b.focus(); } });
    document.addEventListener('click', function(e){ if(!el.contains(e.target)) close(); });
    d.setOptions = function(o){ d.opts = [['', label]].concat(o); paint(); };
    paint(); return d;
  }
  function list(){
    var t = $('moQ').value.trim().toLowerCase().replace(/[-._\s/]/g,''), md = ddMod.val, vn = ddVen.val;
    var r = MODELS.filter(function(m){ return (!md || m.modality === md) && (!vn || m._v.indexOf(vn) > -1) && (!t || m._k.indexOf(t) > -1); });
    var shown = r.slice(0, 300);
    $('moList').innerHTML = shown.length ? shown.map(function(m){ return '<button type="button" role="option" aria-selected="'+(model && m.anchor_id === model.anchor_id)+'" class="tp-row'+(model && m.anchor_id === model.anchor_id ? ' on' : '')+'" data-id="'+esc(m.anchor_id)+'" title="'+esc(m.model_name)+'"><span>'+esc(m.model_name)+'</span><b>'+m.vendors+'</b></button>'; }).join('')
      : '<p class="tp-note" style="padding:var(--s3) var(--s2)">No model matches that search.</p>';
    $('moListNote').textContent = r.length > shown.length ? 'Showing 300 of '+int(r.length)+'. Search to narrow the list.' : int(r.length)+' model'+(r.length === 1 ? '' : 's')+(vn ? ' sold by '+vn : '')+(md ? ', '+md.toLowerCase() : '')+', each sold by two or more vendors.';
  }
  function pick(m){
    model = m; selV = null; IDX = null; var my = ++reqN; list();
    waiting($('moMsg')); $('moBody').hidden = true;
    $('moName').textContent = m.model_name;
    profile(m);
    try{ localStorage.setItem('atMoModel', m.anchor_id); }catch(e){}
    q(sb.from('index_membership_snapshot').select('index_code').eq('anchor_id', m.anchor_id).eq('in_basket', true).limit(1000))
      .then(function(r){ if(my !== reqN) return; var s = {}; r.forEach(function(x){ if(PUB[x.index_code]) s[x.index_code] = 1; }); IDX = Object.keys(s).length; if(CUR) stats(); }).catch(function(){});
    all(function(){ return sb.from('v_fair_value').select('gate_date,vendor_id,vendor_name,vendor_type,direction,unit,price').eq('anchor_id', m.anchor_id).order('gate_date'); })
      .then(function(rows){ if(my !== reqN) return; ROWS = rows;
        var legs = LEGS.filter(function(l){ return rows.some(function(r){ return r.direction === l[0] && String(r.gate_date) === GATE; }); });
        if(!legs.length){ message($('moMsg'), 'This model has no price in the latest publication.'); return; }
        if(!leg || !legs.some(function(l){ return l[0] === leg; })) leg = legs[0][0];
        $('moLegs').innerHTML = legs.map(function(l){ return '<button type="button" class="as-vt-b" data-leg="'+esc(l[0])+'" aria-selected="'+(l[0] === leg)+'">'+l[1]+'</button>'; }).join('');
        $('moLegs').hidden = legs.length < 2;
        unit = null; render(); })
      .catch(function(e){ if(my !== reqN) return; console.error('[Pricing]', e); message($('moMsg'), 'Prices for this model could not be loaded. Refresh the page, or log in again if the problem persists.'); });
  }
  function ctx(n){ n = Number(n); if(!(n > 0)) return null; if(n >= 1e6) return (Math.round(n/1e5)/10).toString().replace(/\.0$/,'')+'M tokens'; if(n >= 1000) return Math.round(n/1000)+'K tokens'; return n+' tokens'; }
  function cap(a){ return (a || []).map(function(x){ x = String(x); return x.charAt(0).toUpperCase()+x.slice(1); }).join(', '); }
  function ym(t){ var m = /^(\d{4})-(\d{2})/.exec(String(t || '')); return m ? MN[+m[2]-1]+' '+m[1] : (t || null); }
  function yn(b){ return b == null ? null : (b ? 'Yes' : 'No'); }
  function profile(m){
    var P = [['Developer', m.creator], ['Family', m.model_family], ['Parameters', m.parameter_count], ['Context window', ctx(m.context_window)], ['Max output', ctx(m.max_output_tokens)],
      ['Inputs', cap(m.modality_input) || null], ['Outputs', cap(m.modality_output) || null], ['Weights', WEIGHTS[m.license_class] || null], ['License', m.license_type], ['Origin', m.creator_country],
      ['Reasoning model', yn(m.is_reasoning)], ['Tool calling', yn(m.tool_calling)], ['JSON mode', yn(m.json_mode)], ['Training data to', ym(m.training_cutoff)]]
      .filter(function(x){ return x[1] != null && x[1] !== ''; });
    $('moProf').innerHTML = P.map(function(x){ return '<div><dt>'+x[0]+'</dt><dd>'+esc(x[1])+'</dd></div>'; }).join('');
    $('moPnote').textContent = P.length ? 'As published by the model’s developer.' : 'No profile on record for this model yet.';
  }
  function stats(){
    var Cc = CUR, now = Cc.now, f = Cc.env[0];
    $('moStats').innerHTML = [
      ['Vendors', String(now.length), 'pricing it now'],
      ['Spread', now.length > 1 && Cc.lo > 0 ? (Cc.hi/Cc.lo).toFixed(1)+'×' : '&mdash;', 'highest over lowest'],
      ['Repriced', Cc.moved+' of '+now.length, 'since first priced'],
      ['Indexes', IDX == null ? '&mdash;' : String(IDX), 'published, in the basket'],
      ['Weeks priced', String(Cc.env.length), 'since '+sdate(f.d)]
    ].map(function(k){ return '<div><p class="tp-lbl">'+k[0]+'</p><div class="v">'+k[1]+'</div><p class="s">'+k[2]+'</p></div>'; }).join('');
  }
  function dist(){
    var Cc = CUR, now = Cc.now, lo = Cc.lo, hi = Cc.hi; if(!now.length){ $('moDist').innerHTML = ''; return; }
    var L0 = Math.log(lo), L1 = Math.log(hi), SP = (L1-L0) || 1, pad = lo === hi ? 50 : 0;
    function P(v){ return pad || ((Math.log(v)-L0)/SP*96+2); }
    var bins = {}, h = '';
    now.forEach(function(v){ var x = P(v.s[GATE]), k = Math.round(x/1.6), n = bins[k] = (bins[k] || 0)+1; v._x = x; v._y = n-1; });
    var maxN = Math.max.apply(null, Object.keys(bins).map(function(k){ return bins[k]; })), stepY = Math.min(10, 60/Math.max(1, maxN)), dsz = Math.max(5, Math.min(9, stepY+0.5));
    h += '<div class="tp-dpl"><div class="ax"></div><div class="md" style="left:'+P(Cc.M).toFixed(2)+'%"></div><div class="mdl" style="left:'+P(Cc.M).toFixed(2)+'%">Median</div>';
    now.forEach(function(v){ var s = bins[Math.round(v._x/1.6)] > 1 ? dsz : 9;
      h += '<button type="button" data-v="'+esc(v.id)+'" class="'+(v.id === selV ? 'on' : '')+'" style="left:'+v._x.toFixed(2)+'%;bottom:'+(v._y*stepY+1).toFixed(1)+'px;width:'+s+'px;height:'+s+'px" aria-label="'+esc(vgroup(v.name))+' '+fx(v.s[GATE])+'"></button>'; });
    h += '<div class="tp-tip tp-dtip" hidden></div></div>';
    h += '<div class="tp-dends"><div>Lowest <b>'+px(lo)+'</b><br>'+esc(vgroup(now[0].name))+'</div><div>Highest <b>'+px(hi)+'</b><br>'+esc(vgroup(now[now.length-1].name))+'</div></div>';
    $('moDist').innerHTML = h;
  }
  function render(){
    var R = ROWS.filter(function(r){ return r.direction === leg; });
    var cnt = {}; R.forEach(function(r){ if(String(r.gate_date) === GATE) cnt[r.unit] = (cnt[r.unit] || 0)+1; });
    var units = Object.keys(cnt).sort(function(a, b){ return cnt[b] - cnt[a]; });
    if(!unit || !cnt[unit]) unit = units[0];
    var U = $('moUnits'); U.hidden = units.length < 2;
    U.innerHTML = units.length > 1 ? units.map(function(u){ return '<button type="button" class="as-vt-b" data-u="'+esc(u)+'" aria-selected="'+(u === unit)+'">'+esc(u)+'</button>'; }).join('') : '';
    R = R.filter(function(r){ return r.unit === unit; });
    var dates = [], ds = {}, V = {};
    R.forEach(function(r){ var d = String(r.gate_date); if(!ds[d]){ ds[d] = 1; dates.push(d); }
      var v = V[r.vendor_id] || (V[r.vendor_id] = { id:r.vendor_id, name:r.vendor_name, type:r.vendor_type, s:{} }); v.s[d] = Number(r.price); });
    dates.sort();
    var vs = Object.keys(V).map(function(k){ return V[k]; });
    var now = vs.filter(function(v){ return v.s[GATE] > 0; }).sort(function(a, b){ return a.s[GATE] - b.s[GATE] || a.name.localeCompare(b.name); });
    var stale = vs.filter(function(v){ return !(v.s[GATE] > 0); });
    var prices = now.map(function(v){ return v.s[GATE]; }), M = med(prices), lo = prices[0], hi = prices[prices.length-1];
    /* Per vendor: first week priced, and the latest week its price moved by more than half a
       percent from its previous published week. */
    var rp = {};
    vs.forEach(function(v){ var prev = null; v.last = null; v.first = null; dates.forEach(function(d){ var p = v.s[d]; if(p > 0){ if(!v.first) v.first = d; if(prev != null && Math.abs(p/prev-1) > 0.005){ v.last = d; rp[d] = 1; } prev = p; } }); });
    var env = dates.map(function(d){ var a = []; vs.forEach(function(v){ var p = v.s[d]; if(p > 0) a.push(p); });
      return a.length ? { d:d, lo:Math.min.apply(null, a), hi:Math.max.apply(null, a), m:med(a), n:a.length } : null; }).filter(Boolean);
    CUR = { V:V, dates:dates, env:env, now:now, M:M, lo:lo, hi:hi, rp:rp, moved:now.filter(function(v){ return v.last; }).length };
    $('moMeta').textContent = [model.modality || '', TIER[model.tier] || '', unit].filter(Boolean).join(' · ');
    $('moMed').innerHTML = px(M);
    var f = env[0], l = env[env.length-1];
    $('moMedSub').innerHTML = env.length > 1 ? chg((l.m/f.m-1)*100)+'<em>since '+mdate(f.d)+'</em>' : '<em>first week priced</em>';
    stats(); dist();
    var L0 = Math.log(lo*0.85), L1 = Math.log(hi*1.15), SP = (L1-L0) || 1;
    function P(v){ return ((Math.log(v)-L0)/SP*100).toFixed(2); }
    $('moTbl').innerHTML = now.map(function(v){ var p = v.s[GATE], d = (p/M-1)*100;
      return '<tr class="pick'+(v.id === selV ? ' sel' : '')+'" tabindex="0" data-v="'+esc(v.id)+'"><td>'+esc(vgroup(v.name))+'</td><td class="d">'+esc(channel(v.type))+'</td><td class="r">'+px(p)+'</td><td class="r">'+(Math.abs(d) < 0.05 ? 'At median' : Math.abs(d).toFixed(1)+'% '+(d > 0 ? 'above' : 'below'))+'</td>'
        + '<td class="r">'+(v.first < GATE ? chg((p/v.s[v.first]-1)*100) : '<span class="d">New</span>')+'</td>'
        + '<td class="r'+(v.last ? '' : ' d')+'">'+(v.last ? sdate(v.last) : v.first > dates[0] ? 'Listed '+sdate(v.first) : 'No change on record')+'</td>'
        + '<td><div class="tp-pos"><i></i><b style="left:'+P(M)+'%"></b><s style="left:'+P(p)+'%"></s></div></td></tr>'; }).join('');
    $('moStale').textContent = stale.length ? stale.length+' vendor'+(stale.length === 1 ? '' : 's')+' that priced this model before published no price on '+ldate(GATE)+' and '+(stale.length === 1 ? 'is' : 'are')+' left out: '+stale.map(function(v){ var x = Object.keys(v.s).sort().pop(); return vgroup(v.name)+' (last priced '+sdate(x)+')'; }).join(', ')+'.' : 'Every vendor above published this price on '+ldate(GATE)+'.';
    $('moSrc').textContent = 'Source: Attic Standard, prices published '+ldate(GATE)+'. Figures update with each index publication. Unit: price '+unit+'. Price: each vendor’s lowest list price for the model; the median counts each vendor once.';
    chart();
    $('moMsg').hidden = true; $('moBody').hidden = false;
  }
  function pickV(id){ selV = selV === id ? null : id; render(); }
  /* Price by week on the shared frame: the band from the lowest to the highest vendor, the median,
     a dotted line at each week a vendor repriced, the selected vendor in white. */
  function chart(){
    var Cc = CUR, env = Cc.env, V = Cc.V;
    $('moChT').textContent = legName(leg)+' price by week';
    $('moChN').textContent = env.length ? 'Since '+ldate(env[0].d)+', '+env.length+' week'+(env.length === 1 ? '' : 's')+', '+unit+'.' : '';
    var sv = selV ? V[selV] : null, rps = Object.keys(Cc.rp).filter(function(d){ return env.length && d !== env[0].d; });
    var lg = [{ k:'line', c:sv ? 'var(--series-history)' : 'var(--series)', n:'Market median' }, { k:'bar', c:'rgba(198,203,211,.22)', n:'Lowest to highest vendor' }];
    if(rps.length) lg.push({ k:'thin', c:'var(--l5)', n:'A vendor repriced' });
    if(sv) lg.push({ k:'line', c:'var(--l1)', n:vgroup(sv.name) });
    C().legend($('moLg'), lg);
    var box = $('moCh');
    if(env.length < 2){ box._geo = null; if(box._asro){ box._asdraw = null; } box.innerHTML = '<p class="tp-note" style="padding:var(--s6) 0;text-align:center">Priced for one week so far. The chart starts with the second week.</p>'; return; }
    mount(box, function(){
      var ch = C(), AX = ch.axis(env[0].d, env[env.length-1].d), vals = [];
      env.forEach(function(e){ vals.push(e.lo, e.hi); });
      if(sv) Cc.dates.forEach(function(d){ if(sv.s[d] > 0) vals.push(sv.s[d]); });
      var vmin = Math.min.apply(null, vals), vmax = Math.max.apply(null, vals), pad = (vmax-vmin)*0.12 || vmax*0.1, lo = Math.max(0, vmin-pad), hi = vmax+pad, tk = ticks(lo, hi, 4);
      var Y = ch.y(lo, hi), g = [];
      function step(a){ var o = []; a.forEach(function(p, i){ if(i) o.push([p[0], a[i-1][1]]); o.push(p); }); return o; }
      function pts(a){ return a.map(function(p){ return AX.x(p[0]).toFixed(1)+','+Y(p[1]).toFixed(1); }).join(' '); }
      tk.forEach(function(v){ if(v >= lo && v <= hi){ g.push(ch.rule(Y(v), { cls:'as-s-grid' })); g.push(T(ch.X0, Y(v)-4, ax$(v))); } });
      rps.forEach(function(d){ var x = AX.x(d).toFixed(1); g.push('<line x1="'+x+'" x2="'+x+'" y1="'+ch.PT+'" y2="'+ch.PB+'" class="as-s-axis" stroke-dasharray="2 3"></line>'); });
      g.push('<polygon points="'+pts(step(env.map(function(e){ return [e.d, e.hi]; })))+' '+pts(step(env.map(function(e){ return [e.d, e.lo]; })).reverse())+'" style="fill:rgba(198,203,211,.10)"></polygon>');
      g.push('<polyline fill="none" class="'+(sv ? 'as-s-hist' : 'as-s-series')+'" stroke-width="2" stroke-linejoin="round" points="'+pts(step(env.map(function(e){ return [e.d, e.m]; })))+'"></polyline>');
      var la = env[env.length-1];
      if(sv){ var co = Cc.dates.filter(function(d){ return sv.s[d] > 0; }).map(function(d){ return [d, sv.s[d]]; });
        if(co.length) g.push('<polyline fill="none" stroke="var(--l1)" stroke-width="2" stroke-linejoin="round" points="'+pts(step(co))+'"></polyline>');
        if(sv.s[GATE] > 0) g.push('<circle cx="'+AX.x(GATE).toFixed(1)+'" cy="'+Y(sv.s[GATE]).toFixed(1)+'" r="4" fill="var(--l1)"></circle>'); }
      else g.push('<circle cx="'+AX.x(la.d).toFixed(1)+'" cy="'+Y(la.m).toFixed(1)+'" r="4" class="as-f-series"></circle>');
      g.push(AX.svg());
      box._geo = { axis:ch.TA/ch.H, pts:env.map(function(e){ return { f:AX.x(e.d)/ch.W, e:e }; }) };
      return ch.svg(g.join(''), model.model_name+' '+legName(leg).toLowerCase()+' price by week: market median and the range from the lowest to the highest vendor');
    });
  }
  function start(){
    waiting($('moMsg'));
    ddVen = DD($('moVen'), 'All vendors', list); ddMod = DD($('moMod'), 'All modalities', list);
    $('moQ').addEventListener('input', list);
    $('moList').addEventListener('click', function(e){ var b = e.target.closest('.tp-row'); if(!b) return; for(var i = 0; i < MODELS.length; i++) if(MODELS[i].anchor_id === b.dataset.id){ pick(MODELS[i]); break; } });
    $('moLegs').addEventListener('click', function(e){ var b = e.target.closest('[data-leg]'); if(!b || b.dataset.leg === leg) return; leg = b.dataset.leg; unit = null; selV = null;
      this.querySelectorAll('[data-leg]').forEach(function(x){ x.setAttribute('aria-selected', String(x === b)); }); render(); });
    $('moUnits').addEventListener('click', function(e){ var b = e.target.closest('[data-u]'); if(!b) return; unit = b.dataset.u; selV = null; render(); });
    $('moDist').addEventListener('click', function(e){ var b = e.target.closest('button[data-v]'); if(b) pickV(b.dataset.v); });
    $('moDist').addEventListener('mouseover', function(e){ var b = e.target.closest('button[data-v]'), t = this.querySelector('.tp-dtip'); if(!t) return; if(!b){ t.hidden = true; return; }
      var v = CUR.V[b.dataset.v], d = (v.s[GATE]/CUR.M-1)*100;
      t.innerHTML = '<b>'+esc(vgroup(v.name))+'</b> '+px(v.s[GATE])+' · '+(Math.abs(d) < 0.05 ? 'at median' : Math.abs(d).toFixed(1)+'% '+(d > 0 ? 'above' : 'below')); t.style.left = b.style.left; t.hidden = false; });
    $('moDist').addEventListener('mouseleave', function(){ var t = this.querySelector('.tp-dtip'); if(t) t.hidden = true; });
    $('moTbl').addEventListener('click', function(e){ var tr = e.target.closest('tr[data-v]'); if(tr) pickV(tr.dataset.v); });
    $('moTbl').addEventListener('keydown', function(e){ if(e.key !== 'Enter' && e.key !== ' ') return; var tr = e.target.closest('tr[data-v]'); if(!tr) return; e.preventDefault(); pickV(tr.dataset.v); });
    hover($('moChW'), $('moCh'), function(p){ var e = p.e, sv = selV ? CUR.V[selV] : null;
      return '<div class="t">Week of '+ldate(e.d)+'</div>Median <b>'+px(e.m)+'</b><br>Lowest '+px(e.lo)+' · Highest '+px(e.hi)+'<br>'+e.n+' vendor'+(e.n === 1 ? '' : 's')+' priced'+(CUR.rp[e.d] && e.d !== CUR.env[0].d ? ', repricing that week' : '')
        + (sv && sv.s[e.d] > 0 ? '<br>'+esc(vgroup(sv.name))+' <b>'+px(sv.s[e.d])+'</b>' : ''); });
    $('moCite').addEventListener('click', function(){ if(!CUR) return;
      copy(this, 'Attic Standard, '+model.model_name+' '+legName(leg).toLowerCase()+' price, '+ldate(GATE)+': market median $'+fx(CUR.M)+' '+unit+' across '+CUR.now.length+' vendors (lowest $'+fx(CUR.lo)+', highest $'+fx(CUR.hi)+'). atticstandard.com'); });
    if(!sb){ message($('moMsg'), 'Prices load once you are logged in.'); return; }
    Promise.all([
      all(function(){ return sb.from('v_fair_value_models').select('anchor_id,model_name,display_name,creator,tier,modality,vendors,vendor_names,model_family,parameter_count,context_window,max_output_tokens,modality_input,modality_output,tool_calling,json_mode,training_cutoff,license_type,license_class,is_reasoning,creator_country').gte('vendors', 2).order('vendors', { ascending:false }).order('display_name'); }),
      q(sb.from('index_registry').select('index_code').eq('is_published', true)).catch(function(){ return []; })
    ]).then(function(r){ MODELS = r[0] || []; r[1].forEach(function(x){ PUB[x.index_code] = 1; });
      if(!MODELS.length){ message($('moMsg'), 'No model is sold by two or more vendors in the latest publication.'); return; }
      var mods = {}, vens = {};
      /* The registry's display name is what people read; the raw name still matches a search. */
      MODELS.forEach(function(m){ m.raw_name = m.model_name; m.model_name = m.display_name || m.model_name; m._k = (m.model_name+' '+m.raw_name).toLowerCase().replace(/[-._\s/]/g,''); if(m.modality) mods[m.modality] = 1; m._v = (m.vendor_names || []).map(vgroup); m._v.forEach(function(v){ vens[v] = 1; }); });
      ddVen.setOptions(Object.keys(vens).sort(function(a, b){ return a.localeCompare(b); }).map(function(v){ return [v, v]; }));
      ddMod.setOptions(Object.keys(mods).sort().map(function(m){ return [m, m]; }));
      var keep = pending; if(!keep){ try{ keep = localStorage.getItem('atMoModel'); }catch(e){} } pending = null;
      pick(MODELS.filter(function(m){ return m.anchor_id === keep; })[0] || MODELS[0]);
    }).catch(function(e){ console.error('[Pricing]', e); message($('moMsg'), 'Prices could not be loaded. Refresh the page, or log in again if the problem persists.'); });
  }
  /* Contracts can open a model here. */
  function openModel(id){ if(!MODELS.length){ pending = id; return; } var m = MODELS.filter(function(x){ return x.anchor_id === id; })[0]; if(m && m !== model) pick(m); }
  return { start:start, open:openModel };
})();

/* ═══ START ═══ */
/* The dashboards read the published date, so each starts once the session and the date are known. */
var SESSION = null;
var ready = new Promise(function(res){
  (window.atomAuthReady || Promise.resolve(null)).then(function(s){
    SESSION = s; if(!s || !window.atomSupabase){ res(); return; }
    sb = window.atomSupabase;
    sb.from('site_config').select('active_date').eq('id', 1).then(function(r){ var d = r && r.data && r.data[0] && r.data[0].active_date; if(d) GATE = String(d).slice(0,10); else sb = null; res(); }, function(){ sb = null; res(); });
  });
});
var _start = { contracts:CS.start, models:MO.start, indexes:IX.start };
CS.start = function(){ ready.then(_start.contracts); };
MO.start = function(){ ready.then(_start.models); };
IX.start = function(){ ready.then(_start.indexes); };
function go(){ if($('atomTP')) return; masthead(); shell(); ready.then(function(){ PINS.start(); }); }
if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go); else go();
})();

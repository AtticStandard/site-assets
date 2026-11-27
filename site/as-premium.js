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
    var b = $('tpTabs').querySelector('[data-k="'+t.key+'"]'); b.setAttribute('aria-selected', on ? 'true' : 'false'); b.tabIndex = on ? 0 : -1;
    var n = document.querySelector('.as-nav .tp-nv[data-k="'+t.key+'"]'); if(n){ n.classList.toggle('as-on', on); if(on) n.setAttribute('aria-current', 'page'); else n.removeAttribute('aria-current'); } });
  if(push && history.replaceState) history.replaceState(null, '', '#'+k);
  if(was && was !== k && !$('tpBar').offsetHeight){ window.scrollTo(0, 0); }
  else if(was && was !== k){ var bar = $('tpBar'), y = window.pageYOffset + bar.getBoundingClientRect().top - (parseInt(ROOT.style.getPropertyValue('--tp-bar'), 10) || 102); if(window.pageYOffset > y) window.scrollTo(0, Math.max(0, y)); }
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
  /* On the Terminal the masthead carries the Terminal's views where the site links sit; the site links
     stay in the menu button, and the account stays after the divider. Phones keep the strip under it. */
  var nav = m.querySelector('.as-nav');
  if(nav){ var first = nav.querySelector('.as-rule') || nav.firstChild;
    DASH.forEach(function(t){ var l = document.createElement('a'); l.className = 'tp-nv'; l.href = '#'+t.key; l.dataset.k = t.key; l.textContent = t.label;
      l.addEventListener('click', function(e){ e.preventDefault(); show(t.key, true); }); nav.insertBefore(l, first); }); }
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
  + '<div class="tp-tw tp-ltw"><table class="tp-ld" id="ixT"></table></div></section>'
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
  var wkN = 0, PHONE = window.matchMedia('(max-width: 767px)');
  /* On a phone the table shows the selected leg only; the tiles above switch it. */
  if(PHONE.addEventListener) PHONE.addEventListener('change', function(){ if(D) week(); });
  function week(){
    var K = S.K, d = D.W[K], c = cur, my = ++wkN;
    $('ixWkT').textContent = d ? 'Week of '+ldate(d) : '';
    $('ixPrev').disabled = K <= 0; $('ixNext').disabled = K >= D.W.length-1;
    if(!d){ $('ixT').innerHTML = ''; return; }
    var o = cache[c] && cache[c].WK[d], t = $('ixT');
    if(!o || !o.done) t.classList.add('busy');
    /* Stepping quickly through weeks fetches only the one it settles on. */
    (o ? Promise.resolve() : new Promise(function(r){ setTimeout(r, 140); })).then(function(){ if(my !== wkN) return null; return getWeek(c, d); }).then(function(X){ if(my !== wkN) return; if(cache[c] && cache[c].WK[d]) cache[c].WK[d].done = true; t.classList.remove('busy');
      if(!X){ t.className = 'tp-ld'; t.innerHTML = '<tbody><tr><td class="d">No model detail is stored for this week.</td></tr></tbody>'; return; }
      weekDraw(X); })
    .catch(function(e){ if(my !== wkN) return; console.error('[Indexes week]', e); t.classList.remove('busy'); t.className = 'tp-ld'; t.innerHTML = '<tbody><tr><td class="d">This week could not be loaded. Try again.</td></tr></tbody>'; });
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
    /* The ledger: no fills. The selected leg is marked by brighter figures and a rule under its name; the
       developer and vendor count sit with the model; prices keep their decimals for alignment with the
       trailing zeros dimmed; Effect carries a bar from a zero line, scaled to the week's largest move. */
    var LV = PHONE.matches ? [cur2] : LS, NL = LV.length, N = 1 + NL*4, cy = sym() === '$' ? 'USD' : sym() === '€' ? 'EUR' : 'CNY';
    function on(g){ return g === cur2 ? ' on' : ' off'; }
    function pz(v){ return v == null ? '' : esc(px(v)); }
    function sub(r){ return '<em>'+(r.dev ? esc(r.dev)+'<span class="tp-dot"> &middot; </span>' : '')+r.nv+(r.nv === 1 ? ' vendor' : ' vendors')+'</em>'; }
    var h = '<thead><tr class="tp-hg"><th class="tp-unit">Prices in '+cy+' '+esc(D.unit || '')+'; a model&rsquo;s price is the median of its vendors</th>'+LV.map(function(g){ return '<th class="tp-gp'+on(g)+'"></th><th colspan="3" class="tp-lgh'+on(g)+'"><span>'+NM[g]+'</span></th>'; }).join('')+'</tr>'
      + '<tr class="tp-hc"><th>Model</th>'+LV.map(function(g){ var o = on(g); return '<th class="tp-gp tp-w0'+o+'"></th><th class="r tp-w1'+o+'">Price</th><th class="r tp-w2'+o+'">1 week</th><th class="r tp-w3'+o+'">'+(lv ? 'Effect' : 'Vs spot')+'</th>'; }).join('')+'</tr></thead><tbody>';
    /* No index row: the level, the spot price and their weekly change sit in the tiles right above. */
    function cell(r, g){ var x = r.L[g], o = on(g);
      if(!x || !x.n) return '<td class="tp-gp'+o+'"></td><td class="r d'+o+'">Not priced</td><td class="'+o.trim()+'"></td><td class="'+o.trim()+'"></td>';
      var s = IDX[g], dv = s.s ? (x.md/s.s-1)*100 : null, sig = Math.abs(x.ef) >= 0.005;
      var w = x.chg == null || Math.abs(x.chg) < 0.05 ? '' : chg(x.chg, 1);
      var e = lv ? (sig ? '<span class="'+(x.ef < 0 ? 'tp-dn' : 'tp-up')+'">'+eff(x.ef)+'</span>' : '')
                 : (dv == null ? '' : '<span class="d">'+(Math.abs(dv) < 0.05 ? 'At spot' : (Math.abs(dv) >= 100 ? Math.round(Math.abs(dv)).toLocaleString('en-US') : Math.abs(dv).toFixed(1))+'% '+(dv > 0 ? 'above' : 'below'))+'</span>');
      return '<td class="tp-gp'+o+'"></td><td class="r'+o+'">'+pz(x.md)+'</td><td class="r'+o+'">'+w+'</td><td class="r'+o+'">'+e+'</td>'; }
    function vrows(r){
      var V = {}, keys = [];
      LS.forEach(function(g){ if(r.L[g]) r.L[g].vs.forEach(function(q){ var k = q.v.v+'|'+q.v.t; if(!V[k]){ V[k] = { v:q.v.v, t:q.v.t, P:{} }; keys.push(k); } V[k].P[g] = q; }); });
      var out = keys.map(function(k){ var z = V[k]; z.sp = z.P[cur2] ? z.P[cur2].p : 1e9; z.isNew = HP && LS.every(function(g){ return !z.P[g] || z.P[g].p0 == null; }); return z; })
        .sort(function(a, b){ return a.sp - b.sp || a.v.localeCompare(b.v); });
      return out.map(function(z){ return '<tr class="tp-vr"><td><span class="tp-vn">'+esc(z.v)+(z.isNew ? '<span class="tp-nw">New</span>' : '')+'<em>'+esc(z.t)+'</em></span></td>'
        + LV.map(function(g){ var q = z.P[g], o = on(g), mv = q && q.p0 != null && Math.abs(q.p/q.p0-1) > 0.005;
          return '<td class="tp-gp'+o+'"></td><td class="r'+o+'">'+(q ? (mv ? '<span class="tp-was">'+pz(q.p0)+'</span>' : '')+pz(q.p) : '')+'</td><td class="r'+o+'">'+(mv ? chg((q.p/q.p0-1)*100, 1) : '')+'</td><td class="'+o.trim()+'"></td>'; }).join('')+'</tr>'; }).join('')
        + '<tr class="tp-vgo"><td colspan="'+N+'">'+(r.nv >= 2 ? '<button class="tp-link" type="button" data-go="'+esc(r.a)+'">Open '+esc(r.nm)+' in Models &rarr;</button>' : '')+'</td></tr>';
    }
    function mrow(r){ var o = !!(S.open && S.open[r.a]);
      return '<tr class="pick'+(o ? ' sel' : '')+'" tabindex="0" data-a="'+esc(r.a)+'" aria-expanded="'+o+'"><td><span class="tp-mn"><svg class="tp-chev'+(o ? ' open' : '')+'" viewBox="0 0 12 12" aria-hidden="true"><path d="M4.5 2.5 8 6 4.5 9.5"></path></svg><b>'+esc(r.nm)+'</b>'+(r.isNew ? '<span class="tp-nw">New</span>' : '')+sub(r)+'</span></td>'
        + LV.map(function(g){ return cell(r, g); }).join('')+'</tr>'+(o ? vrows(r) : ''); }
    function grp(t, n, note, rowsH, fold, tot){
      var head = '<span class="tp-lbl">'+t+'</span><span class="c">'+n+'</span>'+(note ? '<span class="hn">'+note+'</span>' : '')+(fold || '');
      if(!tot) return '<tr class="tp-gr"><td colspan="'+N+'">'+head+'</td></tr>'+rowsH;
      return '<tr class="tp-gr"><td colspan="4">'+head+'</td>'+LV.map(function(g, i){ var v = tot[g], o = on(g);
        return (i ? '<td class="tp-gp'+o+'"></td><td colspan="2" class="'+o.trim()+'"></td>' : '')+'<td class="r'+o+'">'+(Math.abs(v) >= 0.005 ? '<span class="tp-sum '+(v < 0 ? 'tp-dn' : 'tp-up')+'">'+eff(v)+'</span>' : '')+'</td>'; }).join('')+'</tr>'+rowsH; }
    var w = X.d, lo = X.pd || '0000';
    function when(a){ return a.st === 'admitted' ? a.vt : a.vf || a.dt; }
    var adm = (X.adm || []).filter(function(a){ var x = when(a); return x && String(x).slice(0, 10) <= w && String(x).slice(0, 10) > lo; });
    var left = adm.filter(function(a){ return (a.st === 'admitted' && a.vt) || (a.st === 'excluded' && a.vf); }).map(function(a){ return { nm:a.nm, rule:RULE[a.rc] || '', why:clean(a.r) }; });
    Object.keys(prevAny).forEach(function(a){ if(!curAny[a] && !left.some(function(x){ return x.nm === nm(a); })) left.push({ nm:nm(a), rule:'', why:'Out of the basket from this week.' }); });
    var away = adm.filter(function(a){ return a.st === 'excluded' && !a.vf; }).map(function(a){ return { nm:a.nm, rule:RULE[a.rc] || '', why:clean(a.r) }; });
    function xrows(X){ return X.map(function(x){ return '<tr class="tp-xr"><td><span class="tp-mn"><b>'+esc(x.nm)+'</b></span></td><td colspan="'+(N-1)+'" class="tp-xw">'+(x.rule ? '<span class="tp-tag2">'+esc(x.rule)+'</span>' : '')+esc(x.why)+'</td></tr>'; }).join(''); }
    /* The same groups and order in both measures; only the last column changes (Effect or Vs spot). */
    var se = function(r){ return r.L[cur2] ? Math.abs(r.L[cur2].ef) : 0; }, by = function(a, b){ return se(b) - se(a) || b.mx - a.mx || b.nv - a.nv || a.nm.localeCompare(b.nm); };
    var mv = rows.filter(function(r){ return r.moved; }).sort(by), nw = rows.filter(function(r){ return !r.moved && r.isNew; }).sort(by);
    var rp = rows.filter(function(r){ return !r.moved && !r.isNew && r.rep; }).sort(by), ns = rows.filter(function(r){ return !r.moved && !r.isNew && !r.rep; }).sort(by);
    if(mv.length) h += grp('Moved the index', mv.length, '', mv.map(mrow).join(''));
    if(rp.length) h += grp('Repriced at a vendor', rp.length, 'no effect on the level', rp.map(mrow).join(''));
    if(nw.length) h += grp('Joined the basket', nw.length, 'new this week; they count toward the level from their second priced week', nw.map(mrow).join(''));
    var keep = mv.length || rp.length || nw.length ? 0 : 6, all = S.all;
    if(ns.length) h += grp('No change', ns.length, 'no price change at any vendor, on any leg', (all ? ns : ns.slice(0, keep)).map(mrow).join(''),
      ns.length > keep ? '<button class="tp-link tp-fold" type="button" data-fold="1">'+(all ? 'Hide' : keep ? 'Show all '+ns.length : 'Show')+'</button>' : '');
    if(left.length) h += grp('Left the basket', left.length, '', xrows(left));
    if(away.length) h += grp('Not admitted', away.length, '', xrows(away));
    $('ixT').className = 'tp-ld n'+LV.length;
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
    /* One line: the unit already heads the week table. */
    $('ixSrc').textContent = 'Source: Attic Standard, index levels, spot prices and vendor prices published '+ldate(D.date)+', administered with reference to the IOSCO Principles for Financial Benchmarks.';
  }
  /* The citation is for the week on screen, so any past week can be quoted exactly. */
  function cite(b){ if(!D) return; var G = D.LG[S.leg], wd = D.W[S.K], l = G.S.filter(function(x){ return x.d === wd; })[0] || G.S[G.S.length-1];
    copy(b, 'Attic Standard, '+cur+' ('+ixName(cur)+'), '+NM[S.leg].toLowerCase()+' leg, '+(S.bk === 'coh' ? 'caching cohort' : 'all models')+', week of '+ldate(l.d)+': index level '+l.l.toFixed(2)+(l.s != null ? ', spot price '+sym()+fx(l.s)+' '+(D.unit || '') : '')+'. atticstandard.com'); }

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
    $('ixMode').addEventListener('click', function(e){ var b = e.target.closest('[data-m]'); if(!b || b.dataset.m === S.mode || !D) return; S.mode = b.dataset.m; controls(); tiles(); chart(); week(); });
    $('ixBk').addEventListener('click', function(e){ var b = e.target.closest('[data-b]'); if(!b || b.dataset.b === S.bk || !D) return; S.leg = SW[S.leg][b.dataset.b]; S.bk = b.dataset.b; fixLeg(); S.open = null; S.all = false; render(); });
    $('ixTiles').addEventListener('click', function(e){ var b = e.target.closest('[data-leg]'); if(!b || b.dataset.leg === S.leg) return; S.leg = b.dataset.leg; beh(); tiles(); chart(); week(); });
    $('ixPrev').addEventListener('click', function(){ if(D && S.K > 0) pickWeek(D.W[S.K-1]); });
    $('ixNext').addEventListener('click', function(){ if(D && S.K < D.W.length-1) pickWeek(D.W[S.K+1]); });
    hover($('ixChW'), $('ixCh'), function(p){ var s = p.w, lv = S.mode === 'lv', inW = D.WI[s.d] != null;
      return '<div class="t">Week of '+ldate(s.d)+'</div>'+NM[S.leg]+(lv ? ' index <b>'+s.l.toFixed(2)+'</b> '+(s.w == null ? '' : chg(s.w, 2)) : ' spot <b>'+px(s.s)+'</b>')
        +'<br><span class="t">'+(!inW ? '' : D.WI[s.d] === S.K ? 'Selected' : 'Select to see the models')+'</span>'; });
    $('ixChW').addEventListener('click', function(e){ var G = $('ixCh')._geo; if(!G) return; var r = $('ixCh').getBoundingClientRect(), f = (e.clientX - r.left)/r.width, best = null, bd = 1e9;
      G.pts.forEach(function(p){ var x = Math.abs(p.f - f); if(x < bd){ bd = x; best = p; } }); if(best) pickWeek(best.w.d); });
    $('ixChW').tabIndex = 0; $('ixChW').setAttribute('aria-label', 'Chart. Use the left and right arrow keys to choose a week.');
    $('ixChW').addEventListener('keydown', function(e){ if(!D || (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight')) return; e.preventDefault(); var n = D.W[S.K + (e.key === 'ArrowRight' ? 1 : -1)]; if(n) pickWeek(n); });
    /* Any number of models can be open at once; a second click closes only that one. */
    function toggle(tr){ var a = tr.dataset.a; S.open = S.open || {}; if(S.open[a]) delete S.open[a]; else S.open[a] = 1; week(); var n = $('ixT').querySelector('tr[data-a="'+tr.dataset.a+'"]'); if(n) n.focus({ preventScroll:true }); }
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
/* One page per contract, read top to bottom like an index or a model (rebuilt November 27, 2026, on the
   Indexes and Models principles):
     Contracts    every contract on file as a card: the index it follows, what it covers, the latest
                  settled month against the signed value and the term elapsed. A card opens the contract.
     Header       the reference index and the contract's name; the latest month, the contract to date and
                  the term as chips; the other terms in one line.
     Legs         one tile per leg, also the leg selector: the settled level of the month on screen, its
                  change on the month before and since the base, the room to the floor or cap, the value.
     Chart        the monthly bill against the fixed price, or the selected leg's index and settled level.
     The month    every covered model that month: each leg's settled and signed rate and its share of the
                  commitment, and the model's value against signed; a model opens to its market. The
                  month steps back and forward, and the citation follows it. */
function contractsHTML(){
  var L = '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M7.5 2.5 4 6l3.5 3.5"></path></svg>', R = '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M4.5 2.5 8 6 4.5 9.5"></path></svg>';
  return '<section class="tp-dash" id="tpContracts" role="tabpanel" aria-label="Contracts" hidden>'
  + '<section class="tp-pins" id="csCards" aria-label="Contracts" hidden><div class="tp-bh"><p class="tp-lbl">Contracts</p><span class="tp-bn" id="csCardN"></span></div><div class="tp-pc" id="csPc"></div></section>'
  + '<div id="csMsg"></div><div class="tp-ix" id="csBody" hidden><div class="tp-prog" id="csProg" hidden></div>'
  + '<div class="tp-ixh"><div class="tp-ixt"><p class="tp-code" id="csCode"></p><h2 class="tp-h" id="csName"></h2></div><div class="tp-cg" id="csCg"></div><p class="tp-facts" id="csFacts"></p></div>'
  + '<div class="tp-notice" id="csNote" hidden></div>'
  + '<section class="tp-blk tp-lgs" id="csLegsS"><div class="tp-ctl"><div class="as-vt" id="csView" role="group" aria-label="Chart"><button type="button" class="as-vt-b" data-v="bill">Monthly bill</button><button type="button" class="as-vt-b" data-v="lv">Index and settled level</button></div><span class="tp-bn" id="csCtlN"></span></div>'
  + '<div class="tp-tiles" id="csTiles" role="group" aria-label="Leg"></div>'
  + '<div class="tp-chw"><div class="as-lgv" id="csLg"></div><div class="tp-ch" id="csChW"><div id="csCh"></div><div class="tp-hv" hidden></div><div class="tp-tip" hidden></div></div></div></section>'
  + '<section class="tp-wk" id="csWk"><div class="tp-wkh"><button type="button" class="tp-stp" id="csPrev" aria-label="Previous month">'+L+'</button><h3 class="tp-st" id="csMoT"></h3><button type="button" class="tp-stp" id="csNext" aria-label="Next month">'+R+'</button><span class="tp-bn tp-wkn" id="csMoN"></span></div>'
  + '<div class="tp-tw tp-ltw"><table class="tp-ld" id="csT"></table></div></section>'
  + '<div class="tp-foot"><p class="as-note" id="csSrc"></p><div class="tp-ln"><button class="tp-link" id="csCite" type="button">Copy citation</button><a class="tp-link" href="/clause">How the Clause works &rarr;</a></div></div>'
  + '</div></section>';
}

var CS = (function(){
  var ORDER = ['input','cached','output'], LEG = { input:'Input', cached:'Cached input', output:'Output' }, FVD = { input:'Input', cached:'Cached Input', output:'Output' };
  var RULE = { monthly_average:'Settled on the monthly average', quarterly_in_advance:'Set a quarter in advance' }, LIMIT = { floor:'Floor', cap:'Cap', band:'Threshold' }, NEAR = 2;
  var L = [], SUM = {}, c0 = null, reqN = 0, D = null, leg = null, K = 0, open = {}, view = 'bill', PHONE = window.matchMedia('(max-width: 767px)');
  try{ view = localStorage.getItem('atCsView') === 'lv' ? 'lv' : 'bill'; }catch(e){}
  function num(v){ return v == null ? null : Number(v); }
  function usd(v){ return '$'+Math.round(Math.abs(Number(v))).toLocaleString('en-US'); }
  function big(v){ v = Number(v); return v >= 1e6 && v%1e5 === 0 ? '$'+(v/1e6)+'M' : usd(v); }
  function rate(v){ return '$'+Number(v).toFixed(6); }
  function lv(v){ return Number(v).toFixed(2); }
  function chg2(d){ return chg(d, 2); }
  function mon(ym){ return MN[+ym.slice(5,7)-1]; }
  function ixc(c){ return c.index_code === 'BLEND' ? 'Blend of three indexes' : c.index_code; }

  /* ── The cards: every contract on file, its latest settled month from one query for all ── */
  function summarise(rows){
    var by = {}; rows.forEach(function(r){ var c = by[r.contract_id] = by[r.contract_id] || {}; (c[r.ym] = c[r.ym] || []).push(r); });
    L.forEach(function(c){ var M = by[c.contract_id] || {}, n = 0, last = null, fx = 0, ix = 0;
      Object.keys(M).sort().forEach(function(ym){ var R = M[ym]; if(!R.length || R.some(function(r){ return r.settled_level == null || r.provisional; })) return;
        n++; last = { ym:ym, fx:R.reduce(function(a, r){ return a + num(r.fixed_usd); }, 0), ix:R.reduce(function(a, r){ return a + num(r.indexed_usd); }, 0) }; });
      SUM[c.contract_id] = { n:n, last:last }; });
  }
  function cards(){
    var el = $('csPc'); $('csCards').hidden = !L.length;
    var sim = L.filter(function(c){ return c.is_illustrative; }).length;
    $('csCardN').textContent = sim ? (sim === L.length ? 'Simulated contracts' : sim+' simulated')+' follow the same settlement rules as signed ones' : L.length+' on file';
    el.innerHTML = L.map(function(c){ var s = SUM[c.contract_id] || {}, m = s.last, sel = c === c0, p = String(c.label).split(': ');
      return '<div class="tp-pcd'+(sel ? ' on' : '')+'" role="button" tabindex="0" data-c="'+esc(c.contract_id)+'" aria-pressed="'+sel+'">'
        + '<p class="tp-code">'+esc(ixc(c))+'</p><p class="tp-pn">'+esc(p[0])+'</p><p class="tp-pd">'+esc(p.slice(1).join(': '))+'</p>'
        + '<div class="tp-plg tp-plc">'+(m ? '<span class="tp-pk">'+mon(m.ym)+' settled</span><b>'+usd(m.ix)+'</b>'+(chg2((m.ix/m.fx-1)*100) || '<span></span>')
          + '<span class="tp-pk">Term</span><b>'+s.n+' of '+c.term_months+'</b><span class="d">months</span>' : '<span class="tp-pk">Not yet settled</span><span></span><span></span>')+'</div></div>'; }).join('');
  }

  /* ── One contract ── */
  function load(c){
    var first = !D; c0 = c; open = {}; cards(); var my = ++reqN;
    if(first){ waiting($('csMsg')); $('csBody').hidden = true; } else { $('csBody').classList.add('busy'); $('csProg').hidden = false; }
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
      return more.then(function(m){ if(my !== reqN) return; done(); D = build(c, r[0], r[1], r[2], m[0], m[1]); K = D.months.length - 1; render(); });
    }).catch(function(e){ if(my !== reqN) return; done(); console.error('[Contracts]', e);
      if(first) message($('csMsg'), 'The contract could not be loaded. Refresh the page, or log in again if the problem persists.'); else flash($('csName'), 'Could not load this contract'); });
    function done(){ $('csBody').classList.remove('busy'); $('csProg').hidden = true; }
  }
  /* Months with every leg settled, weekly levels rebased to the contract base, covered models with
     the latest market. A model row of * is the whole index and has no rate of its own. */
  function build(c, S, CM, WR, MD, FV){
    var legs = ORDER.filter(function(k){ return S.some(function(r){ return r.direction === k; }); });
    var byM = {}; S.forEach(function(r){ (byM[r.ym] = byM[r.ym] || { ym:r.ym, weeks:r.weeks, L:{} }).L[r.direction] = r; });
    var rows = Object.keys(byM).sort().map(function(k){ return byM[k]; });
    function full(m){ return legs.every(function(k){ var r = m.L[k]; return r && r.settled_level != null && !r.provisional; }); }
    function part(m){ return legs.some(function(k){ var r = m.L[k]; return r && r.settled_level != null; }); }
    var months = rows.filter(full), prov = rows.filter(function(m){ return !full(m) && part(m); })[0] || null;
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
  function render(){
    var c = D.c, has = D.months.length;
    if(!leg || D.legs.indexOf(leg) < 0) leg = D.legs[0];
    head(); notice();
    $('csLegsS').hidden = $('csWk').hidden = !has;
    if(has){ controls(); tiles(); chart(); month(); }
    foot();
    $('csMsg').hidden = true; $('csBody').hidden = false;
  }
  function head(){
    var c = D.c, m = D.months[D.months.length-1], fl = num(c.floor_level), cp = num(c.cap_level), th = num(c.threshold_pct);
    var startM = String(c.effective_date).slice(0,7), endM = addM(startM, c.term_months-1), fx = 0, ix = 0;
    D.months.forEach(function(x){ fx += x.fx; ix += x.ix; });
    $('csCode').textContent = ixc(c)+(c.is_illustrative ? ' · Simulated contract' : '');
    $('csName').textContent = c.label;
    var g = [];
    if(m) g.push('<span class="tp-cgl"><span class="tp-lbl">'+mon(m.ym)+' settled</span><span class="tp-np"><b>'+usd(m.ix)+'</b></span><span class="tp-np">'+chg2((m.ix/m.fx-1)*100)+' against '+usd(m.fx)+' signed</span></span>');
    if(D.months.length > 1) g.push('<span class="tp-cgl"><span class="tp-lbl">Contract to date</span><span class="tp-np"><b>'+usd(ix)+'</b></span><span class="tp-np">'+chg2((ix/fx-1)*100)+' against '+usd(fx)+' signed</span></span>');
    g.push('<span class="tp-cgl"><span class="tp-lbl">Term</span><span class="tp-np"><b>'+D.months.length+'</b> of '+c.term_months+' months settled</span></span>');
    if(c.index_code !== 'BLEND'){ var p = String(c.index_code).split(' ');
      g.push('<span class="tp-cgl"><span class="tp-lbl">Reference index</span><button type="button" class="tp-np tp-ixl" data-ix="'+esc(c.index_code)+'" title="'+esc(ixName(c.index_code))+'">'+esc(p[1]+(p[2] !== 'GLB' ? ' '+p[2] : ''))+'</button></span>'); }
    $('csCg').innerHTML = g.join('<span class="tp-cgd" aria-hidden="true"></span>');
    var F = [(c.form === 'differential' ? 'Differential' : 'Ratio')+(D.legs.length > 1 ? ', '+['','one','two','three'][D.legs.length]+' legs' : ', '+LEG[D.legs[0]].toLowerCase()),
      'Base '+mname(c.base_period)+' = 100', c.reset_months > 1 ? RULE.quarterly_in_advance : (RULE[c.settlement_rule] || c.settlement_rule),
      fl != null && cp != null ? 'Floor '+fl+', cap '+cp : fl != null ? 'Floor '+fl : cp != null ? 'Cap '+cp : null,
      th != null ? 'Threshold '+th+'% either side of base' : null,
      ldate(c.effective_date)+' to '+ldate(iso(utc(addM(endM,1)+'-01') - 864e5)),
      c.annual_commitment_usd != null ? big(c.annual_commitment_usd)+' a year'+(c.terms && c.terms.commitment === 'minimum_spend' ? ', minimum commitment' : '') : null,
      D.M.length ? D.M.length+' model'+(D.M.length === 1 ? '' : 's') : 'The whole index', 'A successor model keeps the rate'].filter(Boolean);
    $('csFacts').textContent = F.join(' · ');
  }
  /* One line, only when a leg settled at its floor or cap, or within 2% of it, in the latest month. */
  function notice(){
    var m = D.months[D.months.length-1], fl = num(D.c.floor_level), cp = num(D.c.cap_level), el = $('csNote'), h = '';
    if(m) D.legs.some(function(k){ var r = m.L[k], v = num(r.settled_level), w = D.W[k][D.W[k].length-1], t = '';
      if(r.limit_applied === 'floor' || r.limit_applied === 'cap') t = LEG[k]+' settled at its '+r.limit_applied+' in '+mon(m.ym)+', '+lv(v)+' against an index average of '+lv(r.index_level)+'.';
      else if(fl != null && (v-fl)/v*100 < NEAR) t = LEG[k]+' settled '+((v-fl)/v*100).toFixed(1)+'% above its floor.';
      else if(cp != null && (cp-v)/v*100 < NEAR) t = LEG[k]+' settled '+((cp-v)/v*100).toFixed(1)+'% below its cap.';
      if(!t) return false;
      h = '<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="7" fill="none" stroke="currentColor" stroke-width="1.4"/><line x1="8" y1="4.5" x2="8" y2="9" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><circle cx="8" cy="11.5" r="0.9" fill="currentColor"/></svg><p>'+t+(w ? ' <span>The week of '+ldate(w.d)+' closed at '+lv(w.v)+'.</span>' : '')+'</p>';
      return true; });
    if(!D.months.length) h = '<p>The first month settles once its index levels are published.</p>';
    el.innerHTML = h; el.hidden = !h;
  }

  /* ── Legs: the chart switch and one tile per leg, for the month on screen ── */
  function controls(){
    $('csView').querySelectorAll('[data-v]').forEach(function(b){ b.setAttribute('aria-selected', String(b.dataset.v === view)); });
    $('csCtlN').textContent = 'Settled level, base '+mname(D.c.base_period)+' = 100';
  }
  function tiles(){
    var m = D.months[K], pm = K > 0 ? D.months[K-1] : null, fl = num(D.c.floor_level), cp = num(D.c.cap_level), lim = fl != null ? 'floor' : cp != null ? 'cap' : null;
    $('csTiles').className = 'tp-tiles n'+D.legs.length;
    $('csTiles').innerHTML = D.legs.map(function(k){ var r = m.L[k], v = num(r.settled_level), pv = pm ? num(pm.L[k].settled_level) : null, on = k === leg;
      var room = lim === 'floor' ? (v-fl)/v*100 : lim === 'cap' ? (cp-v)/v*100 : null;
      var C3 = [['1 month', pv ? chg2((v/pv-1)*100) : ''], ['Since base', chg2(v-100)]];
      if(room != null) C3.push([lim === 'floor' ? 'Above floor' : 'Below cap', '<span class="tp-rmv">'+Math.max(0, room).toFixed(1)+'%</span>']);
      return '<button type="button" class="tp-leg'+(on ? ' on' : '')+'" data-leg="'+k+'" aria-pressed="'+on+'"><span class="tp-lbl">'+LEG[k]+(r.limit_applied ? '<span class="tp-flag">'+LIMIT[r.limit_applied]+'</span>' : '')+'</span>'
        + '<span class="tp-lv">'+lv(v)+'</span><span class="tp-c3">'+C3.map(function(c){ return '<span><span class="tp-lbl">'+c[0]+'</span>'+(c[1] || '<span class="d">&mdash;</span>')+'</span>'; }).join('')+'</span>'
        + '<span class="tp-ls">'+usd(r.indexed_usd)+' settled against '+usd(r.fixed_usd)+' signed'+(r.limit_applied ? ', index average '+lv(r.index_level) : '')+'</span></button>'; }).join('');
  }

  /* ── Chart: the monthly bill, or the selected leg's index and settled level ── */
  function chart(){ if(view === 'lv') levels(); else bill(); }
  /* The monthly bill: the shared simulated contract chart, the same drawing as on the Clause page. */
  function bill(){
    var box = $('csCh'), ac = C(); box._geo = null; if(!ac || !ac.contract){ view = 'lv'; controls(); levels(); return; }
    var c = D.c, single = D.legs.length === 1, li = -1, fx = D.months[0].fx;
    if(single) D.months.some(function(m, i){ var a = m.L[D.legs[0]].limit_applied; if(a === 'floor' || a === 'cap'){ li = i; return true; } return false; });
    var S = { fx:fx, months:D.months.map(function(m){ return m.ym; }), pay:D.months.map(function(m){ return m.ix; }),
      unl:li >= 0 ? D.months.map(function(m){ var r = m.L[D.legs[0]]; return r.limit_applied ? num(r.index_level) : null; }) : null, lim:li >= 0 ? D.months[li].L[D.legs[0]].limit_applied : null,
      gate:GATE, from:mon(D.months[0].ym), min:!!(c.terms && c.terms.commitment === 'minimum_spend') };
    mount(box, function(){ var r = ac.contract(S); ac.legend($('csLg'), r.legend); return r.svg; });
  }
  /* The weekly index on the contract base and the monthly settled level, floor and cap dashed; the month on
     screen shaded. */
  function levels(){
    var c = D.c, W = D.W[leg] || [], st = D.months, fl = num(c.floor_level), cp = num(c.cap_level), base = c.base_period, sel = D.months[K];
    var lg = [];
    if(W.length) lg.push({ k:'thin', c:'var(--series)', n:LEG[leg]+' index' });
    lg.push({ k:'line', c:'var(--l1)', n:'Settled level', v:lv(sel.L[leg].settled_level) });
    if(fl != null || cp != null) lg.push({ k:'dash', c:'var(--l4)', n:fl != null && cp != null ? 'Floor and cap' : fl != null ? 'Floor' : 'Cap' });
    C().legend($('csLg'), lg);
    var box = $('csCh');
    mount(box, function(){
      var ch = C(), first = monday(utc(base+'-01')), lastT = Math.max(W.length ? utc(W[W.length-1].d) : first, utc(GATE)), AX = ch.axis(iso(first), iso(monday(lastT - 6*864e5)));
      var vals = W.map(function(w){ return w.v; }).concat(st.map(function(m){ return num(m.L[leg].settled_level); }), [100]);
      if(fl != null) vals.push(fl); if(cp != null) vals.push(cp);
      var lo = Math.min.apply(null, vals) - 2, hi = Math.max.apply(null, vals) + 2, tk = ticks(lo, hi, 4); lo = Math.min(lo, tk[0]); hi = Math.max(hi, tk[tk.length-1]);
      var Y = ch.y(lo, hi), g = [], x0 = ch.X0, x1 = ch.X1;
      function X(t){ return Math.max(x0, Math.min(x1, AX.x(iso(t)))); }
      var bx = X(monday(utc(addM(base,1)+'-01')));
      g.push('<rect x="'+x0+'" y="'+ch.PT+'" width="'+(bx-x0).toFixed(1)+'" height="'+(ch.PB-ch.PT)+'" style="fill:rgba(255,255,255,.025)"></rect>');
      var sa = X(monday(utc(sel.ym+'-01'))), sb2 = X(monday(utc(addM(sel.ym,1)+'-01')));
      g.push('<rect x="'+sa.toFixed(1)+'" y="'+ch.PT+'" width="'+Math.max(0, sb2-sa).toFixed(1)+'" height="'+(ch.PB-ch.PT)+'" style="fill:rgba(255,255,255,.045)"></rect>');
      tk.forEach(function(v){ g.push(ch.rule(Y(v), { cls:'as-s-grid' })); g.push(T(x0, Y(v)-4, String(v))); });
      [fl, cp].forEach(function(v){ if(v != null) g.push(ch.rule(Y(v), { cls:'as-s-bar3', dash:'6 4' })); });
      if(W.length) g.push('<polyline fill="none" class="as-s-series" stroke-width="1.5" stroke-linejoin="round" points="'+W.map(function(w){ return X(utc(w.d)).toFixed(1)+','+Y(w.v).toFixed(1); }).join(' ')+'"></polyline>');
      st.forEach(function(m){ var a = X(monday(utc(m.ym+'-01'))) + 3, b = X(monday(utc(addM(m.ym,1)+'-01'))) - 3, y = Y(num(m.L[leg].settled_level)).toFixed(1);
        if(b > a) g.push('<line x1="'+a.toFixed(1)+'" x2="'+b.toFixed(1)+'" y1="'+y+'" y2="'+y+'" stroke="var(--l1)" stroke-width="3" stroke-linecap="round"'+(m === sel ? '' : ' stroke-opacity=".55"')+'></line>'); });
      if(W.length){ var lw = W[W.length-1]; g.push('<circle cx="'+X(utc(lw.d)).toFixed(1)+'" cy="'+Y(lw.v).toFixed(1)+'" r="4" class="as-f-series"></circle>'); }
      g.push(AX.svg());
      box._geo = { axis:ch.TA/ch.H, pts:W.map(function(w){ return { f:X(utc(w.d))/ch.W, w:w }; }) };
      return ch.svg(g.join(''), LEG[leg]+': weekly index level on the contract base and the monthly settled level'+(fl != null || cp != null ? ', with floor and cap' : ''));
    });
  }
  function pickMonth(i){ if(!D || i == null || i === K || i < 0 || i > D.months.length-1) return; K = i; tiles(); chart(); month(); }

  /* ── The month: every covered model, each leg in its own block, and the model's value ── */
  if(PHONE.addEventListener) PHONE.addEventListener('change', function(){ if(D && D.months.length) month(); });
  function month(){
    var m = D.months[K], LV = PHONE.matches ? [leg] : D.legs, N = 1 + (LV.length+1)*4, last = K === D.months.length-1;
    $('csMoT').textContent = mname(m.ym);
    $('csPrev').disabled = K <= 0; $('csNext').disabled = last;
    $('csMoN').textContent = last && D.prov ? mname(D.prov.ym)+(D.c.reset_months > 1 ? ' is being set' : ' settles once its index levels are published') : '';
    function on(k){ return k === leg ? ' on' : ' off'; }
    var h = '<thead><tr class="tp-hg"><th class="tp-unit">Rates in USD '+esc(D.unit)+'; share is each model&rsquo;s part of the commitment</th>'
      + LV.map(function(k){ return '<th class="tp-gp'+on(k)+'"></th><th colspan="3" class="tp-lgh'+on(k)+'"><span>'+LEG[k]+' <em class="tp-lgl">'+lv(m.L[k].settled_level)+'</em></span></th>'; }).join('')
      + '<th class="tp-gp"></th><th colspan="3" class="tp-lgh tp-lgv"><span>Value</span></th></tr>'
      + '<tr class="tp-hc"><th>Model</th>'+LV.map(function(k){ var o = on(k); return '<th class="tp-gp tp-w0'+o+'"></th><th class="r tp-w1'+o+'">Settled</th><th class="r tp-w2'+o+'">Signed</th><th class="r tp-w3'+o+'">Share</th>'; }).join('')
      + '<th class="tp-gp tp-w0"></th><th class="r tp-w1">Signed</th><th class="r tp-w2">Settled</th><th class="r tp-w3">Vs signed</th></tr></thead><tbody>';
    function val(fx, ix){ return '<td class="tp-gp"></td><td class="r d">'+usd(fx)+'</td><td class="r on">'+usd(ix)+'</td><td class="r on">'+(fx ? chg2((ix/fx-1)*100) : '')+'</td>'; }
    function mval(x){ var fx = 0, ix = 0;
      D.legs.forEach(function(k){ var r = x.r[k], Lk = m.L[k]; if(!r || !(num(Lk.share) > 0)) return; var f = num(Lk.fixed_usd)*r.share/num(Lk.share); fx += f; ix += f*num(Lk.indexed_usd)/num(Lk.fixed_usd); });
      return [fx, ix]; }
    function market(x){ var wk = sdate(GATE);
      return '<tr class="tp-vr"><td><span class="tp-vn">Market median<em>'+esc(wk)+'</em></span></td>'
        + LV.map(function(k){ var r = x.r[k], o = on(k), mk = r && r.mkt, sv = r ? r.signed*num(m.L[k].settled_level)/100 : null;
          return '<td class="tp-gp'+o+'"></td><td class="r'+o+'">'+(mk ? esc(rate(mk.med)) : '')+'</td><td class="r'+o+'"><span class="d">'+(mk ? mk.n+' vendor'+(mk.n === 1 ? '' : 's') : r ? 'No market' : '')+'</span></td><td class="r'+o+'">'+(mk ? chg2((sv/mk.med-1)*100) : '')+'</td>'; }).join('')
        + '<td class="tp-gp"></td><td colspan="3" class="r"><span class="d">Settled rate against the market median</span></td></tr>'
        + '<tr class="tp-vgo"><td colspan="'+N+'">'+(x.vendors >= 2 ? '<button class="tp-link" type="button" data-go="'+esc(x.id)+'">Open '+esc(x.name)+' in Models &rarr;</button>' : '')+'</td></tr>'; }
    function row(x){ var o = !!open[x.id], v = mval(x);
      return '<tr class="pick'+(o ? ' sel' : '')+'" tabindex="0" data-id="'+esc(x.id)+'" aria-expanded="'+o+'"><td><span class="tp-mn"><svg class="tp-chev'+(o ? ' open' : '')+'" viewBox="0 0 12 12" aria-hidden="true"><path d="M4.5 2.5 8 6 4.5 9.5"></path></svg><b>'+esc(x.name)+'</b>'+(x.dev ? '<em>'+esc(x.dev)+'</em>' : '')+'</span></td>'
        + LV.map(function(k){ var r = x.r[k], o2 = on(k); if(!r) return '<td class="tp-gp'+o2+'"></td><td class="r d'+o2+'">Not covered</td><td class="'+o2.trim()+'"></td><td class="'+o2.trim()+'"></td>';
          return '<td class="tp-gp'+o2+'"></td><td class="r'+o2+'">'+esc(rate(r.signed*num(m.L[k].settled_level)/100))+'</td><td class="r'+o2+'"><span class="d">'+esc(rate(r.signed))+'</span></td><td class="r'+o2+'">'+Math.round(r.share*100)+'%</td>'; }).join('')
        + val(v[0], v[1])+'</tr>'+(o ? market(x) : ''); }
    if(D.M.length) h += '<tr class="tp-gr"><td colspan="'+N+'"><span class="tp-lbl">Models</span><span class="c">'+D.M.length+'</span><span class="hn">largest share first; a model opens to its market</span></td></tr>' + D.M.map(row).join('');
    h += '<tr class="tp-ixr"><td>'+(D.M.length ? 'All models' : 'The whole index')+'</td>'
      + LV.map(function(k){ var o = on(k), Lk = m.L[k]; return '<td class="tp-gp'+o+'"></td><td class="r'+o+'">'+(Lk.limit_applied ? '<span class="tp-flag">'+LIMIT[Lk.limit_applied]+'</span>' : '')+'</td><td class="'+o.trim()+'"></td><td class="r'+o+'">'+Math.round(num(Lk.share)*100)+'%</td>'; }).join('')
      + val(m.fx, m.ix)+'</tr>';
    $('csT').className = 'tp-ld n'+(LV.length+1);
    $('csT').innerHTML = h+'</tbody>';
  }
  function foot(){
    $('csSrc').textContent = 'Source: Attic Standard, index levels published '+ldate(GATE)+', administered with reference to the IOSCO Principles for Financial Benchmarks. Settlement: '+(D.c.reset_months > 1 ? 'the average of the last 12 published weeks, set a quarter in advance' : 'the average of the published weeks in each month')+'; base '+mname(D.c.base_period)+' = 100.';
    $('csCite').disabled = !D.months.length;
  }
  /* The citation is for the month on screen, so any settled month can be quoted exactly. */
  function cite(b){ if(!D || !D.months.length) return; var m = D.months[K];
    copy(b, 'Attic Standard, '+D.c.label+' ('+D.c.contract_id+'), '+mname(m.ym)+' settlement against '+D.c.index_code+': '+D.legs.map(function(k){ return LEG[k].toLowerCase()+' '+lv(m.L[k].settled_level); }).join(', ')+' (base '+mname(D.c.base_period)+' = 100). Settled value '+usd(m.ix)+' against '+usd(m.fx)+' at signed rates. Index levels published '+ldate(GATE)+'. atticstandard.com'); }

  function start(){
    waiting($('csMsg'));
    function choose(id){ L.forEach(function(c){ if(c.contract_id === id && c !== c0) load(c); }); }
    $('csPc').addEventListener('click', function(e){ var c = e.target.closest('[data-c]'); if(c) choose(c.dataset.c); });
    $('csPc').addEventListener('keydown', function(e){ if(e.key !== 'Enter' && e.key !== ' ') return; var c = e.target.closest('[data-c]'); if(!c) return; e.preventDefault(); choose(c.dataset.c); });
    $('csCg').addEventListener('click', function(e){ var b = e.target.closest('[data-ix]'); if(!b) return; show('indexes', true); IX.pick(b.dataset.ix); });
    $('csView').addEventListener('click', function(e){ var b = e.target.closest('[data-v]'); if(!b || b.dataset.v === view || !D) return; view = b.dataset.v; try{ localStorage.setItem('atCsView', view); }catch(x){} controls(); chart(); });
    $('csTiles').addEventListener('click', function(e){ var b = e.target.closest('[data-leg]'); if(!b || b.dataset.leg === leg) return; leg = b.dataset.leg; tiles(); if(view === 'lv') chart(); month(); });
    $('csPrev').addEventListener('click', function(){ pickMonth(K-1); });
    $('csNext').addEventListener('click', function(){ pickMonth(K+1); });
    hover($('csChW'), $('csCh'), function(p){ var w = p.w, m = D.months.filter(function(s){ return s.ym === w.d.slice(0,7); })[0], isBase = w.d.slice(0,7) === D.c.base_period;
      return '<div class="t">Week of '+ldate(w.d)+'</div>Index <b>'+lv(w.v)+'</b>'+(m ? '<br>'+mon(m.ym)+' settled <b>'+lv(m.L[leg].settled_level)+'</b>' : isBase ? '<br>Base month' : '<br>Month not yet settled'); });
    /* In the levels chart, a click opens the month it falls in. */
    $('csChW').addEventListener('click', function(e){ var G = $('csCh')._geo; if(!G || !D) return; var r = $('csCh').getBoundingClientRect(), f = (e.clientX - r.left)/r.width, best = null, bd = 1e9;
      G.pts.forEach(function(p){ var x = Math.abs(p.f - f); if(x < bd){ bd = x; best = p; } });
      if(best) D.months.forEach(function(m, i){ if(m.ym === best.w.d.slice(0,7)) pickMonth(i); }); });
    function toggle(tr){ var id = tr.dataset.id; if(open[id]) delete open[id]; else open[id] = 1; month(); var n = $('csT').querySelector('tr[data-id="'+id+'"]'); if(n) n.focus({ preventScroll:true }); }
    $('csT').addEventListener('click', function(e){
      var g = e.target.closest('[data-go]'); if(g){ try{ localStorage.setItem('atMoModel', g.dataset.go); }catch(x){} MO.open(g.dataset.go); show('models', true); return; }
      var tr = e.target.closest('tr[data-id]'); if(tr) toggle(tr); });
    $('csT').addEventListener('keydown', function(e){ if(e.key !== 'Enter' && e.key !== ' ') return; var tr = e.target.closest('tr[data-id]'); if(!tr) return; e.preventDefault(); toggle(tr); });
    $('csCite').addEventListener('click', function(){ cite(this); });
    if(!sb){ message($('csMsg'), 'Contracts load once you are logged in.'); return; }
    q(sb.from('clause_contract').select('*').order('sort_order', { ascending:true }).order('created_at', { ascending:true })).then(function(rows){
      L = rows; if(!L.length){ message($('csMsg'), 'No contracts are on file yet.'); return; }
      var keep = null; try{ keep = localStorage.getItem('atCsContract'); }catch(e){}
      var c = L.filter(function(x){ return x.contract_id === keep; })[0] || L[0];
      q(sb.from('v_clause_settlement').select('contract_id,direction,ym,settled_level,fixed_usd,indexed_usd,provisional').in('contract_id', L.map(function(x){ return x.contract_id; })).limit(5000))
        .then(summarise).catch(function(){}).then(function(){ cards(); });
      load(c);
    }).catch(function(e){ console.error('[Contracts]', e); message($('csMsg'), 'Contracts could not be loaded. Refresh the page, or log in again if the problem persists.'); });
  }
  return { start:start };
})();

/* ═══ MODELS ═══ */
/* One page per model, read top to bottom like an index (rebuilt November 26, 2026, on the Indexes
   principles):
     Pinned       up to five models a subscriber follows: developer, name, every leg with its market
                  median and change on the week. An x unpins; the dashed card opens the finder to pin.
     Finder       one search field with the results under it, a modality switch and a vendor list, in
                  place of the old list on the left.
     Header       developer, modality and tier; the name; vendors, weeks priced and the published
                  indexes that hold the model (each opens that index); the profile in one line.
     Legs         one tile per leg, also the leg selector: market median and its change over a week,
                  a month and since first priced, with the range across vendors. A unit switch when a
                  model is priced in more than one unit.
     Chart        the selected leg: the median and the range from the lowest to the highest vendor;
                  select a week to see its vendors.
     The week     every vendor that week, cheapest first on the selected leg, each leg in its own block
                  (price, change on the week, distance from the median); a vendor opens to its own price
                  changes. Vendors that priced the model before and not this week close the table.
   One query per model (v_fair_value, every leg and week), kept in memory. */
function pricingHTML(){
  var L = '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M7.5 2.5 4 6l3.5 3.5"></path></svg>', R = '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M4.5 2.5 8 6 4.5 9.5"></path></svg>';
  return '<section class="tp-dash" id="tpPricing" role="tabpanel" aria-label="Models" hidden>'
  + '<section class="tp-pins" id="moPins" aria-label="Pinned models" hidden><div class="tp-bh"><p class="tp-lbl">Pinned models</p><span class="tp-bn" id="moPinN"></span></div><div class="tp-pc" id="moPc"></div></section>'
  + '<div class="tp-sel tp-fnd"><span class="tp-lbl">Model</span><div class="tp-fr"><div class="tp-fq" id="moFq"><svg class="tp-fi" viewBox="0 0 16 16" aria-hidden="true"><circle cx="7" cy="7" r="4.6"></circle><path d="M10.4 10.4 14 14"></path></svg>'
  + '<input class="tp-in" id="moQ" type="text" role="combobox" aria-expanded="false" aria-controls="moRes" aria-autocomplete="list" autocomplete="off" spellcheck="false" placeholder="Find a model by name or developer">'
  + '<div class="tp-res" id="moRes" role="listbox" aria-label="Models" hidden></div></div><div class="tp-dd" id="moVen"></div></div>'
  + '<span class="tp-lbl">Modality</span><div class="as-vt" id="moMod" role="group" aria-label="Modality"></div>'
  + '<span class="tp-lbl" id="moYl">Your price</span><div class="tp-yr" id="moYr" role="group" aria-labelledby="moYl"></div></div>'
  + '<div id="moMsg"></div><div class="tp-ix" id="moBody" hidden><div class="tp-prog" id="moProg" hidden></div>'
  + '<div class="tp-ixh"><div class="tp-mh"><div class="tp-ixt"><p class="tp-code" id="moCode"></p><h2 class="tp-h" id="moName"></h2></div><button type="button" class="tp-pinb" id="moPin" aria-pressed="false"></button></div>'
  + '<div class="tp-cg" id="moCg"></div><p class="tp-facts" id="moFacts"></p></div>'
  + '<section class="tp-blk tp-lgs"><div class="tp-ctl"><div class="as-vt" id="moUnits" role="group" aria-label="Unit" hidden></div><span class="tp-bn" id="moCtlN"></span></div>'
  + '<div class="tp-tiles" id="moTiles" role="group" aria-label="Price leg"></div>'
  + '<div class="tp-chw"><div class="as-lgv" id="moLg"></div><div class="tp-ch" id="moChW"><div id="moCh"></div><div class="tp-hv" hidden></div><div class="tp-tip" hidden></div></div></div></section>'
  + '<section class="tp-wk"><div class="tp-wkh"><button type="button" class="tp-stp" id="moPrev" aria-label="Previous week">'+L+'</button><h3 class="tp-st" id="moWkT"></h3><button type="button" class="tp-stp" id="moNext" aria-label="Next week">'+R+'</button></div>'
  + '<div class="tp-tw tp-ltw"><table class="tp-ld" id="moT"></table></div></section>'
  + '<div class="tp-foot"><p class="as-note" id="moSrc"></p><div class="tp-ln"><button class="tp-link" id="moCite" type="button">Copy citation</button><a class="tp-link" href="/methodology">Read the methodology &rarr;</a></div></div>'
  + '</div></section>';
}

var MO = (function(){
  var TIER = { FTR:'Flagship', FLG:'Flagship', MID:'Core', COR:'Core', BDG:'Compact', CMP:'Compact', TASK:'Task-specific' };
  var LEGS = [['Input','Input'],['Cached Input','Cached input'],['Output','Output']], LK = { 'Input':'Input', 'Cached Input':'Cached', 'Output':'Output' };
  var WEIGHTS = { open:'Published weights', 'open-weight':'Published weights, restricted license', 'non-commercial':'Published weights, non-commercial', proprietary:'Unpublished weights' };
  var MODO = ['Text','Multimodal','Image','Video','Voice','Audio'];
  var MODELS = [], BYA = {}, PUB = {}, model = null, ROWS = [], CUR = null, reqN = 0, pending = null, ddVen, mod = '', act = -1, pinMode = false, PINR = null;
  var S = { leg:null, unit:null, K:null, open:{} }, PHONE = window.matchMedia('(max-width: 767px)');
  function fx(v){ v = Number(v); if(!(v > 0)) return '0'; if(v >= 1) return v.toFixed(v >= 100 ? 2 : 4); var d = Math.max(6, Math.ceil(-Math.log10(v))+1); return v.toFixed(Math.min(d, 10)); }
  function px(v){ return v == null ? '' : '$'+fx(v); }
  /* On a pinned card, three significant figures keep three legs side by side. */
  function pc(v){ v = Number(v); if(!(v > 0)) return '$0'; return '$'+(v >= 1 ? v.toFixed(2) : String(+v.toPrecision(3))); }
  function ax$(v, dp){ return '$'+Number(v).toFixed(dp); }
  function legName(l){ for(var i = 0; i < LEGS.length; i++) if(LEGS[i][0] === l) return LEGS[i][1]; return l; }
  function c1(v){ return v == null || isNaN(v) ? '' : chg(Number(v), 1); }
  function vs(p, M){ var d = (p/M-1)*100; return Math.abs(d) < 0.05 ? 'At median' : (Math.abs(d) >= 100 ? Math.round(Math.abs(d)).toLocaleString('en-US') : Math.abs(d).toFixed(1))+'% '+(d > 0 ? 'above' : 'below'); }
  function prevWeek(d){ return iso(utc(d) - 7*864e5); }
  var CARET = '<svg width="11" height="7" viewBox="0 0 11 7" aria-hidden="true"><path d="M1 1 L5.5 5.5 L10 1" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  function DD(el, label, onChange){
    var d = { val:'', opts:[['', label]] };
    el.innerHTML = '<button type="button" class="tp-ddb" aria-haspopup="listbox" aria-expanded="false"><span></span>'+CARET+'</button><div class="tp-ddl" role="listbox" hidden></div>';
    var b = el.firstChild, Lb = el.lastChild, ac = -1;
    function paint(){ b.firstChild.textContent = (d.opts.filter(function(o){ return o[0] === d.val; })[0] || d.opts[0])[1]; }
    function open(){ Lb.innerHTML = d.opts.map(function(o, i){ return '<button type="button" role="option" data-i="'+i+'" aria-selected="'+(o[0] === d.val)+'">'+esc(o[1])+'</button>'; }).join('');
      Lb.hidden = false; el.classList.add('open'); b.setAttribute('aria-expanded','true'); ac = -1; var s = Lb.querySelector('[aria-selected=true]'); if(s) Lb.scrollTop = s.offsetTop - Lb.clientHeight/2; }
    function close(){ Lb.hidden = true; el.classList.remove('open'); b.setAttribute('aria-expanded','false'); }
    function set(i){ d.val = d.opts[i][0]; paint(); close(); onChange(); }
    b.addEventListener('click', function(){ Lb.hidden ? open() : close(); });
    Lb.addEventListener('click', function(e){ var o = e.target.closest('button'); if(o) set(+o.dataset.i); });
    el.addEventListener('keydown', function(e){ if(Lb.hidden){ if(e.key === 'ArrowDown'){ e.preventDefault(); open(); } return; }
      var bs = Lb.querySelectorAll('button');
      if(e.key === 'Escape'){ close(); b.focus(); }
      else if(e.key === 'ArrowDown' || e.key === 'ArrowUp'){ e.preventDefault(); ac = Math.max(0, Math.min(bs.length-1, ac + (e.key === 'ArrowDown' ? 1 : -1))); bs.forEach(function(x, i){ x.classList.toggle('act', i === ac); }); bs[ac].scrollIntoView({ block:'nearest' }); }
      else if(e.key === 'Enter' && ac > -1){ e.preventDefault(); set(ac); b.focus(); } });
    document.addEventListener('click', function(e){ if(!el.contains(e.target)) close(); });
    d.setOptions = function(o){ d.opts = [['', label]].concat(o); paint(); };
    paint(); return d;
  }

  /* ── Pinned models ── */
  var PMAX = 5;
  function pins(){ var p = null; try{ p = JSON.parse(localStorage.getItem('atMoPins') || 'null'); }catch(e){}
    if(!Array.isArray(p)) p = MODELS.slice(0, 4).map(function(m){ return m.anchor_id; });
    return p.filter(function(a){ return BYA[a]; }).slice(0, PMAX); }
  function putPins(p){ try{ localStorage.setItem('atMoPins', JSON.stringify(p)); }catch(e){} PINR = null; }
  /* The cards need each pinned model's median on every leg, this week and last: one query for all. */
  function pinData(P){
    if(PINR && PINR.k === P.join('|')) return PINR.p;
    var pw = prevWeek(GATE);
    var p = all(function(){ return sb.from('v_fair_value').select('anchor_id,gate_date,direction,unit,price').in('anchor_id', P).in('gate_date', [GATE, pw]); })
      .then(function(rows){ var O = {};
        P.forEach(function(a){ var R = rows.filter(function(r){ return r.anchor_id === a; }), L = {};
          LEGS.forEach(function(l){ var now = R.filter(function(r){ return r.direction === l[0] && String(r.gate_date) === GATE; }); if(!now.length) return;
            var cnt = {}; now.forEach(function(r){ cnt[r.unit] = (cnt[r.unit] || 0)+1; }); var u = Object.keys(cnt).sort(function(x, y){ return cnt[y] - cnt[x]; })[0];
            var m1 = med(now.filter(function(r){ return r.unit === u; }).map(function(r){ return Number(r.price); })),
                m0 = med(R.filter(function(r){ return r.direction === l[0] && r.unit === u && String(r.gate_date) === pw; }).map(function(r){ return Number(r.price); }));
            L[l[0]] = [m1, m0 ? (m1/m0-1)*100 : null]; });
          O[a] = L; });
        return O; });
    PINR = { k:P.join('|'), p:p }; return p;
  }
  function drawPins(){
    var box = $('moPins'), el = $('moPc'); if(!el) return; var P = pins(), full = P.length >= PMAX;
    $('moPinN').textContent = P.length+' of '+PMAX; box.hidden = false;
    function card(a, L){ var m = BYA[a], sel = model && model.anchor_id === a;
      return '<div class="tp-pcd'+(sel ? ' on' : '')+'" role="button" tabindex="0" data-pin="'+esc(a)+'" aria-pressed="'+sel+'">'
        + '<button type="button" class="tp-unpin" data-unpin="'+esc(a)+'" aria-label="Unpin '+esc(m.model_name)+'"><svg viewBox="0 0 12 12" aria-hidden="true"><path d="M3 3l6 6M9 3l-6 6"></path></svg></button>'
        + '<p class="tp-code">'+esc(m.creator || '')+'</p><p class="tp-pn">'+esc(m.model_name)+'</p><p class="tp-pd tp-pd1">'+esc([m.modality, m.vendors+' vendors'].filter(Boolean).join(' · '))+'</p>'
        + '<div class="tp-plg">'+(L ? LEGS.filter(function(l){ return L[l[0]]; }).map(function(l){ var v = L[l[0]];
            return '<span class="tp-pk">'+LK[l[0]]+'</span><b>'+pc(v[0])+'</b>'+(v[1] == null || Math.abs(v[1]) < 0.05 ? '<span></span>' : chg(v[1], 1)); }).join('') : '')+'</div></div>'; }
    function paint(D){ el.innerHTML = P.map(function(a){ return card(a, D && D[a]); }).join('') + (full ? '' : '<button type="button" class="tp-padd'+(pinMode ? ' on' : '')+'" data-open="1">+ Pin a model</button>'); }
    paint(null);
    if(P.length) pinData(P).then(function(D){ if(pins().join('|') === P.join('|')) paint(D); }).catch(function(){});
  }
  function togglePin(a){ var p = pins(), i = p.indexOf(a); if(i > -1) p.splice(i, 1); else if(p.length < PMAX) p.push(a); putPins(p); drawPins(); pinBtn(); }
  function pinBtn(){ if(!model) return; var b = $('moPin'), on = pins().indexOf(model.anchor_id) > -1, full = pins().length >= PMAX;
    b.setAttribute('aria-pressed', String(on)); b.disabled = !on && full; b.textContent = on ? 'Pinned' : full ? 'Five pinned' : 'Pin'; b.title = !on && full ? 'Unpin a model to pin this one' : ''; }

  /* ── Your price: the rate a subscriber pays, per leg, kept in this browser. It becomes a row in the week
     table, at its place among the vendors, with its distance from the median. ── */
  function rates(){ try{ return JSON.parse(localStorage.getItem('atMoRates') || '{}') || {}; }catch(e){ return {}; } }
  function myRate(){ var r = rates(), m = model && r[model.anchor_id]; return (m && m[S.unit]) || {}; }
  function putRate(leg, v){ var r = rates(), a = model.anchor_id; r[a] = r[a] || {}; var u = r[a][S.unit] = r[a][S.unit] || {};
    if(v > 0) u[leg] = v; else delete u[leg];
    if(!Object.keys(u).length) delete r[a][S.unit]; if(!Object.keys(r[a]).length) delete r[a];
    try{ localStorage.setItem('atMoRates', JSON.stringify(r)); }catch(e){} }
  function num(v){ v = String(v || '').replace(/[$,\s]/g, ''); var n = Number(v); return v !== '' && n > 0 ? n : null; }
  function yours(){
    var Y = myRate(), any = Object.keys(Y).length;
    $('moYr').innerHTML = CUR.legs.map(function(l){ return '<label class="tp-yi"><span>'+legName(l)+'</span><input class="tp-in" type="text" inputmode="decimal" autocomplete="off" spellcheck="false" data-leg="'+esc(l)+'" placeholder="$0.000000" value="'+(Y[l] ? '$'+fx(Y[l]) : '')+'" aria-label="Your '+legName(l).toLowerCase()+' price, USD '+esc(S.unit)+'"></label>'; }).join('')
      + '<span class="tp-bn">USD '+esc(S.unit)+'. Kept in this browser only.</span><button type="button" class="tp-link" id="moYc"'+(any ? '' : ' hidden')+'>Clear</button>';
  }

  /* ── Finder ── */
  function norm(s){ return String(s || '').toLowerCase().replace(/[-._\s/]/g, ''); }
  function matches(){
    var t = norm($('moQ').value), vn = ddVen.val;
    return MODELS.filter(function(m){ return (!mod || m.modality === mod) && (!vn || m._v.indexOf(vn) > -1) && (!t || m._k.indexOf(t) > -1); });
  }
  function results(){
    var r = matches(), shown = r.slice(0, 12), t = $('moQ').value.trim(), el = $('moRes');
    var head = pinMode ? 'Choose a model to pin' : (!t && !mod && !ddVen.val ? 'Most widely sold' : int(r.length)+' model'+(r.length === 1 ? '' : 's'));
    act = Math.min(act, shown.length-1);
    el.innerHTML = '<div class="tp-rh"><span class="tp-lbl">'+head+'</span><span class="tp-bn">'+(r.length > shown.length ? 'Showing 12 of '+int(r.length)+'. Type to narrow.' : 'Each sold by two or more vendors.')+'</span></div>'
      + (shown.length ? shown.map(function(m, i){ var on = model && m.anchor_id === model.anchor_id, pn = pins().indexOf(m.anchor_id) > -1;
          return '<button type="button" role="option" id="moRo'+i+'" class="tp-ri'+(i === act ? ' act' : '')+'" data-id="'+esc(m.anchor_id)+'" aria-selected="'+(i === act)+'"><span class="n"><b>'+esc(m.model_name)+'</b><em>'+esc([m.creator, m.modality, TIER[m.tier]].filter(Boolean).join(' · '))+'</em></span>'
            + '<span class="v">'+m.vendors+' vendors</span><span class="p">'+(pinMode ? (pn ? 'Pinned' : 'Pin') : on ? 'Open' : '')+'</span></button>'; }).join('')
        : '<p class="tp-note tp-rn">No model matches. Try the developer&rsquo;s name, or clear the filters.</p>');
    $('moQ').setAttribute('aria-activedescendant', act > -1 ? 'moRo'+act : '');
    return shown;
  }
  function openRes(){ var el = $('moRes'); results(); el.hidden = false; $('moQ').setAttribute('aria-expanded', 'true'); }
  function closeRes(){ $('moRes').hidden = true; $('moQ').setAttribute('aria-expanded', 'false'); act = -1; if(pinMode){ pinMode = false; drawPins(); } }
  function choose(id){ var m = BYA[id]; if(!m) return;
    if(pinMode){ var p = pins(); if(p.indexOf(id) < 0 && p.length < PMAX){ p.push(id); putPins(p); } }
    closeRes(); $('moQ').value = ''; $('moQ').blur(); drawPins(); if(m !== model) pick(m); else pinBtn(); }
  function modRow(){ var ms = MODO.filter(function(k){ return MODELS.some(function(m){ return m.modality === k; }); });
    MODELS.forEach(function(m){ if(m.modality && ms.indexOf(m.modality) < 0) ms.push(m.modality); });
    $('moMod').innerHTML = [['', 'All']].concat(ms.map(function(k){ return [k, k]; })).map(function(it){ return '<button type="button" class="as-vt-b" data-k="'+esc(it[0])+'" aria-selected="'+(it[0] === mod)+'">'+esc(it[1])+'</button>'; }).join(''); }

  /* ── One model ── */
  function pick(m){
    model = m; var my = ++reqN, first = !CUR;
    if(first){ waiting($('moMsg')); $('moBody').hidden = true; } else { $('moBody').classList.add('busy'); $('moProg').hidden = false; }
    try{ localStorage.setItem('atMoModel', m.anchor_id); }catch(e){}
    drawPins();
    var mem = q(sb.from('index_membership_snapshot').select('index_code').eq('anchor_id', m.anchor_id).eq('in_basket', true).limit(1000)).catch(function(){ return []; });
    Promise.all([all(function(){ return sb.from('v_fair_value').select('gate_date,vendor_id,vendor_name,vendor_type,direction,unit,price').eq('anchor_id', m.anchor_id).order('gate_date'); }), mem])
      .then(function(r){ if(my !== reqN) return; ROWS = r[0]; var s = {}; r[1].forEach(function(x){ if(PUB[x.index_code]) s[x.index_code] = 1; }); m._ix = Object.keys(s).sort();
        S.open = {}; S.unit = null; S.K = null; done();
        if(!ROWS.some(function(x){ return String(x.gate_date) === GATE; })){ $('moBody').hidden = true; message($('moMsg'), 'This model has no price in the latest publication.'); return; }
        render(); $('moMsg').hidden = true; $('moBody').hidden = false; })
      .catch(function(e){ if(my !== reqN) return; done(); console.error('[Models]', e);
        if(first) message($('moMsg'), 'Prices for this model could not be loaded. Refresh the page, or log in again if the problem persists.'); else flash($('moName'), 'Could not load '+m.model_name); });
    function done(){ $('moBody').classList.remove('busy'); $('moProg').hidden = true; }
  }
  /* Units: the one most vendors use first. Legs: those priced in that unit in the latest week. */
  function prep(){
    var cnt = {}; ROWS.forEach(function(r){ if(String(r.gate_date) === GATE) cnt[r.unit] = (cnt[r.unit] || 0)+1; });
    var units = Object.keys(cnt).sort(function(a, b){ return cnt[b] - cnt[a]; });
    if(!S.unit || !cnt[S.unit]) S.unit = units[0];
    var R = ROWS.filter(function(r){ return r.unit === S.unit; }), V = {}, ds = {};
    R.forEach(function(r){ var d = String(r.gate_date); ds[d] = 1;
      var v = V[r.vendor_id] || (V[r.vendor_id] = { id:r.vendor_id, name:vgroup(r.vendor_name), type:channel(r.vendor_type), P:{} });
      (v.P[r.direction] = v.P[r.direction] || {})[d] = Number(r.price); });
    var W = Object.keys(ds).sort(), legs = LEGS.map(function(l){ return l[0]; }).filter(function(l){ return R.some(function(r){ return r.direction === l && String(r.gate_date) === GATE; }); });
    var vs = Object.keys(V).map(function(k){ return V[k]; });
    /* Each leg by week: median, lowest, highest, vendors. */
    var E = {}; legs.forEach(function(l){ E[l] = W.map(function(d){ var a = []; vs.forEach(function(v){ var p = v.P[l] && v.P[l][d]; if(p > 0) a.push(p); }); return a.length ? { d:d, m:med(a), lo:Math.min.apply(null, a), hi:Math.max.apply(null, a), n:a.length } : null; }); });
    vs.forEach(function(v){ var f = null; W.forEach(function(d){ if(f) return; if(legs.some(function(l){ return v.P[l] && v.P[l][d] > 0; })) f = d; }); v.first = f; });
    if(!S.leg || legs.indexOf(S.leg) < 0) S.leg = legs.indexOf('Output') > -1 ? 'Output' : legs[0];
    if(S.K == null || S.K > W.length-1) S.K = W.length-1;
    CUR = { units:units, legs:legs, W:W, V:V, vs:vs, E:E };
  }
  function render(){ prep(); head(); yours(); controls(); tiles(); chart(); week(); foot(); }
  function head(){
    var m = model, C = CUR, now = C.vs.filter(function(v){ return C.legs.some(function(l){ return v.P[l] && v.P[l][GATE] > 0; }); }).length;
    $('moCode').textContent = [m.creator, m.modality, TIER[m.tier]].filter(Boolean).join(' · ');
    $('moName').textContent = m.model_name; pinBtn();
    var ix = m._ix || [];
    $('moCg').innerHTML = '<span class="tp-cgl"><span class="tp-np"><b>'+now+'</b> vendors</span><span class="tp-np"><b>'+C.W.length+'</b> weeks priced, since '+esc(ldate(C.W[0]))+'</span></span>'
      + (ix.length ? '<span class="tp-cgd" aria-hidden="true"></span><span class="tp-cgl"><span class="tp-lbl">In '+ix.length+' published '+(ix.length === 1 ? 'index' : 'indexes')+'</span>'
        + ix.map(function(c){ var p = c.split(' '); return '<button type="button" class="tp-np tp-ixl" data-ix="'+esc(c)+'" title="'+esc(ixName(c))+'">'+esc(p[1]+(p[2] !== 'GLB' ? ' '+p[2] : ''))+'</button>'; }).join('')+'</span>' : '');
    $('moFacts').textContent = facts(m);
  }
  function ctx(n){ n = Number(n); if(!(n > 0)) return null; if(n >= 1e6) return (Math.round(n/1e5)/10).toString().replace(/\.0$/,'')+'M'; if(n >= 1000) return Math.round(n/1000)+'K'; return String(n); }
  function list2(a){ a = (a || []).map(function(x){ return String(x).toLowerCase(); }); return a.length ? a.join(', ') : null; }
  function ym(t){ var x = /^(\d{4})-(\d{2})/.exec(String(t || '')); return x ? MN[+x[2]-1]+' '+x[1] : null; }
  function params(p){ p = String(p || '').trim(); if(!p || /^not/i.test(p) || /^\d{1,3}$/.test(p)) return null; if(/^\d{9,}$/.test(p)) return Math.round(Number(p)/1e9)+'B parameters'; return p+(/param/i.test(p) ? '' : ' parameters'); }
  /* The profile in one line, as published by the developer; missing facts are left out. */
  function facts(m){
    var io = list2(m.modality_input), oo = list2(m.modality_output), c = ctx(m.context_window), o = ctx(m.max_output_tokens);
    var a = [io && oo ? (io.charAt(0).toUpperCase()+io.slice(1))+' in, '+oo+' out' : null, c ? c+' context' : null, o ? o+' max output' : null, params(m.parameter_count),
      WEIGHTS[m.license_class] ? WEIGHTS[m.license_class]+(m.license_type && !/proprietary|open-source/i.test(m.license_type) ? ' ('+m.license_type+')' : '') : null,
      m.creator_country ? 'Developed in '+m.creator_country : null, m.is_reasoning ? 'Reasoning' : null, m.tool_calling ? 'Tool calling' : null, m.json_mode ? 'JSON mode' : null,
      ym(m.training_cutoff) ? 'Training data to '+ym(m.training_cutoff) : null].filter(Boolean);
    return a.join(' · ');
  }
  function controls(){
    var U = $('moUnits'); U.hidden = CUR.units.length < 2;
    U.innerHTML = CUR.units.length > 1 ? CUR.units.map(function(u){ return '<button type="button" class="as-vt-b" data-u="'+esc(u)+'" aria-selected="'+(u === S.unit)+'">'+esc(u.replace(/^per /, 'Per '))+'</button>'; }).join('') : '';
    $('moCtlN').textContent = 'Market median, the middle vendor price, '+S.unit;
  }
  function tiles(){
    var C = CUR, K = S.K;
    $('moTiles').className = 'tp-tiles n'+C.legs.length;
    $('moTiles').innerHTML = C.legs.map(function(l){ var A = C.E[l], e = A[K], on = l === S.leg;
      function back(n){ for(var i = K-n; i >= 0; i--) if(A[i]) return A[i]; return null; }
      var f = null; for(var i = 0; i <= K; i++) if(A[i]){ f = A[i]; break; }
      var w = K > 0 && A[K-1] && e ? (e.m/A[K-1].m-1)*100 : null, mo = K >= 4 && back(4) && e ? (e.m/back(4).m-1)*100 : null, sf = f && e && f !== e ? (e.m/f.m-1)*100 : null;
      return '<button type="button" class="tp-leg'+(on ? ' on' : '')+'" data-leg="'+esc(l)+'" aria-pressed="'+on+'"><span class="tp-lbl">'+legName(l)+'</span>'
        + '<span class="tp-lv">'+(e ? px(e.m) : '&mdash;')+'</span><span class="tp-c3">'+[['1 week', w], ['1 month', mo], ['Since '+(f ? sdate(f.d).replace(/, \d{4}$/, '') : 'first priced'), sf]].map(function(c){ return '<span><span class="tp-lbl">'+c[0]+'</span>'+(c1(c[1]) || '<span class="d">&mdash;</span>')+'</span>'; }).join('')+'</span>'
        + (e ? '<span class="tp-ls">'+e.n+' vendor'+(e.n === 1 ? '' : 's')+(e.n > 1 ? ', '+px(e.lo)+' to '+px(e.hi) : '')+'</span>' : '')+'</button>'; }).join('');
  }
  /* The selected leg by week: the median, the band from the lowest to the highest vendor, the selected week. */
  function chart(){
    var Cc = CUR, A = Cc.E[S.leg].map(function(e, i){ return e ? { e:e, i:i } : null; }).filter(Boolean), box = $('moCh'), l = A[A.length-1].e, yp = myRate()[S.leg] || null;
    var lg = [{ k:'line', c:'var(--series)', n:legName(S.leg)+' market median', v:px(l.m) }, { k:'bar', c:'rgba(198,203,211,.3)', n:'Lowest to highest vendor' }];
    if(yp) lg.push({ k:'dash', c:'var(--accent)', n:'Your price', v:px(yp) });
    lg.push({ k:'thin', c:'var(--l1)', n:'Selected week' });
    C().legend($('moLg'), lg);
    if(A.length < 2){ box._geo = null; box.innerHTML = '<p class="tp-note tp-empty">Priced for one week so far.</p>'; return; }
    mount(box, function(){
      var ch = C(), AX = ch.axis(iso(utc(A[0].e.d) - 14*864e5), A[A.length-1].e.d), vals = [];
      A.forEach(function(x){ vals.push(x.e.lo, x.e.hi); }); if(yp) vals.push(yp);
      var lo = Math.min.apply(null, vals), hi = Math.max.apply(null, vals), pad = (hi-lo)*0.12 || hi*0.1; lo = Math.max(0, lo-pad); hi += pad;
      var tk = ticks(lo, hi, 4), Y = ch.y(lo, hi), g = [], st = tk.length > 1 ? tk[1]-tk[0] : hi, dp = Math.max(0, -Math.floor(Math.log10(st)));
      function step(a){ var o = []; a.forEach(function(p, i){ if(i) o.push([p[0], a[i-1][1]]); o.push(p); }); return o; }
      function pts(a){ return a.map(function(p){ return AX.x(p[0]).toFixed(1)+','+Y(p[1]).toFixed(1); }).join(' '); }
      tk.forEach(function(v){ if(v < lo || v > hi) return; g.push(ch.rule(Y(v), { cls:'as-s-grid' })); g.push(T(ch.X0, Y(v)-4, ax$(v, dp))); });
      g.push('<polygon points="'+pts(step(A.map(function(x){ return [x.e.d, x.e.hi]; })))+' '+pts(step(A.map(function(x){ return [x.e.d, x.e.lo]; })).reverse())+'" style="fill:rgba(198,203,211,.12)"></polygon>');
      g.push('<polyline fill="none" class="as-s-series" stroke-width="2" stroke-linejoin="round" points="'+pts(step(A.map(function(x){ return [x.e.d, x.e.m]; })))+'"></polyline>');
      /* Your price, as entered, across the whole chart. */
      if(yp) g.push('<line x1="'+AX.x(A[0].e.d).toFixed(1)+'" x2="'+AX.x(A[A.length-1].e.d).toFixed(1)+'" y1="'+Y(yp).toFixed(1)+'" y2="'+Y(yp).toFixed(1)+'" style="stroke:var(--accent);stroke-width:1.5;stroke-dasharray:5 4"></line>');
      var s = Cc.E[S.leg][S.K]; if(s){ var sx = AX.x(s.d);
        g.push('<line x1="'+sx.toFixed(1)+'" x2="'+sx.toFixed(1)+'" y1="'+ch.PT+'" y2="'+ch.TA+'" style="stroke:var(--l1)"></line>');
        g.push('<circle cx="'+sx.toFixed(1)+'" cy="'+Y(s.m).toFixed(1)+'" r="5" style="fill:var(--l1);stroke:var(--bg);stroke-width:2"></circle>'); }
      g.push(AX.svg());
      box._geo = { axis:ch.TA/ch.H, pts:A.map(function(x){ return { f:AX.x(x.e.d)/ch.W, e:x.e, i:x.i }; }) };
      return ch.svg(g.join(''), model.model_name+', '+legName(S.leg).toLowerCase()+' market median and the range from the lowest to the highest vendor, by week');
    });
  }
  function pickWeek(i){ if(i == null || i === S.K || i < 0 || i > CUR.W.length-1) return; S.K = i; tiles(); chart(); week(); }

  /* ── The week: every vendor, cheapest first on the selected leg ── */
  if(PHONE.addEventListener) PHONE.addEventListener('change', function(){ if(CUR) week(); });
  function week(){
    var C = CUR, K = S.K, d = C.W[K], pd = K > 0 ? C.W[K-1] : null, sel = S.leg, LV = PHONE.matches ? [sel] : C.legs, N = 1 + LV.length*4;
    $('moWkT').textContent = 'Week of '+ldate(d);
    $('moPrev').disabled = K <= 0; $('moNext').disabled = K >= C.W.length-1;
    function on(l){ return l === sel ? ' on' : ' off'; }
    function at(v, l, x){ return v.P[l] && v.P[l][x] > 0 ? v.P[l][x] : null; }
    var now = C.vs.filter(function(v){ return C.legs.some(function(l){ return at(v, l, d); }); }), M = {};
    C.legs.forEach(function(l){ M[l] = C.E[l][K] ? C.E[l][K].m : null; });
    now.sort(function(a, b){ var x = at(a, sel, d), y = at(b, sel, d); return (x == null) - (y == null) || (x || 0) - (y || 0) || a.name.localeCompare(b.name); });
    /* Your price sits among the vendors, after any vendor at the same price. */
    var Y = myRate(), yi = -1;
    if(Object.keys(Y).length){ yi = now.length; if(Y[sel]) for(var i = 0; i < now.length; i++){ var x = at(now[i], sel, d); if(x != null && x > Y[sel]){ yi = i; break; } } }
    /* Vendors that priced the model in an earlier week and not in this one. */
    var gone = C.vs.filter(function(v){ return now.indexOf(v) < 0 && v.first && v.first < d; }).map(function(v){ var last = null;
      C.W.forEach(function(x){ if(x < d && C.legs.some(function(l){ return at(v, l, x); })) last = x; }); v.last = last; return v; }).sort(function(a, b){ return a.last < b.last ? 1 : a.last > b.last ? -1 : a.name.localeCompare(b.name); });
    var h = '<thead><tr class="tp-hg"><th class="tp-unit">Prices in USD '+esc(S.unit)+'; the median counts each vendor once</th>'+LV.map(function(l){ return '<th class="tp-gp'+on(l)+'"></th><th colspan="3" class="tp-lgh'+on(l)+'"><span>'+legName(l)+'</span></th>'; }).join('')+'</tr>'
      + '<tr class="tp-hc"><th>Vendor</th>'+LV.map(function(l){ var o = on(l); return '<th class="tp-gp tp-w0'+o+'"></th><th class="r tp-w1'+o+'">Price</th><th class="r tp-w2'+o+'">1 week</th><th class="r tp-w3'+o+'">Vs median</th>'; }).join('')+'</tr></thead><tbody>';
    function cell(v, l){ var o = on(l), p = at(v, l, d), p0 = pd ? at(v, l, pd) : null, mv = p != null && p0 != null && Math.abs(p/p0-1) > 0.005;
      if(p == null) return '<td class="tp-gp'+o+'"></td><td class="r d'+o+'">'+(C.E[l][K] ? 'Not priced' : '')+'</td><td class="'+o.trim()+'"></td><td class="'+o.trim()+'"></td>';
      return '<td class="tp-gp'+o+'"></td><td class="r'+o+'">'+(mv ? '<span class="tp-was">'+esc(px(p0))+'</span>' : '')+esc(px(p))+'</td><td class="r'+o+'">'+(mv ? chg((p/p0-1)*100, 1) : '')+'</td><td class="r'+o+'"><span class="d">'+(M[l] ? vs(p, M[l]) : '')+'</span></td>'; }
    /* A vendor opened: each week its price changed on any leg, newest first, up to the selected week. */
    function hist(v){
      var ev = [], prev = {};
      C.W.slice(0, K+1).forEach(function(x){ var ch = {}, any = false;
        C.legs.forEach(function(l){ var p = at(v, l, x); if(p != null && prev[l] != null && Math.abs(p/prev[l]-1) > 0.005){ ch[l] = [prev[l], p]; any = true; } if(p != null) prev[l] = p; });
        if(any) ev.push({ d:x, ch:ch }); });
      var out = ev.reverse().map(function(e){ return '<tr class="tp-vr"><td><span class="tp-vn">'+esc(sdate(e.d))+'<em>Repriced</em></span></td>'
        + LV.map(function(l){ var c = e.ch[l], o = on(l); return '<td class="tp-gp'+o+'"></td><td class="r'+o+'">'+(c ? '<span class="tp-was">'+esc(px(c[0]))+'</span>'+esc(px(c[1])) : '')+'</td><td class="r'+o+'">'+(c ? chg((c[1]/c[0]-1)*100, 1) : '')+'</td><td class="'+o.trim()+'"></td>'; }).join('')+'</tr>'; }).join('');
      return out + '<tr class="tp-vgo"><td colspan="'+N+'"><span class="tp-note">'+(ev.length ? 'First priced '+esc(ldate(v.first))+'.' : 'No price change since first priced '+esc(ldate(v.first))+'.')+'</span></td></tr>';
    }
    function row(v){ var o = !!S.open[v.id], nw = pd && v.first === d;
      return '<tr class="pick'+(o ? ' sel' : '')+'" tabindex="0" data-v="'+esc(v.id)+'" aria-expanded="'+o+'"><td><span class="tp-mn"><svg class="tp-chev'+(o ? ' open' : '')+'" viewBox="0 0 12 12" aria-hidden="true"><path d="M4.5 2.5 8 6 4.5 9.5"></path></svg><b>'+esc(v.name)+'</b>'+(nw ? '<span class="tp-nw">New</span>' : '')+'<em>'+esc(v.type)+'</em></span></td>'
        + LV.map(function(l){ return cell(v, l); }).join('')+'</tr>'+(o ? hist(v) : ''); }
    function grp(t, n, note){ return '<tr class="tp-gr"><td colspan="'+N+'"><span class="tp-lbl">'+t+'</span><span class="c">'+n+'</span>'+(note ? '<span class="hn">'+note+'</span>' : '')+'</td></tr>'; }
    function you(){ return '<tr class="tp-you"><td><span class="tp-mn"><b>Your price</b><em>entered by you</em></span></td>'
      + LV.map(function(l){ var o = on(l), p = Y[l]; return '<td class="tp-gp'+o+'"></td><td class="r'+o+'">'+(p ? esc(px(p)) : '')+'</td><td class="'+o.trim()+'"></td><td class="r'+o+'">'+(p && M[l] ? '<span class="d">'+vs(p, M[l])+'</span>' : '')+'</td>'; }).join('')+'</tr>'; }
    h += grp('Priced this week', now.length, 'cheapest first on '+legName(sel).toLowerCase()) + now.map(function(v, i){ return (i === yi ? you() : '') + row(v); }).join('') + (yi === now.length ? you() : '');
    if(gone.length) h += grp('No price this week', gone.length, 'priced this model before; left out of the median') + gone.map(function(v){ return '<tr class="tp-xr"><td><span class="tp-mn"><b>'+esc(v.name)+'</b><em>'+esc(v.type)+'</em></span></td><td colspan="'+(N-1)+'" class="tp-xw">Last priced '+esc(ldate(v.last))+'</td></tr>'; }).join('');
    $('moT').className = 'tp-ld n'+LV.length;
    $('moT').innerHTML = h+'</tbody>';
  }
  function foot(){ $('moSrc').textContent = 'Source: Attic Standard, vendor prices published '+ldate(GATE)+', each vendor’s lowest list price for the model, administered with reference to the IOSCO Principles for Financial Benchmarks.'; }
  /* The citation is for the week on screen, so any past week can be quoted exactly. */
  function cite(b){ if(!CUR) return; var e = CUR.E[S.leg][S.K]; if(!e) return;
    copy(b, 'Attic Standard, '+model.model_name+' '+legName(S.leg).toLowerCase()+' price, week of '+ldate(e.d)+': market median $'+fx(e.m)+' '+S.unit+' across '+e.n+' vendors (lowest $'+fx(e.lo)+', highest $'+fx(e.hi)+'), published '+ldate(e.d)+'. atticstandard.com'); }

  function start(){
    waiting($('moMsg'));
    ddVen = DD($('moVen'), 'All vendors', function(){ act = -1; openRes(); });
    var Q = $('moQ');
    Q.addEventListener('focus', openRes);
    Q.addEventListener('input', function(){ act = -1; openRes(); });
    Q.addEventListener('keydown', function(e){
      if(e.key === 'Escape'){ closeRes(); Q.blur(); return; }
      if(e.key === 'ArrowDown' || e.key === 'ArrowUp'){ e.preventDefault(); if($('moRes').hidden) openRes(); var n = Math.min(12, matches().length); if(!n) return; act = (act + (e.key === 'ArrowDown' ? 1 : -1) + n) % n; results(); var o = $('moRo'+act); if(o) o.scrollIntoView({ block:'nearest' }); return; }
      if(e.key === 'Enter'){ e.preventDefault(); var r = matches(); var m = r[Math.max(0, act)]; if(m) choose(m.anchor_id); } });
    $('moRes').addEventListener('mousedown', function(e){ e.preventDefault(); });
    $('moRes').addEventListener('click', function(e){ var b = e.target.closest('[data-id]'); if(b) choose(b.dataset.id); });
    document.addEventListener('click', function(e){ if(!$('moFq').contains(e.target) && !$('moVen').contains(e.target) && !$('moMod').contains(e.target) && !e.target.closest('#moPc [data-open]')) { if(!$('moRes').hidden) closeRes(); } });
    $('moMod').addEventListener('click', function(e){ var b = e.target.closest('[data-k]'); if(!b) return; mod = b.dataset.k; modRow(); act = -1; openRes(); });
    $('moPins').addEventListener('click', function(e){
      var u = e.target.closest('[data-unpin]'); if(u){ e.stopPropagation(); togglePin(u.dataset.unpin); return; }
      if(e.target.closest('[data-open]')){ pinMode = !pinMode; drawPins(); if(pinMode){ Q.focus(); openRes(); } else closeRes(); return; }
      var c = e.target.closest('[data-pin]'); if(c && BYA[c.dataset.pin] && BYA[c.dataset.pin] !== model) pick(BYA[c.dataset.pin]); });
    $('moPc').addEventListener('keydown', function(e){ if(e.key !== 'Enter' && e.key !== ' ') return; var c = e.target.closest('[data-pin]'); if(!c || e.target.closest('[data-unpin]')) return; e.preventDefault(); if(BYA[c.dataset.pin] !== model) pick(BYA[c.dataset.pin]); });
    $('moPin').addEventListener('click', function(){ if(model) togglePin(model.anchor_id); });
    var yT = null;
    /* Each entry is kept as it is typed; the table follows a moment later. */
    $('moYr').addEventListener('input', function(e){ var t = e.target.closest('input[data-leg]'); if(!t || !model) return;
      putRate(t.dataset.leg, num(t.value)); $('moYc').hidden = !Object.keys(myRate()).length; clearTimeout(yT); yT = setTimeout(function(){ chart(); week(); }, 200); });
    $('moYr').addEventListener('change', function(e){ var t = e.target.closest('input[data-leg]'); if(!t) return; var v = num(t.value); t.value = v ? '$'+fx(v) : ''; });
    $('moYr').addEventListener('keydown', function(e){ if(e.key === 'Enter' && e.target.matches('input[data-leg]')) e.target.blur(); });
    $('moYr').addEventListener('click', function(e){ if(!e.target.closest('#moYc') || !model) return; CUR.legs.forEach(function(l){ putRate(l, null); }); yours(); chart(); week(); });
    $('moCg').addEventListener('click', function(e){ var b = e.target.closest('[data-ix]'); if(!b) return; show('indexes', true); IX.pick(b.dataset.ix); });
    $('moUnits').addEventListener('click', function(e){ var b = e.target.closest('[data-u]'); if(!b || b.dataset.u === S.unit) return; S.unit = b.dataset.u; S.open = {}; S.K = null; render(); });
    $('moTiles').addEventListener('click', function(e){ var b = e.target.closest('[data-leg]'); if(!b || b.dataset.leg === S.leg) return; S.leg = b.dataset.leg; tiles(); chart(); week(); });
    $('moPrev').addEventListener('click', function(){ pickWeek(S.K-1); });
    $('moNext').addEventListener('click', function(){ pickWeek(S.K+1); });
    hover($('moChW'), $('moCh'), function(p){ var e = p.e;
      return '<div class="t">Week of '+ldate(e.d)+'</div>Median <b>'+px(e.m)+'</b><br>Lowest '+px(e.lo)+' · Highest '+px(e.hi)+'<br><span class="t">'+e.n+' vendor'+(e.n === 1 ? '' : 's')+(p.i === S.K ? ', selected' : ', select to see them')+'</span>'; });
    $('moChW').addEventListener('click', function(e){ var G = $('moCh')._geo; if(!G) return; var r = $('moCh').getBoundingClientRect(), f = (e.clientX - r.left)/r.width, best = null, bd = 1e9;
      G.pts.forEach(function(p){ var x = Math.abs(p.f - f); if(x < bd){ bd = x; best = p; } }); if(best) pickWeek(best.i); });
    $('moChW').tabIndex = 0; $('moChW').setAttribute('aria-label', 'Chart. Use the left and right arrow keys to choose a week.');
    $('moChW').addEventListener('keydown', function(e){ if(!CUR || (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight')) return; e.preventDefault(); pickWeek(S.K + (e.key === 'ArrowRight' ? 1 : -1)); });
    /* Any number of vendors can be open at once; a second click closes only that one. */
    function toggle(tr){ var v = tr.dataset.v; if(S.open[v]) delete S.open[v]; else S.open[v] = 1; week(); var n = $('moT').querySelector('tr[data-v="'+v+'"]'); if(n) n.focus({ preventScroll:true }); }
    $('moT').addEventListener('click', function(e){ var tr = e.target.closest('tr[data-v]'); if(tr) toggle(tr); });
    $('moT').addEventListener('keydown', function(e){ if(e.key !== 'Enter' && e.key !== ' ') return; var tr = e.target.closest('tr[data-v]'); if(!tr) return; e.preventDefault(); toggle(tr); });
    $('moCite').addEventListener('click', function(){ cite(this); });
    if(!sb){ message($('moMsg'), 'Prices load once you are logged in.'); return; }
    Promise.all([
      all(function(){ return sb.from('v_fair_value_models').select('anchor_id,model_name,display_name,creator,tier,modality,vendors,vendor_names,model_family,parameter_count,context_window,max_output_tokens,modality_input,modality_output,tool_calling,json_mode,training_cutoff,license_type,license_class,is_reasoning,creator_country').gte('vendors', 2).order('vendors', { ascending:false }).order('display_name'); }),
      q(sb.from('index_registry').select('index_code').eq('is_published', true)).catch(function(){ return []; })
    ]).then(function(r){ MODELS = r[0] || []; r[1].forEach(function(x){ PUB[x.index_code] = 1; });
      if(!MODELS.length){ message($('moMsg'), 'No model is sold by two or more vendors in the latest publication.'); return; }
      var vens = {};
      /* The registry's display name is what people read; the raw name and the developer still match a search. */
      MODELS.forEach(function(m){ m.raw_name = m.model_name; m.model_name = m.display_name || m.model_name; BYA[m.anchor_id] = m;
        m._k = norm(m.model_name+' '+m.raw_name+' '+(m.creator || '')); m._v = (m.vendor_names || []).map(vgroup); m._v.forEach(function(v){ vens[v] = 1; }); });
      ddVen.setOptions(Object.keys(vens).sort(function(a, b){ return a.localeCompare(b); }).map(function(v){ return [v, v]; }));
      modRow();
      var keep = pending; if(!keep){ try{ keep = localStorage.getItem('atMoModel'); }catch(e){} } pending = null;
      pick(BYA[keep] || BYA[pins()[0]] || MODELS[0]);
    }).catch(function(e){ console.error('[Models]', e); message($('moMsg'), 'Models could not be loaded. Refresh the page, or log in again if the problem persists.'); });
  }
  /* The Indexes week table can open a model here. */
  function openModel(id){ if(!MODELS.length){ pending = id; return; } var m = BYA[id]; if(m && m !== model) pick(m); }
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

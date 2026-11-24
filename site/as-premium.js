/* TERMINAL (/premium). The subscriber dashboards, moved out of the page embeds into the shared
   library on November 24, 2026 and rebuilt on the site system (styles in as-premium.css):
     Header      the inner-page header: title, tagline, header rows (Published, Covers, For).
     Switch      the site toggle, Indexes, Models and Contracts; held under the site header while
                 the page scrolls.
     Indexes     one page per index (added November 24, 2026): what moved the level each week and
                 which models moved it, the basket down to every SKU, repricing, vendors and the
                 admission record, from one signed-in call (terminal_index_view).
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
  + '<header class="tp-he"><div class="tp-hl"><h1 class="tp-h1">Terminal</h1>'
  + '<p class="tp-hsub">Where contracts under the Clause are followed and settled, and where the market behind them is read, down to every vendor, model and SKU.</p></div>'
  + '<dl class="tp-sheet"><div class="tp-r"><dt class="tp-lbl">Published</dt><dd id="tpPub">&nbsp;</dd></div>'
  + '<div class="tp-r"><dt class="tp-lbl">Covers</dt><dd id="tpCov">&nbsp;</dd></div>'
  + '<div class="tp-r"><dt class="tp-lbl">For</dt><dd>Procurement, finance, legal and analysts, on both sides</dd></div></dl></header>'
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
/* Header rows: the published date, what the Terminal covers, who is signed in. */
function header(s){
  if(GATE) $('tpPub').innerHTML = '<b>'+ldate(GATE)+'</b>';
  if(!sb) return;
  Promise.all([
    sb.from('clause_contract').select('contract_id', { count:'exact', head:true }),
    sb.from('v_fair_value_models').select('anchor_id', { count:'exact', head:true }).gte('vendors', 2),
    sb.from('index_registry').select('index_code', { count:'exact', head:true }).eq('is_published', true)
  ]).then(function(r){ var c = r[0].count, m = r[1].count, x = r[2].count; if(c == null || m == null) return;
    $('tpCov').innerHTML = (x ? '<b>'+int(x)+'</b> indexes, ' : '')+'<b>'+int(m)+'</b> models sold by two or more vendors, <b>'+int(c)+'</b> contract'+(c === 1 ? '' : 's')+' under the Clause'; }).catch(function(){});
}

/* ═══ INDEXES ═══ */
/* One page per index, the spine of the Terminal: pick an index with the same Family, Index and
   Market rows as the public page, then read it top to bottom. What moved the level each week and
   which models moved it; the basket down to every SKU; every lasting repricing; who supplies it;
   every model admitted, left or turned away, with the rule. One signed-in call per index and leg
   (terminal_index_view), kept in memory, so going back to an index is instant; an index is fetched
   ahead when the pointer rests on it. While a new index loads the current one stays in place,
   dimmed, so nothing on the page jumps. */
function indexesHTML(){
  return '<section class="tp-dash" id="tpIndexes" role="tabpanel" aria-label="Indexes" hidden>'
  + '<div class="tp-sel" id="ixSel"><span class="tp-lbl">Family</span><div class="as-vt" id="ixFam" role="group" aria-label="Family"></div>'
  + '<span class="tp-lbl">Index</span><div class="as-vt" id="ixSeg" role="group" aria-label="Index"></div>'
  + '<span class="tp-lbl">Market</span><div class="as-vt" id="ixMkt" role="group" aria-label="Market"></div></div>'
  + '<div id="ixMsg"></div><div class="tp-ix" id="ixBody" hidden><div class="tp-prog" id="ixProg" hidden></div>'
  + '<div class="tp-ixh"><div class="tp-ixt"><p class="tp-code" id="ixCode"></p><h2 class="tp-h" id="ixName"></h2><p class="tp-q" id="ixQ"></p></div><div class="as-vt" id="ixLegs" role="group" aria-label="Price leg"></div></div>'
  + '<div class="tp-figs" id="ixFigs"></div>'
  + '<div class="tp-lay"><div class="tp-secs">'
  + '<section class="tp-xs" id="ixS1" data-n="What moved"><div class="tp-sech"><div><h3 class="tp-st">What moved the index</h3><p class="tp-ss">Each week’s change in the index level, and the models that caused it. Select a week.</p></div></div>'
  + '<div class="tp-chw"><div class="as-lgv" id="ixMvLg"></div><div class="tp-ch" id="ixMvW"><div id="ixMv"></div><div class="tp-hv" hidden></div><div class="tp-tip" hidden></div></div></div>'
  + '<div class="tp-mv"><div><p class="tp-lbl" id="ixWkT"></p><div class="tp-wf" id="ixWf"></div></div><div><p class="tp-lbl">How to read it</p><p class="tp-note tp-rd">Every model in the basket counts once. A model’s part of the week’s change is its own price move across the vendors that sell it, shared out among the models priced in both weeks, so the parts add up to the change in the level.</p><p class="tp-rd" id="ixWkGo"></p></div></div></section>'
  + '<section class="tp-xs" id="ixS2" data-n="Composition"><div class="tp-sech"><div><h3 class="tp-st">Composition</h3><p class="tp-ss" id="ixCoN"></p></div><div class="tp-tools"><input class="tp-in tp-find" id="ixFind" type="search" autocomplete="off" spellcheck="false" placeholder="Find a model, vendor or SKU" aria-label="Find a model, vendor or SKU"><div class="as-vt" id="ixCoV" role="group" aria-label="View"><button type="button" class="as-vt-b" data-v="m" aria-selected="true">By model</button><button type="button" class="as-vt-b" data-v="s" aria-selected="false">By SKU</button></div></div></div>'
  + '<div class="tp-tw"><table class="tp-tbl tp-sort" id="ixCoT"><thead id="ixCoH"></thead><tbody id="ixCo"></tbody></table></div><p class="tp-note tp-more" id="ixCoM"></p></section>'
  + '<section class="tp-xs" id="ixS3" data-n="Repricing"><div class="tp-sech"><div><h3 class="tp-st">Repricing</h3><p class="tp-ss">Every lasting list price change on a SKU in this index over the last six months, newest first. Select one to see its week in What moved.</p></div></div>'
  + '<div class="tp-tw"><table class="tp-tbl"><thead><tr><th>Week</th><th>Vendor</th><th>Model</th><th class="r">Before</th><th class="r">After</th><th class="r">Change</th></tr></thead><tbody id="ixRp"></tbody></table></div><p class="tp-note tp-more" id="ixRpM"></p></section>'
  + '<section class="tp-xs" id="ixS4" data-n="Vendors"><div class="tp-sech"><div><h3 class="tp-st">Vendors</h3><p class="tp-ss" id="ixVnN"></p></div></div>'
  + '<div class="tp-tw"><table class="tp-tbl tp-sort" id="ixVnT"><thead id="ixVnH"></thead><tbody id="ixVn"></tbody></table></div><p class="tp-note tp-more" id="ixVnM"></p></section>'
  + '<section class="tp-xs" id="ixS5" data-n="Admissions"><div class="tp-sech"><div><h3 class="tp-st">Admissions</h3><p class="tp-ss">Every model that left the basket or was turned away, with the rule applied. The record a contract party can audit.</p></div></div>'
  + '<div class="tp-tw"><table class="tp-tbl"><thead><tr><th>Week</th><th>Model</th><th>Decision</th><th>Rule</th><th class="tp-wrap-h">Reason</th></tr></thead><tbody id="ixAd"></tbody></table></div><p class="tp-note tp-more" id="ixAdM"></p></section>'
  + '<div class="tp-foot"><p class="as-note" id="ixSrc"></p><div class="tp-ln"><button class="tp-link" id="ixCite" type="button">Copy citation</button><a class="tp-link" id="ixPub" href="/indexes">Open on the Indexes page &rarr;</a><a class="tp-link" href="/methodology">Read the methodology &rarr;</a></div></div>'
  + '</div><nav class="tp-toc" id="ixToc" aria-label="On this index"><p class="tp-lbl">On this index</p></nav></div></div></section>';
}

var IX = (function(){
  var SEG = { TXT:'Text', MML:'Multimodal', IMG:'Image', IMP:'Image by area', VID:'Video', VDC:'Video by clip', AUD:'Speech to text', VOC:'Text to speech',
    EMB:'Embeddings', DEV:'Model developers', CLD:'Cloud marketplaces', PLT:'Inference platforms', NCL:'Neoclouds', FLG:'Flagship', COR:'Core',
    CMP:'Compact', PRP:'Unpublished weights', OSS:'Published weights', OWC:'Restricted weights', USA:'United States', CHN:'China', RSN:'Reasoning', COD:'Coding' };
  var MKT = { GLB:'Global', EUR:'Europe', CNY:'China' }, MKO = ['GLB','EUR','CNY'];
  var FAMO = ['Modality','Channel','Tier','License','Origin','Use case'];
  var LEGN = { input:'Input', cached:'Cached input', output:'Output' }, LEGO = ['input','cached','output'];
  var SYM = { USD:'$', EUR:'€', CNY:'¥' };
  var RULE = { 'R2-SUPER':'Superseded', 'R3-SERVE':'Serving variant', 'R4-VARIANT':'Variant', 'R5-DERIV':'Third-party derivative', 'R7-LINEUP':'Not in the lineup',
    'R8-TASK':'Task-specific', 'R11-QUANT':'Quantized copy', 'R12-ALIAS':'Alias', 'R13-METER':'Metering band', 'R14-SIZE':'Sibling size', 'R16-UNVERIFIED':'Unverified',
    'R17-NOHOME':'No index home', 'R18-NOTAMODEL':'Not a model', 'R20-PROCESS':'Processing tool', 'R21-TASK':'Task-specific', 'R6-CURRENT':'Current model', 'R19-PRODUCT':'Priced product' };
  var L = [], BY = {}, cur = null, leg = null, D = null, reqN = 0, cache = {}, inflight = {}, wk = null, view = 'm', open = {}, more = {}, sortS = { m:['n',-1], s:['p',1], v:['k',-1] };
  var famLast = {};

  function seg(c){ return c.split(' ')[1]; }
  function mkt(c){ return c.split(' ')[2]; }
  function sym(){ return SYM[(BY[cur] || {}).cur] || '$'; }
  function fx(v){ v = Number(v); if(!(v > 0)) return '0'; if(v >= 1) return v.toFixed(v >= 100 ? 2 : 4); var d = Math.max(6, Math.ceil(-Math.log10(v))+1); return v.toFixed(Math.min(d, 10)); }
  function px(v){ return v == null ? '' : sym()+fx(v); }
  function pct(v, dp){ return (v < 0 ? '&minus;' : v > 0 ? '+' : '')+Math.abs(v).toFixed(dp == null ? 2 : dp)+'%'; }
  function vsMed(p, m){ var d = (p/m-1)*100; return Math.abs(d) < 0.05 ? 'At median' : Math.abs(d).toFixed(1)+'% '+(d > 0 ? 'above' : 'below'); }
  function name(c){ var s = SEG[seg(c)] || seg(c); return s+(mkt(c) !== 'GLB' ? ', '+MKT[mkt(c)] : ''); }
  function vt(items, on){ return items.map(function(it){ return '<button type="button" class="as-vt-b" data-k="'+esc(it[0])+'" aria-selected="'+(it[0] === on)+'">'+it[1]+'</button>'; }).join(''); }
  function cd(s){ return ' <span class="tp-cd">'+esc(s)+'</span>'; }

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
  function pickCode(c){ if(!BY[c] || c === cur) return; cur = c; famLast[BY[c].fam] = c; try{ localStorage.setItem('atIxCode', c); }catch(e){} selector(); load(); }

  /* ── Data ── */
  function key(c, l){ return c+'|'+l; }
  function fetch(c, l){
    var k = key(c, l); if(cache[k]) return Promise.resolve(cache[k]); if(inflight[k]) return inflight[k];
    inflight[k] = sb.rpc('terminal_index_view', { p_code:c, p_dir:l }).then(function(r){ delete inflight[k]; if(r.error) throw r.error; if(!r.data) throw new Error('No data'); cache[k] = prep(r.data); return cache[k]; },
      function(e){ delete inflight[k]; throw e; });
    return inflight[k];
  }
  function legsOf(c){ var g = (BY[c] || {}).legs || {}; return LEGO.filter(function(l){ return g[l]; }); }
  function legFor(c){ var ls = legsOf(c); return ls.indexOf(leg) > -1 ? leg : ls.indexOf('output') > -1 ? 'output' : ls[0]; }
  function prefetch(c){ if(!sb || !BY[c]) return; var l = legFor(c); if(l) fetch(c, l).catch(function(){}); }
  /* Per model: vendors, median, range; per SKU its model; contributions for each week. */
  function prep(d){
    var A = {};
    d.comp.forEach(function(m){ A[m.a] = m; var ps = m.k.map(function(k){ return Number(k.p); }).filter(function(p){ return p > 0; }).sort(function(a, b){ return a-b; });
      var vs = {}; m.k.forEach(function(k){ vs[vgroup(k.v)] = 1; k.m = m; }); m.nv = Object.keys(vs).length; m.ns = m.k.length;
      m.md = med(ps); m.lo = ps[0]; m.hi = ps[ps.length-1]; m.sp = m.lo > 0 ? m.hi/m.lo : null; });
    d.A = A;
    var W = {}; d.series.forEach(function(s, i){ s.w = s.w == null ? null : Number(s.w); s.l = Number(s.l); s.i = i; W[s.d] = s; }); d.W = W;
    var M = {}; d.moved.forEach(function(w){ M[w.d] = w; }); d.M = M;
    d.rep.forEach(function(r){ r.pc = (r.to/r.from-1)*100; });
    d.skus = []; d.comp.forEach(function(m){ m.k.forEach(function(k){ d.skus.push(k); }); });
    return d;
  }
  function load(){
    var c = cur, l = legFor(c), my = ++reqN; leg = l;
    var first = !D; if(first) waiting($('ixMsg')); else { $('ixBody').classList.add('busy'); $('ixProg').hidden = false; }
    fetch(c, l).then(function(d){ if(my !== reqN) return; D = d; wk = null; open = {}; more = {}; $('ixFind').value = '';
      try{ localStorage.setItem('atIxLeg', l); }catch(e){}
      render(); $('ixMsg').hidden = true; $('ixBody').hidden = false; done(); requestAnimationFrame(SPY); })
    .catch(function(e){ if(my !== reqN) return; console.error('[Indexes]', e); done();
      if(first) message($('ixMsg'), 'This index could not be loaded. Refresh the page, or log in again if the problem persists.');
      else { $('ixProg').hidden = true; flash($('ixName'), 'Could not load '+c); } });
    function done(){ $('ixBody').classList.remove('busy'); $('ixProg').hidden = true; }
  }

  /* ── Header and figures ── */
  function render(){
    var x = BY[cur], ls = legsOf(cur);
    $('ixCode').textContent = cur; $('ixName').textContent = name(cur); $('ixQ').textContent = D.q || D.desc || '';
    var lg = $('ixLegs'); lg.hidden = ls.length < 2; lg.innerHTML = ls.length > 1 ? vt(ls.map(function(l){ return [l, LEGN[l]]; }), leg) : '';
    $('ixPub').href = '/indexes?index='+cur.toLowerCase().replace(/\s+/g, '-')+'#atom-index-card';
    figs(); defWeek(); moved(); comp(); rep(); ven(); adm(); foot();
  }
  function figs(){
    var S = D.series, l = S[S.length-1], f = S[0], b4 = S[Math.max(0, S.length-5)], F = D.fig || {};
    var h = [
      ['Index level', l ? l.l.toFixed(2) : '', l && f && S.length > 1 ? chg((l.l/f.l-1)*100)+' since '+sdate(f.d) : 'first week'],
      ['Last 4 weeks', l && S.length > 4 ? chg((l.l/b4.l-1)*100) : '', l && S.length > 4 ? 'from '+b4.l.toFixed(2)+' on '+mdate(b4.d) : 'four weeks not yet published'],
      ['Spot price', F.spot != null ? px(F.spot) : '', esc(D.unit)+', median'],
      ['Models', D.comp.length ? String(D.comp.length) : '', 'in the basket'],
      ['Vendors', String(D.ven.length), int(D.skus.length)+' SKUs on this leg']];
    $('ixFigs').innerHTML = h.map(function(k){ return '<div><p class="tp-lbl">'+k[0]+'</p><p class="v">'+k[1]+'</p><p class="s">'+k[2]+'</p></div>'; }).join('');
  }

  /* ── What moved ── */
  function weeks(){ return D.series.slice(-14); }
  /* The default week: the latest whose change has a breakdown and is not flat, else the latest. */
  function defWeek(){
    var ws = weeks(); wk = null;
    for(var i = ws.length-1; i >= 0; i--){ var w = ws[i]; if(D.M[w.d] && w.w != null && Math.abs(w.w) >= 0.005){ wk = w.d; break; } }
    if(!wk && ws.length) wk = ws[ws.length-1].d;
  }
  /* Each model's part of the week's change: its log price move over the sum, times the published
     change, so the parts add up to the change in the level. */
  function parts(w){
    var m = D.M[w.d], W = w.w; if(!m || W == null) return null;
    var s = Number(m.s), n = m.n, rows = (m.m || []).map(function(x){ var lr = Number(x.lr);
      return { a:x.a, nm:(D.A[x.a] && D.A[x.a].nm) || x.nm, v:Math.abs(s) > 1e-9 ? W*lr/s : lr/n*100 }; });
    rows.sort(function(a, b){ return Math.abs(b.v) - Math.abs(a.v); });
    return { n:n, rows:rows, W:W };
  }
  function cause(a, d){
    var R = D.rep.filter(function(r){ return r.a === a && r.d === d; });
    if(!R.length) return '';
    if(R.length === 1){ var r = R[0]; return esc(vgroup(r.v))+' '+(r.pc < 0 ? 'cut' : 'raised')+' its price '+Math.abs(r.pc).toFixed(1)+'%'; }
    var vs = {}; R.forEach(function(r){ vs[vgroup(r.v)] = 1; }); var n = Object.keys(vs).length;
    return n === 1 ? esc(Object.keys(vs)[0])+' repriced '+R.length+' SKUs' : n+' vendors repriced';
  }
  function moved(){
    var ws = weeks(), box = $('ixMv');
    C().legend($('ixMvLg'), [{ k:'bar', c:'var(--series)', n:'Weekly change in the index level' }, { k:'bar', c:'var(--l1)', n:'Selected week' }]);
    if(ws.length < 2){ box._geo = null; box.innerHTML = '<p class="tp-note tp-empty">Published for one week so far. Weekly changes start with the second week.</p>'; }
    else mount(box, function(){
      var ch = C(), a = iso(utc(ws[0].d) - 7*864e5), b = iso(utc(ws[ws.length-1].d) + 7*864e5), AX = ch.axis(a, b);
      var mx = Math.max.apply(null, ws.map(function(w){ return Math.abs(w.w || 0); }).concat([0.5])), tk = ticks(-mx*1.1, mx*1.1, 4), lo = Math.min(tk[0], -mx*1.1), hi = Math.max(tk[tk.length-1], mx*1.1);
      var Y = ch.y(lo, hi), g = [], sp = (AX.x(ws[1].d) - AX.x(ws[0].d)), bw = Math.min(44, sp*0.56);
      tk.forEach(function(v){ if(v === 0) return; g.push(ch.rule(Y(v), { cls:'as-s-grid' })); g.push(T(ch.X0, Y(v)-4, (v > 0 ? '+' : v < 0 ? '−' : '')+Math.abs(v)+'%')); });
      g.push(ch.rule(Y(0), { cls:'as-s-axis' }));
      ws.forEach(function(w){ var x = AX.x(w.d), v = w.w || 0, y0 = Y(0), y1 = Y(v), on = w.d === wk, h = Math.max(1.5, Math.abs(y1-y0));
        g.push('<rect x="'+(x-bw/2).toFixed(1)+'" y="'+(v > 0 ? y1 : y0).toFixed(1)+'" width="'+bw.toFixed(1)+'" height="'+h.toFixed(1)+'" rx="2" '+(on ? 'fill="var(--l1)"' : 'class="as-f-series" fill-opacity=".5"')+'></rect>'); });
      g.push(AX.svg());
      box._geo = { axis:ch.TA/ch.H, pts:ws.map(function(w){ return { f:AX.x(w.d)/ch.W, w:w }; }) };
      return ch.svg(g.join(''), name(cur)+' '+LEGN[leg].toLowerCase()+': weekly change in the index level over the last '+ws.length+' weeks');
    });
    week();
  }
  function week(){
    var w = D.W[wk], P = w ? parts(w) : null, h = '', go = '';
    $('ixWkT').textContent = w ? 'Week of '+ldate(w.d)+': what moved it' : '';
    if(!w){ $('ixWf').innerHTML = ''; $('ixWkGo').innerHTML = ''; return; }
    if(!P) h = '<p class="tp-note tp-wfn">'+(w.w != null && Math.abs(w.w) < 0.005 ? 'No model moved the index this week.' : 'The breakdown for this week is published with the next update.')+'</p>';
    else {
      var shown = P.rows.slice(0, 7), rest = P.rows.slice(7), same = P.n - P.rows.length, mx = Math.max.apply(null, shown.map(function(r){ return Math.abs(r.v); }).concat([Math.abs(P.W), 0.01]));
      function bar(v){ var wd = Math.min(50, Math.abs(v)/mx*50); return '<span class="tp-trk"><i></i><b style="'+(v < 0 ? 'right' : 'left')+':50%;width:'+wd.toFixed(1)+'%"></b></span>'; }
      shown.forEach(function(r){ var c = cause(r.a, w.d);
        h += '<div class="tp-wr"><span class="t">'+esc(r.nm)+(c ? '<em>'+c+'</em>' : '')+'</span>'+bar(r.v)+'<span class="v">'+pct(r.v)+'</span></div>'; });
      if(rest.length){ var rv = rest.reduce(function(s, r){ return s + r.v; }, 0); h += '<div class="tp-wr"><span class="t">'+rest.length+' other model'+(rest.length === 1 ? '' : 's')+'<em>smaller moves</em></span>'+bar(rv)+'<span class="v">'+pct(rv)+'</span></div>'; }
      if(same > 0) h += '<div class="tp-wr"><span class="t">'+same+' model'+(same === 1 ? '' : 's')+'<em>no change at any vendor</em></span>'+bar(0)+'<span class="v d">'+pct(0)+'</span></div>';
      h += '<div class="tp-wr tot"><span class="t">Index level, week of '+mdate(w.d)+'</span><span></span><span class="v">'+chg(P.W, 2)+'</span></div>';
      var top = shown[0]; if(top && Math.abs(top.v) >= 0.005 && D.A[top.a] && D.A[top.a].nv >= 2) go = '<button class="tp-link" type="button" data-go="'+esc(top.a)+'">Open '+esc(top.nm)+' in Models &rarr;</button>';
    }
    $('ixWf').innerHTML = h; $('ixWkGo').innerHTML = go;
  }
  function pickWeek(d){ if(!d || d === wk || !D.W[d]) return; wk = d; moved(); }

  /* ── Composition ── */
  function findT(){ return $('ixFind').value.trim().toLowerCase(); }
  function hit(k, t){ return !t || (k.m.nm+' '+(k.m.c || '')+' '+k.v+' '+(k.pl || '')+' '+k.s).toLowerCase().indexOf(t) > -1; }
  function sorter(which, rows, get){ var s = sortS[which], f = s[0], dir = s[1];
    return rows.sort(function(a, b){ var x = get(a, f), y = get(b, f); if(x == null && y == null) return 0; if(x == null) return 1; if(y == null) return -1;
      return (typeof x === 'string' ? x.localeCompare(y) : x - y)*dir; }); }
  function th(which, f, label, r){ var s = sortS[which], on = s[0] === f;
    return '<th class="'+(r ? 'r ' : '')+'tp-th'+(on ? ' on' : '')+'" data-sort="'+f+'" aria-sort="'+(on ? (s[1] > 0 ? 'ascending' : 'descending') : 'none')+'"><button type="button">'+label+'<i aria-hidden="true">'+(on ? (s[1] > 0 ? '&#9650;' : '&#9660;') : '')+'</i></button></th>'; }
  function lastChange(k){ return k.lcd ? '<td class="r">'+sdate(k.lcd)+'</td><td class="r">'+chg(Number(k.lcp))+'</td>' : '<td class="r d">No change</td><td class="r d"></td>'; }
  function comp(){
    var t = findT(), N = 12;
    $('ixCoN').textContent = 'Every model in the basket on '+ldate(D.date)+' and every SKU behind it. '+(view === 'm' ? 'Open a model to see the SKU each vendor sells.' : 'One row per SKU, '+esc(D.unit)+'.');
    $('ixCoV').querySelectorAll('[data-v]').forEach(function(b){ b.setAttribute('aria-selected', String(b.dataset.v === view)); });
    if(view === 'm'){
      $('ixCoH').innerHTML = '<tr>'+th('m','nm','Model')+th('m','c','Developer')+th('m','nv','Vendors',1)+th('m','n','SKUs',1)+th('m','md','Median',1)+th('m','lo','Lowest',1)+th('m','hi','Highest',1)+th('m','sp','Spread',1)+'</tr>';
      var R = D.comp.filter(function(m){ return !t || m.k.some(function(k){ return hit(k, t); }); });
      sorter('m', R, function(m, f){ return f === 'n' ? m.ns : f === 'c' ? (m.c || '') : m[f]; });
      var lim = more.co || t ? R.length : N, h = '';
      R.slice(0, lim).forEach(function(m){ var o = !!open[m.a] || (!!t && R.length <= 3);
        h += '<tr class="pick'+(o ? ' sel' : '')+'" tabindex="0" data-a="'+esc(m.a)+'" aria-expanded="'+o+'"><td><span class="tp-x" aria-hidden="true">'+(o ? '&minus;' : '+')+'</span>'+esc(m.nm)+'</td><td class="d">'+esc(m.c || '')+'</td><td class="r">'+m.nv+'</td><td class="r">'+m.ns+'</td><td class="r w">'+px(m.md)+'</td><td class="r d">'+px(m.lo)+'</td><td class="r d">'+px(m.hi)+'</td><td class="r">'+(m.sp ? m.sp.toFixed(1)+'&times;' : '')+'</td></tr>';
        if(o){
          var ks = m.k.filter(function(k){ return hit(k, t) || !t || (m.nm+' '+(m.c || '')).toLowerCase().indexOf(t) > -1; });
          h += '<tr class="tp-dt"><td colspan="8"><table class="tp-dtt tp-sku"><thead><tr><th>Vendor</th><th>Channel</th><th>SKU as listed</th><th class="r">Price</th><th class="r">Vs median</th><th class="r">First priced</th><th class="r">Last change</th><th class="r">Change</th></tr></thead><tbody>'
            + ks.map(function(k){ return '<tr><td>'+esc(vgroup(k.v))+'</td><td class="d">'+esc(channel(k.t))+'</td><td><span class="tp-pl">'+esc(k.pl || k.s)+'</span></td><td class="r w">'+px(k.p)+'</td><td class="r">'+(k.p > 0 && m.md ? vsMed(k.p, m.md) : '')+'</td><td class="r d">'+(k.f ? sdate(k.f) : '')+'</td>'+lastChange(k)+'</tr>'; }).join('')
            + '</tbody></table>'+(m.nv >= 2 ? '<button class="tp-link tp-dgo" type="button" data-go="'+esc(m.a)+'">Open '+esc(m.nm)+' in Models: price by week and every vendor &rarr;</button>' : '')+'</td></tr>';
        }
      });
      $('ixCo').innerHTML = h || '<tr><td colspan="8" class="d">No model or SKU matches that search.</td></tr>';
      $('ixCoM').innerHTML = R.length > lim ? 'Showing '+lim+' of '+R.length+' models. <button class="tp-link" type="button" data-more="co">Show all '+R.length+'</button>' : (t ? R.length+' of '+D.comp.length+' models match.' : '');
    } else {
      $('ixCoH').innerHTML = '<tr>'+th('s','v','Vendor')+th('s','t','Channel')+th('s','nm','Model')+th('s','pl','SKU as listed')+th('s','p','Price',1)+th('s','vm','Vs model median',1)+th('s','lcd','Last change',1)+th('s','lcp','Change',1)+'</tr>';
      var S = D.skus.filter(function(k){ return hit(k, t); });
      sorter('s', S, function(k, f){ return f === 'nm' ? k.m.nm : f === 'v' ? vgroup(k.v) : f === 't' ? channel(k.t) : f === 'vm' ? (k.p > 0 && k.m.md ? k.p/k.m.md : null) : f === 'p' ? (k.p > 0 ? Number(k.p) : null) : f === 'lcp' ? (k.lcp == null ? null : Number(k.lcp)) : (k[f] == null ? null : k[f]); });
      var lim2 = more.co || t ? S.length : 25;
      $('ixCo').innerHTML = S.slice(0, lim2).map(function(k){ return '<tr><td>'+esc(vgroup(k.v))+'</td><td class="d">'+esc(channel(k.t))+'</td><td>'+esc(k.m.nm)+'</td><td><span class="tp-pl">'+esc(k.pl || k.s)+'</span></td><td class="r w">'+px(k.p)+'</td><td class="r">'+(k.p > 0 && k.m.md ? vsMed(k.p, k.m.md) : '')+'</td>'+lastChange(k)+'</tr>'; }).join('')
        || '<tr><td colspan="8" class="d">No SKU matches that search.</td></tr>';
      $('ixCoM').innerHTML = S.length > lim2 ? 'Showing '+lim2+' of '+int(S.length)+' SKUs. <button class="tp-link" type="button" data-more="co">Show all '+int(S.length)+'</button>' : (t ? S.length+' of '+int(D.skus.length)+' SKUs match.' : '');
    }
  }

  /* ── Repricing ── */
  function rep(){
    var R = D.rep, lim = more.rp ? R.length : 10, inWin = {}; weeks().forEach(function(w){ inWin[w.d] = 1; });
    $('ixRp').innerHTML = R.slice(0, lim).map(function(r){ var m = D.A[r.a], ok = inWin[r.d];
      return '<tr'+(ok ? ' class="pick" tabindex="0" data-wk="'+esc(r.d)+'"' : '')+'><td class="d">'+sdate(r.d)+'</td><td>'+esc(vgroup(r.v))+'</td><td>'+esc(m ? m.nm : r.a)+'</td><td class="r d">'+px(r.from)+'</td><td class="r">'+px(r.to)+'</td><td class="r">'+chg(r.pc)+'</td></tr>'; }).join('')
      || '<tr><td colspan="6" class="d">No SKU in this index has changed its list price in the last six months.</td></tr>';
    $('ixRpM').innerHTML = R.length > lim ? 'Showing the '+lim+' most recent of '+R.length+' changes. <button class="tp-link" type="button" data-more="rp">Show all '+R.length+'</button>' : (R.length ? 'A change counts when a SKU’s list price moves more than 0.5% from its previous published week.' : '');
  }

  /* ── Vendors ── */
  function ven(){
    var V = D.ven.slice(), tot = D.skus.length || 1, top = V.reduce(function(a, v){ return Math.max(a, v.k); }, 0);
    $('ixVnN').textContent = 'Who supplies the basket, how much of it, and the models no other vendor sells. '+(top ? 'The largest vendor holds '+(top/tot*100).toFixed(1)+'% of the SKUs on this leg.' : '');
    $('ixVnH').innerHTML = '<tr>'+th('v','v','Vendor')+th('v','t','Channel')+th('v','k','SKUs',1)+th('v','sh','Share of the basket',1)+th('v','m','Models',1)+th('v','so','Sold only here',1)+'</tr>';
    sorter('v', V, function(v, f){ return f === 'sh' ? v.k : f === 't' ? channel(v.t) : v[f]; });
    var lim = more.vn ? V.length : 10;
    $('ixVn').innerHTML = V.slice(0, lim).map(function(v){ return '<tr><td>'+esc(vgroup(v.v))+'</td><td class="d">'+esc(channel(v.t))+'</td><td class="r">'+v.k+'</td><td class="r">'+(v.k/tot*100).toFixed(1)+'%</td><td class="r">'+v.m+'</td><td class="r'+(v.so ? '' : ' d')+'">'+(v.so || 'None')+'</td></tr>'; }).join('');
    $('ixVnM').innerHTML = V.length > lim ? 'Showing '+lim+' of '+V.length+' vendors. <button class="tp-link" type="button" data-more="vn">Show all '+V.length+'</button>' : '';
  }

  /* ── Admissions ── */
  function clean(r){ r = String(r || '');
    r = r.replace(/\s*\([^)]*(AUDIT|sweep|previously)[^)]*\)/gi, '').replace(/;?\s*admitted elsewhere under R\d+[^.]*/gi, '');
    r = r.replace(/^Same (basis|treatment) as [^:]+:\s*/i, '').replace(/\s*Same (basis|treatment) as [^.]*\./gi, '');
    r = r.replace(/\s*Tracked in AIPI [A-Z]{3} [A-Z]{3}\.?/g, '').replace(/\s*\((?:[A-Z]\d+|R\d+[A-Z-]*)\)/g, '').replace(/\s*under R\d+[A-Z-]*/g, '');
    r = r.replace(/\b(\d{4})-(\d{2})-(\d{2})\b/g, function(x){ return ldate(x); });
    return r.trim(); }
  function adm(){
    var A = D.adm.filter(function(a){ return a.st !== 'admitted' || a.vt; }), lim = more.ad ? A.length : 10;
    $('ixAd').innerHTML = A.slice(0, lim).map(function(a){ var left = a.st === 'excluded' && a.vf, d = left ? a.vf : a.vt || a.dt;
      var lab = a.st === 'admitted' ? 'Left' : left ? 'Left' : 'Not admitted';
      return '<tr><td class="d">'+sdate(d)+'</td><td>'+esc(a.nm)+'</td><td><span class="tp-tag2'+(lab === 'Left' ? ' on' : '')+'">'+lab+'</span></td><td class="d">'+esc(RULE[a.rc] || '')+'</td><td class="tp-wrap-c">'+esc(clean(a.r))+'</td></tr>'; }).join('')
      || '<tr><td colspan="5" class="d">No model has left this basket or been turned away so far.</td></tr>';
    $('ixAdM').innerHTML = A.length > lim ? 'Showing the '+lim+' most recent of '+A.length+' decisions. <button class="tp-link" type="button" data-more="ad">Show all '+A.length+'</button>' : '';
  }

  /* ── Close ── */
  function foot(){
    $('ixSrc').textContent = 'Source: Attic Standard, index levels and basket published '+ldate(D.date)+'. Figures update with each index publication. Unit: '+(sym() === '$' ? 'USD ' : sym() === '€' ? 'EUR ' : 'CNY ')+D.unit+'. Price: each SKU’s list price; the median counts each SKU once.';
  }
  function cite(b){ if(!D) return; var l = D.series[D.series.length-1], F = D.fig || {};
    copy(b, 'Attic Standard, '+cur+' ('+name(cur)+'), '+LEGN[leg].toLowerCase()+' leg, '+ldate(D.date)+': index level '+(l ? l.l.toFixed(2) : '')+(F.spot != null ? ', spot price '+sym()+fx(F.spot)+' '+D.unit : '')+'. atticstandard.com'); }

  /* ── Contents: the sections on the right, the one in view marked. ── */
  function toc(){
    var nav = $('ixToc'), S = [].slice.call(document.querySelectorAll('#tpIndexes .tp-xs'));
    nav.insertAdjacentHTML('beforeend', S.map(function(s, i){ return '<a href="#'+s.id+'" data-s="'+s.id+'"><b>'+(i+1)+'</b>'+esc(s.dataset.n)+'</a>'; }).join(''));
    nav.addEventListener('click', function(e){ var a = e.target.closest('a[data-s]'); if(!a) return; e.preventDefault(); go($(a.dataset.s)); });
    var on = null;
    function spy(){ if($('tpIndexes').hidden) return; var top = (parseInt(ROOT.style.getPropertyValue('--tp-top'), 10) || 160) + 40, pick = S[0];
      S.forEach(function(s){ if(s.getBoundingClientRect().top <= top) pick = s; });
      if(window.innerHeight + window.pageYOffset >= document.documentElement.scrollHeight - 4) pick = S[S.length-1];
      if(pick !== on){ on = pick; nav.querySelectorAll('a').forEach(function(a){ a.classList.toggle('on', a.dataset.s === pick.id); }); } }
    window.addEventListener('scroll', function(){ requestAnimationFrame(spy); }, { passive:true }); SPY = spy;
  }
  var SPY = function(){};
  function go(el){ if(!el) return; var top = (parseInt(ROOT.style.getPropertyValue('--tp-bar'), 10) || 102) + ($('tpBar') ? $('tpBar').offsetHeight : 56) + 24;
    window.scrollTo({ top:Math.max(0, window.pageYOffset + el.getBoundingClientRect().top - top), behavior:'smooth' }); }

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
    $('ixLegs').addEventListener('click', function(e){ var b = e.target.closest('[data-k]'); if(!b || b.dataset.k === leg) return; leg = b.dataset.k; load(); });
    $('ixLegs').addEventListener('pointerover', function(e){ var b = e.target.closest('[data-k]'); if(b) fetch(cur, b.dataset.k).catch(function(){}); });
    hover($('ixMvW'), $('ixMv'), function(p){ var w = p.w, m = D.M[w.d];
      return '<div class="t">Week of '+ldate(w.d)+'</div>Index '+(w.w == null ? 'first week' : chg(w.w, 2))+' <span class="t">to</span> <b>'+w.l.toFixed(2)+'</b>'+(m ? '<br>'+m.n+' models priced in both weeks' : '')+(w.d === wk ? '' : '<br><span class="t">Select to see what moved it</span>'); });
    $('ixMvW').addEventListener('click', function(e){ var G = $('ixMv')._geo; if(!G) return; var r = $('ixMv').getBoundingClientRect(), f = (e.clientX - r.left)/r.width, best = null, bd = 1e9;
      G.pts.forEach(function(p){ var d = Math.abs(p.f - f); if(d < bd){ bd = d; best = p; } }); if(best) pickWeek(best.w.d); });
    $('ixMvW').addEventListener('keydown', function(e){ if(e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return; e.preventDefault(); var ws = weeks(), i = ws.findIndex(function(w){ return w.d === wk; }), n = ws[i + (e.key === 'ArrowRight' ? 1 : -1)]; if(n) pickWeek(n.d); });
    $('ixMvW').tabIndex = 0; $('ixMvW').setAttribute('aria-label', 'Weekly change chart. Use the left and right arrow keys to choose a week.');
    $('ixFind').addEventListener('input', function(){ more.co = false; comp(); });
    $('ixCoV').addEventListener('click', function(e){ var b = e.target.closest('[data-v]'); if(!b || b.dataset.v === view) return; view = b.dataset.v; more.co = false; comp(); });
    function toggle(tr){ open[tr.dataset.a] = !open[tr.dataset.a]; comp(); }
    $('ixCo').addEventListener('click', function(e){ var tr = e.target.closest('tr[data-a]'); if(tr) toggle(tr); });
    $('ixCo').addEventListener('keydown', function(e){ if(e.key !== 'Enter' && e.key !== ' ') return; var tr = e.target.closest('tr[data-a]'); if(!tr) return; e.preventDefault(); toggle(tr); var n = $('ixCo').querySelector('tr[data-a="'+tr.dataset.a+'"]'); if(n) n.focus(); });
    [['ixCoH','co'],['ixVnH','vn']].forEach(function(p){ $(p[0]).addEventListener('click', function(e){ var h = e.target.closest('[data-sort]'); if(!h) return; var w = p[1] === 'vn' ? 'v' : view, s = sortS[w];
      sortS[w] = s[0] === h.dataset.sort ? [s[0], -s[1]] : [h.dataset.sort, /^(nm|c|v|t|pl)$/.test(h.dataset.sort) ? 1 : -1]; p[1] === 'vn' ? ven() : comp(); }); });
    $('ixRp').addEventListener('click', function(e){ var tr = e.target.closest('tr[data-wk]'); if(!tr) return; pickWeek(tr.dataset.wk); go($('ixS1')); });
    $('ixRp').addEventListener('keydown', function(e){ if(e.key !== 'Enter') return; var tr = e.target.closest('tr[data-wk]'); if(!tr) return; pickWeek(tr.dataset.wk); go($('ixS1')); });
    $('tpIndexes').addEventListener('click', function(e){
      var m = e.target.closest('[data-more]'); if(m){ more[m.dataset.more] = true; ({ co:comp, rp:rep, vn:ven, ad:adm })[m.dataset.more](); return; }
      var g = e.target.closest('[data-go]'); if(g){ try{ localStorage.setItem('atMoModel', g.dataset.go); }catch(x){} MO.open(g.dataset.go); show('models', true); } });
    $('ixCite').addEventListener('click', function(){ cite(this); });
    toc();
    if(!sb){ message($('ixMsg'), 'Indexes load once you are logged in.'); return; }
    sb.rpc('terminal_index_list').then(function(r){
      if(r.error) throw r.error; L = r.data || []; if(!L.length){ message($('ixMsg'), 'No index is published yet.'); return; }
      L.forEach(function(i){ BY[i.code] = i; });
      var keep = null, kl = null; try{ keep = localStorage.getItem('atIxCode'); kl = localStorage.getItem('atIxLeg'); }catch(e){}
      cur = BY[keep] ? keep : (BY['AIPI TXT GLB'] ? 'AIPI TXT GLB' : L[0].code); leg = kl; famLast[BY[cur].fam] = cur;
      selector(); load();
    }).catch(function(e){ console.error('[Indexes]', e); message($('ixMsg'), 'Indexes could not be loaded. Refresh the page, or log in again if the problem persists.'); });
  }
  function count(){ return L.length; }
  return { start:start, count:count };
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
        q(sb.from('v_fair_value_models').select('anchor_id,model_name,creator,vendors').in('anchor_id', ids)),
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
    var M = Object.keys(mods).map(function(k){ var m = mods[k], i = info[k] || {}; m.name = i.model_name || k; m.dev = i.creator || ''; m.vendors = num(i.vendors) || 0; return m; })
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
      all(function(){ return sb.from('v_fair_value_models').select('anchor_id,model_name,creator,tier,modality,vendors,vendor_names,model_family,parameter_count,context_window,max_output_tokens,modality_input,modality_output,tool_calling,json_mode,training_cutoff,license_type,license_class,is_reasoning,creator_country').gte('vendors', 2).order('vendors', { ascending:false }).order('model_name'); }),
      q(sb.from('index_registry').select('index_code').eq('is_published', true)).catch(function(){ return []; })
    ]).then(function(r){ MODELS = r[0] || []; r[1].forEach(function(x){ PUB[x.index_code] = 1; });
      if(!MODELS.length){ message($('moMsg'), 'No model is sold by two or more vendors in the latest publication.'); return; }
      var mods = {}, vens = {};
      MODELS.forEach(function(m){ m._k = String(m.model_name).toLowerCase().replace(/[-._\s/]/g,''); if(m.modality) mods[m.modality] = 1; m._v = (m.vendor_names || []).map(vgroup); m._v.forEach(function(v){ vens[v] = 1; }); });
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
function go(){ if($('atomTP')) return; shell(); ready.then(function(){ header(SESSION); }); }
if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go); else go();
})();

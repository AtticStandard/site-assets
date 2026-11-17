/* ═══ THE FIVE DRIVERS (homepage #hpDrivers) ═══
   Moved here from the homepage embed on November 17, 2026. Every chart is drawn on the shared chart
   frame (AS.chart) from the published Clause page payload, so the figures move with each publication.
   Site rule C: each chart has a legend with values above it (AS.chart.legend) and no names or values
   at line ends; scale labels sit inside the plot; a top-left label names what the chart measures. */
(function(){
var AS = window.AS || {}, H = AS.home;
var DRV = [
{ k:'spread', name:'Vendor spread', short:'One model, priced differently by vendor' },
{ k:'reprice', name:'Vendor repricing', short:'Each vendor changes its list price at will' },
{ k:'drift', name:'Price drift', short:'Prices of models on sale move over time' },
{ k:'components', name:'Component shifts', short:'Input, cached input and output move apart' },
{ k:'turnover', name:'Model turnover', short:'Models are listed and withdrawn continually' }];
var NAMES = { FLG:'Flagship', CMP:'Compact', COR:'Core', TXT:'Text', DEV:'Model developers', EMB:'Embeddings', MML:'Multimodal', CLD:'Cloud marketplaces', PLT:'Inference platforms', NCL:'Neoclouds' };
var LEGS = { input:'input', output:'output', cached:'cached input' };
var P = null, AX = null, WEEKS = null, CH = {}, TXT = {}, LGD = {}, sel = 0;

function C(){ return AS.chart; }
function T(x, y, s, cls, anchor, size, w){ return C().text(x, y, s, { cls:cls || 'as-f-l4', anchor:anchor, size:size || 11, weight:w }); }
function svg(inner, label){ return C().svg(inner, label); }
function pct(v, dp){ var a = Math.abs(v).toFixed(dp); return (Number(a) === 0 ? '' : (v > 0 ? '+' : '−')) + a + '%'; }

/* Index levels since May for the legs the Clause page follows. Legend with values above the chart
(site rule C); each line names itself on hover. */
function drift(){
var c = C(), ser = P.series, keys = Object.keys(ser), hl = 'AIPI TXT GLB|output';
if(!ser[hl]) hl = keys[0];
var all = []; keys.forEach(function(k){ ser[k].forEach(function(p){ all.push(+p[1]); }); });
var lo = Math.min(85, Math.floor(Math.min.apply(null, all) - 1)), hi = Math.max(103, Math.ceil(Math.max.apply(null, all) + 1));
var Y = function(v){ return c.PB - (v - lo) / (hi - lo) * (c.PB - c.PT); };
var g = [c.rule(Y(100), { dash:'3 4' }), T(c.X0, 10, 'Index level, May = 100')];
function nm(k){ var code = k.split('|')[0].split(' ')[1], leg = k.split('|')[1]; return (NAMES[code] || code) + ' ' + (LEGS[leg] || leg); }
function chg(k){ var s = ser[k]; return +s[s.length - 1][1] - 100; }
function pts(k){ return ser[k].map(function(p){ return AX.x(p[0]).toFixed(1) + ',' + Y(+p[1]).toFixed(1); }).join(' '); }
var oth = keys.filter(function(k){ return k !== hl; }), mn = 0, mxo = 0;
oth.forEach(function(k, n){ var v = chg(k); if(n === 0 || v < mn) mn = v; if(n === 0 || v > mxo) mxo = v;
g.push('<polyline fill="none" class="as-s-bar3" stroke-width="1" points="' + pts(k) + '"><title>' + H.esc(nm(k) + ', ' + pct(v, 1)) + '</title></polyline>'); });
var tl = chg(hl), s = ser[hl];
g.push('<polyline fill="none" class="as-s-series" stroke-width="2.2" points="' + pts(hl) + '"><title>' + H.esc(nm(hl) + ', ' + pct(tl, 2)) + '</title></polyline>');
g.push('<circle cx="' + AX.x(s[s.length - 1][0]).toFixed(1) + '" cy="' + Y(+s[s.length - 1][1]).toFixed(1) + '" r="4" class="as-f-series"></circle>');
g.push(AX.svg());
var mx = 0; keys.forEach(function(k){ mx = Math.max(mx, Math.abs(chg(k))); });
var nmh = nm(hl); nmh = nmh.charAt(0).toUpperCase() + nmh.slice(1);
LGD.drift = [{ k:'line', c:'var(--series)', n:nmh, v:pct(tl, 2), note:'since May' }, { k:'thin', c:'var(--bar-3)', n:'Other indexes', v:pct(mxo, 1) + ' to ' + pct(mn, 1) }];
TXT.drift = 'The text output index is <strong>' + Math.abs(tl).toFixed(2) + '%</strong> ' + (tl <= 0 ? 'below' : 'above') + ' its May level, and other indexes have moved by as much as ' + mx.toFixed(1) + '%.';
return svg(g.join(''), 'Index legs since May: text output is ' + Math.abs(tl).toFixed(2) + '% ' + (tl <= 0 ? 'below' : 'above') + ' its May level; others have moved by as much as ' + mx.toFixed(1) + '%');
}

/* Every lasting price change since May, by week and size. The scale sits inside the plot at its
left edge; the medians are named in the legend. */
function reprice(){
var c = C(), r = P.reprice, ev = P.reprice_events;
TXT.reprice = 'Vendors made <strong>' + H.int(r.n) + '</strong> lasting changes to their list prices in 13 weeks: ' + H.int(r.down) + ' cuts and ' + H.int(r.up) + ' rises.';
if(!ev || !ev.length) return '';
var top = 44, bot = c.PB - 6, zero = (top + bot) / 2, from = H.addDays(WEEKS[WEEKS.length - 1], -84);
var Y = function(v){ return zero - Math.max(-100, Math.min(100, v)) / 100 * (zero - top); };
var g = [];
[100, 50, -50, -100].forEach(function(v){ g.push(c.rule(Y(v), { cls:'as-s-grid' })); if(Math.abs(v) === 100) g.push(T(c.X0, Y(v) - 4, H.minus((v > 0 ? '+' : '') + v + '%'), 'as-f-l4', 'start', 10)); });
g.push(c.rule(zero)); g.push(T(c.X0, zero - 4, '0%', 'as-f-l4', 'start', 10));
g.push(c.band(AX, from, 'Last 13 weeks'));
var byw = {}, labs = [c.X0 + 20, c.X1 + 8]; ev.forEach(function(e){ (byw[e[0]] = byw[e[0]] || []).push(+e[1]); });
Object.keys(byw).forEach(function(d){
var cx = AX.x(d), recent = d >= from, vals = byw[d].sort(function(a, b){ return a - b; }), seen = {}, tot = {};
vals.forEach(function(v){ var k = Math.round(Y(v) / 6); tot[k] = (tot[k] || 0) + 1; });
vals.forEach(function(v){
var key = Math.round(Y(v) / 6), k = seen[key] || 0; seen[key] = k + 1;
var per = Math.min(tot[key], 6), col = k % 6, row = Math.floor(k / 6), x = cx + (col - (per - 1) / 2) * 5.2, cls = recent ? 'as-f-series' : 'as-f-bar3';
if(v > 100){
g.push('<path d="M' + (x - 4).toFixed(1) + ',' + (top + 4) + ' L' + x.toFixed(1) + ',' + (top - 3) + ' L' + (x + 4).toFixed(1) + ',' + (top + 4) + ' Z" class="' + cls + '"></path>');
/* Rises above +100% are marked at the top edge; a label is skipped where it would touch its neighbour. */
if(labs.every(function(lx){ return Math.abs(lx - x) > 38; })){ labs.push(x); g.push(T(x, top - 8, '+' + Math.round(v) + '%', 'as-f-l4', 'middle', 10)); }
} else g.push('<circle cx="' + x.toFixed(1) + '" cy="' + (Y(v) + row * 5).toFixed(1) + '" r="2.6" class="' + cls + '" fill-opacity="' + (recent ? 0.9 : 0.7) + '"></circle>');
});
});
var sp = (c.X1 - c.X0) / (WEEKS.length - 1);
[+r.med_up, -r.med_down].forEach(function(m){
if(!isFinite(m)) return;
g.push('<line x1="' + (AX.x(from) - sp / 2).toFixed(1) + '" y1="' + Y(m).toFixed(1) + '" x2="' + c.AR + '" y2="' + Y(m).toFixed(1) + '" class="as-s-series" stroke-dasharray="4 4" stroke-width="1"></line>');
});
g.push(AX.svg());
LGD.reprice = [{ k:'dot', c:'var(--series)', n:'Last 13 weeks', v:H.int(r.n) + ' changes' }, { k:'dot', c:'var(--bar-3)', n:'Earlier' },
{ k:'dash', c:'var(--series)', n:'Median rise', v:'+' + r.med_up + '%' }, { k:'dash', c:'var(--series)', n:'Median cut', v:'−' + r.med_down + '%' }];
return svg(g.join(''), 'Every lasting price change since May, by week and size; in the last 13 weeks ' + r.n + ' changes, ' + r.down + ' cuts with a median of ' + r.med_down + ' percent and ' + r.up + ' rises with a median of ' + r.med_up + ' percent');
}

/* Listings added and withdrawn each week since May. */
function turnover(){
var c = C(), L = P.listings, w = L.weeks, n = w.length, mx = 1, i;
w.forEach(function(r){ mx = Math.max(mx, r[1], r[2]); });
var sp = (c.X1 - c.X0) / (n - 1), bar = sp * 0.6, mid = 150, up = 104, from = H.addDays(WEEKS[WEEKS.length - 1], -84);
var g = [c.band(AX, from, 'Last 13 weeks'), c.rule(mid), T(c.X0, 10, 'Listings per week')];
w.forEach(function(r, i){
var x = AX.x(r[0]) - bar / 2, recent = i >= n - 13, ha = r[1] / mx * up, hb = r[2] / mx * up;
g.push('<rect x="' + x.toFixed(1) + '" y="' + (mid - ha).toFixed(1) + '" width="' + bar.toFixed(1) + '" height="' + ha.toFixed(1) + '" rx="1.5" class="' + (recent ? 'as-f-series' : 'as-f-bar4') + '"></rect>');
g.push('<rect x="' + x.toFixed(1) + '" y="' + (mid + 1).toFixed(1) + '" width="' + bar.toFixed(1) + '" height="' + hb.toFixed(1) + '" rx="1.5" class="' + (recent ? 'as-f-bar3' : 'as-f-bar4') + '"></rect>');
});
var ia = 0, ib = 0; for(i = 1; i < n; i++){ if(w[i][1] > w[ia][1]) ia = i; if(w[i][2] > w[ib][2]) ib = i; }
g.push(T(AX.x(w[ia][0]), mid - w[ia][1] / mx * up - 6, String(w[ia][1]), 'as-f-l4', 'middle', 10));
g.push(T(AX.x(w[ib][0]), mid + w[ib][2] / mx * up + 14, String(w[ib][2]), 'as-f-l4', 'middle', 10));
g.push(AX.svg());
LGD.turnover = [{ k:'bar', c:'var(--series)', n:'Added', v:H.int(L.added_13w), note:'in 13 weeks' }, { k:'bar', c:'var(--bar-3)', n:'Withdrawn', v:H.int(L.gone_13w), note:'in 13 weeks' }, { k:'bar', c:'var(--bar-4)', n:'Earlier weeks' }];
TXT.turnover = 'In 13 weeks, vendors added <strong>' + H.int(L.added_13w) + '</strong> listings and withdrew <strong>' + H.int(L.gone_13w) + '</strong>, with ' + H.int(L.live) + ' on sale today.';
return svg(g.join(''), 'Model listings added and withdrawn each week since May; in the last 13 weeks ' + L.added_13w + ' were added and ' + L.gone_13w + ' withdrawn');
}

/* The text index's three components since May. */
function components(){
var c = C(), ser = P.series, k = function(l){ return ser['AIPI TXT GLB|' + l]; };
if(!k('input') || !k('cached') || !k('output')) return '';
var last = function(l){ var s = k(l); return +s[s.length - 1][1]; };
var all = []; ['input', 'output', 'cached'].forEach(function(l){ k(l).forEach(function(p){ all.push(+p[1]); }); });
var lo = Math.min(93, Math.floor(Math.min.apply(null, all) - 1)), hi = Math.max(101, Math.ceil(Math.max.apply(null, all) + 1));
var Y = function(v){ return c.PB - (v - lo) / (hi - lo) * (c.PB - c.PT); };
var g = [c.rule(Y(100), { dash:'3 4' }), T(c.X0, 10, 'Text index level, May = 100')];
[['input', 'as-s-hist', 1.5], ['output', 'as-s-hist', 1.5], ['cached', 'as-s-series', 2.2]].forEach(function(l){
g.push('<polyline fill="none" class="' + l[1] + '" stroke-width="' + l[2] + '" points="' + k(l[0]).map(function(p){ return AX.x(p[0]).toFixed(1) + ',' + Y(+p[1]).toFixed(1); }).join(' ') + '"></polyline>');
});
var sc = k('cached');
g.push('<circle cx="' + AX.x(sc[sc.length - 1][0]).toFixed(1) + '" cy="' + Y(last('cached')).toFixed(1) + '" r="4" class="as-f-series"></circle>');
g.push(AX.svg());
LGD.components = [{ k:'line', c:'var(--series)', n:'Cached input', v:pct(last('cached') - 100, 2), note:'since May' }, { k:'line', c:'var(--series-history)', n:'Input', v:pct(last('input') - 100, 2) }, { k:'line', c:'var(--series-history)', n:'Output', v:pct(last('output') - 100, 2) }];
var di = 100 - last('input'), dc = 100 - last('cached');
TXT.components = (di > 0.05 && dc > 0)
? 'Since May, cached input prices have fallen <strong>' + (dc / di).toFixed(1) + ' times</strong> as fast as standard input prices.'
: 'Since May, cached input prices have moved <strong>' + pct(-dc, 1) + '</strong> and standard input prices ' + pct(-di, 1) + '.';
return svg(g.join(''), 'Text index since May: cached input ' + pct(-dc, 2) + ' against its May level, input ' + pct(-di, 2));
}

/* One model, every vendor's price for it. */
function spread(){
var c = C(), sp = P.spread, p = sp.prices.map(Number).sort(function(a, b){ return a - b; }), med = +sp.median;
var lo = Math.floor(p[0] * 1000) / 1000, hi = Math.ceil(p[p.length - 1] * 1000) / 1000;
if(hi - lo < 0.004){ hi = lo + 0.004; }
var stepMaj = (hi - lo) > 0.012 ? 0.002 : 0.001;
var X = function(v){ return c.X0 + (v - lo) / (hi - lo) * (c.X1 - c.X0); };
var g = [c.rule(c.TA), T(c.X0, 10, 'Price per 1,000 tokens, one model')];
for(var t = lo; t <= hi + 1e-9; t += stepMaj / 4){
var major = Math.abs(Math.round(t / stepMaj) * stepMaj - t) < 1e-9;
g.push('<line x1="' + X(t).toFixed(1) + '" y1="' + c.TA + '" x2="' + X(t).toFixed(1) + '" y2="' + (c.TA + (major ? 8 : 4)) + '" class="as-s-axis"></line>');
/* The end labels sit inside the frame: the first starts at its tick, the last ends at its tick. */
if(major) g.push(T(X(t), c.TA + 22, '$' + t.toFixed(3), 'as-f-l4', t - lo < 1e-9 ? 'start' : hi - t < 1e-9 ? 'end' : 'middle', 10));
}
/* Prices within a twentieth of a cent of each other share a column. */
var cols = []; p.forEach(function(v){ var q = cols.filter(function(cc){ return Math.abs(cc.v - v) < 0.00005; })[0]; if(q) q.n++; else cols.push({ v:v, n:1 }); });
var base = c.TA - 12, st = 14, medCol = cols.filter(function(cc){ return Math.abs(cc.v - med) < 0.00005; })[0];
cols.forEach(function(cc){ for(var j = 0; j < cc.n; j++) g.push('<circle cx="' + X(cc.v).toFixed(1) + '" cy="' + (base - j * st).toFixed(1) + '" r="6" class="' + ((cc === cols[0] || cc === cols[cols.length - 1]) ? 'as-f-series' : 'as-f-bar3') + '"></circle>'); });
var ratio = p[p.length - 1] / p[0];
var an = function(x){ return x - c.X0 < 60 ? 'start' : c.X1 - x < 60 ? 'end' : 'middle'; }, ax = function(x){ return x - c.X0 < 60 ? x - 6 : c.X1 - x < 60 ? x + 6 : x; };
g.push(T(ax(X(p[0])), base - 22, 'Lowest, 1×', 'as-f-l2', an(X(p[0]))));
g.push(T(ax(X(p[p.length - 1])), base - 22, 'Highest, ' + ratio.toFixed(1) + '×', 'as-f-l2', an(X(p[p.length - 1]))));
if(medCol && medCol.n > 1) g.push(T(X(medCol.v) + 14, base - (medCol.n - 1) * st + 4, medCol.n + ' vendors at the median'));
LGD.spread = [{ k:'dot', c:'var(--series)', n:'Lowest and highest', v:'$' + p[0].toFixed(4) + ' and $' + p[p.length - 1].toFixed(4) }, { k:'dot', c:'var(--bar-3)', n:'Other vendors', v:String(p.length - 2) }];
TXT.spread = 'Across the ' + p.length + ' vendors that sell the same model, the highest price is <strong>' + ratio.toFixed(1) + ' times</strong> the lowest.';
return svg(g.join(''), 'One model priced by ' + p.length + ' vendors: the highest price is ' + ratio.toFixed(1) + ' times the lowest');
}

/* Story tabs: the first driver is selected, its bar full; the reader
picks the others. Nothing advances on its own. */
function tabs(){
var el = document.getElementById('hpDsTabs');
el.innerHTML = DRV.map(function(d, i){
return '<button class="as-ds-t" role="tab" type="button" aria-selected="false" data-i="' + i + '"><span class="as-ds-bar"><span class="as-ds-fill"></span></span><span class="as-ds-n">' + d.name + '</span><span class="as-ds-s">' + d.short + '</span></button>';
}).join('');
el.addEventListener('click', function(e){ var b = e.target.closest('.as-ds-t'); if(!b) return; show(+b.getAttribute('data-i')); });
el.addEventListener('keydown', function(e){
if(e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return; e.preventDefault();
show((sel + (e.key === 'ArrowRight' ? 1 : DRV.length - 1)) % DRV.length); el.querySelectorAll('.as-ds-t')[sel].focus();
});
}
function show(i){
sel = i;
var bs = document.querySelectorAll('#hpDsTabs .as-ds-t');
bs.forEach(function(b, n){
var on = n === i, f = b.querySelector('.as-ds-fill'), nm = b.querySelector('.as-ds-n');
b.setAttribute('aria-selected', on ? 'true' : 'false'); b.tabIndex = on ? 0 : -1;
nm.style.color = on ? 'var(--l1)' : '';
f.style.animation = ''; f.style.width = '';
if(on) f.style.width = '100%';
});
var k = DRV[i].k;
document.getElementById('hpDsText').innerHTML = TXT[k] || '&nbsp;';
var el = document.getElementById('hpDsChart');
/* Charts are redrawn at the panel's real width when the shared frame can do it. */
if(AS.chart.mount) AS.chart.mount(el, CH[k] || null);
else el.innerHTML = CH[k] ? CH[k]() : '';
if(AS.chart.legend) AS.chart.legend(AS.chart.legendFor(el), CH[k] ? LGD[k] : []);
}

function start(){
if(!document.getElementById('hpDrivers') || !AS.hp || !AS.chart) return;
tabs(); show(0);
AS.hp.then(function(d){
P = d; WEEKS = (d.listings && d.listings.weeks || []).map(function(w){ return w[0]; });
if(WEEKS.length < 2){ var s0 = d.series[Object.keys(d.series)[0]]; WEEKS = s0.map(function(p){ return p[0]; }); }
AX = AS.chart.axis(WEEKS[0], WEEKS[WEEKS.length - 1]);
[['spread', spread], ['reprice', reprice], ['drift', drift], ['components', components], ['turnover', turnover]].forEach(function(f){
try { if(f[1]()) CH[f[0]] = f[1]; } catch(e){ console.error('Attic Standard driver chart ' + f[0] + ':', e); }
});
show(sel);
}).catch(function(){});
}
if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();

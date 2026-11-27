/* ═══ HOMEPAGE: THE TERMINAL SECTION (#hpTerm) AND TERMINAL-FIRST WORDING (November 27, 2026) ═══
   The Terminal is the way in and the Clause the next step. A new section above the Clause section
   shows what the Terminal answers: are we paying the market price? Three points sit on the left and
   step every six seconds, like the five drivers but stacked, with a thin bar beside the current point
   filling from top to bottom; the monitor on the right shows that point's screen (widescreen shots of
   the Terminal, real data from the November 23, 2026 publication, in site/img/terminal). Hovering
   pauses the steps, picking a point stops them there, and nothing moves for readers who ask for
   reduced motion or while the section is off screen.
   The wording changes below fold into the homepage embeds when they are next edited. */
(function(){
var src = (document.currentScript && document.currentScript.src) || '';
var IMG = src.replace(/\/site\/[^\/]*$/, '/site/img/terminal/');
var PTS = [
  { n:'Pricing history', d:'How the market price of each model you buy has moved, with your own rate drawn against it, so you can see whether you are paying above the market and for how long.',
    img:'models-history.jpg', t:'Terminal · Models · Price history', alt:'The Terminal price history for one model: the market price by week, the range across vendors and the subscriber’s own price as a dashed line' },
  { n:'Vendor comparison', d:'Every vendor selling the same model, ranked by price, with your rate placed among them. It shows where a better offer exists and backs the case for a lower one.',
    img:'models-vendors.jpg', t:'Terminal · Models · Week of November 23, 2026', alt:'The Terminal week table for one model: every vendor, cheapest first, with the subscriber’s own price as a marked row among them' },
  { n:'Competitive landscape', d:'Which segments have many vendors competing and which have few, how far their prices differ and how often they change them, so you know where there is room to negotiate.',
    img:'indexes-behavior.jpg', t:'Terminal · Indexes · Flagship', alt:'The Terminal view of one index: its split by vendor type, price dispersion, vendor concentration, repricing and volatility' },
  { n:'Contract tracking and settlement', c:1, d:'Once a contract is priced on the Attic Standard Clause, the Terminal follows it against its index and shows what each month settles at next to the price you signed.',
    img:'contracts-settlement.jpg', t:'Terminal · Contracts · Simulated contract', alt:'The Terminal view of a simulated $10 million contract on the flagship index: the November settled value against the signed value, each leg against its floor, and the monthly bill under the Clause against the fixed price' }];

/* The section's styles, kept with it (homepage only). */
var CSS = `body #hpTerm .as-tm-t.as-tm-c .as-tm-fill{background:var(--gold,#D4AF37)}body #hpTerm .as-tm-t.as-tm-c[aria-selected="true"] .as-tm-n,body #hpTerm .as-tm-t.as-tm-c:hover .as-tm-n{color:var(--gold,#D4AF37)}body .as-hero #hpHeroCl.as-btn{background:transparent !important;color:var(--gold,#D4AF37) !important;border-color:var(--gold,#D4AF37) !important}body .as-hero #hpHeroCl.as-btn:hover,body .as-hero #hpHeroCl.as-btn:focus-visible{background:rgba(212,175,55,.1) !important}svg.as-vx .as-fr-hide{display:none!important}body #hpTerm .as-tm{display:grid;grid-template-columns:minmax(0,5fr) minmax(0,7fr);gap:56px;align-items:center}body #hpTerm .as-tm-l .as-sh{margin-bottom:0}body #hpTerm .as-tm-pts{display:flex;flex-direction:column;margin-top:var(--s5)}body #hpTerm .as-tm-t{all:unset;box-sizing:border-box;cursor:pointer;display:grid;grid-template-columns:2px minmax(0,1fr);column-gap:18px;padding:14px 0}body #hpTerm .as-tm-t:focus-visible{outline:2px solid var(--accent);outline-offset:4px;border-radius:2px}body #hpTerm .as-tm-bar{position:relative;background:var(--border);border-radius:1px;overflow:hidden}body #hpTerm .as-tm-fill{position:absolute;left:0;top:0;width:2px;height:0;background:var(--l1)}body #hpTerm .as-tm-x{min-width:0}body #hpTerm .as-tm-n{display:block;font-size:var(--fs-lead);font-weight:600;line-height:var(--lh-ui);color:var(--l3);transition:color .15s}body #hpTerm .as-tm-t:hover .as-tm-n,body #hpTerm .as-tm-t[aria-selected="true"] .as-tm-n{color:var(--l1)}body #hpTerm .as-tm-d{display:block;margin-top:4px;font-size:var(--fs-ui);line-height:1.55;color:var(--l4)}body #hpTerm .as-tm-mon{background:var(--surface-raised);border:1px solid var(--border);border-radius:10px;padding:12px;box-shadow:0 30px 80px rgba(0,0,0,.45)}body #hpTerm .as-tm-top{display:flex;align-items:center;gap:6px;height:14px;margin:-2px 2px 10px}body #hpTerm .as-tm-top i{width:7px;height:7px;border-radius:50%;background:#3A4048}body #hpTerm .as-tm-top em{margin-left:10px;font-style:normal;font-size:10px;font-weight:500;letter-spacing:1.2px;text-transform:uppercase;color:var(--l5);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}body #hpTerm .as-tm-scr{position:relative;aspect-ratio:16/9;overflow:hidden;border:1px solid var(--border);border-radius:4px;background:var(--bg)}body #hpTerm .as-tm-scr img{position:absolute;inset:0;width:100%;height:100%;max-width:none;object-fit:cover;opacity:0;transition:opacity .5s ease}body #hpTerm .as-tm-scr img.on{opacity:1}body #hpTerm .as-sf{margin-top:var(--s6)}@media (prefers-reduced-motion:reduce){body #hpTerm .as-tm-scr img{transition:none}}@media (max-width:991px){body #hpTerm .as-tm{grid-template-columns:none;gap:var(--s5)}}@media (max-width:767px){body #hpTerm .as-tm-mon{padding:8px;border-radius:8px}body #hpTerm .as-tm-top{margin-bottom:8px}body #hpTerm .as-tm-t{padding:10px 0}}`;
function styles(){ if(document.getElementById('asHomeTermCss')) return; var st = document.createElement('style'); st.id = 'asHomeTermCss'; st.textContent = CSS; document.head.appendChild(st); }

function txt(el, from, to){ if(el && el.textContent.indexOf(from) > -1) el.textContent = el.textContent.replace(from, to); }
function find(sel, has){ return [].slice.call(document.querySelectorAll(sel)).filter(function(e){ return e.textContent.indexOf(has) > -1; })[0]; }

/* The wording: the hero says what the indexes show before what contracts do with them, and its main
   button opens the Terminal; the Clause becomes the step after; the close offers the comparison. */
function words(){
  var hp = find('.as-hero p.as-prose', 'price their contracts against');
  if(hp) hp.textContent = hp.textContent.replace(/We turn published vendor rates into indexes that[^.]*\./, 'We turn published vendor rates into indexes that buyers and sellers use to track the market and price their contracts against.');
  var b = find('.as-hero a.as-btn', 'Contact us about a contract');
  if(b){ b.textContent = 'See the Terminal'; b.setAttribute('href', '/terminal'); b.removeAttribute('data-contact-open'); b.removeAttribute('data-contact-topic'); }
  txt(find('#hpClause .as-ss', 'Your bill follows'), 'Your bill follows an Attic Standard index month by month, at a price neither side sets.',
    'Once you know the market price, the Clause keeps you on it: your bill follows an Attic Standard index month by month, at a price neither side sets.');
  txt(find('#hpCov .as-ss', 'so your contract follows'), 'so your contract follows the whole market', 'so the benchmark reflects the whole market');
  txt(find('.as-sec .as-ss', 'Every figure your contract settles on'), 'Every figure your contract settles on traces back', 'Every published figure traces back');
  var p = find('.as-sec p.as-prose', 'how the Clause would have priced');
  if(p){ p.textContent = 'A 30-minute session compares the models you use with the benchmark, before you negotiate or renew.';
    var cs = p.closest('.as-sec'), h = cs.querySelector('h2.as-st'); txt(h, 'Put the market price in your next AI contract.', 'Bring the market price to your next AI contract.');
    /* Two links up front: the Terminal as the button, the Clause as the text link beside it. The one-page
       overview moves from the hero to the close, in place of the Clause link there. */
    var pdf = document.querySelector('.as-hero a[data-ov-pdf], .as-hero a[href="#overview"]') || find('.as-hero a', 'One-page overview');
    var ex = find('.as-sec a.as-cl-l', 'Explore the Clause');
    if(pdf && ex && !document.getElementById('hpHeroCl')){
      var cl = document.createElement('a'); cl.id = 'hpHeroCl'; cl.className = 'as-btn as-btn-s'; cl.textContent = 'See the Clause'; cl.setAttribute('href', '/clause');
      pdf.parentNode.insertBefore(cl, pdf);
      pdf.className = ex.className; ex.parentNode.replaceChild(pdf, ex);
    }
  }
}

/* The hero diagram in two frames (option C, November 27, 2026): a Terminal window around the point where
   vendor prices become the index, and a Clause frame around the contract price and the bill. The frame
   names and lines take the size of the diagram's own labels and follow them when they are rescaled;
   phones, which show a legend instead of labels, get the two frames as legend entries. */
var NS = 'http://www.w3.org/2000/svg';
function el(tag, at){ var e = document.createElementNS(NS, tag); for(var k in at) e.setAttribute(k, at[k]); return e; }
function frames(){
  var s = document.querySelector('svg.as-vx'); if(!s || s.querySelector('.as-fr')) return;
  var lines = [].slice.call(s.querySelectorAll('polyline')).filter(function(l){ return !l.closest('.as-s-series'); }), gold = lines.filter(function(l){ return /gold/.test(l.getAttribute('style') || ''); })[0];
  var idx = lines.filter(function(l){ return l !== gold; })[0]; if(!idx || !gold) return;
  function xs(l){ return l.getAttribute('points').trim().split(/\s+/).map(function(p){ return +p.split(',')[0]; }); }
  var ix = xs(idx), gx = xs(gold), x0 = Math.min.apply(null, ix), x1 = Math.max.apply(null, ix);
  var vb = (s.getAttribute('viewBox') || '0 28 1200 168').split(/\s+/).map(Number), top = vb[1] + 4, h = vb[3] - 8;
  var ref = [].slice.call(s.querySelectorAll('text')).filter(function(t){ return t.textContent.trim() === 'Attic Standard index'; })[0];
  var g = el('g', { 'class':'as-fr', 'aria-hidden':'true' }), T = [];
  function frame(x, w, stroke, fill, name, line){
    g.appendChild(el('rect', { x:x, y:top, width:w, height:h, rx:8, fill:fill, stroke:stroke, 'stroke-opacity':'.55', 'vector-effect':'non-scaling-stroke' }));
    var a = el('text', { x:x + 14, y:top + 18, 'font-family':'Roboto, sans-serif', 'font-weight':'600', 'letter-spacing':'1', style:'fill:' + stroke }); a.textContent = name;
    var b = el('text', { x:x + 14, y:top + h - 12, 'font-family':'Roboto, sans-serif', style:'fill:var(--l4)' }); b.textContent = line;
    g.appendChild(a); g.appendChild(b); T.push(a, b);
  }
  var tx = Math.max(vb[0], x0 - 200);
  frame(tx, x1 - 6 - tx, '#3278FF', 'rgba(50,120,255,.05)', 'ATTIC STANDARD TERMINAL', 'Discover and monitor the market price');
  var cx = x1 + 6;
  frame(cx, Math.max(Math.max.apply(null, gx) + 40, vb[0] + vb[2] + 6) - cx, '#D4AF37', 'rgba(212,175,55,.05)', '\u00a7 ATTIC STANDARD CLAUSE', 'Contract and settle on the index');
  s.insertBefore(g, s.firstChild);
  /* The Clause frame now names the gold line, so its own label goes (phones keep it in the legend). */
  [].slice.call(s.querySelectorAll('text')).forEach(function(t){ if(t.textContent.trim() === 'Your contract price'){ t.classList.add('as-fr-hide'); t.style.display = 'none'; } });
  function size(){ var fs = ref ? +ref.getAttribute('font-size') || 12 : 12, narrow = s.clientWidth < 600;
    T.forEach(function(t, i){ t.setAttribute('font-size', (i % 2 ? fs : fs * .9).toFixed(2)); t.style.display = narrow ? 'none' : ''; }); }
  size();
  if(ref && window.MutationObserver) new MutationObserver(size).observe(ref, { attributes:true, attributeFilter:['font-size'] });
  if(window.ResizeObserver) new ResizeObserver(size).observe(s);
  var lgr = (s.closest('figure') || s.parentNode).querySelector('.as-lgr');
  if(lgr && !lgr.querySelector('.as-fr-lg')){
    [['#3278FF', 'Attic Standard Terminal: discover and monitor the market price'], ['#D4AF37', 'Attic Standard Clause: contract and settle on the index']].forEach(function(f){
      var it = document.createElement('div'); it.className = 'as-lg as-fr-lg';
      it.innerHTML = '<span class="as-lg-k" style="width:12px;height:9px;border-radius:2px;border:1px solid ' + f[0] + '"></span><span>' + f[1] + '</span>'; lgr.appendChild(it); });
  }
}

function section(){
  var cl = document.getElementById('hpClause'); if(!cl || document.getElementById('hpTerm')) return;
  var host = cl.parentElement, wrap = document.createElement('div'); wrap.className = host.className || 'w-embed'; wrap.style.cssText = host.style.cssText;
  wrap.innerHTML = '<section class="as-sec" id="hpTerm" aria-labelledby="hpTermH"><div class="as-tm">'
    + '<div class="as-tm-l"><div class="as-sh"><div><h2 class="as-st" id="hpTermH">Know the market price before you sign.</h2>'
    + '<p class="as-ss">The Attic Standard Terminal gives FinOps and procurement teams an independent view of what the models they buy cost across the market, so every negotiation and renewal starts from the market price.</p></div></div>'
    + '<div class="as-tm-pts" role="tablist" aria-orientation="vertical" aria-label="What the Terminal shows">'
    + PTS.map(function(p, i){ return '<button type="button" class="as-tm-t' + (p.c ? ' as-tm-c' : '') + '" role="tab" id="hpTmT' + i + '" aria-controls="hpTmP" aria-selected="false" data-i="' + i + '"><span class="as-tm-bar"><span class="as-tm-fill"></span></span><span class="as-tm-x"><span class="as-tm-n">' + p.n + '</span><span class="as-tm-d">' + p.d + '</span></span></button>'; }).join('')
    + '</div></div>'
    + '<div class="as-tm-r" id="hpTmP" role="tabpanel"><div class="as-tm-mon"><div class="as-tm-top" aria-hidden="true"><i></i><i></i><i></i><em></em></div><div class="as-tm-scr">'
    + PTS.map(function(p, i){ return '<img src="' + IMG + p.img + '" alt="' + p.alt + '" width="1600" height="900" loading="lazy" decoding="async"' + (i ? ' aria-hidden="true"' : '') + '>'; }).join('')
    + '</div></div></div></div>'
    + '<div class="as-sf"><p class="as-note">Source: Attic Standard Terminal, screens from the November 23, 2026 publication, with an example price entered and a simulated contract.</p><a class="as-sf-a" href="/terminal">See what the Terminal covers &rarr;</a></div></section>';
  host.parentNode.insertBefore(wrap, host);
  rotate(wrap.querySelector('#hpTerm'));
}

/* The steps: six seconds a point, the bar beside it filling as its time runs, as the drivers do. */
function rotate(sec){
  var bs = [].slice.call(sec.querySelectorAll('.as-tm-t')), ims = [].slice.call(sec.querySelectorAll('.as-tm-scr img')), lab = sec.querySelector('.as-tm-top em');
  var STEP = 6000, auto = !(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches), paused = false, seen = !window.IntersectionObserver, el0 = 0, last = null, sel = 0;
  function show(i){ sel = i;
    bs.forEach(function(b, n){ var on = n === i; b.setAttribute('aria-selected', on ? 'true' : 'false'); b.tabIndex = on ? 0 : -1; b.querySelector('.as-tm-fill').style.height = on && !auto ? '100%' : '0'; });
    ims.forEach(function(m, n){ var on = n === i; m.classList.toggle('on', on); if(on){ m.removeAttribute('aria-hidden'); m.loading = 'eager'; } else m.setAttribute('aria-hidden', 'true'); });
    lab.textContent = PTS[i].t; sec.querySelector('.as-tm-r').setAttribute('aria-labelledby', 'hpTmT' + i);
  }
  function loop(ts){ if(!auto) return;
    if(last != null && !paused && seen && !document.hidden) el0 += ts - last; last = ts;
    var f = bs[sel].querySelector('.as-tm-fill'); f.style.height = Math.min(100, el0 / STEP * 100).toFixed(2) + '%';
    if(el0 >= STEP){ el0 = 0; show((sel + 1) % PTS.length); }
    requestAnimationFrame(loop); }
  function stop(){ auto = false; }
  var box = sec.querySelector('.as-tm');
  box.addEventListener('mouseenter', function(){ paused = true; }); box.addEventListener('mouseleave', function(){ paused = false; });
  box.addEventListener('focusin', function(){ paused = true; }); box.addEventListener('focusout', function(){ paused = false; });
  sec.querySelector('.as-tm-pts').addEventListener('click', function(e){ var b = e.target.closest('.as-tm-t'); if(!b) return; stop(); show(+b.getAttribute('data-i')); });
  sec.querySelector('.as-tm-pts').addEventListener('keydown', function(e){
    if(e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return; e.preventDefault(); stop();
    show((sel + (e.key === 'ArrowDown' ? 1 : PTS.length - 1)) % PTS.length); bs[sel].focus(); });
  if(window.IntersectionObserver) new IntersectionObserver(function(es){ seen = es[0].isIntersecting; }, { threshold:0.35 }).observe(sec);
  show(0);
  if(auto) requestAnimationFrame(loop);
}

function start(){ if(!document.getElementById('hpClause')) return; styles(); words(); section(); frames(); }
if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();

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
  { n:'Model price intelligence', d:'Every vendor that sells a model, cheapest first, with your own price placed among them and its distance from the median.',
    img:'models-vendors.jpg', t:'Terminal · Models · Week of November 23, 2026', alt:'The Terminal week table for one model: every vendor, cheapest first, with the subscriber’s own price as a marked row among them' },
  { n:'Pricing history', d:'Every leg, week by week back to the start of the series, with the range across vendors and your price drawn against it.',
    img:'models-history.jpg', t:'Terminal · Models · Price history', alt:'The Terminal price history for one model: the market median by week, the range across vendors and the subscriber’s price as a dashed line' },
  { n:'Competitive landscape', d:'How far prices spread across vendors, how concentrated each segment is and how often vendors reprice, for every index.',
    img:'indexes-behavior.jpg', t:'Terminal · Indexes · Flagship', alt:'The Terminal view of one index: its split by vendor type, price dispersion, vendor concentration, repricing and volatility' }];

/* The section's styles, kept with it (homepage only). */
var CSS = `body #hpTerm .as-tm{display:grid;grid-template-columns:minmax(0,5fr) minmax(0,7fr);gap:56px;align-items:center}body #hpTerm .as-tm-l .as-sh{margin-bottom:0}body #hpTerm .as-tm-pts{display:flex;flex-direction:column;margin-top:var(--s5)}body #hpTerm .as-tm-t{all:unset;box-sizing:border-box;cursor:pointer;display:grid;grid-template-columns:2px minmax(0,1fr);column-gap:18px;padding:14px 0}body #hpTerm .as-tm-t:focus-visible{outline:2px solid var(--accent);outline-offset:4px;border-radius:2px}body #hpTerm .as-tm-bar{position:relative;background:var(--border);border-radius:1px;overflow:hidden}body #hpTerm .as-tm-fill{position:absolute;left:0;top:0;width:2px;height:0;background:var(--l1)}body #hpTerm .as-tm-x{min-width:0}body #hpTerm .as-tm-n{display:block;font-size:var(--fs-lead);font-weight:600;line-height:var(--lh-ui);color:var(--l3);transition:color .15s}body #hpTerm .as-tm-t:hover .as-tm-n,body #hpTerm .as-tm-t[aria-selected="true"] .as-tm-n{color:var(--l1)}body #hpTerm .as-tm-d{display:block;margin-top:4px;font-size:var(--fs-ui);line-height:1.55;color:var(--l4)}body #hpTerm .as-tm-mon{background:var(--surface-raised);border:1px solid var(--border);border-radius:10px;padding:12px;box-shadow:0 30px 80px rgba(0,0,0,.45)}body #hpTerm .as-tm-top{display:flex;align-items:center;gap:6px;height:14px;margin:-2px 2px 10px}body #hpTerm .as-tm-top i{width:7px;height:7px;border-radius:50%;background:#3A4048}body #hpTerm .as-tm-top em{margin-left:10px;font-style:normal;font-size:10px;font-weight:500;letter-spacing:1.2px;text-transform:uppercase;color:var(--l5);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}body #hpTerm .as-tm-scr{position:relative;aspect-ratio:16/9;overflow:hidden;border:1px solid var(--border);border-radius:4px;background:var(--bg)}body #hpTerm .as-tm-scr img{position:absolute;inset:0;width:100%;height:100%;max-width:none;object-fit:cover;opacity:0;transition:opacity .5s ease}body #hpTerm .as-tm-scr img.on{opacity:1}body #hpTerm .as-sf{margin-top:var(--s6)}@media (prefers-reduced-motion:reduce){body #hpTerm .as-tm-scr img{transition:none}}@media (max-width:991px){body #hpTerm .as-tm{grid-template-columns:none;gap:var(--s5)}}@media (max-width:767px){body #hpTerm .as-tm-mon{padding:8px;border-radius:8px}body #hpTerm .as-tm-top{margin-bottom:8px}body #hpTerm .as-tm-t{padding:10px 0}}`;
function styles(){ if(document.getElementById('asHomeTermCss')) return; var st = document.createElement('style'); st.id = 'asHomeTermCss'; st.textContent = CSS; document.head.appendChild(st); }

function txt(el, from, to){ if(el && el.textContent.indexOf(from) > -1) el.textContent = el.textContent.replace(from, to); }
function find(sel, has){ return [].slice.call(document.querySelectorAll(sel)).filter(function(e){ return e.textContent.indexOf(has) > -1; })[0]; }

/* The wording: the hero says what the indexes show before what contracts do with them, and its main
   button opens the Terminal; the Clause becomes the step after; the close offers the comparison. */
function words(){
  txt(find('.as-hero p.as-prose', 'price their contracts against'),
    'We turn published vendor rates into indexes that buyers and sellers price their contracts against.',
    'We turn published vendor rates into indexes that show what AI inference costs across the market, and that buyers and sellers can price their contracts against.');
  var b = find('.as-hero a.as-btn', 'Contact us about a contract');
  if(b){ b.textContent = 'See the Terminal'; b.setAttribute('href', '/terminal'); b.removeAttribute('data-contact-open'); b.removeAttribute('data-contact-topic'); }
  txt(find('#hpClause .as-ss', 'Your bill follows'), 'Your bill follows an Attic Standard index month by month, at a price neither side sets.',
    'Once you know the market price, the Clause keeps you on it: your bill follows an Attic Standard index month by month, at a price neither side sets.');
  txt(find('#hpCov .as-ss', 'so your contract follows'), 'so your contract follows the whole market', 'so the benchmark reflects the whole market');
  txt(find('.as-sec .as-ss', 'Every figure your contract settles on'), 'Every figure your contract settles on traces back', 'Every published figure traces back');
  var p = find('.as-sec p.as-prose', 'how the Clause would have priced');
  if(p){ p.textContent = 'A 30-minute session compares the models you use with the benchmark, so you see where your spend sits before you negotiate or renew.';
    var h = p.closest('.as-sec').querySelector('h2.as-st'); txt(h, 'Put the market price in your next AI contract.', 'See where your AI spend sits against the market.'); }
}

function section(){
  var cl = document.getElementById('hpClause'); if(!cl || document.getElementById('hpTerm')) return;
  var host = cl.parentElement, wrap = document.createElement('div'); wrap.className = host.className || 'w-embed'; wrap.style.cssText = host.style.cssText;
  wrap.innerHTML = '<section class="as-sec" id="hpTerm" aria-labelledby="hpTermH"><div class="as-tm">'
    + '<div class="as-tm-l"><div class="as-sh"><div><h2 class="as-st" id="hpTermH">Know whether you are paying the market price.</h2>'
    + '<p class="as-ss">The Terminal compares the models you use with the benchmark, week by week, so you see where your spend sits before you negotiate or renew.</p></div></div>'
    + '<div class="as-tm-pts" role="tablist" aria-orientation="vertical" aria-label="What the Terminal shows">'
    + PTS.map(function(p, i){ return '<button type="button" class="as-tm-t" role="tab" id="hpTmT' + i + '" aria-controls="hpTmP" aria-selected="false" data-i="' + i + '"><span class="as-tm-bar"><span class="as-tm-fill"></span></span><span class="as-tm-x"><span class="as-tm-n">' + p.n + '</span><span class="as-tm-d">' + p.d + '</span></span></button>'; }).join('')
    + '</div></div>'
    + '<div class="as-tm-r" id="hpTmP" role="tabpanel"><div class="as-tm-mon"><div class="as-tm-top" aria-hidden="true"><i></i><i></i><i></i><em></em></div><div class="as-tm-scr">'
    + PTS.map(function(p, i){ return '<img src="' + IMG + p.img + '" alt="' + p.alt + '" width="1600" height="900" loading="lazy" decoding="async"' + (i ? ' aria-hidden="true"' : '') + '>'; }).join('')
    + '</div></div></div></div>'
    + '<div class="as-sf"><p class="as-note">Source: Attic Standard Terminal, screens from the November 23, 2026 publication, with an example price entered.</p><a class="as-sf-a" href="/terminal">See what the Terminal covers &rarr;</a></div></section>';
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

function start(){ if(!document.getElementById('hpClause')) return; styles(); words(); section(); }
if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();

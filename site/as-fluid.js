/* FLUID CHARTS, staged on the new homepage; folds into the shared script (AS.chart).
   A chart is drawn on a frame as wide as its container, so the plot stretches
   while labels keep their set size. Below 720px the frame stays 720 wide and
   scales down as before. Charts redraw when their container changes width. */
(function(){
  var AS = window.AS = window.AS || {}, C = AS.chart;
  if(!C || C.mount) return;
  var BASE = C.W, MIN = 720;
  C.fit = function(w){
    var W = Math.max(MIN, Math.round(w || BASE));
    C.W = W; C.X1 = W - 170; C.LX = W - 146; C.AR = W - 156;
    return C;
  };
  function render(el, force){
    var w = el.clientWidth;
    if(!w || (!force && w === el._asw) || !el._asdraw) return;
    el._asw = w; C.fit(w);
    try { el.innerHTML = el._asdraw(); } catch(e){ console.error('Attic Standard chart:', e); }
    finally { C.fit(BASE); }
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

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

/* ═══ CONTACT DRAWER ═══
  CONTACT DRAWER ("Talk to the team"), staged on the new homepage; folds into the shared files
  and then shows on every page except /contact, which holds the full form.
  A folder sits on the bottom edge of the screen: only its tab and a thin lip show. The tab,
  and every link to /contact, slides it up; the tab, Escape or a click outside tucks it down.
  Submissions go to Web3forms, like the contact page, which emails info@atticstandard.com. */
(function(){
  if(/^\/contact\/?$/.test(location.pathname) || document.getElementById('asCd')) return;
  var W3_URL = 'https://api.web3forms.com/submit', W3_KEY = '21f374e5-af06-489a-b3b1-e31e060b5ab4';
  var TOPICS = ['The Clause','Terminal','MCP','Coverage question','Methodology question','Vendor onboarding','Press','Partnerships','Other'];
  function f(id, lbl, inner, full){ return '<div class="as-cd-f' + (full ? ' full' : '') + '"><label class="as-cd-l" for="asCd-' + id + '">' + lbl + '</label>' + inner + '<div class="as-cd-e" id="asCd-' + id + '-err">' + ({first:'Enter your first name',last:'Enter your last name',email:'Enter a valid work email',company:'Enter your company',topic:'Select an option',msg:'Enter a message'})[id] + '</div></div>'; }
  function inp(id, type, ac){ return '<input class="as-cd-i" type="' + type + '" id="asCd-' + id + '" name="' + id + '" autocomplete="' + ac + '">'; }
  var html =
    '<button type="button" class="as-cd-tab" aria-expanded="false" aria-controls="asCdB"><span class="as-cd-dot" aria-hidden="true"></span>Talk to the team<span class="as-cd-s">Reply within one business day</span>' +
    '<svg viewBox="0 0 12 8" aria-hidden="true"><path d="M1 6.4 L6 1.6 L11 6.4" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></svg></button>' +
    '<div class="as-cd-b" id="asCdB" role="region" aria-labelledby="asCdT" inert>' +
    '<div class="as-cd-k"><div><h2 class="as-cd-t" id="asCdT">Talk to the team</h2><p class="as-cd-st">A demo, a quote, or a question about coverage. We respond within one business day.</p></div>' +
    '<ol class="as-cd-steps"><li><b>01</b><span>Tell us what you buy or build, and where.</span></li><li><b>02</b><span>We reply within one business day to set a time.</span></li><li><b>03</b><span>In 30 minutes we compare your models with the benchmark and show how the Clause would have priced your spend.</span></li></ol></div>' +
    '<form novalidate><p class="as-cd-n">All fields required.</p>' +
    '<div class="as-cd-row">' + f('first', 'First name', inp('first', 'text', 'given-name')) + f('last', 'Last name', inp('last', 'text', 'family-name')) + '</div>' +
    '<div class="as-cd-row">' + f('email', 'Work email', inp('email', 'email', 'email')) + f('company', 'Company', inp('company', 'text', 'organization')) + '</div>' +
    '<div class="as-cd-row">' + f('topic', 'What can we help with', '<select class="as-cd-i" id="asCd-topic" name="topic"><option value="">Select an option</option>' + TOPICS.map(function(t){ return '<option>' + t + '</option>'; }).join('') + '</select>', true) + '</div>' +
    '<div class="as-cd-row">' + f('msg', 'Message', '<textarea class="as-cd-i" id="asCd-msg" name="msg" placeholder="Tell us what you are working on"></textarea>', true) + '</div>' +
    '<div class="as-cd-act"><button type="submit" class="as-cd-go">Send message</button><p class="as-cd-n as-cd-r">Your details are used to answer your enquiry and are not shared with third parties.</p></div></form></div>';

  function mount(){
    var cd = document.createElement('div'); cd.className = 'as-cd'; cd.id = 'asCd'; cd.innerHTML = html;
    document.body.appendChild(cd); document.documentElement.classList.add('as-has-cd');
    var tab = cd.querySelector('.as-cd-tab'), body = cd.querySelector('.as-cd-b'), form = cd.querySelector('form'), go = cd.querySelector('.as-cd-go'), note = cd.querySelector('.as-cd-r');
    function $(id){ return document.getElementById('asCd-' + id); }
    function set(open, topic){
      cd.classList.toggle('up', open); tab.setAttribute('aria-expanded', open ? 'true' : 'false');
      if(open){ body.removeAttribute('inert'); if(topic && !$('topic').value) $('topic').value = topic; setTimeout(function(){ $('first').focus({ preventScroll:true }); }, 300); }
      else body.setAttribute('inert', '');
    }
    tab.addEventListener('click', function(){ set(!cd.classList.contains('up')); });
    document.addEventListener('keydown', function(e){ if(e.key === 'Escape' && cd.classList.contains('up')){ set(false); tab.focus(); } });
    document.addEventListener('click', function(e){
      var a = e.target.closest && e.target.closest('a[href],[data-contact-open]');
      if(a && (a.hasAttribute('data-contact-open') || /^(https?:\/\/(www\.)?atticstandard\.com)?\/contact\/?(#.*)?$/.test(a.getAttribute('href')))){
        e.preventDefault(); set(true, a.getAttribute('data-contact-topic')); return;
      }
      if(cd.classList.contains('up') && !cd.contains(e.target)) set(false);
    });
    function err(id, on){ $(id).classList.toggle('err', on); $(id + '-err').classList.toggle('show', on); }
    ['first','last','email','company','topic','msg'].forEach(function(id){ $(id).addEventListener(id === 'topic' ? 'change' : 'input', function(){ err(id, false); }); });
    form.addEventListener('submit', function(e){
      e.preventDefault();
      var v = {}, ok = true;
      ['first','last','company','topic','msg'].forEach(function(id){ v[id] = $(id).value.trim(); var bad = !v[id]; err(id, bad); if(bad) ok = false; });
      v.email = $('email').value.trim(); var badE = !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email); err('email', badE); if(badE) ok = false;
      if(!ok) return;
      go.disabled = true; go.textContent = 'Sending'; note.classList.remove('err');
      fetch(W3_URL, { method:'POST', headers:{ 'Content-Type':'application/json', Accept:'application/json' }, body:JSON.stringify({
        access_key:W3_KEY, from_name:'Attic Standard Website',
        subject:'Attic Standard contact: ' + v.topic + ' — ' + v.first + ' ' + v.last + ' (' + v.company + ')',
        replyto:v.email, first_name:v.first, last_name:v.last, email:v.email, company:v.company, interest:v.topic, message:v.msg,
        source_page:location.pathname + ' (drawer)' }) })
      .then(function(r){ if(!r.ok) throw new Error('HTTP ' + r.status);
        form.reset(); go.textContent = 'Message sent'; note.textContent = 'Thank you. We respond within one business day.'; })
      .catch(function(x){ console.error('Attic Standard contact form unavailable:', x);
        go.disabled = false; go.textContent = 'Send message'; note.classList.add('err'); note.textContent = 'Message could not be sent. Please email info@atticstandard.com directly.'; });
    });
  }
  if(document.body) mount(); else document.addEventListener('DOMContentLoaded', mount);
})();

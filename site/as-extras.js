/* ═══════════════════════════════════════════════════════════
   ATTIC STANDARD · SITE EXTRAS (loaded on every page, after the page)
   1. Indexes in the navigation: the header, the menu and the footer.
   2. Links into the price index card go to the Indexes page: the ticker,
      and any older link that still points at the homepage card.
   3. The contact drawer.
   These fold into as-site.js when the header and footer markup are next rebuilt.
   ═══════════════════════════════════════════════════════════ */
(function(){
  function slug(c){ return String(c).trim().toLowerCase().replace(/\s+/g, '-'); }
  function nav(){
    var n = document.querySelector('.as-nav');
    if(n && !n.querySelector('a[href="/indexes"]')){
      var a = document.createElement('a'); a.href = '/indexes'; a.textContent = 'Indexes';
      n.insertBefore(a, n.querySelector('a[href="/primer"]') || n.firstChild);
    }
    var d = document.getElementById('navDropdown'), p = d && d.querySelector('a[href="/primer"]');
    if(p && !d.querySelector('a[href="/indexes"]')){
      var m = document.createElement('a'); m.href = '/indexes';
      m.innerHTML = '<span class="nav-icon">&#9650;</span><span class="nav-text">Indexes</span>';
      p.parentNode.insertBefore(m, p);
    }
    var f = document.querySelector('.atom-footer-group a[href="/primer"]');
    if(f && !f.parentNode.querySelector('a[href="/indexes"]')){
      var g = document.createElement('a'); g.href = '/indexes'; g.textContent = 'Indexes';
      f.parentNode.insertBefore(g, f);
    }
    if(/^\/indexes\/?$/.test(location.pathname)) document.querySelectorAll('a[href="/indexes"]').forEach(function(x){ x.setAttribute('aria-current', 'page'); });
  }
  function fixLinks(root){
    (root || document).querySelectorAll('a[href^="/?index="]').forEach(function(a){ a.setAttribute('href', '/indexes' + a.getAttribute('href').slice(1)); });
    if(typeof window.atomSelectIndex !== 'function')
      (root || document).querySelectorAll('a.tk-grp[data-code]').forEach(function(a){ a.setAttribute('href', '/indexes?index=' + slug(a.getAttribute('data-code')) + '#atom-index-card'); });
  }
  function start(){
    nav(); fixLinks();
    var t = 0; new MutationObserver(function(){ clearTimeout(t); t = setTimeout(function(){ fixLinks(); }, 120); }).observe(document.body, { childList:true, subtree:true });
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();

/* ═══ CONTACT DRAWER ═══
  CONTACT DRAWER ("Talk to the team"), staged on the new homepage; folds into the shared files
  and then shows on every page except /contact, which holds the full form.
  A folder sits on the bottom edge of the screen: only its tab and a thin lip show. The tab,
  and every link to /contact, slides it up; the tab, Escape or a click outside tucks it down.
  Submissions go to Web3forms, like the contact page, which emails info@atticstandard.com. */
(function(){
  /* Not on /contact, which holds the full form, nor on a page that still carries the old contact section. */
  if(/^\/contact\/?$/.test(location.pathname) || document.getElementById('asCd') || document.getElementById('atomContact')) return;
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

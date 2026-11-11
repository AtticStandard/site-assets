/* ═══════════════════════════════════════════════════════════
   ATTIC STANDARD · SITE EXTRAS (loaded on every page, after the page)
   1. Indexes in the navigation (header, menu, footer); Terminal replaces Pricing,
      since the price ladder lives on the Terminal page.
   2. Links into the price index card go to the Indexes page: the ticker,
      and any older link that still points at the homepage card.
   2b. Chart months turn to initials where they would crowd; empty shares read 0.0%.
   2c. Tab rows that overflow get arrows and a fade; sideways scrollers keep space above their bar.
   2d. The MCP is retired: its links leave the menu, footer and older page embeds, the About
       page's access line drops it, and the contact topic list no longer offers it.
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
    /* Pricing lives on the Terminal page: the header link becomes Terminal,
       the menu drops its Pricing entry (Terminal is already listed there). */
    var pr = n && n.querySelector('a[href="/#pricing"]');
    if(pr){ pr.href = '/terminal'; pr.textContent = 'Terminal'; }
    var dp = d && d.querySelector('a[href="/#pricing"]'); if(dp) dp.remove();
    [['/indexes', /^\/indexes\/?$/], ['/terminal', /^\/terminal\/?$/]].forEach(function(r){
      if(r[1].test(location.pathname)) document.querySelectorAll('.as-nav a[href="' + r[0] + '"], #navDropdown a[href="' + r[0] + '"]').forEach(function(x){ x.setAttribute('aria-current', 'page'); });
    });
  }
  function fixLinks(root){
    (root || document).querySelectorAll('a[href^="/?index="]').forEach(function(a){ a.setAttribute('href', '/indexes' + a.getAttribute('href').slice(1)); });
    (root || document).querySelectorAll('a[href="/#pricing"]').forEach(function(a){ a.setAttribute('href', '/terminal'); });
    if(typeof window.atomSelectIndex !== 'function')
      (root || document).querySelectorAll('a.tk-grp[data-code]').forEach(function(a){ a.setAttribute('href', '/indexes?index=' + slug(a.getAttribute('data-code')) + '#atom-index-card'); });
  }
  /* Chart timelines: where months sit closer than 28px apart, they are written as initials. */
  var MONS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  function months(){
    document.querySelectorAll('svg').forEach(function(svg){
      var ts = [].filter.call(svg.querySelectorAll('text'), function(t){ return MONS.indexOf(t.textContent.trim()) > -1; });
      if(ts.length < 3) return;
      var vb = svg.viewBox && svg.viewBox.baseVal, k = vb && vb.width ? svg.getBoundingClientRect().width / vb.width : 1;
      var xs = ts.map(function(t){ return +t.getAttribute('x') * k; }).sort(function(a, b){ return a - b; }), gap = 1e9;
      for(var i = 1; i < xs.length; i++) gap = Math.min(gap, xs[i] - xs[i - 1]);
      if(gap < 28) ts.forEach(function(t){ t.textContent = t.textContent.trim().charAt(0); });
    });
  }
  /* Composition tables: a country with no models shows 0.0%, not a blank. */
  function zeros(){ document.querySelectorAll('.colist-row .colist-v').forEach(function(c){ if(!c.textContent.trim()) c.textContent = '0.0%'; }); }
  /* Tab rows that run past the screen get an arrow at each end (one tab per step) and a fade
     on the side with more tabs; both appear only while the row overflows. */
  var CHEV = { prev:'M7 1 L2 6.5 L7 12', next:'M2 1 L7 6.5 L2 12' };
  function rails(){
    document.querySelectorAll('.as-ds, .as-cl-t').forEach(function(row){
      if(row._rail || !row.parentNode) return; row._rail = true;
      var wrap = document.createElement('div'); wrap.className = 'as-rail';
      row.parentNode.insertBefore(wrap, row);
      function btn(dir){
        var b = document.createElement('button'); b.type = 'button'; b.className = 'as-rail-b'; b.setAttribute('aria-label', dir === 'prev' ? 'Show earlier tabs' : 'Show more tabs');
        b.innerHTML = '<svg width="9" height="13" viewBox="0 0 9 13" aria-hidden="true"><path d="' + CHEV[dir] + '" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
        b.addEventListener('click', function(){
          var kids = [].slice.call(row.children), x = row.scrollLeft, w = row.clientWidth, to = x;
          if(dir === 'next'){ for(var i = 0; i < kids.length; i++){ var r = kids[i].offsetLeft + kids[i].offsetWidth; if(r > x + w + 2){ to = r - w; break; } } }
          else { for(var j = kids.length - 1; j >= 0; j--){ if(kids[j].offsetLeft < x - 2){ to = kids[j].offsetLeft; break; } } }
          row.scrollTo({ left:Math.max(0, to), behavior:'smooth' });
        });
        return b;
      }
      var prev = btn('prev'), next = btn('next');
      wrap.appendChild(prev); wrap.appendChild(row); wrap.appendChild(next);
      function upd(){
        var m = row.scrollWidth - row.clientWidth, over = m > 2, s = row.scrollLeft;
        wrap.classList.toggle('on', over); wrap.classList.toggle('fl', over && s > 2); wrap.classList.toggle('fr', over && s < m - 2);
        prev.classList.toggle('off', !(over && s > 2)); next.classList.toggle('off', !(over && s < m - 2));
      }
      row.addEventListener('scroll', upd, { passive:true });
      if(window.ResizeObserver) new ResizeObserver(upd).observe(row); else window.addEventListener('resize', upd);
      upd();
    });
  }
  /* Blocks that scroll sideways with a visible bar keep var(--s3) between content and bar. */
  function scrollers(){
    document.querySelectorAll('.as-sec *, #atomIC *, #atomMK *').forEach(function(el){
      if(el.closest('.as-rail') || el.classList.contains('isel-rail')) return;
      var o = getComputedStyle(el).overflowX, on = (o === 'auto' || o === 'scroll') && el.scrollWidth > el.clientWidth + 2;
      if(on !== el.classList.contains('as-scroll-x')) el.classList.toggle('as-scroll-x', on);
    });
  }
  function noMcp(){
    document.querySelectorAll('a[href="/mcp"],a[href^="/mcp#"],a[href^="/mcp?"],a[href*="atticstandard.com/mcp"]').forEach(function(a){ a.remove(); });
    document.querySelectorAll('.cpg-dd-option').forEach(function(li){ if(li.textContent.trim() === 'MCP') li.remove(); });
    document.querySelectorAll('option').forEach(function(o){ if(o.textContent.trim() === 'MCP') o.remove(); });
    document.querySelectorAll('.abt-layer-desc').forEach(function(d){ if(/\bMCP\b/.test(d.textContent)) d.textContent = 'The published indexes, wherever pricing decisions are made: free on this site, and in the Terminal, where the parties to a contract on the benchmark follow its reference index, each month\u2019s settlement figure and the prices behind it. Both draw on the same published assessment, so a figure is identical wherever it is read.'; });
  }
  function tidy(){ noMcp(); fixLinks(); months(); zeros(); rails(); }
  function start(){
    nav(); tidy();
    var t = 0; new MutationObserver(function(){ clearTimeout(t); t = setTimeout(tidy, 120); }).observe(document.body, { childList:true, subtree:true });
    var rt = 0; window.addEventListener('resize', function(){ clearTimeout(rt); rt = setTimeout(function(){ months(); scrollers(); }, 300); });
    setTimeout(scrollers, 1500); setTimeout(scrollers, 5000);
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();

/* ═══ CONTACT DRAWER ═══
  CONTACT DRAWER ("Talk to the team"), staged on the new homepage; folds into the shared files
  and then shows on every page except /contact, which holds the full form.
  A folder sits on the bottom edge of the screen: only its tab and a thin lip show. The tab,
  and every call to action that names a topic, slides it up; the tab, Escape or a click outside tucks it down.
  Submissions go to Web3forms, like the contact page, which emails info@atticstandard.com. */
(function(){
  /* Not on /contact, which holds the full form, nor on a page that still carries the old contact section. */
  if(/^\/contact\/?$/.test(location.pathname) || document.getElementById('asCd') || document.getElementById('atomContact')) return;
  var W3_URL = 'https://api.web3forms.com/submit', W3_KEY = '21f374e5-af06-489a-b3b1-e31e060b5ab4';
  var TOPICS = ['The Clause','Terminal','Coverage question','Methodology question','Vendor onboarding','Press','Partnerships','Other'];
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
      /* Calls to action open the drawer (data-contact-open, data-contact-topic, #atomContact);
         a plain link to /contact, as in the menu and the footer, goes to the Contact page. */
      var a = e.target.closest && e.target.closest('a[href],[data-contact-open]');
      if(a && (a.hasAttribute('data-contact-open') || a.hasAttribute('data-contact-topic') || a.getAttribute('href') === '#atomContact')){
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

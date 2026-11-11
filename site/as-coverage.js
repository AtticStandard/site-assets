/* COVERAGE PAGE (staging): every figure, table and the vendor directory filled from the
   published coverage payload (get_coverage_page), the channel toggles and search, the vendor
   assessments, the contents highlight and the request form (Web3forms, like the contact
   drawer). The markup carries the November 9, 2026 figures, so the page reads correctly
   even if the data cannot be loaded. */
(function(){
  'use strict';
  var API = 'https://jonncmzxvxzwyaznokba.supabase.co/rest/v1/rpc/get_coverage_page', KEY = 'sb_publishable_SHTwtIYuHKMP3W5fhrwx2A_Byi9IVtF';
  var W3_URL = 'https://api.web3forms.com/submit', W3_KEY = '21f374e5-af06-489a-b3b1-e31e060b5ab4';
  var MONTH = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  var CH = { 'Model Developer':['Model developer','Model developers','Their own models, at their own list price','#C9CDD3',0],
             'Cloud Marketplace':['Cloud marketplace','Cloud marketplaces','Many developers&rsquo; models inside a cloud catalog','#9AA0A8',1],
             'Inference Platform':['Inference platform','Inference platforms','Hosted open and licensed models across modalities','#7D848F',2],
             'Neocloud':['Neocloud','Neoclouds','Inference on their own GPU capacity','#5C626B',3] };
  var UNITS = { Multimodal:'Per 1,000 tokens: input, cached input, output', Text:'Per 1,000 tokens: input, cached input, output',
                Image:'Per image, per megapixel, per generation, per step', Video:'Per second, per video, per megapixel',
                Audio:'Per minute, per 1,000 tokens', Voice:'Per 1,000 characters, per 1,000 tokens' };
  var MIXC = { Multimodal:'#C9CDD3', Video:'#9AA0A8', Text:'#7D848F', Image:'#5C626B', Audio:'#454A52', Voice:'#363A40' };
  var IXN = { TXT:'Text', MML:'Multimodal', IMG:'Image', IMP:'Image by area', VID:'Video', VDC:'Video by clip', AUD:'Speech to text', VOC:'Text to speech',
              EMB:'Embeddings', DEV:'Model developers', CLD:'Cloud marketplaces', PLT:'Inference platforms', NCL:'Neoclouds', FLG:'Flagship', COR:'Core',
              CMP:'Compact', PRP:'Unpublished weights', OSS:'Published weights', OWC:'Restricted weights', USA:'United States', CHN:'China', RSN:'Reasoning', COD:'Coding' };
  var CUR = { EUR:', euros', CNY:', yuan' };
  var CHEV = '<svg viewBox="0 0 12 8" aria-hidden="true"><path d="M1 1.6 L6 6.4 L11 1.6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var LENS = '<svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true"><circle cx="7" cy="7" r="5" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M11 11l3.5 3.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>';

  function $(id){ return document.getElementById(id); }
  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"]/g, function(c){ return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]; }); }
  function int(n){ return Math.round(Number(n)).toLocaleString('en-US'); }
  function longDate(iso){ var p = String(iso).slice(0, 10).split('-'); return MONTH[+p[1] - 1] + ' ' + (+p[2]) + ', ' + p[0]; }
  function set(id, h){ var e = $(id); if(e) e.innerHTML = h; }
  function bar(frac, label, color){ return '<div class="cov-bar"><i style="width:calc((100% - 64px) * ' + Math.max(frac, 0.004).toFixed(4) + ')' + (color ? ';background:' + color : '') + '"></i><span>' + label + '</span></div>'; }
  function ixName(code){ var p = String(code).split(' '), n = IXN[p[1]] || p[1], c = CUR[p[2]] || '';
    return esc(n + c) + '&nbsp;<span class="cov-nw">(<a class="cov-ixc" href="/indexes?index=' + code.toLowerCase().replace(/\s+/g, '-') + '#atom-index-card">' + esc(code) + '</a>)</span>'; }
  function slug(v){ return v.slug || String(v.name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
  function more(label, fn){ var d = document.createElement('div'); d.className = 'cov-more'; d.setAttribute('role', 'button'); d.tabIndex = 0; d.innerHTML = label + ' <span>&darr;</span>';
    d.addEventListener('click', fn); d.addEventListener('keydown', function(e){ if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); fn(); } }); return d; }

  /* ---------- the market ---------- */
  function glance(s){
    [s.Vendors, s.Pricing_Services, s.Models, s.SKUs, s.Countries, s.Indexes].forEach(function(v, i){ if(v != null && !isNaN(+v)) set('covG' + i, int(v)); });
  }
  function countries(list){
    var box = $('covCty'); if(!box || !list || !list.length) return;
    var mx = Math.max.apply(null, list.map(function(c){ return +c.share; })), h = '<div class="cov-h">Country</div><div class="cov-h cov-r cov-x">Vendors</div><div class="cov-h cov-r cov-x">Models</div><div class="cov-h cov-r">SKUs</div><div class="cov-h">Share of SKUs</div>';
    list.forEach(function(c, i){ var hd = i >= 6 ? ' cov-hide cov-xr' : '';
      h += '<div class="cov-nm' + hd + '">' + esc(c.country) + '</div><div class="cov-r cov-x' + hd + '">' + int(c.vendors) + '</div><div class="cov-r cov-x' + hd + '">' + int(c.models) + '</div><div class="cov-r cov-b' + hd + '">' + int(c.skus) + '</div><div class="' + hd.trim() + '">' + bar(c.share / mx, (+c.share).toFixed(1) + '%') + '</div>'; });
    box.innerHTML = h;
    if(list.length > 6){ var m = more('Show the other ' + (list.length - 6) + ' countries', function(){ [].slice.call(box.querySelectorAll('.cov-xr')).forEach(function(e){ e.classList.remove('cov-hide'); }); m.remove(); }); box.appendChild(m); }
  }
  function modalities(list){
    var box = $('covMod'); if(!box || !list || !list.length) return;
    var mx = Math.max.apply(null, list.map(function(m){ return +m.skus; })), h = '<div class="cov-h">Modality</div><div class="cov-h cov-x">Priced in</div><div class="cov-h">&nbsp;</div><div class="cov-h cov-r">SKUs</div>';
    list.forEach(function(m){ h += '<div class="cov-nm">' + esc(m.modality) + '</div><div class="cov-x">' + (UNITS[m.modality] || '') + '</div><div><div class="cov-bar"><i style="width:' + (m.skus / mx * 100).toFixed(1) + '%"></i></div></div><div class="cov-r cov-b">' + int(m.skus) + '</div>'; });
    box.innerHTML = h;
  }
  function channels(list){
    if(!list || !list.length) return;
    list = list.slice().sort(function(a, b){ return (CH[a.channel] || [0,0,0,0,9])[4] - (CH[b.channel] || [0,0,0,0,9])[4]; });
    var tot = list.reduce(function(a, c){ return a + +c.skus; }, 0), st = $('covStack'), box = $('covChn');
    if(st){ st.innerHTML = list.map(function(c){ var k = CH[c.channel] || [c.channel, c.channel, '', '#7D848F']; return '<div style="flex:' + c.skus + ';background:' + k[3] + '" title="' + esc(k[1]) + '">' + Math.round(c.skus / tot * 100) + '%</div>'; }).join('');
      var lg = document.createElement('div'); lg.className = 'cov-stack-l'; lg.style.gridTemplateColumns = list.map(function(c){ return c.skus + 'fr'; }).join(' ');
      lg.innerHTML = list.map(function(c){ return '<span>' + esc((CH[c.channel] || [0, c.channel])[1]) + '</span>'; }).join('');
      var old = st.parentNode.querySelector('.cov-stack-l'); if(old) old.remove(); st.parentNode.appendChild(lg); }
    if(box){ var h = '<div class="cov-h">Channel</div><div class="cov-h cov-x">What it sells</div><div class="cov-h cov-r">Vendors</div><div class="cov-h cov-r cov-x">Pricing services</div><div class="cov-h cov-r">SKUs</div>';
      list.forEach(function(c){ var k = CH[c.channel] || [c.channel, c.channel, '', '#7D848F'];
        h += '<div class="cov-nm"><span class="cov-sw" style="background:' + k[3] + '"></span>' + esc(k[1]) + '</div><div class="cov-x">' + k[2] + '</div><div class="cov-r">' + int(c.vendors) + '</div><div class="cov-r cov-x">' + int(c.services) + '</div><div class="cov-r cov-b">' + int(c.skus) + '</div>'; });
      box.innerHTML = h; }
  }

  /* ---------- vendor directory ---------- */
  var V = [], filt = 'all', q = '', all = false, open = null, GATE = null;
  function logo(v){
    var l = v.logo; if(l && l.paths && l.paths.length) return '<span class="cov-lg"><svg viewBox="' + esc(l.vb || '0 0 24 24') + '" aria-hidden="true">' + l.paths.map(function(p){ return '<path d="' + esc(p.d) + '"' + (p.o != null && p.o < 1 ? ' fill-opacity="' + p.o + '"' : '') + '/>'; }).join('') + '</svg></span>';
    return '<span class="cov-lg">' + esc(String(v.name).replace(/[^A-Za-z0-9 ]/g, ' ').split(/\s+/).filter(Boolean).slice(0, 2).map(function(w){ return w[0]; }).join('').toUpperCase()) + '</span>';
  }
  function panel(v){
    var k = CH[v.channel] || [v.channel], mix = Object.keys(v.mix || {}).map(function(m){ return [m, v.mix[m]]; }).sort(function(a, b){ return b[1] - a[1]; });
    var mx = '<div class="cov-mix">' + mix.map(function(m){ return '<i style="flex:' + m[1] + ';background:' + (MIXC[m[0]] || '#7D848F') + '"></i>'; }).join('') + '</div>'
      + '<div class="cov-mixl">' + mix.map(function(m){ return '<span><em style="background:' + (MIXC[m[0]] || '#7D848F') + '"></em>' + esc(m[0]) + ' <b>' + int(m[1]) + '</b></span>'; }).join('') + '</div>';
    var c = (v.contrib || []).slice().sort(function(a, b){ return b[1] - a[1]; }), cb;
    if(c.length){
      var top = Math.max(c[0][1], 1), t = '<div class="cov-h">Index</div><div class="cov-h cov-x">Share of basket SKUs</div><div class="cov-h cov-r">Models in basket</div>';
      c.forEach(function(r, i){ var hd = i >= 5 ? ' cov-hide cov-xr' : '';
        t += '<div class="' + hd.trim() + '">' + ixName(r[0]) + '</div><div class="cov-x' + hd + '">' + bar(r[1] / top, (+r[1]).toFixed(2) + '%') + '</div><div class="cov-r' + hd + '"><b style="color:var(--l1);margin-right:4px">' + int(r[2]) + '</b>&nbsp;of ' + int(r[3]) + '</div>'; });
      cb = '<div><p class="cov-lbl" style="margin:0 0 var(--s2)">Contribution to published indexes</p><div class="cov-tb2 cov-cb">' + t + '</div></div>';
    } else cb = '<p class="cov-why">' + esc(v.reason || 'This vendor&rsquo;s prices are tracked, and its models are not yet admitted to an index basket.') + '</p>';
    var p = document.createElement('div'); p.className = 'cov-pan'; p.id = 'v-' + slug(v);
    p.innerHTML = '<div class="cov-ph"><span class="cov-lbl">Coverage assessment &middot; ' + esc(k[0]) + ' &middot; published ' + esc(longDate(GATE)) + '</span><button type="button" class="cov-copy">Copy link to this vendor</button></div>'
      + '<div class="cov-two"><div class="cov-fact2"><span class="cov-lbl">Tracked since</span><b>' + esc(longDate(v.since)) + '</b><span>Prices captured at source from the vendor&rsquo;s own published rates.</span></div>'
      + '<div class="cov-fact2"><span class="cov-lbl">Models by modality</span>' + mx + '</div></div>' + cb;
    var box = p.querySelector('.cov-cb');
    if(box && c.length > 5) box.appendChild(more('Show the other ' + (c.length - 5) + ' indexes', function(){ [].slice.call(box.querySelectorAll('.cov-xr')).forEach(function(e){ e.classList.remove('cov-hide'); }); this.remove(); }));
    p.querySelector('.cov-copy').addEventListener('click', function(e){
      e.stopPropagation(); var url = location.origin + location.pathname + '#v-' + slug(v), b = this;
      var ok = function(){ b.textContent = 'Link copied'; setTimeout(function(){ b.textContent = 'Copy link to this vendor'; }, 1600); };
      if(navigator.clipboard) navigator.clipboard.writeText(url).then(ok, function(){ history.replaceState(null, '', '#v-' + slug(v)); ok(); }); else { history.replaceState(null, '', '#v-' + slug(v)); ok(); }
    });
    return p;
  }
  function draw(){
    var box = $('covVd'); if(!box) return;
    var list = V.filter(function(v){ return (filt === 'all' || v.channel === filt) && (!q || String(v.name).toLowerCase().indexOf(q) >= 0); });
    var show = all || q ? list : list.slice(0, 10);
    box.innerHTML = '<div class="cov-h">&nbsp;</div><div class="cov-h">Vendor</div><div class="cov-h cov-x">Channel</div><div class="cov-h cov-x">Country</div><div class="cov-h cov-r cov-x">Models</div><div class="cov-h cov-r">SKUs</div><div class="cov-h cov-r cov-x">Indexes</div><div class="cov-h">&nbsp;</div>';
    if(!show.length){ var n = document.createElement('div'); n.className = 'cov-fnote'; n.style.gridColumn = '1/-1'; n.textContent = 'No vendor matches this search.'; box.appendChild(n); }
    show.forEach(function(v){
      var on = open === v.name, o = on ? ' cov-op' : '', cells = [
        ['', logo(v)], ['cov-nm', esc(v.name)], ['cov-x', esc((CH[v.channel] || [v.channel])[0])], ['cov-x', esc(v.country || '')],
        ['cov-r cov-x', int(v.models)], ['cov-r cov-b', int(v.skus)],
        ['cov-r cov-x', (v.contrib && v.contrib.length) ? int(v.contrib.length) : '<span class="cov-tag">Tracked</span>'], ['cov-chev', CHEV]];
      var row = cells.map(function(c){ var d = document.createElement('div'); d.className = ('cov-row ' + c[0] + o).trim(); d.innerHTML = c[1]; return d; });
      row.forEach(function(d){
        d.addEventListener('click', function(){ open = on ? null : v.name; draw(); if(!on){ var p = $('v-' + slug(v)); if(p && p.getBoundingClientRect().top < 80) p.scrollIntoView({ block:'nearest' }); } });
        d.addEventListener('mouseenter', function(){ row.forEach(function(x){ x.classList.add('cov-hov'); }); });
        d.addEventListener('mouseleave', function(){ row.forEach(function(x){ x.classList.remove('cov-hov'); }); });
        box.appendChild(d);
      });
      row[1].setAttribute('role', 'button'); row[1].tabIndex = 0; row[1].setAttribute('aria-expanded', on ? 'true' : 'false');
      row[1].addEventListener('keydown', function(e){ if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); this.click(); } });
      if(on) box.appendChild(panel(v));
    });
    if(!all && !q && list.length > 10) box.appendChild(more('Show all ' + list.length + ' vendors', function(){ all = true; draw(); }));
  }
  function tools(){
    var t = $('covTools'); if(!t) return;
    var tabs = [['all', 'All']].concat(Object.keys(CH).map(function(k){ return [k, CH[k][1]]; }));
    t.innerHTML = '<div class="cov-vtw"><div class="cov-vt" role="tablist">' + tabs.map(function(x, i){ return '<button type="button" class="cov-vt-b' + (i ? '' : ' cov-on') + '" role="tab" aria-selected="' + (i ? 'false' : 'true') + '" data-ch="' + esc(x[0]) + '">' + esc(x[1]) + '</button>'; }).join('') + '</div></div>'
      + '<label class="cov-srch">' + LENS + '<input type="search" placeholder="Find a vendor" aria-label="Find a vendor" autocomplete="off"></label>';
    t.addEventListener('click', function(e){ var b = e.target.closest('.cov-vt-b'); if(!b) return; filt = b.getAttribute('data-ch'); all = false;
      [].slice.call(t.querySelectorAll('.cov-vt-b')).forEach(function(x){ var on = x === b; x.classList.toggle('cov-on', on); x.setAttribute('aria-selected', on ? 'true' : 'false'); }); draw(); });
    var tm = 0; t.querySelector('input').addEventListener('input', function(){ var v = this.value; clearTimeout(tm); tm = setTimeout(function(){ q = v.trim().toLowerCase(); draw(); }, 120); });
  }

  /* ---------- request form ---------- */
  function form(){
    var w = $('covForm'); if(!w) return;
    var f = function(id, lbl, inner, wide){ return '<label class="' + (wide ? 'cov-w' : '') + '" for="covF-' + id + '">' + lbl + inner + '</label>'; };
    var inp = function(id, type, ac){ return '<input class="cov-in" type="' + type + '" id="covF-' + id + '" name="' + id + '" autocomplete="' + ac + '">'; };
    var el = document.createElement('form'); el.className = 'cov-frm'; el.noValidate = true;
    el.innerHTML = f('first', 'First name', inp('first', 'text', 'given-name')) + f('last', 'Last name', inp('last', 'text', 'family-name'))
      + f('email', 'Work email', inp('email', 'email', 'email')) + f('company', 'Company', inp('company', 'text', 'organization'))
      + f('kind', 'Request', '<select class="cov-in" id="covF-kind" name="kind"><option value="">Select an option</option><option>Cover my company, as a vendor</option><option>Suggest a vendor I use, as a buyer</option></select>')
      + f('vendor', 'Vendor to cover', inp('vendor', 'text', 'off'))
      + f('page', 'Pricing page', inp('page', 'url', 'url'), true)
      + f('msg', 'Message', '<textarea class="cov-in" id="covF-msg" name="msg" placeholder="Anything we should know"></textarea>', true)
      + '<div class="cov-frow"><button type="submit" class="as-btn as-btn-p">Send request</button><span>We respond within one business day.</span></div>';
    w.innerHTML = ''; w.appendChild(el);
    var go = el.querySelector('button'), note = el.querySelector('.cov-frow span'), g = function(id){ return $('covF-' + id); };
    ['first','last','email','company','kind','vendor','page'].forEach(function(id){ g(id).addEventListener(id === 'kind' ? 'change' : 'input', function(){ this.classList.remove('cov-err'); }); });
    el.addEventListener('submit', function(e){
      e.preventDefault(); var v = {}, ok = true;
      ['first','last','company','kind','vendor','page'].forEach(function(id){ v[id] = g(id).value.trim(); var bad = !v[id]; g(id).classList.toggle('cov-err', bad); if(bad) ok = false; });
      v.email = g('email').value.trim(); var be = !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email); g('email').classList.toggle('cov-err', be); if(be) ok = false;
      v.msg = g('msg').value.trim();
      note.classList.toggle('cov-err', !ok); note.textContent = ok ? 'Sending' : 'Please complete the fields marked in red.';
      if(!ok) return;
      go.disabled = true;
      fetch(W3_URL, { method:'POST', headers:{ 'Content-Type':'application/json', Accept:'application/json' }, body:JSON.stringify({
        access_key:W3_KEY, from_name:'Attic Standard Website',
        subject:'Attic Standard coverage request: ' + v.vendor + ' (' + v.first + ' ' + v.last + ', ' + v.company + ')',
        replyto:v.email, first_name:v.first, last_name:v.last, email:v.email, company:v.company, interest:'Coverage request: ' + v.kind,
        vendor:v.vendor, pricing_page:v.page, message:v.msg || '(none)', source_page:location.pathname + ' (coverage request)' }) })
      .then(function(r){ if(!r.ok) throw new Error('HTTP ' + r.status); el.reset(); go.textContent = 'Request sent'; note.textContent = 'Thank you. We respond within one business day.'; })
      .catch(function(x){ console.error('Attic Standard coverage request unavailable:', x); go.disabled = false; note.classList.add('cov-err'); note.textContent = 'The request could not be sent. Please email info@atticstandard.com directly.'; });
    });
  }

  function fill(p){
    GATE = p.gate; var date = longDate(GATE);
    set('covPub', date); [].slice.call(document.querySelectorAll('.cov-d')).forEach(function(e){ e.textContent = date; });
    glance(p.summary || {}); countries(p.countries); modalities(p.modalities); channels(p.channels);
    V = (p.vendors || []).slice().sort(function(a, b){ return b.skus - a.skus || String(a.name).localeCompare(b.name); });
    var h = location.hash.replace(/^#v-/, ''), hit = h && V.filter(function(v){ return slug(v) === h; })[0];
    if(hit){ open = hit.name; all = true; }
    draw();
    if(hit) setTimeout(function(){ var e = $('v-' + slug(hit)); if(e) e.scrollIntoView({ block:'center' }); }, 300);
  }

  function init(){
    tools(); form();
    var links = [].slice.call(document.querySelectorAll('.cov-toc a, .cov-chips a')), chips = document.querySelector('.cov-chips');
    var ids = links.map(function(a){ return a.getAttribute('href').slice(1); }).filter(function(v, i, s){ return v && s.indexOf(v) === i; });
    var els = ids.map(function(id){ return document.getElementById(id); }).filter(Boolean);
    if(els.length && window.IntersectionObserver){
      var io = new IntersectionObserver(function(es){ es.forEach(function(en){ if(!en.isIntersecting) return; var id = en.target.id;
        links.forEach(function(a){ var hit = a.getAttribute('href') === '#' + id; a.classList.toggle('cov-on', hit);
          if(hit && chips && a.parentNode === chips && chips.scrollWidth > chips.clientWidth) chips.scrollTo({ left:a.offsetLeft - 16, behavior:'smooth' }); }); }); }, { rootMargin:'-30% 0px -60% 0px' });
      els.forEach(function(el){ io.observe(el); });
    }
    DATA.then(fill).catch(function(e){ console.error('Attic Standard coverage data unavailable:', e); });
  }
  var DATA = window.COV_TEST ? Promise.resolve(window.COV_TEST) : fetch(API, { method:'POST', headers:{ apikey:KEY, 'Content-Type':'application/json' }, body:'{}' })
    .then(function(r){ if(!r.ok) throw new Error('HTTP ' + r.status); return r.json(); });
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();

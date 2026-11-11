/* CONTACT PAGE: topic list, checks, delivery, booking popup and the two office clocks.
   Delivery: one request to Web3forms, which emails info@atticstandard.com (the address is set in
   the Web3forms account, not here) and keeps a copy under Submissions. Same key as the drawer. */
(function(){
  'use strict';
  var W3_URL = 'https://api.web3forms.com/submit', W3_KEY = '21f374e5-af06-489a-b3b1-e31e060b5ab4';
  var CAL = 'https://calendly.com/stamatios-a7om/30min?hide_event_type_details=1&hide_gdpr_banner=1&primary_color=3278ff';
  function $(id){ return document.getElementById(id); }
  function init(){
    var form = $('cxForm'); if(!form) return;
    var dd = $('cxDd'), trg = $('cx-topic'), lab = $('cxDl'), pan = $('cxPn'), hid = $('cx-reason');
    var opts = [].slice.call(pan.querySelectorAll('.cx-op')), kb = -1;
    function group(el){ return el.closest('.cx-g'); }
    function bad(el, on){ var g = group(el); if(g) g.classList.toggle('err', on); if(on) el.setAttribute('aria-invalid', 'true'); else el.removeAttribute('aria-invalid'); }
    function open(){ dd.classList.add('open'); trg.setAttribute('aria-expanded', 'true'); }
    function close(){ dd.classList.remove('open'); trg.setAttribute('aria-expanded', 'false'); opts.forEach(function(o){ o.classList.remove('kb'); }); kb = -1; }
    function pick(v){
      var o = opts.filter(function(x){ return x.getAttribute('data-value') === v; })[0]; if(!o) return;
      hid.value = v; lab.textContent = v; lab.classList.add('on');
      opts.forEach(function(x){ var on = x === o; x.classList.toggle('on', on); x.setAttribute('aria-selected', on ? 'true' : 'false'); });
      bad(trg, false);
    }
    trg.addEventListener('click', function(e){ e.stopPropagation(); dd.classList.contains('open') ? close() : open(); });
    trg.addEventListener('keydown', function(e){
      if(e.key === 'ArrowDown' || e.key === 'ArrowUp'){ e.preventDefault(); open(); kb = Math.max(0, Math.min(opts.length - 1, kb + (e.key === 'ArrowDown' ? 1 : -1)));
        opts.forEach(function(o, i){ o.classList.toggle('kb', i === kb); }); opts[kb].scrollIntoView({ block:'nearest' }); }
      else if(e.key === 'Enter' && kb > -1 && dd.classList.contains('open')){ e.preventDefault(); pick(opts[kb].getAttribute('data-value')); close(); }
    });
    opts.forEach(function(o){ o.addEventListener('click', function(){ pick(o.getAttribute('data-value')); close(); trg.focus(); }); });
    document.addEventListener('click', function(e){ if(!dd.contains(e.target)) close(); });
    document.addEventListener('keydown', function(e){ if(e.key === 'Escape' && dd.classList.contains('open')){ close(); trg.focus(); } });
    /* A topic can arrive with the link: /contact?topic=Press */
    try { var q = new URLSearchParams(location.search).get('topic'); if(q) pick(q); } catch(e){}
    ['first', 'last', 'company', 'email', 'message'].forEach(function(k){ var el = $('cx-' + k); el.addEventListener('input', function(){ bad(el, false); }); });

    var send = $('cxSend'), note = $('cxNote');
    send.addEventListener('click', function(){
      var v = {}, first = null;
      ['first', 'last', 'company', 'email', 'message'].forEach(function(k){
        var el = $('cx-' + k), x = el.value.trim(); v[k] = x;
        var no = !x || (k === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(x)); bad(el, no); if(no && !first) first = el;
      });
      if(!hid.value){ bad(trg, true); if(!first) first = trg; }
      if(first){ first.focus(); return; }
      if($('cx-bot').checked) return;
      send.textContent = 'Sending'; send.disabled = true; note.classList.remove('err');
      fetch(W3_URL, { method:'POST', headers:{ 'Content-Type':'application/json', Accept:'application/json' }, body:JSON.stringify({
        access_key:W3_KEY, from_name:'Attic Standard Website',
        subject:'Attic Standard contact: ' + hid.value + ', ' + v.first + ' ' + v.last + ' (' + v.company + ')',
        replyto:v.email, first_name:v.first, last_name:v.last, email:v.email, company:v.company, interest:hid.value, message:v.message,
        source_page:location.pathname }) })
      .then(function(r){ if(!r.ok) throw new Error('HTTP ' + r.status);
        form.innerHTML = '<div class="cx-done" role="status"><b>Message sent</b><span></span></div>';
        form.querySelector('.cx-done span').textContent = 'Thank you, ' + v.first + '. We will reply within one business day.'; })
      .catch(function(){ send.textContent = 'Send message'; send.disabled = false; note.classList.add('err');
        note.textContent = 'Something did not go through. Try again, or write to info@atticstandard.com.'; });
    });

    var cal = $('cxCal'), loading = false;
    if(cal) cal.addEventListener('click', function(e){
      if(window.Calendly){ e.preventDefault(); window.Calendly.initPopupWidget({ url:CAL }); return; }
      if(loading) return; loading = true; e.preventDefault();
      var l = document.createElement('link'); l.rel = 'stylesheet'; l.href = 'https://assets.calendly.com/assets/external/widget.css'; document.head.appendChild(l);
      var s = document.createElement('script'); s.src = 'https://assets.calendly.com/assets/external/widget.js';
      s.onload = function(){ loading = false; if(window.Calendly) window.Calendly.initPopupWidget({ url:CAL }); };
      s.onerror = function(){ loading = false; window.open(cal.href, '_blank', 'noopener'); };
      document.head.appendChild(s);
    });

    var clocks = [].slice.call(document.querySelectorAll('.cx-tm[data-tz]'));
    function tick(){ var d = new Date();
      clocks.forEach(function(el){ try {
        var t = new Intl.DateTimeFormat('en-US', { timeZone:el.getAttribute('data-tz'), hour:'numeric', minute:'2-digit', hour12:true }).format(d);
        el.textContent = t.replace(/\s?AM$/, ' am').replace(/\s?PM$/, ' pm') + ' local time';
      } catch(e){ el.textContent = ''; } }); }
    if(clocks.length){ tick(); setInterval(tick, 30000); }
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();

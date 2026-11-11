/* ═══════════════════════════════════════════════════════════
   ATTIC STANDARD SITE SCRIPT  v1.0.0
   Loaded once, at the end of the page, from the Webflow footer code.
   1. Masthead, dropdown and ticker
   2. System status pill in the footer
   3. Shared chart frame (AS.chart) and the standard footnote
   ═══════════════════════════════════════════════════════════ */
/* 1. MASTHEAD, DROPDOWN AND TICKER */
(function() {
  /* Two toggles now: one in the masthead, one in the band for when
     the masthead has folded. Both drive the same dropdown. */
  var toggles = [].slice.call(document.querySelectorAll('.menu-toggle'));
  var navDropdown = document.getElementById('navDropdown');

  function closeMenu() {
    toggles.forEach(function(t) { t.classList.remove('active'); });
    if (navDropdown) navDropdown.classList.remove('active');
  }

  if (toggles.length && navDropdown) {
    toggles.forEach(function(toggle) {
      toggle.addEventListener('click', function(e) {
        e.stopPropagation();
        var open = !navDropdown.classList.contains('active');
        closeMenu();
        if (open) { toggle.classList.add('active'); navDropdown.classList.add('active'); }
      });
    });
    document.addEventListener('click', function(e) {
      var inside = toggles.some(function(t) { return t.contains(e.target); });
      if (!inside && !navDropdown.contains(e.target)) closeMenu();
    });
    document.querySelectorAll('.nav-dropdown a').forEach(function(link) {
      link.addEventListener('click', closeMenu);
    });
  }

  /* Coverage is a page of its own (/coverage) since October 2026, so its
     links are plain links. The homepage panel and its click handler are gone. */

  /* Past the first screen the masthead folds away and the band
     stays. The threshold sits below the masthead height so the
     fold happens after it has already scrolled out of view. */
  var header = document.getElementById('atomHeader');
  if (header) {
    var ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function() {
        var hh = parseInt(getComputedStyle(document.documentElement)
                   .getPropertyValue('--header-h'), 10) || 102;
        var y = window.pageYOffset || document.documentElement.scrollTop;
        header.classList.toggle('as-compact', y > hh + 40);
        ticking = false;
      });
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ACCOUNT: reads the stored login session; signed in, Log in becomes the account circle. */
  (function() {
    var AUTH = 'https://jonncmzxvxzwyaznokba.supabase.co/auth/v1';
    var AKEY = 'sb_publishable_SHTwtIYuHKMP3W5fhrwx2A_Byi9IVtF';
    var SKEY = 'sb-jonncmzxvxzwyaznokba-auth-token';
    var sess = null;
    try { sess = JSON.parse(localStorage.getItem(SKEY) || 'null'); } catch (e) { sess = null; }
    if (sess && sess.currentSession) sess = sess.currentSession;
    if (!sess || !sess.refresh_token || !sess.user || !sess.user.email) return;
    var email = sess.user.email;

    function logout(ev) {
      if (ev) ev.preventDefault();
      var done = function() {
        try { localStorage.removeItem(SKEY); } catch (e) {}
        window.location.href = '/login';
      };
      fetch(AUTH + '/logout', { method: 'POST', headers: { apikey: AKEY, Authorization: 'Bearer ' + sess.access_token } })
        .then(done, done);
    }

    var dLogin = document.querySelector('.nav-dropdown a[href="/login"]');
    if (dLogin) {
      var t = dLogin.querySelector('.nav-text');
      if (t) t.textContent = 'Log out';
      dLogin.addEventListener('click', logout);
    }

    var link = document.querySelector('.as-nav a.as-login');
    if (!link) return;
    var box = document.createElement('div');
    box.className = 'as-acct';
    box.innerHTML =
      '<button class="as-avatar" type="button" aria-haspopup="true" aria-expanded="false" aria-label="Account"></button>' +
      '<div class="as-acct-menu" hidden>' +
        '<div class="as-acct-who"><span>Signed in as</span><b></b></div>' +
        '<a href="/premium">Terminal</a>' +
        '<button type="button" data-act="pass">Change password</button>' +
        '<button type="button" data-act="out">Log out</button>' +
      '</div>';
    var btn = box.querySelector('.as-avatar'), menu = box.querySelector('.as-acct-menu');
    btn.textContent = email.charAt(0);
    btn.title = email;
    box.querySelector('.as-acct-who b').textContent = email;
    link.parentNode.replaceChild(box, link);

    function close() { menu.hidden = true; btn.setAttribute('aria-expanded', 'false'); }
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      var open = menu.hidden;
      close();
      if (open) { menu.hidden = false; btn.setAttribute('aria-expanded', 'true'); }
    });
    document.addEventListener('click', function(e) { if (!box.contains(e.target)) close(); });
    document.addEventListener('keydown', function(e) { if (e.key === 'Escape') close(); });

    box.querySelector('[data-act="out"]').addEventListener('click', logout);
    var pass = box.querySelector('[data-act="pass"]');
    pass.addEventListener('click', function() {
      pass.disabled = true; pass.textContent = 'Sending';
      fetch(AUTH + '/recover?redirect_to=' + encodeURIComponent(window.location.origin + '/login'), {
        method: 'POST',
        headers: { apikey: AKEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email })
      }).then(function(r) {
        pass.textContent = r.ok ? 'Reset link sent to your email' : 'Could not send, try again';
      }).catch(function() {
        pass.textContent = 'Could not send, try again';
      }).then(function() {
        setTimeout(function() { pass.disabled = false; pass.textContent = 'Change password'; }, 4000);
      });
    });
  })();

  var PIXELS_PER_SECOND = 55;
  var SUPABASE_URL = 'https://jonncmzxvxzwyaznokba.supabase.co/rest/v1';
  var SUPABASE_KEY = 'sb_publishable_SHTwtIYuHKMP3W5fhrwx2A_Byi9IVtF';

  function sb(path) {
    return fetch(SUPABASE_URL + path, {
      headers: { 'apikey': SUPABASE_KEY }
    }).then(function(r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); });
  }

  /* Readings come from v_index_ticker: one row per index and direction at the gate, rebased in SQL (v_index_rebased) so the band and the cards share one base. */

  var DIRS = [
    { key: 'input',  tag: 'Input'  },
    { key: 'cached', tag: 'Cached' },
    { key: 'output', tag: 'Output' }
  ];

  function chgClass(c) { return c > 0.05 ? 'change-up' : (c < -0.05 ? 'change-down' : 'change-neutral'); }
  function arrow(c)    { return c > 0.05 ? '\u25B2' : (c < -0.05 ? '\u25BC' : '\u25AC'); }

  function build(rows) {
    var ticker = document.getElementById('priceTicker');
    if (!ticker) return;

    /* One entry per index; a direction exists only if it carries a price at the gate. */
    var byIndex = {}, codes = [];
    rows.forEach(function(r) {
      if (!r.index_code || !r.direction) return;
      if (!byIndex[r.index_code]) {
        byIndex[r.index_code] = { order: r.display_order, dirs: {} };
        codes.push(r.index_code);
      }
      byIndex[r.index_code].dirs[r.direction] = r;
    });

    /* display_order comes from the registry, so the running order is
       maintained where the indexes are defined rather than in an array
       here. A row without one sorts last instead of first. */
    codes.sort(function(a, b) {
      var ao = byIndex[a].order, bo = byIndex[b].order;
      if (ao == null) ao = 9999;
      if (bo == null) bo = 9999;
      return ao - bo || a.localeCompare(b);
    });

    var html = '';
    codes.forEach(function(code) {
      var shortCode = code.replace('AIPI ', '');
      var grp = '';
      DIRS.forEach(function(d) {
        var row = byIndex[code].dirs[d.key];
        if (!row || row.level == null) return;
        var lvl = Number(row.level);
        if (!(lvl > 0)) return;
        var c = (row.wow == null) ? null : Number(row.wow);
        /* Each chip names its period; a null wow renders the house placeholder. */
        var chg = (c === null)
          ? '<span class="tk-chg change-neutral">--</span>'
          : '<span class="tk-chg ' + chgClass(c) + '">'
                + arrow(c) + ' ' + Math.abs(c).toFixed(1) + '%<span class="tk-1w">1w</span></span>';
        grp += '<span class="tk-item">'
            +  '<span class="tk-dir">' + d.tag + '</span>'
            +  '<span class="tk-lvl">' + lvl.toFixed(1) + '</span>'
            +  chg
            +  '</span>';
      });
      if (grp) html += '<a class="tk-grp" href="#atom-index-card" data-code="' + code + '">'
                    + '<span class="tk-code">' + shortCode + '</span>'
                    + grp + '<span class="tk-go">\u203A</span></a>';
    });

    if (!html) { ticker.innerHTML = '<div class="ticker-item">No index data</div>'; return; }

    requestAnimationFrame(function() {
      ticker.innerHTML = html + html;
      requestAnimationFrame(function() {
        var half = ticker.scrollWidth / 2;
        var dur = half / PIXELS_PER_SECOND;
        var s = document.getElementById('ticker-dynamic-keyframes');
        if (s) s.remove();
        s = document.createElement('style');
        s.id = 'ticker-dynamic-keyframes';
        s.textContent = '@keyframes tickerScroll{0%{transform:translateX(0)}100%{transform:translateX(-' + half + 'px)}}';
        document.head.appendChild(s);
        ticker.style.animation = 'tickerScroll ' + dur + 's linear infinite';
      });
    });

    /* Clicking a reading selects that index on the card and scrolls to it.
       The card exposes window.atomSelectIndex; if the hook is absent (any
       page without the card) the anchor simply does nothing. */
    ticker.addEventListener('click', function(ev) {
      var a = ev.target.closest ? ev.target.closest('.tk-grp') : null;
      if (!a) return;
      var code = a.getAttribute('data-code');
      if (typeof window.atomSelectIndex === 'function') {
        ev.preventDefault();
        window.atomSelectIndex(code, true);
      }
    });
  }

  /* One request, and no site_config lookup: the gate is applied inside
     the view, so the band cannot read a week the cards are not showing. */
  function initTicker() {
    sb('/v_index_ticker?select=index_code,direction,level,wow,display_order&order=display_order.asc,index_code.asc')
      .then(function(rows) {
        if (!rows || !rows.length) throw new Error('no index rows');
        build(rows);
      })
      .catch(function(err) {
        console.error('Attic Standard ticker unavailable:', err);
        var el = document.getElementById('priceTicker');
        if (el) el.innerHTML = '<div class="ticker-item" style="color:var(--down)">Price index data unavailable</div>';
      });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initTicker);
  else initTicker();

})();

/* 2. SYSTEM STATUS */
(function(){
  var PAGE='https://atticstandard.instatus.com';
  function mount(){
    var std=document.querySelector('.as-foot-std');
    if(!std||document.getElementById('asFootStatus'))return;
    var a=document.createElement('a');
    a.id='asFootStatus';a.className='as-foot-status';a.href=PAGE;a.target='_blank';a.rel='noopener';
    a.innerHTML='<span class="as-st-dot"></span><span class="as-st-txt">System status</span><span class="as-st-go">\u203A</span>';
    std.parentNode.insertBefore(a,std.nextSibling);
    fetch(PAGE+'/summary.json').then(function(r){if(!r.ok)throw new Error('HTTP '+r.status);return r.json();})
    .then(function(d){
      var map={UP:['var(--up)','All systems operational'],HASISSUES:['var(--flat)','Some systems affected'],UNDERMAINTENANCE:['var(--flat)','Scheduled maintenance']};
      var m=map[d&&d.page&&d.page.status];if(!m)return;
      a.querySelector('.as-st-dot').style.background=m[0];
      a.querySelector('.as-st-txt').textContent=m[1];
    }).catch(function(err){console.error('Attic Standard status unavailable:',err);});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
})();

/* ═══════════════════════════════════════════════════════════
   3. SHARED CHART FRAME
   Every chart on the site is drawn on this one frame, so sizes,
   the label column and the timeline can never drift between pages.
     Frame     1360 x 320, full content width.
     Plot      x 14 to 1190, y 16 to 260.
     Labels    one column, left-aligned at x 1214.
     Rules     every horizontal rule runs from 0 to 1204.
     Timeline  a tick every Monday; a taller tick, a centred month
               name and (first month and each January) the year on
               the first Monday of each month.
   Draw a chart with these helpers and nothing else, and it will
   match every other chart on the site.
   ═══════════════════════════════════════════════════════════ */
(function(){
  var AS = window.AS = window.AS || {};
  var C = AS.chart = { W:1360, H:320, X0:14, X1:1190, LX:1214, AL:0, AR:1204, PT:16, PB:260, TA:270 };
  var MON = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  var FONT = 'font-family="Roboto, sans-serif"';

  function esc(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function day(iso){ var p = String(iso).slice(0,10).split('-'); return Date.UTC(+p[0], +p[1]-1, +p[2]); }
  function r1(n){ return Math.round(n*10)/10; }
  C.esc = esc;

  /* Text. o: { cls, anchor, size, weight }. Classes are the as-f-* fills. */
  C.text = function(x, y, s, o){
    o = o || {};
    return '<text x="'+r1(x)+'" y="'+r1(y)+'" font-size="'+(o.size||11)+'" '+FONT+
      (o.weight ? ' font-weight="'+o.weight+'"' : '')+' class="'+(o.cls||'as-f-l4')+'" text-anchor="'+(o.anchor||'start')+'">'+esc(s)+'</text>';
  };

  /* A horizontal rule across the full rule extent. o: { cls, dash, width } */
  C.rule = function(y, o){
    o = o || {};
    return '<line x1="'+C.AL+'" y1="'+r1(y)+'" x2="'+C.AR+'" y2="'+r1(y)+'" class="'+(o.cls||'as-s-axis')+'"'+
      (o.dash ? ' stroke-dasharray="'+o.dash+'"' : '')+(o.width ? ' stroke-width="'+o.width+'"' : '')+'></line>';
  };

  /* A side label in the shared column. Two lines: a title and an optional value. */
  C.side = function(y, title, value, o){
    o = o || {};
    var t = C.text(C.LX, y, title, { cls:o.cls||'as-f-l4', size:o.size||11, weight:o.weight });
    return value == null ? t : t + C.text(C.LX, y+14, value, { cls:'as-f-l5', size:11 });
  };

  /* Linear y scale onto the plot. */
  C.y = function(lo, hi){ return function(v){ return C.PB - (v-lo)/(hi-lo)*(C.PB-C.PT); }; };

  /* The shared timeline. first and last are Mondays (YYYY-MM-DD). */
  C.axis = function(first, last){
    var a = day(first), b = day(last), WEEK = 7*864e5;
    var ax = {};
    ax.x = function(d){ return C.X0 + (day(d)-a)/(b-a)*(C.X1-C.X0); };
    ax.weeks = function(){ var out=[]; for (var t=a; t<=b; t+=WEEK) out.push(new Date(t).toISOString().slice(0,10)); return out; };
    ax.svg = function(){
      var g = [C.rule(C.TA)], firstLabel = true;
      for (var t=a; t<=b; t+=WEEK){
        var d = new Date(t), x = C.X0 + (t-a)/(b-a)*(C.X1-C.X0), major = d.getUTCDate() <= 7;
        g.push('<line x1="'+r1(x)+'" y1="'+C.TA+'" x2="'+r1(x)+'" y2="'+(C.TA+(major?8:4))+'" class="as-s-axis"></line>');
        if (major){
          g.push(C.text(x, C.TA+22, MON[d.getUTCMonth()], { anchor:'middle', size:10 }));
          if (firstLabel || d.getUTCMonth() === 0) g.push(C.text(x, C.TA+37, d.getUTCFullYear(), { anchor:'middle', size:10 }));
          firstLabel = false;
        }
      }
      return g.join('');
    };
    return ax;
  };

  /* The "last N weeks" band: shaded from the week of `from` to the right edge, labelled top left. */
  C.band = function(ax, from, label){
    var sp = (C.X1-C.X0)/(ax.weeks().length-1), x0 = ax.x(from) - sp/2;
    return '<rect x="'+r1(x0)+'" y="0" width="'+r1(C.AR-x0)+'" height="'+C.TA+'" style="fill: rgba(255,255,255,.025)"></rect>'+
      C.text(x0+8, 14, label, { cls:'as-f-l2' });
  };

  /* The finished chart. label is the accessible description. */
  C.svg = function(inner, label){
    return '<svg viewBox="0 0 '+C.W+' '+C.H+'" role="img" aria-label="'+esc(label)+'" style="width:100%;height:auto">'+inner+'</svg>';
  };

  /* Dates are written month first: "November 9, 2026". */
  var LONG = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  AS.fmtDate = function(iso){ var d = new Date(day(iso)); return LONG[d.getUTCMonth()]+' '+d.getUTCDate()+', '+d.getUTCFullYear(); };

  /* The standard footnote. what: e.g. "data to", "coverage as of".
     Resolves with the full sentence for the published date. */
  AS.footnote = function(what){
    return (AS.activeDate || Promise.reject()).then(function(d){
      return 'Source: Attic Standard, '+what+' '+AS.fmtDate(d)+'. Figures update with each index publication.';
    });
  };
})();

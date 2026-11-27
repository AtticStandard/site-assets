/* TERMINAL LOGIN GATE (/premium), loaded in the page head after supabase-js. The page stays hidden
   until a signed-in session is confirmed; without one the reader goes to the login page.
   November 24, 2026: the gate now runs on staging (atticstandard.webflow.io) as well as the live
   site, so Terminal changes can be checked on staging with a real login before they go live. Only
   the Webflow Designer preview (a webflow.com address) skips it, and shows no data. */
(function(){
  var root = document.documentElement, host = (location.hostname || '').toLowerCase();
  var done; window.atomAuthReady = new Promise(function(r){ done = r; });
  root.classList.add('as-auth-pending');
  function reveal(){ root.classList.remove('as-auth-pending'); }
  function toLogin(){ location.href = '/login'; }
  if(/(^|\.)webflow\.com$/.test(host)){ reveal(); done(null); return; }
  if(!window.supabase){ toLogin(); return; }
  var sb = window.supabase.createClient('https://jonncmzxvxzwyaznokba.supabase.co', 'sb_publishable_SHTwtIYuHKMP3W5fhrwx2A_Byi9IVtF');
  window.atomSupabase = sb;
  sb.auth.getSession().then(function(res){
    var s = res && res.data && res.data.session;
    if(!s){ toLogin(); return; }
    reveal(); done(s);
  }).catch(toLogin);
  sb.auth.onAuthStateChange(function(event, session){ if(event === 'SIGNED_OUT' || !session) toLogin(); });
})();

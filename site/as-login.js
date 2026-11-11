/* LOGIN: sign-in (unchanged logic: show password, caps lock, one failure message, reset by email)
   and the market this week on the right, read from the published levels. */
(function(){
'use strict';
var URL_SB='https://jonncmzxvxzwyaznokba.supabase.co';
var KEY='sb_publishable_SHTwtIYuHKMP3W5fhrwx2A_Byi9IVtF';
var sb=window.supabase.createClient(URL_SB,KEY);
function $(id){return document.getElementById(id)}

var form=$('lgnForm'),email=$('lgn-email'),pass=$('lgn-password');
var eg=$('lgnEmailGroup'),pg=$('lgnPassGroup');
var btn=$('lgn-btn'),alertBox=$('lgn-alert'),okBox=$('lgn-ok');
var forgot=$('lgn-forgot'),reveal=$('lgn-reveal'),caps=$('lgn-caps');

sb.auth.getSession().then(function(r){if(r&&r.data&&r.data.session)window.location.href='/premium'}).catch(function(){});

function clearAll(){eg.classList.remove('err');pg.classList.remove('err');email.removeAttribute('aria-invalid');pass.removeAttribute('aria-invalid');alertBox.classList.remove('on');okBox.classList.remove('on')}
function fail(g,el){g.classList.add('err');el.setAttribute('aria-invalid','true')}
[email,pass].forEach(function(el){el.addEventListener('input',function(){el.closest('.lgn-group').classList.remove('err');el.removeAttribute('aria-invalid')})});
function say(html){alertBox.innerHTML=html;alertBox.classList.add('on')}

reveal.addEventListener('click',function(){var on=pass.type==='password';pass.type=on?'text':'password';reveal.textContent=on?'Hide':'Show';reveal.setAttribute('aria-pressed',on?'true':'false');pass.focus()});
function capsCheck(ev){if(!ev.getModifierState)return;caps.classList.toggle('on',ev.getModifierState('CapsLock'))}
pass.addEventListener('keyup',capsCheck);pass.addEventListener('keydown',capsCheck);pass.addEventListener('blur',function(){caps.classList.remove('on')});

var RX=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;
function login(){
  clearAll();
  var e=email.value.trim(),p=pass.value,bad=null;
  if(!e||!RX.test(e)){fail(eg,email);bad=email}
  if(!p){fail(pg,pass);if(!bad)bad=pass}
  if(bad){bad.focus();return}
  btn.textContent='Logging in...';btn.disabled=true;
  sb.auth.signInWithPassword({email:e,password:p}).then(function(res){
    if(res.error){btn.textContent='Log in';btn.disabled=false;
      /* One message for every failure: naming the cause would confirm which addresses hold accounts. */
      say('That email and password did not match an active Terminal account. If you have not confirmed your account yet, use the link in the email we sent. Otherwise check both and try again, or <a href="/contact">contact us</a> about access.');return}
    btn.textContent='Redirecting...';window.location.href='/premium';
  }).catch(function(){btn.textContent='Log in';btn.disabled=false;say('Something went wrong on our side. Try again in a moment.')});
}
form.addEventListener('submit',function(ev){ev.preventDefault();login()});

forgot.addEventListener('click',function(){
  clearAll();var e=email.value.trim();
  if(!e||!RX.test(e)){fail(eg,email);email.focus();say('Enter your email address first, then use the reset link.');return}
  forgot.textContent='Sending...';
  sb.auth.resetPasswordForEmail(e,{redirectTo:window.location.origin+'/login'}).then(function(){
    forgot.textContent='Forgot your password?';okBox.textContent='If an account exists for '+e+', a reset link is on its way. Check your inbox.';okBox.classList.add('on');
  }).catch(function(){forgot.textContent='Forgot your password?';say('The reset could not be sent right now. Try again in a moment.')});
});

/* The market this week. */
var MONTH=['January','February','March','April','May','June','July','August','September','October','November','December'];
function dt(s){var p=String(s).slice(0,10).split('-');return MONTH[+p[1]-1]+' '+(+p[2])+', '+p[0]}
function n(v){return Number(v).toLocaleString('en-US')}
function chg(w){var v=Math.round(Math.abs(+w)*100)/100;if(!v)return '<span class="fl">&#9644; 0.00%</span>';return '<span class="'+(w<0?'dn':'up')+'">'+(w<0?'&#9660; ':'&#9650; ')+v.toFixed(2)+'%</span>'}
function get(path){return fetch(URL_SB+'/rest/v1'+path,{headers:{apikey:KEY}}).then(function(r){if(!r.ok)throw new Error(r.status);return r.json()})}
var LIST=[['MML','Multimodal'],['IMG','Image'],['VID','Video'],['AUD','Speech to text'],['VOC','Text to speech']];
function chart(rows){
  var box=$('lgnChart');if(!box||rows.length<2)return;
  var W=640,H=150,P=6,vals=rows.map(function(r){return +r.level}),lo=Math.min.apply(null,vals.concat([100])),hi=Math.max.apply(null,vals.concat([100])),pad=(hi-lo)*.12||.5;lo-=pad;hi+=pad;
  var y=function(v){return P+(hi-v)/(hi-lo)*(H-2*P)},pts=vals.map(function(v,i){return (P+i*(W-2*P)/(vals.length-1)).toFixed(1)+','+y(v).toFixed(1)}).join(' ');
  box.innerHTML='<svg viewBox="0 0 '+W+' '+H+'" role="img" aria-label="Text index, input, since May 2026"><line x1="0" x2="'+W+'" y1="'+y(100).toFixed(1)+'" y2="'+y(100).toFixed(1)+'" stroke="var(--border)" stroke-dasharray="3 4"/><text x="'+(W-4)+'" y="'+(y(100)-6).toFixed(1)+'" text-anchor="end">100 = May 2026</text><polyline points="'+pts+'" fill="none" stroke="var(--l1)" stroke-width="1.8" stroke-linejoin="round"/></svg>';
}
function market(ad){
  var d=String(ad).slice(0,10);
  if($('lgnPub'))$('lgnPub').textContent=dt(d);
  get('/v_index_rebased?select=date,level&index_code=eq.AIPI%20TXT%20GLB&direction=eq.input&date=gte.2026-05-04&date=lte.'+d+'&order=date').then(chart).catch(function(){});
  get('/v_index_ticker?select=index_code,direction,level,wow&index_code=in.(%22AIPI%20TXT%20GLB%22,%22AIPI%20MML%20GLB%22,%22AIPI%20IMG%20GLB%22,%22AIPI%20VID%20GLB%22,%22AIPI%20AUD%20GLB%22,%22AIPI%20VOC%20GLB%22)').then(function(rows){
    var by={};rows.forEach(function(r){var c=r.index_code.split(' ')[1];if(!by[c]||r.direction==='input')by[c]=r});
    if(by.TXT){$('lgnTxt').textContent=(+by.TXT.level).toFixed(2);$('lgnTxtW').innerHTML=chg(by.TXT.wow)+' <span class="fl" style="color:var(--l4)">1w</span>'}
    var tb=$('lgnTb');if(!tb)return;var h='<div class="h">Index</div><div class="h">Level</div><div class="h">1w</div>';
    LIST.forEach(function(x){var r=by[x[0]];if(!r)return;h+='<div class="nm">'+x[1]+' <a href="/indexes?index=aipi-'+x[0].toLowerCase()+'-glb#atom-index-card">'+x[0]+'</a></div><div>'+(+r.level).toFixed(2)+'</div><div>'+chg(r.wow)+'</div>'});
    tb.innerHTML=h;
  }).catch(function(){});
  fetch(URL_SB+'/rest/v1/rpc/get_coverage_page',{method:'POST',headers:{apikey:KEY,'Content-Type':'application/json'},body:'{}'}).then(function(r){return r.ok?r.json():null}).then(function(c){
    var s=c&&c.summary,el=$('lgnSrc');if(!s||!el)return;
    el.textContent='Source: Attic Standard, input index levels, '+dt(d)+'. '+n(s.Vendors)+' vendors, '+n(s.Models)+' models and '+n(s.SKUs)+' SKUs behind them. Figures update with each index publication.';
  }).catch(function(){});
}
var ad=window.AS&&window.AS.activeDate;
(ad&&ad.then?ad:get('/site_config?id=eq.1&select=active_date').then(function(r){return r[0].active_date})).then(market).catch(function(){});
})();

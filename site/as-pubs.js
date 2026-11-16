/* ═══ PUBLICATIONS (homepage research section, #hpPubs) ═══
   Left column: every live white paper, newest first, as a list row with a small
   cover, date, format, title, summary and link (up to four). Right column: the
   five newest weekly assessments. Everything comes from the publications table.
   A paper whose url ends in .pdf is offered as a download, anything else as a
   link out. The section stays hidden until the rows load, so a failed request
   leaves no empty frame. The wordmark for the covers is kept in the embed as
   <template id="hpPbWm">. AS.pubs.render(rows) draws from given rows. */
(function(){
  var AS = window.AS = window.AS || {};
  var MONTH = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]; }); }
  function safe(u){ u = String(u || ''); return /^https:\/\//i.test(u) ? u : '#'; }
  function monthYear(d){ var p = String(d).split('-'); return MONTH[+p[1] - 1] + ' ' + p[0]; }
  function longDate(d){ var p = String(d).split('-'); return MONTH[+p[1] - 1] + ' ' + (+p[2]) + ', ' + p[0]; }
  function isPdf(u){ return /\.pdf(?:$|[?#])/i.test(String(u || '')); }
  function $(id){ return document.getElementById(id); }

  function paperRow(p, wm){
    var my = monthYear(p.published_on), pdf = isPdf(p.url);
    return '<a href="' + esc(safe(p.url)) + '" class="as-pb-pr" target="_blank" rel="noopener">'
      + '<div class="as-pb-cv" aria-hidden="true"><div class="as-wm">' + wm + '</div><div class="as-crule"></div><div class="as-ck">White paper</div>'
      + '<div class="as-ct">' + esc(p.title) + '</div><div class="as-cf"><span>Attic Standard</span><span>' + esc(my) + '</span></div></div>'
      + '<div class="as-pb-px"><span class="as-pb-d">' + esc(my) + ' · ' + (pdf ? 'PDF' : 'LinkedIn article') + '</span>'
      + '<span class="as-pb-pt">' + esc(p.title) + '</span>'
      + (p.summary ? '<p class="as-pb-ps">' + esc(p.summary) + '</p>' : '')
      + '<span class="as-pb-go">' + (pdf ? 'Download the paper (PDF) ↓' : 'Read the paper ↗') + '</span></div></a>';
  }

  function render(rows){
    var root = $('hpPubs'); if(!root) return;
    rows = (rows || []).slice().sort(function(a, b){ return a.published_on < b.published_on ? 1 : a.published_on > b.published_on ? -1 : 0; });
    var papers = rows.filter(function(r){ return r.kind === 'paper'; }).slice(0, 4);
    var eds = rows.filter(function(r){ return r.kind === 'edition'; }).slice(0, 5);
    if(!papers.length && !eds.length) return;
    var box = $('hpPbPaper'), list = $('hpPbList'), t = $('hpPbWm');
    var wm = t ? (t.innerHTML || '').trim() : '';
    if(box && list){
      list.innerHTML = papers.map(function(p){ return paperRow(p, wm); }).join('');
      box.hidden = !papers.length;
    }
    $('hpPbRows').innerHTML = eds.map(function(r){
      return '<a href="' + esc(safe(r.url)) + '" class="as-pb-r" target="_blank" rel="noopener"><span class="as-pb-d">' + longDate(r.published_on) + '</span><span class="as-pb-h">' + esc(r.title) + '</span><span class="as-pb-go" aria-hidden="true">↗</span></a>';
    }).join('');
    root.hidden = false;
  }

  function start(){
    if(!$('hpPubs') || !AS.rest) return;
    AS.rest('/publications?select=kind,title,subtitle,summary,published_on,url&is_live=eq.true&order=published_on.desc')
      .then(render)
      .catch(function(e){ console.error('Attic Standard publications unavailable:', e); });
  }
  AS.pubs = { render: render };
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();

/* ═══ PUBLICATIONS (homepage research section, #hpPubs) ═══
   The newest white paper takes the cover slot; up to two earlier papers sit
   under it as compact rows; the five newest weekly assessments fill the right
   column. Everything comes from the publications table. A paper whose url ends
   in .pdf is offered as a download, anything else as a link out. The section
   stays hidden until the rows load, so a failed request leaves no empty frame.
   AS.pubs.render(rows) draws from given rows (used to preview unpublished rows). */
(function(){
  var AS = window.AS = window.AS || {};
  var MONTH = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]; }); }
  function safe(u){ u = String(u || ''); return /^https:\/\//i.test(u) ? u : '#'; }
  function monthYear(d){ var p = String(d).split('-'); return MONTH[+p[1] - 1] + ' ' + p[0]; }
  function longDate(d){ var p = String(d).split('-'); return MONTH[+p[1] - 1] + ' ' + (+p[2]) + ', ' + p[0]; }
  function isPdf(u){ return /\.pdf(?:$|[?#])/i.test(String(u || '')); }
  function $(id){ return document.getElementById(id); }

  function render(rows){
    var root = $('hpPubs'); if(!root) return;
    rows = (rows || []).slice().sort(function(a, b){ return a.published_on < b.published_on ? 1 : a.published_on > b.published_on ? -1 : 0; });
    var papers = rows.filter(function(r){ return r.kind === 'paper'; });
    var eds = rows.filter(function(r){ return r.kind === 'edition'; }).slice(0, 5);
    if(!papers.length && !eds.length) return;
    var paper = papers[0], box = $('hpPbPaper');
    if(paper && box){
      var my = monthYear(paper.published_on), href = safe(paper.url), pdf = isPdf(paper.url);
      [$('hpPbCvA'), $('hpPbLink')].forEach(function(a){ if(a) a.href = href; });
      $('hpPbCt').textContent = paper.title;
      $('hpPbCs').textContent = paper.subtitle || '';
      $('hpPbCm').textContent = my;
      $('hpPbKind').textContent = 'White paper · ' + my;
      $('hpPbTitle').textContent = paper.title;
      /* The summary's closing sentence stands as the finding, as on the paper's cover. */
      var s = String(paper.summary || ''), parts = s.match(/[^.!?]+[.!?]+/g) || [s], s1 = $('hpPbSum'), s2 = $('hpPbSum2');
      if(parts.length > 1){ s1.textContent = parts.slice(0, -1).join('').trim(); s2.textContent = parts[parts.length - 1].trim(); s2.hidden = false; }
      else { s1.textContent = s; s2.hidden = true; }
      $('hpPbGo').textContent = pdf ? 'Download the paper (PDF) ↓' : 'Read the paper ↗';
      var earlier = papers.slice(1, 3), wrap = $('hpPbEarlier');
      if(wrap){
        $('hpPbErows').innerHTML = earlier.map(function(r){
          return '<a href="' + esc(safe(r.url)) + '" class="as-pb-er" target="_blank" rel="noopener">'
            + '<span class="as-pb-h">' + esc(r.title) + '</span>'
            + '<span class="as-pb-d">' + esc(monthYear(r.published_on)) + (isPdf(r.url) ? ' · PDF' : '') + '</span>'
            + '<span class="as-pb-go" aria-hidden="true">' + (isPdf(r.url) ? '↓' : '↗') + '</span></a>';
        }).join('');
        wrap.hidden = !earlier.length;
      }
      box.hidden = false;
    } else if(box) box.hidden = true;
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

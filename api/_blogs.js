// Reads the "Blogs" and "Blog Photos" tabs of the website's Google Sheet and turns them into blog posts.
// (Files starting with "_" are helpers, not web addresses.)
const { esc } = require('./_shared');
const SHEET_ID = process.env.SHEET_ID || '1p307OWQyb3ZeqLAFO5JyU0qIZSKhW-MFIA97LlBORY8'; // keep identical to SHEET_ID in site.js

const slugify = s => (s||'').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/['’`]/g,'').replace(/&/g,' and ').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
function parseCSV(t){const rows=[];let f='',r=[],q=false;for(let i=0;i<t.length;i++){const c=t[i],n=t[i+1];if(q){if(c==='"'&&n==='"'){f+='"';i++}else if(c==='"')q=false;else f+=c}else{if(c==='"')q=true;else if(c===','){r.push(f);f=''}else if(c==='\r'){}else if(c==='\n'){r.push(f);rows.push(r);r=[];f=''}else f+=c}}if(f.length||r.length){r.push(f);rows.push(r)}return rows}

async function tab(name){
  const res = await fetch('https://docs.google.com/spreadsheets/d/'+SHEET_ID+'/gviz/tq?tqx=out:csv&headers=1&sheet='+encodeURIComponent(name));
  if (!res.ok) throw new Error('sheet '+name+' '+res.status);
  const rows = parseCSV(await res.text());
  const h = (rows[0]||[]).map(x => x.trim().toLowerCase());
  return rows.slice(1).filter(r => r.some(c => c.trim())).map(r => Object.fromEntries(h.map((k,i) => [k,(r[i]||'').trim()])));
}
// Sheet times are Dhaka time (GMT+6)
function when(s){
  s = (s||'').trim(); if (!s) return null;
  const m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:[ T](\d{1,2}):(\d{2}))?/);
  if (m) return new Date(Date.UTC(+m[1], +m[2]-1, +m[3], +(m[4]||0), +(m[5]||0)) - 6*3600e3);
  const d = new Date(s); return isNaN(d) ? null : d;
}
const imgUrl = f => !f ? '' : (/^(https?:)?\/\//.test(f) || f[0]==='/') ? f : '/images/blog/' + f;

async function getBlogs(){
  const [rows, ph] = await Promise.all([tab('Blogs'), tab('Blog Photos').catch(() => [])]);
  const photos = {};
  ph.forEach(r => {
    const k = (r['blog']||'').toLowerCase(), n = parseInt(r['photo no.'], 10);
    if (k && n && r['file name']) (photos[k] = photos[k] || {})[n] = { src: imgUrl(r['file name']), alt: r['alt text / caption'] || '' };
  });
  const now = Date.now(), used = {};
  const posts = rows.filter(r => r.title).map(r => {
    const site = (r['site status']||'').toLowerCase(), st = (r.status||'').toLowerCase(), date = when(r['publish date']);
    // Live = the sheet's "Site status" column says LIVE/PUBLISHED (falls back to "Status") and the publish date has arrived
    const ok = site ? /^(live|published)/.test(site) : /^(publish|published|live|ready|approved|yes)$/.test(st);
    if (!ok || (date && date.getTime() > now)) return null;
    const body = r.body || '';
    const first = body.split('\n').map(x => x.trim()).find(x => x && !/^(#|[-*]\s|\[photo)/i.test(x)) || '';
    let summary = (r.summary || first.replace(/\[([^\]]+)\]\([^)]*\)/g,'$1').replace(/\*\*/g,'')).replace(/\s+/g,' ').trim();
    if (summary.length > 160) summary = summary.slice(0,157).replace(/\s+\S*$/,'') + '…';
    return { title: r.title, category: r.category || 'Journal', date, summary, keywords: r.keywords || '', cover: imgUrl(r['cover photo']), body,
      photos: photos[r.title.toLowerCase()] || {}, featured: /^(yes|y|true)$/i.test(r.featured||''),
      dateText: date ? date.toLocaleDateString('en-GB', { day:'numeric', month:'long', year:'numeric', timeZone:'Asia/Dhaka' }) : '',
      mins: Math.max(1, Math.round(body.split(/\s+/).filter(Boolean).length / 200)) };
  }).filter(Boolean).sort((a,b) => (b.date||0) - (a.date||0));
  posts.forEach(p => { const s = slugify(p.title) || 'post'; let f = s, i = 2; while (used[f]) f = s + '-' + i++; used[f] = 1; p.slug = f; });
  return posts;
}

// Sheet text -> safe HTML. Supports: ## heading, **bold**, [text](link), - bullets, [photo 1]
const inline = s => s.replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>').replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+|\/[^\s)]*)\)/g,'<a href="$2">$1</a>');
function render(body, ph){
  const out = []; let para = [], list = [];
  const fp = () => { if (para.length) { out.push('<p>'+inline(esc(para.join(' ')))+'</p>'); para = []; } };
  const fl = () => { if (list.length) { out.push('<ul>'+list.map(x => '<li>'+inline(esc(x))+'</li>').join('')+'</ul>'); list = []; } };
  for (const raw of (body||'').replace(/\r/g,'').split('\n')) {
    const t = raw.trim(); let m;
    if (!t) { fp(); fl(); }
    else if ((m = t.match(/^\[photo\s*(\d+)\]$/i))) { fp(); fl(); const p = ph[+m[1]];
      if (p) out.push('<figure class="pf"><div class="gi"><img src="'+esc(p.src)+'" alt="'+esc(p.alt)+'" loading="lazy"></div>'+(p.alt ? '<figcaption>'+esc(p.alt)+'</figcaption>' : '')+'</figure>'); }
    else if ((m = t.match(/^(#{1,3})\s+(.+)$/))) { fp(); fl(); const n = Math.max(2, m[1].length); out.push('<h'+n+'>'+inline(esc(m[2]))+'</h'+n+'>'); }
    else if ((m = t.match(/^[-*]\s+(.+)$/))) { fp(); list.push(m[1]); }
    else { fl(); para.push(t); }
  }
  fp(); fl(); return out.join('\n');
}
module.exports = { getBlogs, render };

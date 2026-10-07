// Shared helpers for the server-rendered pages (project pages + sitemap).
// Reads the same Google Sheet as the website, so editing the sheet updates these pages too.
const SITE = 'https://thestudioakaar.com';
const SHEET_ID = process.env.SHEET_ID || '1p307OWQyb3ZeqLAFO5JyU0qIZSKhW-MFIA97LlBORY8'; // keep identical to SHEET_ID in site.js
const CATEGORY_ORDER = ['Residential Building','Residential Interior','Commercial Interior','Institutional Design','Public Space Design','Landscape Design','Set Design'];

const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const slugify = s => (s||'').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/['’`]/g,'').replace(/&/g,' and ').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
const catRank = c => { const i = CATEGORY_ORDER.findIndex(x => x.toLowerCase() === (c||'').trim().toLowerCase()); return i < 0 ? 99 : i; };
const abs = u => /^https?:/.test(u) ? u : SITE + u;

function parseCSV(t){const rows=[];let f='',r=[],q=false;for(let i=0;i<t.length;i++){const c=t[i],n=t[i+1];if(q){if(c==='"'&&n==='"'){f+='"';i++}else if(c==='"')q=false;else f+=c}else{if(c==='"')q=true;else if(c===','){r.push(f);f=''}else if(c==='\r'){}else if(c==='\n'){r.push(f);rows.push(r);r=[];f=''}else f+=c}}if(f.length||r.length){r.push(f);rows.push(r)}return rows}

// Same rules as site.js, so the web addresses always match the ones the site uses.
function buildProjects(csvText){
  const rows = parseCSV(csvText);
  const h = (rows[0]||[]).map(x => x.trim().toLowerCase());
  const recs = rows.slice(1).filter(r => r.some(c => c.trim())).map(r => Object.fromEntries(h.map((k,i) => [k,(r[i]||'').trim()])));
  const isHidden = r => /^(no|n|false|hide|hidden|draft)$/i.test((r.show||'').trim());
  const byOrder = (a,b) => (parseFloat(a.order)||1e9) - (parseFloat(b.order)||1e9);
  const list = recs.filter(r => r.title && !isHidden(r)).sort(byOrder).map(r => {
    const files = (r.photos||'').split(/[,;\n]+/).map(x => x.trim()).filter(Boolean);
    return { title:r.title, category:r.category||'Uncategorized', loc:r.location||'', size:r.size||'', desc:r.description||'',
      base:slugify(r.title), images:files.map(f => (/^(https?:)?\/\//.test(f)||f[0]==='/') ? f : '/images/gallery/'+f) };
  }).filter(p => p.images.length);
  list.forEach((p,i) => p.num = String(i+1).padStart(2,'0'));
  const counts = {}, used = {};
  list.forEach(p => counts[p.base] = (counts[p.base]||0)+1);
  list.forEach(p => { let s = p.base || ('project-'+p.num); if (counts[p.base] > 1) s += '-' + slugify(p.category); let fs = s, i = 2; while (used[fs]) fs = s + '-' + i++; used[fs] = 1; p.slug = fs; });
  return list;
}

async function getProjects(){
  const res = await fetch('https://docs.google.com/spreadsheets/d/'+SHEET_ID+'/gviz/tq?tqx=out:csv&sheet=Projects');
  if (!res.ok) throw new Error('sheet ' + res.status);
  return buildProjects(await res.text());
}

const jsonLd = o => '<script type="application/ld+json">' + JSON.stringify(o).replace(/</g,'\\u003c') + '</script>';

// Full page wrapper that matches the rest of the website (same CSS, menu, footer, tracking).
function layout({ title, desc, path, image, ld, body, robots }){
  const url = SITE + path;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
${robots ? `<meta name="robots" content="${robots}">\n` : ''}<link rel="canonical" href="${url}">
<link rel="icon" type="image/png" href="/images/logo.png">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Studio Akaar">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${esc(image)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="${esc(image)}">
<script>try{if(sessionStorage.s)document.documentElement.className='skip'}catch(e){}</script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400&family=Manrope:wght@300;400;500;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/site.css">
${ld || ''}
</head>
<body>
<div id="loader" aria-hidden="true"></div>
<header id="nav"><noscript><a href="/">Studio Akaar</a> <a href="/projects">Portfolio</a> <a href="/team">Team</a> <a href="/about">About</a> <a href="/contact">Contact</a></noscript></header>
${body}
<footer id="foot"></footer>
<a class="wa" href="https://wa.me/8801790568894?text=Hi%20Studio%20Akaar%2C%20I%27d%20like%20to%20talk%20about%20a%20project." target="_blank" rel="noopener">Chat on WhatsApp</a>
<script src="/site.js"></script>
</body>
</html>`;
}

module.exports = { SITE, esc, abs, catRank, CATEGORY_ORDER, buildProjects, getProjects, jsonLd, layout };

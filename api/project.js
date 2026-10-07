// Serves /projects/<project-name> as a real, search-engine-readable page built from your Google Sheet.
const { SITE, esc, abs, catRank, getProjects, jsonLd, layout } = require('./_shared');

module.exports = async (req, res) => {
  const slug = String((req.query && req.query.slug) || '').toLowerCase();
  res.setHeader('Content-Type', 'text/html; charset=utf-8');

  let list;
  try { list = await getProjects(); }
  catch (e) {
    res.statusCode = 503; res.setHeader('Retry-After', '60'); res.setHeader('Cache-Control', 'no-store');
    return res.end(layout({ title:'Studio Akaar — back in a moment', desc:'Please try again shortly.', path:'/projects', image:SITE+'/images/akaar-logo-thumb.jpg', robots:'noindex',
      body:'<div class="pageHead"><h1>Back in a <span>moment.</span></h1><p class="copy">We could not load this project right now. Please try again shortly or <a href="/projects" style="text-decoration:underline">view the portfolio</a>.</p></div>' }));
  }

  const p = list.find(x => x.slug === slug);
  if (!p) {
    res.statusCode = 404; res.setHeader('Cache-Control', 'public, s-maxage=60');
    return res.end(layout({ title:'Project not found — Studio Akaar', desc:'This project could not be found.', path:'/projects', image:SITE+'/images/akaar-logo-thumb.jpg', robots:'noindex',
      body:'<div class="pageHead"><h1>Project not <span>found.</span></h1><p class="copy">It may have moved. <a href="/projects" style="text-decoration:underline">See the full portfolio</a>.</p></div>' }));
  }

  const url = SITE + '/projects/' + p.slug;
  const title = `${p.title} — ${p.category} in Dhaka | Studio Akaar`;
  const plain = p.desc.replace(/\s+/g, ' ').trim();
  const desc = plain ? (plain.length > 155 ? plain.slice(0, 152).replace(/\s+\S*$/, '') + '…' : plain)
                     : `${p.title} — ${p.category.toLowerCase()} project by Studio Akaar, architects and interior designers in Dhaka, Bangladesh.`;
  const imgs = p.images.map(abs);
  const meta = [p.loc, p.size].filter(Boolean).join(' · ');

  const paras = (p.desc || '').split(/\n{2,}/).filter(s => s.trim()).map(s => `<p class="copy">${esc(s.trim()).replace(/\n/g, '<br>')}</p>`).join('');
  const gallery = p.images.map((src, i) => `<figure class="gi"><img src="${esc(src)}" alt="${esc(p.title)} — ${esc(p.category.toLowerCase())} by Studio Akaar, Dhaka, Bangladesh (${i+1} of ${p.images.length})" ${i === 0 ? 'fetchpriority="high"' : 'loading="lazy"'}></figure>`).join('');

  const rel = [...list.filter(q => q !== p && q.category === p.category), ...list.filter(q => q !== p && q.category !== p.category)].slice(0, 3);
  const relCards = rel.map(q => `<a class="card" href="/projects/${esc(q.slug)}"><div class="ph"><img src="${esc(q.images[0])}" alt="${esc(q.title)} — ${esc(q.category.toLowerCase())} by Studio Akaar" loading="lazy"></div><span class="label tag">${esc(q.category)}</span><h3>${esc(q.title)}</h3></a>`).join('');

  const cats = [...new Set(list.map(q => q.category))].sort((a, b) => catRank(a) - catRank(b));
  const allLinks = cats.map(c => `<div><h4>${esc(c)}</h4>${list.filter(q => q.category === c).map(q => `<a href="/projects/${esc(q.slug)}">${esc(q.title)}</a>`).join('')}</div>`).join('');

  const body = `
<div class="pageHead pj">
  <p class="crumbs"><a href="/">Home</a> / <a href="/projects">Portfolio</a> / ${esc(p.category)}</p>
  <h1>${esc(p.title)}</h1>
  <p class="label">${esc(p.category)}${meta ? ' · ' + esc(meta) : ''}</p>
</div>
<div class="pjText">${paras}</div>
<div class="gal">${gallery}</div>
<section class="greet" style="margin-top:var(--sy)">
  <div>
    <p class="eyebrow">Planning something similar?</p>
    <a class="textLink" href="/contact" style="margin:0 30px 0 0">Start a conversation <span>→</span></a>
    <a class="textLink" href="/projects" style="margin:0">Back to portfolio <span>→</span></a>
  </div>
</section>
<section>
  <div class="secHead"><div><p class="eyebrow">More projects</p><h2 class="big">Keep <span>exploring.</span></h2></div></div>
  <div class="hl">${relCards}</div>
</section>
<section style="border-top:1px solid var(--line);padding-top:60px;padding-bottom:60px">
  <p class="eyebrow">All projects</p>
  <nav class="allp" aria-label="All projects">${allLinks}</nav>
</section>
<script>window.addEventListener('load',function(){if(window.track)track('project_view',{project:${JSON.stringify(p.title).replace(/</g, '\\u003c')},category:${JSON.stringify(p.category).replace(/</g, '\\u003c')}})})</script>`;

  const ld = jsonLd({ '@context': 'https://schema.org', '@graph': [
    { '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE + '/' },
      { '@type': 'ListItem', position: 2, name: 'Portfolio', item: SITE + '/projects' },
      { '@type': 'ListItem', position: 3, name: p.title, item: url } ] },
    Object.assign({ '@type': 'CreativeWork', '@id': url + '#project', name: p.title, description: plain || desc, url, image: imgs, genre: p.category,
      creator: { '@type': 'Organization', name: 'Studio Akaar', url: SITE } },
      p.loc ? { locationCreated: { '@type': 'Place', name: p.loc } } : {})
  ] });

  res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=86400');
  res.statusCode = 200;
  res.end(layout({ title, desc, path: '/projects/' + p.slug, image: imgs[0], ld, body }));
};

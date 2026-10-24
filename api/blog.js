// Serves /blog (all posts), /blog/<post-name> (one post) and /api/blog?json=1&n=3 (used by the home page cards).
// Everything comes from the "Blogs" tab of your Google Sheet.
const { SITE, esc, abs, jsonLd, layout } = require('./_shared');
const { getBlogs, render } = require('./_blogs');

const LOGO = SITE + '/images/akaar-logo-thumb.jpg';
const card = p => `<a class="card bcard" href="/blog/${esc(p.slug)}"><div class="ph">${p.cover ? `<img src="${esc(p.cover)}" alt="${esc(p.title)}" loading="lazy">` : `<div class="ini">${esc(p.title.charAt(0))}</div>`}</div><span class="label tag">${esc(p.category)}</span><h3>${esc(p.title)}</h3><p class="meta">${esc([p.dateText, p.mins + ' min read'].filter(Boolean).join(' · '))}</p><p class="d">${esc(p.summary)}</p></a>`;
const notice = (h, t) => `<div class="pageHead"><h1>${h}</h1><p class="copy">${t}</p></div>`;

module.exports = async (req, res) => {
  const q = req.query || {}, slug = String(q.slug || '').toLowerCase();
  let list;
  try { list = await getBlogs(); }
  catch (e) {
    res.statusCode = 503; res.setHeader('Retry-After', '60'); res.setHeader('Cache-Control', 'no-store');
    if (q.json) { res.setHeader('Content-Type', 'application/json'); return res.end('[]'); }
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.end(layout({ title: 'Studio Akaar — back in a moment', desc: 'Please try again shortly.', path: '/blog', image: LOGO, robots: 'noindex',
      body: notice('Back in a <span>moment.</span>', 'We could not load the blog right now. Please try again shortly.') }));
  }

  // Home page cards: selected posts (Featured = Yes in the sheet) first, then the newest
  if (q.json) {
    const n = Math.min(12, parseInt(q.n, 10) || 3);
    const pick = [...list.filter(p => p.featured), ...list.filter(p => !p.featured)].slice(0, n)
      .map(p => ({ title: p.title, slug: p.slug, category: p.category, date: p.dateText, mins: p.mins, summary: p.summary, cover: p.cover }));
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=86400');
    return res.end(JSON.stringify(pick));
  }

  res.setHeader('Content-Type', 'text/html; charset=utf-8');

  if (!slug) {
    const body = `<div class="pageHead"><p class="eyebrow">Blog</p><h1>Notes from the <span>studio.</span></h1><p class="copy">Articles from Studio Akaar on architecture, interior and landscape design in Dhaka, Bangladesh.</p></div>
<section style="padding-top:30px"><div class="hl blogList">${list.map(card).join('') || '<p class="copy">The first articles are on their way.</p>'}</div></section>`;
    const ld = jsonLd({ '@context': 'https://schema.org', '@type': 'Blog', name: 'Studio Akaar Blog', url: SITE + '/blog', publisher: { '@type': 'Organization', name: 'Studio Akaar', url: SITE },
      blogPost: list.slice(0, 20).map(p => ({ '@type': 'BlogPosting', headline: p.title, url: SITE + '/blog/' + p.slug })) });
    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=86400');
    return res.end(layout({ title: 'Blog — Architecture & Interior Design Notes | Studio Akaar', desc: 'Articles from Studio Akaar on architecture, interior and landscape design in Dhaka, Bangladesh.', path: '/blog', image: (list[0] && list[0].cover) ? abs(list[0].cover) : LOGO, ld, body }));
  }

  const p = list.find(x => x.slug === slug);
  if (!p) {
    res.statusCode = 404; res.setHeader('Cache-Control', 'public, s-maxage=60');
    return res.end(layout({ title: 'Article not found — Studio Akaar', desc: 'This article could not be found.', path: '/blog', image: LOGO, robots: 'noindex',
      body: notice('Article not <span>found.</span>', 'It may have moved. <a href="/blog" style="text-decoration:underline">See all articles</a>.') }));
  }
  const url = SITE + '/blog/' + p.slug, img = p.cover ? abs(p.cover) : LOGO;
  const more = list.filter(x => x !== p).slice(0, 3).map(card).join('');
  const body = `
<div class="pageHead pj">
 <p class="crumbs"><a href="/">Home</a> / <a href="/blog">Blog</a> / ${esc(p.category)}</p>
 <h1>${esc(p.title)}</h1>
 <p class="label">${esc([p.category, p.dateText, p.mins + ' min read'].filter(Boolean).join(' · '))}</p>
</div>
${p.cover ? `<div class="blogCover"><figure class="gi"><img src="${esc(p.cover)}" alt="${esc(p.title)}" fetchpriority="high"></figure></div>` : ''}
<article class="post">${render(p.body, p.photos)}</article>
<section class="greet">
 <div><p class="eyebrow">Planning a project?</p>
 <a class="textLink" href="/contact" style="margin:0 30px 0 0">Start a conversation <span>→</span></a>
 <a class="textLink" href="/blog" style="margin:0">All articles <span>→</span></a></div>
</section>
${more ? `<section><div class="secHead"><div><p class="eyebrow">Keep reading</p><h2 class="big">More <span>articles.</span></h2></div></div><div class="hl">${more}</div></section>` : ''}
<script>window.addEventListener('load',function(){if(window.track)track('blog_view',{post:${JSON.stringify(p.title).replace(/</g, '\\u003c')}})})</script>`;
  const ld = jsonLd({ '@context': 'https://schema.org', '@graph': [
    { '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE + '/' },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: SITE + '/blog' },
      { '@type': 'ListItem', position: 3, name: p.title, item: url } ] },
    Object.assign({ '@type': 'BlogPosting', '@id': url + '#post', headline: p.title, description: p.summary, url, mainEntityOfPage: url, image: [img], articleSection: p.category,
      author: { '@type': 'Organization', name: 'Studio Akaar', url: SITE }, publisher: { '@type': 'Organization', name: 'Studio Akaar', url: SITE, logo: { '@type': 'ImageObject', url: SITE + '/images/logo-light.png' } } },
      p.date ? { datePublished: p.date.toISOString() } : {}, p.keywords ? { keywords: p.keywords } : {}) ] });
  res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=86400');
  res.statusCode = 200;
  res.end(layout({ title: `${p.title} | Studio Akaar`, desc: p.summary, path: '/blog/' + p.slug, image: img, ld, body }));
};

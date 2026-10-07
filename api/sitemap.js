// Serves /sitemap.xml: every page plus every project (with its photos) straight from your Google Sheet.
const { SITE, esc, abs, getProjects } = require('./_shared');

module.exports = async (req, res) => {
  let list = [];
  try { list = await getProjects(); } catch (e) {}
  const pages = ['/', '/projects', '/team', '/youtube', '/about', '/contact'];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${pages.map(p => `  <url><loc>${SITE}${p === '/' ? '/' : p}</loc></url>`).join('\n')}
${list.map(p => `  <url><loc>${SITE}/projects/${esc(p.slug)}</loc>\n${p.images.map(i => `    <image:image><image:loc>${esc(abs(i))}</image:loc><image:title>${esc(p.title)}</image:title></image:image>`).join('\n')}\n  </url>`).join('\n')}
</urlset>`;
  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
  res.statusCode = 200;
  res.end(xml);
};

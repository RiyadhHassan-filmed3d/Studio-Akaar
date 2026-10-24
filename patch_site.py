"""Run once from the website folder (the one containing index.html):  python patch_site.py
Applies: scroll-snap off, 3 highlight projects, dynamic hero, bigger headings, blog cards on home, Blog menu link."""
import sys, pathlib

CSS_ADD = r"""
/* ── Bigger "Who we are" / "What we do" headings ── */
.intro h2.big,.services h2.big{font-size:clamp(42px,5.4vw,76px)}

/* ── Hero slideshow (newest projects cross-fade and drift slowly) ── */
.hero>img.hs{opacity:0;transform:scale(1);transition:opacity 1.6s ease,transform 14s linear,filter .7s}
.hero>img.hs.on{opacity:1;transform:scale(1.1)}
.tm .hero>img.hs{transition:opacity 1.6s ease,transform 14s linear,filter .12s linear}
.heroMeta a{border-bottom:1px solid currentColor}

/* ── Blog: cards (home + /blog) and article page ── */
.bcard .ph{aspect-ratio:3/2}
.bcard h3{font-size:20px;line-height:1.25}
.blogList{row-gap:56px}
.blogCover{padding:0 var(--gutter) 10px}
.blogCover .gi img{max-height:680px;object-fit:cover}
.post{padding:30px var(--gutter) 40px}
.post>*{max-width:720px}
.post p{font-size:16px;line-height:1.9;color:#444;margin:0 0 22px}
.post h2{font-size:clamp(26px,3vw,36px);font-weight:300;letter-spacing:-.03em;line-height:1.1;margin:56px 0 18px}
.post h3{font-size:20px;font-weight:400;margin:40px 0 12px}
.post ul{font-size:16px;line-height:1.9;color:#444;margin:0 0 22px;padding-left:20px}
.post a{text-decoration:underline}
.post figure.pf{max-width:980px;margin:40px 0}
.post figcaption{font-size:12px;color:#888;padding-top:10px}
"""

HERO_JS = r"""function heroSlides(work){
 const hero=document.getElementById('top'),base=hero.querySelector(':scope>img'),cap=hero.querySelector('.heroMeta span:last-child'),ov=hero.querySelector('.heroOverlay');
 const picks=work.slice(-5).reverse();
 if(!base||!cap||!picks.length||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
 base.classList.add('hs','on');
 const S=[{el:base,t:'Studio Akaar',h:'/'}];
 picks.forEach(p=>{const im=new Image();im.className='hs';im.alt=p.title+' — project by Studio Akaar';im.dataset.src=p.images[0];hero.insertBefore(im,ov);S.push({el:im,t:p.title,h:'/projects/'+p.slug})});
 let cur=0,timer=0;
 const load=i=>{const im=S[i%S.length].el;if(!im.getAttribute('src'))im.src=im.dataset.src};
 const show=i=>{cur=i%S.length;load(cur);load(cur+1);S.forEach((s,k)=>s.el.classList.toggle('on',k===cur));cap.innerHTML=cur?'<a href="'+S[cur].h+'">'+esc(S[cur].t)+'</a>':'Studio Akaar'};
 const stop=()=>{clearInterval(timer);timer=0},play=()=>{stop();timer=setInterval(()=>show(cur+1),6500)};
 load(1);
 new IntersectionObserver(es=>es[0].isIntersecting?play():stop(),{threshold:.2}).observe(hero);
 document.addEventListener('visibilitychange',()=>document.hidden?stop():play());
}
loadProjects().then(work=>{
 heroSlides(work);"""

BLOG_SECTION = """<!-- LATEST BLOGS (filled from the Blogs tab of the sheet; hidden until there is at least one post) -->
<section id="journal" style="border-top:1px solid var(--line);display:none">
 <div class="secHead reveal">
 <div><p class="eyebrow">Blog</p><h2 class="big">Notes from the <span>studio.</span></h2></div>
 <a class="textLink" href="/blog" style="margin:0">All articles <span>→</span></a>
 </div>
 <div class="hl" id="blogHl"></div>
</section>

<!-- WHAT WE DO -->"""

BLOG_JS = """<script>
// Home page blog cards: posts marked Featured = Yes first, then the newest (3 in total)
fetch('/api/blog?json=1&n=3').then(r=>r.ok?r.json():Promise.reject()).then(list=>{
 if(!list.length)return;
 document.getElementById('blogHl').innerHTML=list.map(p=>`
 <a class="card bcard reveal" href="/blog/${esc(p.slug)}">
 <div class="ph">${p.cover?`<img src="${esc(p.cover)}" alt="${esc(p.title)}" loading="lazy">`:`<div class="ini">${esc(p.title.charAt(0))}</div>`}</div>
 <span class="label tag">${esc(p.category)}</span>
 <h3>${esc(p.title)}</h3>
 <p class="meta">${esc([p.date,p.mins+' min read'].filter(Boolean).join(' · '))}</p>
 <p class="d">${esc(p.summary)}</p>
 </a>`).join('');
 document.getElementById('journal').style.display='';
 observeReveals();
}).catch(()=>{});
</script>
</body>"""

EDITS = {
 'site.css': [
  ('html{scroll-snap-type:y proximity;scroll-padding-top:68px}', 'html{scroll-padding-top:68px}'),
  ('section,footer,.pageHead{scroll-snap-align:start}', ''),
 ],
 'site.js': [
  ("['Films','/youtube']", "['Films','/youtube'],['Blog','/blog']"),
  ("[el.querySelector(':scope>img')]", "[...el.querySelectorAll(':scope>img')]"),
  ("else if(a.id==='latest')", "else if(a.classList.contains('bcard'))track('blog_card_click',{post:h.split('/blog/')[1]||''});\n else if(a.id==='latest')"),
 ],
 'index.html': [
  ('const list=feat.length?feat:(picks.length?picks:work.slice(0,3));',
   "const list=[...feat,...work.slice(-3).reverse().filter(p=>!feat.includes(p))].slice(0,3); // featured first, then filled up with the newest so there are always 3"),
  ('loadProjects().then(work=>{', HERO_JS),
  ('<!-- WHAT WE DO -->', BLOG_SECTION),
  ('</body>', BLOG_JS),
 ],
}

out = {}
for name, edits in EDITS.items():
    p = pathlib.Path(name)
    if not p.exists(): sys.exit(f'Cannot find {name} here. Run this from the folder that contains index.html.')
    s = p.read_text(encoding='utf-8')
    if 'heroSlides' in s or 'bcard' in s: sys.exit(f'{name} looks already patched - nothing changed.')
    for old, new in edits:
        if s.count(old) != 1: sys.exit(f'{name}: expected exactly one match for: {old[:70]!r} (found {s.count(old)}). Nothing was changed.')
        s = s.replace(old, new)
    out[name] = s
out['site.css'] += CSS_ADD
for name, s in out.items():
    pathlib.Path(name + '.bak').write_text(pathlib.Path(name).read_text(encoding='utf-8'), encoding='utf-8')
    pathlib.Path(name).write_text(s, encoding='utf-8')
print('Done. Backups saved as *.bak. Now copy the api/ folder and vercel.json over your existing ones and deploy.')

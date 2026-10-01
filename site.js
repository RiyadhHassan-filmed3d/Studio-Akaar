// ── SHARED SITE SCRIPT: loader, fixed menu, scroll indicator, footer, project data ──
const SHEET_CSV_URL='https://docs.google.com/spreadsheets/d/e/2PACX-1vQYK9l0JYTYe3pNpxRSdS7hWHu5h_vSF2OuDe7qwnUFd4SBv6ufXQp7YT99265m6Uovg5qpEleGOrlY/pub?output=csv';
const PAGES=[['Home','/'],['Projects','/projects'],['Team','/team'],['About Us','/about'],['Contact Us','/contact']];

(function(){
  // Opening animation: A K A A R, shown once per visit, hidden as soon as the page is ready (max 3s)
  const ld=document.getElementById('loader');
  if(ld){
    ld.innerHTML='AKAAR'.split('').map((c,i)=>`<span style="animation-delay:${i*.08}s">${c}</span>`).join('');
    const t0=Date.now();
    let hidden=false;
    const hide=()=>{if(hidden)return;hidden=true;setTimeout(()=>{ld.classList.add('done');try{sessionStorage.s=1}catch(e){}},Math.max(0,800-(Date.now()-t0)))};
    if(document.readyState==='complete')hide();else addEventListener('load',hide);
    setTimeout(hide,3000);
  }

  // Fixed nav + 3-line menu
  const path=location.pathname.replace(/\/$/,'').replace(/(index)?\.html$/,'')||'/';
  document.getElementById('nav').innerHTML='<a href="/" class="brand" aria-label="Studio Akaar"><img src="/images/logo-light.png" alt="Studio Akaar"></a><button id="mb" aria-label="Menu" aria-expanded="false"><i></i><i></i><i></i></button>';
  const dr=document.createElement('nav');dr.id='drawer';
  dr.innerHTML=PAGES.map(p=>`<a href="${p[1]}" class="${p[1]===path?'on':''}">${p[0]}</a>`).join('');
  document.body.appendChild(dr);
  const mb=document.getElementById('mb');
  const toggle=o=>{dr.classList.toggle('open',o);mb.setAttribute('aria-expanded',o)};
  mb.onclick=()=>toggle(!dr.classList.contains('open'));
  dr.onclick=e=>{if(e.target.closest('a'))toggle(false)};
  addEventListener('keydown',e=>{if(e.key==='Escape')toggle(false)});
  document.addEventListener('click',e=>{if(!e.target.closest('#drawer,#mb'))toggle(false)});

  // Minimal scroll indicator: appears while scrolling, gone after 1s of inactivity
  const sb=document.createElement('div');sb.id='sb';document.body.appendChild(sb);
  let st;
  addEventListener('scroll',()=>{
    const h=document.documentElement,max=h.scrollHeight-innerHeight;
    if(max<=0)return;
    const th=Math.max(40,innerHeight*innerHeight/h.scrollHeight);
    sb.style.height=th+'px';
    sb.style.transform=`translateY(${scrollY/max*(innerHeight-th)}px)`;
    sb.style.opacity=1;clearTimeout(st);st=setTimeout(()=>sb.style.opacity=0,1000);
  },{passive:true});

  // Footer
  const f=document.getElementById('foot');
  if(f)f.innerHTML=`<div><p class="eyebrow">Contact</p><strong>Studio Akaar</strong><p>Dhaka, Bangladesh<br>+880 1790 568894<br><a href="mailto:info@thestudioakaar.com" style="margin-top:8px">info@thestudioakaar.com</a></p></div>
  <div><p class="eyebrow">Explore</p>${PAGES.map(p=>`<a href="${p[1]}">${p[0]}</a>`).join('')}<a href="/youtube">Films</a></div>
  <div><p class="eyebrow">Socials</p><a href="https://www.facebook.com/AkaarStudio">Facebook</a><a href="https://www.instagram.com/studioakaar">Instagram</a><a href="https://www.linkedin.com/company/studio-akaar">LinkedIn</a><a href="https://www.youtube.com/@riyadhfilmed3d">YouTube</a></div>
  <div><p class="eyebrow">Trades</p><p>Contractor, sub-contractor or supplier?</p><a href="mailto:info@thestudioakaar.com?subject=Trade%2FVendor%20Inquiry" style="margin-top:10px;text-decoration:underline">Get in touch ↗</a></div>
  <div class="cp">© 2026 Studio Akaar · All rights reserved.</div>`;

  // WhatsApp icon: grey until the cursor / finger comes close
  const wa=document.querySelector('.wa');
  if(wa){
    wa.setAttribute('aria-label','Chat with Studio Akaar on WhatsApp');
    wa.innerHTML='<img src="/images/whatsapp.png" alt="WhatsApp">';
    wa.firstChild.onerror=()=>{wa.innerHTML='<svg viewBox="0 0 24 24" fill="#25D366"><path d="M12 2a10 10 0 0 0-8.6 15L2 22l5.2-1.4A10 10 0 1 0 12 2zm0 18.2a8.1 8.1 0 0 1-4.2-1.2l-.3-.2-3 .8.8-3-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.6.1a6.6 6.6 0 0 1-3.3-2.9c-.2-.4.2-.4.6-1.3.1-.1 0-.3 0-.4l-.7-1.7c-.2-.4-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2c0 1.3 1 2.6 1.1 2.8s2 3 4.7 4.2a5.6 5.6 0 0 0 3.5.7 3 3 0 0 0 2-1.4c.2-.4.2-.7.1-.8s-.2-.2-.4-.3z"/></svg>'};
    const RADIUS=90;  // how close (px) the cursor/finger must get to turn it green
    const near=(x,y)=>{const r=wa.getBoundingClientRect();wa.classList.toggle('near',Math.hypot(x-(r.left+r.width/2),y-(r.top+r.height/2))<RADIUS)};
    addEventListener('mousemove',e=>near(e.clientX,e.clientY),{passive:true});
    ['touchstart','touchmove'].forEach(t=>addEventListener(t,e=>near(e.touches[0].clientX,e.touches[0].clientY),{passive:true}));
    addEventListener('touchend',()=>setTimeout(()=>wa.classList.remove('near'),700));
  }

  // Scroll reveal
  const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}}),{threshold:.12});
  window.observeReveals=()=>{
    document.querySelectorAll('.reveal:not(.in)').forEach(el=>io.observe(el));
    if(window.refreshColor)refreshColor();
  };

  // ── BLACK & WHITE <-> COLOUR ──
  // Everything loads black & white (CSS). Desktop: the block under the mouse turns colour.
  // Phone: the block nearest the screen centre turns colour live while scrolling; blocks above/below fade back to B&W.
  const desk=matchMedia('(hover:hover) and (pointer:fine)').matches;
  const T='.hero,.introImg,.founderPic,.card';
  let raf=0,mx=0,my=0,moved=false,scrolled=false;
  const clearSeen=()=>document.querySelectorAll('.seen').forEach(el=>el.classList.remove('seen'));
  function deskUpdate(){
    raf=0;if(!moved)return;
    const hit=document.elementFromPoint(mx,my),cur=hit&&hit.closest(T);
    document.querySelectorAll('.seen').forEach(el=>{if(el!==cur)el.classList.remove('seen')});
    if(cur)cur.classList.add('seen');
  }
  function touchUpdate(){
    raf=0;if(!scrolled)return;
    const vw=innerWidth,vh=innerHeight;
    document.querySelectorAll(T).forEach(el=>{
      const img=el.classList.contains('hero')?el.querySelector(':scope>img'):el.querySelector('img');
      if(!img)return;
      const r=(el.classList.contains('card')?el.querySelector('.ph'):el).getBoundingClientRect();
      const dy=Math.abs(r.top+r.height/2-vh/2)/(vh*.45);   // 0 = centred vertically
      const dx=Math.abs(r.left+r.width/2-vw/2)/(vw*.45);   // 0 = centred horizontally (for swipe rows)
      img.style.filter='grayscale('+Math.min(1,Math.max(dx,dy)).toFixed(2)+')';
    });
  }
  if(desk){
    addEventListener('mousemove',e=>{mx=e.clientX;my=e.clientY;moved=true;if(!raf)raf=requestAnimationFrame(deskUpdate)},{passive:true});
    addEventListener('scroll',()=>{if(moved&&!raf)raf=requestAnimationFrame(deskUpdate)},{passive:true});
    document.documentElement.addEventListener('mouseleave',clearSeen);
  }else{
    document.documentElement.classList.add('tm');
    addEventListener('scroll',()=>{scrolled=true;if(!raf)raf=requestAnimationFrame(touchUpdate)},{passive:true,capture:true});
  }
  window.refreshColor=()=>{if(!desk&&scrolled)touchUpdate()};
  observeReveals();
})();

// ── PROJECT DATA (Google Sheet) ──
function slugify(s){return (s||'').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/['’`]/g,'').replace(/&/g,' and ').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'')}
function parseCSV(t){const rows=[];let f='',r=[],q=false;for(let i=0;i<t.length;i++){const c=t[i],n=t[i+1];if(q){if(c==='"'&&n==='"'){f+='"';i++}else if(c==='"')q=false;else f+=c}else{if(c==='"')q=true;else if(c===','){r.push(f);f=''}else if(c==='\r'){}else if(c==='\n'){r.push(f);rows.push(r);r=[];f=''}else f+=c}}if(f.length||r.length){r.push(f);rows.push(r)}return rows}
function buildWork(rows){
  if(!rows.length)return[];
  const h=rows[0].map(x=>x.trim().toLowerCase()),c=n=>h.indexOf(n);
  const [iF,iT,iC,iL,iS,iD,iSt,iH]=['filename','title','category','site_location','site_size','description','status','hero'].map(c);
  let groups=[],cur=null;
  for(let i=1;i<rows.length;i++){
    const r=rows[i],g=k=>(r[k]||'').trim(),file=g(iF);
    if(!file)continue;
    if(g(iT)){cur={title:g(iT),category:g(iC),loc:g(iL),size:g(iS),desc:g(iD),status:g(iSt),photos:[]};groups.push(cur)}
    if(!cur)continue;
    if(g(iC)&&!cur.category)cur.category=g(iC);if(g(iL)&&!cur.loc)cur.loc=g(iL);if(g(iS)&&!cur.size)cur.size=g(iS);if(g(iD)&&!cur.desc)cur.desc=g(iD);
    cur.photos.push({file,hero:g(iH).toLowerCase()==='yes'});
  }
  groups=groups.filter(x=>x.status.toLowerCase()!=='draft');
  const list=groups.map((g,i)=>{
    const hero=(g.photos.find(p=>p.hero)||g.photos[0]).file;
    const images=[hero,...g.photos.map(p=>p.file).filter(f=>f!==hero)].map(f=>'/images/gallery/'+f);
    return{title:g.title,category:g.category||'Uncategorized',loc:g.loc,size:g.size,desc:g.desc,images,num:String(i+1).padStart(2,'0'),base:slugify(g.title)};
  });
  const counts={},used={};
  list.forEach(p=>counts[p.base]=(counts[p.base]||0)+1);
  list.forEach(p=>{let s=p.base||('project-'+p.num);if(counts[p.base]>1)s+='-'+slugify(p.category);let fs=s,i=2;while(used[fs])fs=s+'-'+i++;used[fs]=1;p.slug=fs});
  return list;
}
async function loadProjects(){
  let text=null;
  try{text=sessionStorage.getItem('sa_csv')}catch(e){}
  if(!text){
    const res=await fetch(SHEET_CSV_URL,{cache:'no-store'});
    if(!res.ok)throw new Error('fetch failed');
    text=await res.text();
    try{sessionStorage.setItem('sa_csv',text)}catch(e){}
  }
  return buildWork(parseCSV(text));
}

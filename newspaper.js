/* Newspaper Mode: the site's own articles laid out as a daily broadsheet. Our own design. */
(()=>{
const H=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const TD=()=>new Date().toLocaleDateString('en-CA',{timeZone:'America/New_York'});
const LONG=d=>new Date(d+'T12:00:00').toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric',year:'numeric'});
const SHORT=d=>new Date(d+'T12:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric'});
const SITE=()=>{const m=window.EP_MAST||{};return ((m.top?m.top+' ':'')+(m.name||document.title.split('|')[0])).trim()};
const PLACE=()=>/jamestown/i.test(location.hostname+document.title)?'Jamestown':'Rhode Island';
const SEC0={music:'Arts & Entertainment',stage:'Arts & Entertainment',culture:'Arts & Entertainment',family:'Local',people:'Local',news:'Local',transit:'Local',food:'Food'};
const SEC=new Proxy(SEC0,{get:(o,k)=>k==='news'?'Local & State News':o[k]});
const css=`
#paper{position:fixed;inset:0;z-index:9999;background:#2b2b2b;overflow:auto;-webkit-overflow-scrolling:touch}
#paper .pp-bar{position:sticky;top:0;z-index:3;display:flex;gap:8px;align-items:center;justify-content:center;padding:8px;background:#111;border-bottom:1px solid #444;font:700 14px/1 Georgia,serif;color:#eee}
#paper .pp-bar button{all:unset;cursor:pointer;padding:9px 14px;border:1px solid #777;border-radius:4px;color:#fff;background:#222;font:700 14px/1 Georgia,serif}
#paper .pp-bar button:hover{background:#444}#paper .pp-bar .pp-x{margin-left:auto}#paper .pp-bar .pp-pg{min-width:150px;text-align:center}
#paper .sheet *{box-sizing:border-box}#paper .sheet{max-width:1180px;margin:18px auto 40px;background:#f6f4ee;color:#111;padding:22px 30px 34px;box-shadow:0 10px 40px #000a;font-family:Georgia,"Times New Roman",serif}
#paper .ear{display:flex;justify-content:space-between;align-items:flex-end;gap:16px}
#paper .ear .ppbox{flex:0 0 190px;border:1px solid #111;padding:7px 9px;font:400 12.5px/1.35 Georgia,serif}
#paper .ear .ppbox b{display:block;font:800 10.5px/1.2 "Libre Franklin",Arial,sans-serif;letter-spacing:.12em;text-transform:uppercase;margin-bottom:3px}
#paper .flag{flex:1;text-align:center}
#paper .flag img{width:min(640px,100%);height:auto;filter:brightness(0)}
#paper .flag .nm{font:900 clamp(34px,6vw,72px)/1 "Playfair Display",Georgia,serif;letter-spacing:-.01em}
#paper .dl{display:flex;justify-content:space-between;gap:10px;margin-top:8px;padding:5px 0;border-top:3px double #111;border-bottom:1px solid #111;font:700 12px/1.2 "Libre Franklin",Arial,sans-serif;letter-spacing:.06em;text-transform:uppercase}
#paper .sh{display:flex;justify-content:space-between;align-items:baseline;border-bottom:3px double #111;padding:4px 0 6px;margin-bottom:12px}
#paper .sh b{font:900 30px/1 "Playfair Display",Georgia,serif}#paper .sh span{font:700 12px/1 "Libre Franklin",Arial,sans-serif;letter-spacing:.1em;text-transform:uppercase}
#paper .fp{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:0 22px;margin-top:14px}
#paper .pplead{grid-column:1/5;border-right:1px solid #999;padding-right:22px}
#paper .rail{grid-column:5/7}
#paper .kk{font:800 11px/1.2 "Libre Franklin",Arial,sans-serif;letter-spacing:.14em;text-transform:uppercase;color:#333;margin-bottom:4px}
#paper h2.hd{font:800 clamp(30px,4vw,50px)/1.03 "Playfair Display",Georgia,serif;margin:0 0 8px;letter-spacing:-.01em}
#paper h3.hd{font:800 23px/1.12 "Playfair Display",Georgia,serif;margin:0 0 6px}
#paper h4.hd{font:700 17px/1.18 "Playfair Display",Georgia,serif;margin:0 0 4px}
#paper .dk{font:italic 400 19px/1.35 Georgia,serif;color:#222;margin:0 0 8px}
#paper .by{font:700 11px/1.2 "Libre Franklin",Arial,sans-serif;letter-spacing:.1em;text-transform:uppercase;margin:6px 0 10px;padding-bottom:6px;border-bottom:1px solid #bbb}
#paper .txt{column-gap:20px;column-rule:1px solid #ccc;font:400 15.5px/1.5 Georgia,serif;text-align:justify;hyphens:auto}
#paper .txt p{margin:0 0 8px;text-indent:1.2em}#paper .txt p:first-child{text-indent:0}
#paper .txt p.dc:first-letter{float:left;font:900 54px/.8 "Playfair Display",Georgia,serif;margin:6px 6px 0 0}
#paper .txt h5{font:800 13px/1.2 "Libre Franklin",Arial,sans-serif;letter-spacing:.08em;text-transform:uppercase;margin:10px 0 4px;break-after:avoid}
#paper .txt table{width:100%;border-collapse:collapse;font:400 12.5px/1.3 Georgia,serif;margin:4px 0 10px;break-inside:avoid;text-align:left}
#paper .txt td,#paper .txt th{border-bottom:1px solid #bbb;padding:3px 4px;vertical-align:top}#paper .txt th{font:800 10.5px/1.2 "Libre Franklin",Arial,sans-serif;text-transform:uppercase;letter-spacing:.06em}
#paper .txt caption{font:800 11px/1.2 "Libre Franklin",Arial,sans-serif;text-transform:uppercase;letter-spacing:.08em;text-align:left;padding:4px 0}
#paper .c2{column-count:2}#paper .c3{column-count:3}
#paper figure{margin:0 0 10px}#paper figure img{width:100%;height:auto;filter:grayscale(1) contrast(1.05);display:block}
#paper figcaption{font:italic 12.5px/1.3 Georgia,serif;color:#333;padding-top:4px;border-bottom:1px solid #bbb;padding-bottom:5px}
#paper .jump{font:700 12px/1.2 "Libre Franklin",Arial,sans-serif;letter-spacing:.06em;text-transform:uppercase;margin-top:6px}
#paper a.jl,#paper button.jl{all:unset;cursor:pointer;color:#b0001a;text-decoration:underline;text-underline-offset:2px}#paper a.jl:hover,#paper button.jl:hover{color:#e0001f}
#paper .brief{padding:0 0 10px;margin:0 0 10px;border-bottom:1px solid #999}#paper .brief p{margin:0;font:400 14.5px/1.42 Georgia,serif}
#paper .brief .src{font:700 10.5px/1.2 "Libre Franklin",Arial,sans-serif;letter-spacing:.08em;text-transform:uppercase;color:#444;margin-top:3px}
#paper .idx{border:2px solid #111;padding:8px 10px;margin-bottom:14px}#paper .idx b{display:block;font:900 18px/1 "Playfair Display",Georgia,serif;border-bottom:1px solid #111;padding-bottom:5px;margin-bottom:5px}
#paper .idx div{display:flex;justify-content:space-between;font:400 14px/1.6 Georgia,serif;cursor:pointer;color:#b0001a;text-decoration:underline;text-underline-offset:2px}#paper .idx div:hover{text-decoration:underline}
#paper .fold{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:0 22px;margin-top:16px;padding-top:14px;border-top:4px solid #111}
#paper .fold>div{border-right:1px solid #999;padding-right:22px}#paper .fold>div:last-child{border-right:0;padding-right:0}
#paper .agate{column-count:4;column-gap:16px;column-rule:1px solid #ccc;font:400 13px/1.38 Georgia,serif}
#paper .agate .day{font:900 15px/1.2 "Playfair Display",Georgia,serif;border-bottom:2px solid #111;margin:8px 0 4px;break-after:avoid}
#paper .agate .cat{font:800 10.5px/1.2 "Libre Franklin",Arial,sans-serif;letter-spacing:.1em;text-transform:uppercase;margin:7px 0 2px;break-after:avoid}
#paper .agate p{margin:0 0 4px;break-inside:avoid}#paper .agate p b{font-weight:700}
#paper .ft{margin-top:20px;padding-top:6px;border-top:1px solid #111;display:flex;justify-content:space-between;font:700 11px/1.2 "Libre Franklin",Arial,sans-serif;letter-spacing:.08em;text-transform:uppercase}
#paper .grid2{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:0 22px}#paper .grid2>div:first-child{border-right:1px solid #999;padding-right:22px}
@media(max-width:820px){#paper .sheet{padding:14px 14px 24px;margin:0}#paper .ear .ppbox{display:none}#paper .fp,#paper .fold,#paper .grid2{grid-template-columns:minmax(0,1fr)}#paper .pplead,#paper .rail,#paper .fold>div,#paper .grid2>div:first-child{grid-column:auto;border-right:0;padding-right:0}#paper .c2,#paper .c3{column-count:1}#paper .agate{column-count:2}#paper .rail{margin-top:16px;padding-top:12px;border-top:3px double #111}#paper .fold>div{margin-bottom:14px;padding-bottom:12px;border-bottom:1px solid #999}#paper .pp-bar .pp-pg{min-width:0}}
@media(max-width:460px){#paper .agate{column-count:1}}
@media print{body>*:not(#paper){display:none!important}#paper{position:static;background:#fff}#paper .pp-bar{display:none}#paper .sheet{box-shadow:none;margin:0;max-width:none}}`;
let pages=[],cur=0,EV=null;
const stories=()=>{const k=TD();return (typeof STORIES!=='undefined'?STORIES:[]).filter(s=>s&&s.slug&&s.title&&s.body&&!(s.until&&s.until<k)&&!(s.date&&s.date>k)).slice().sort((a,b)=>(b.date||'').localeCompare(a.date||''))};
const para=(b,dc)=>{const o=[];let first=true;for(const p of b){if(typeof p!=='string'||p.startsWith('@go ')||p.startsWith('= '))continue;
 if(p.startsWith('## ')){o.push('<h5>'+H(p.slice(3))+'</h5>');continue}
 if(p.startsWith('#T ')){try{const t=JSON.parse(p.slice(3));o.push('<table>'+(t.title?'<caption>'+H(t.title)+'</caption>':'')+(t.head?'<tr>'+t.head.map(h=>'<th>'+H(h)+'</th>').join('')+'</tr>':'')+(t.rows||[]).map(r=>'<tr>'+r.map(c=>'<td>'+H(c)+'</td>').join('')+'</tr>').join('')+'</table>')}catch(_){}continue}
 if(p.startsWith('> ')){o.push('<p><i>'+H(p.slice(2))+'</i></p>');continue}
 o.push('<p'+(first&&dc?' class="dc"':'')+'>'+H(p)+'</p>');first=false}return o.join('')};
const words=b=>b.filter(p=>typeof p==='string'&&!/^(## |#T |@go |= )/.test(p));
const teaser=(s,n)=>{const w=words(s.body);let out=[],c=0;for(const p of w){out.push(p);c+=p.length;if(c>n)break}return out};
const by=s=>'<div class="by">By '+H(SITE())+(s.date?' · '+H(SHORT(s.date)):'')+'</div>';
const top=d=>{const n=EV?EV.filter(e=>e.date===d).length:0;return `<div class="ear"><div class="ppbox"><b>Today in ${H(PLACE())}</b>${n?n.toLocaleString()+' events on the calendar. Listings, Page C1.':'Event listings, Page C1.'}</div><div class="flag">${(()=>{const im=document.querySelector('header.mast img');return im?'<img src="'+H(im.getAttribute('src'))+'" alt="'+H(SITE())+'">':'<div class="nm">'+H(SITE())+'</div>'})()}</div><div class="ppbox"><b>Inside</b>Arts &amp; Entertainment, B1<br>Holiday Guide, D1</div></div><div class="dl"><span>${H(LONG(d))}</span><span>${H(PLACE())} Edition</span><span>${H(location.hostname.replace(/^www\./,''))}</span></div>`};
const ph=(s)=>s.img?`<figure><img src="${H(s.img)}" alt="${H(s.imgAlt||'')}"><figcaption>${H(s.imgAlt||s.title)}</figcaption></figure>`:'';
const sh=(name,pg)=>`<div class="sh"><b>${H(name)}</b><span>${H(SITE())} · ${H(LONG(TD()))} · Page ${H(pg)}</span></div>`;
const foot=pg=>`<div class="ft"><span>${H(SITE())}</span><span>Page ${H(pg)}</span></div>`;
function build(){
 const S=stories(),d=TD();pages=[];const jumps={};
 const NW=S.filter(s=>s.news).slice(0,2);const feat=S.filter(s=>!s.news);
 const lead=NW[0]||feat[0];const second=NW[1]||null;const rest=feat.filter(s=>s!==lead);
 const fold=rest.slice(0,3),briefs=rest.slice(3,9);
 let pgA=2;[lead,second,...fold].forEach(s=>{if(s)jumps[s.slug]='A'+(pgA++)});
 const jl=s=>`<div class="jump"><button class="jl" data-pp="${H(jumps[s.slug])}">Continued on Page ${H(jumps[s.slug])} ›</button></div>`;
 const hl=(window.H&&window.H.items)||[];
 let A1=top(d)+'<div class="fp"><div class="pplead">';
 if(lead)A1+=`<div class="kk">${H(SEC[lead.topic]||'Local')}</div><h2 class="hd">${H(lead.title)}</h2>${lead.dek?'<p class="dk">'+H(lead.dek)+'</p>':''}${by(lead)}${ph(lead)}<div class="txt c3">${teaser(lead,1400).map((p,i)=>'<p'+(i?'':' class="dc"')+'>'+H(p)+'</p>').join('')}</div>${jl(lead)}`;
 A1+='</div><div class="rail"><div class="idx"><b>Inside today</b>'+[['Front page news','A2'],['Arts & Entertainment','B1'],['Event listings','C1'],['Holiday Guide','D1']].map(([a,b])=>`<div data-pp="${b}"><span>${H(a)}</span><span>${b}</span></div>`).join('')+'</div><div class="kk">In brief</div>'+briefs.map(s=>`<div class="brief"><h4 class="hd">${H(s.title)}</h4><p>${H(s.dek||'')} <button class="jl" data-story="${H(s.slug)}">Read more ›</button></p></div>`).join('')+'</div></div>';
 if(second)A1+=`<div class="fold" style="grid-template-columns:minmax(0,1fr)"><div><div class="kk">${H(SEC[second.topic]||'Local')}</div><h2 class="hd" style="font-size:36px">${H(second.title)}</h2>${second.dek?'<p class="dk">'+H(second.dek)+'</p>':''}${by(second)}<div class="txt c3">${teaser(second,900).map((p,i)=>'<p'+(i?'':' class="dc"')+'>'+H(p)+'</p>').join('')}</div>${jl(second)}</div></div>`;
 if(fold.length)A1+='<div class="fold">'+fold.map(s=>`<div><div class="kk">${H(SEC[s.topic]||'Local')}</div><h3 class="hd">${H(s.title)}</h3>${by(s)}<div class="txt">${teaser(s,420).map(p=>'<p>'+H(p)+'</p>').join('')}</div>${jl(s)}</div>`).join('')+'</div>';
 pages.push({id:'A1',name:'Front Page',html:A1+foot('A1')});
 [lead,second,...fold].forEach(s=>{if(!s)return;const pg=jumps[s.slug];pages.push({id:pg,name:'Front Page News',html:sh('News',pg)+`<div class="kk">${H(SEC[s.topic]||'Local')} · Continued from Page A1</div><h2 class="hd">${H(s.title)}</h2>${s.dek?'<p class="dk">'+H(s.dek)+'</p>':''}${by(s)}<div class="txt c3">${para(s.body,true)}</div>${(s.sources&&s.sources.length)?'<div class="by" style="border:0;margin-top:10px">Sources: '+s.sources.map(x=>'<a class="jl" href="'+H(x.url)+'" target="_blank" rel="noopener">'+H(x.outlet)+'</a>').join(' · ')+'</div>':''}<div class="jump"><button class="jl" data-pp="A1">‹ Back to the front page</button> · <button class="jl" data-story="${H(s.slug)}">Open this article on the website ›</button></div>`+foot(pg)})});
 // B section: arts
 const arts=S.filter(s=>/music|stage|culture/.test(s.topic)&&!fold.includes(s)&&s!==lead).slice(0,7);let bp=1;
 for(let i=0;i<arts.length;i+=3){const ch=arts.slice(i,i+3),pg='B'+(bp++);const [a,...o]=ch;
  pages.push({id:pg,name:'Arts & Entertainment',html:sh('Arts & Entertainment',pg)+`<div class="kk">${H(a.topic==='music'?'Music':a.topic==='stage'?'On Stage':'Culture')}</div><h2 class="hd">${H(a.title)}</h2>${a.dek?'<p class="dk">'+H(a.dek)+'</p>':''}${by(a)}${ph(a)}<div class="txt c3">${para(a.body,true)}</div>`+(o.length?'<div class="fold" style="grid-template-columns:repeat('+o.length+',minmax(0,1fr))">'+o.map(s=>`<div><h3 class="hd">${H(s.title)}</h3>${by(s)}<div class="txt c2">${para(s.body)}</div></div>`).join('')+'</div>':'')+foot(pg)})}
 // C: listings
 if(EV){const days=[0,1,2].map(n=>{const t=new Date(d+'T12:00:00');t.setDate(t.getDate()+n);return t.toLocaleDateString('en-CA')});
  const CAT={live:'Live music',rock:'Live music',jazz:'Live music',classical:'Classical',theater:'Theater & comedy',film:'Film',arts:'Art & museums',family:'Family',community:'Community',talks:'Talks'};
  let h='';for(const dd of days){const L=EV.filter(e=>e.date===dd&&CAT[e.genre]);if(!L.length)continue;h+='<div class="day">'+H(LONG(dd))+'</div>';const g={};L.forEach(e=>{(g[CAT[e.genre]]=g[CAT[e.genre]]||[]).push(e)});
   for(const c of Object.keys(g)){h+='<div class="cat">'+H(c)+'</div>';const seen=new Set();g[c].forEach(e=>{const k=(e.artists||'')+e.venue;if(seen.has(k))return;seen.add(k);h+='<p><b>'+H(e.artists)+'</b>'+(e.time?', '+H(e.time):'')+'. '+H(e.venue||'')+(e.hood&&e.hood!==e.venue?', '+H(e.hood):'')+(e.price?'. '+H(e.price):'')+'.</p>'})}}
  pages.push({id:'C1',name:'Event Listings',html:sh('Event Listings',"C1")+'<div class="agate">'+h+'</div>'+foot('C1')})}
 // D: holiday
 if(window.__ppHol&&window.__ppHol.sections){const G=window.__ppHol;let h='';G.sections.forEach(s=>{h+='<div class="day">'+H(s.label)+'</div>';s.items.forEach(i=>{h+='<p><b>'+H(i.t)+'</b>. '+H(i.when||'')+(i.time?', '+H(i.time):'')+'. '+H(i.where||'')+(i.town&&i.town!==i.where?', '+H(i.town):'')+(i.price?'. '+H(i.price):'')+'.</p>'})});
  pages.push({id:'D1',name:'Holiday Guide',html:sh('Holiday Guide','D1')+'<div class="agate">'+h+'</div>'+foot('D1')})}
}
function show(){const P=document.getElementById('paper');const p=pages[cur];P.querySelector('.sheet').innerHTML=p.html;P.querySelector('.pp-pg').textContent='Page '+p.id+' · '+(cur+1)+' of '+pages.length;P.scrollTop=0}
async function open(){
 if(!document.getElementById('ppCss')){const st=document.createElement('style');st.id='ppCss';st.textContent=css;document.head.appendChild(st)}
 try{if(!EV){const j=await fetch('data/cal.json',{cache:'no-cache'}).then(r=>r.json());EV=j.events||[]}}catch(_){EV=[]}
 try{if(!window.__ppHol){window.__ppHol=await fetch('data/holiday.json',{cache:'no-cache'}).then(r=>r.ok?r.json():null)}}catch(_){}
 build();cur=0;
 let P=document.getElementById('paper');if(!P){P=document.createElement('div');P.id='paper';P.setAttribute('role','dialog');P.setAttribute('aria-label','Newspaper mode');
  P.innerHTML='<div class="pp-bar"><button class="pp-p">‹ Previous page</button><span class="pp-pg"></span><button class="pp-n">Next page ›</button><button class="pp-x">Close newspaper ✕</button></div><div class="sheet"></div>';document.body.appendChild(P);
  P.addEventListener('click',e=>{const t=e.target.closest('button,[data-pp]');if(!t)return;
   if(t.classList.contains('pp-x'))return close();if(t.classList.contains('pp-p')){cur=(cur-1+pages.length)%pages.length;return show()}if(t.classList.contains('pp-n')){cur=(cur+1)%pages.length;return show()}
   if(t.dataset.pp){const k=pages.findIndex(p=>p.id===t.dataset.pp);if(k>=0){cur=k;show()}return}
   if(t.dataset.story){e.preventDefault();e.stopPropagation();close();try{STATE.story=t.dataset.story;STATE.prev='front';STATE.view='read';render();scrollTo(0,0)}catch(_){location.href='?story='+t.dataset.story}}});
  addEventListener('keydown',e=>{if(!document.getElementById('paper')||document.getElementById('paper').hidden)return;if(e.key==='Escape')close();if(e.key==='ArrowRight'){cur=(cur+1)%pages.length;show()}if(e.key==='ArrowLeft'){cur=(cur-1+pages.length)%pages.length;show()}})}
 P.hidden=false;document.documentElement.style.overflow='hidden';show()}
function close(){const P=document.getElementById('paper');if(P)P.hidden=true;document.documentElement.style.overflow=''}
window.openNewspaper=open;
const btn=()=>{const h=document.querySelector('header.mast');if(!h||document.getElementById('paperBtn'))return;const b=document.createElement('button');b.id='paperBtn';b.type='button';b.textContent='Newspaper Mode';b.addEventListener('click',open);h.appendChild(b)};
btn();addEventListener('DOMContentLoaded',btn);
})();

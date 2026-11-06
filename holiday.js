/* Holiday guide tab: data/holiday.json holds the picks; past events drop off on their own. The tab goes away after the guide's last day. */
(function(){
 const X=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
 const today=()=>new Date().toLocaleDateString('en-CA',{timeZone:'America/New_York'});
 let G=null,asked=false;
 function load(){if(asked)return;asked=true;fetch('data/holiday.json?'+Math.floor(Date.now()/6e5),{cache:'no-store'}).then(r=>r.ok?r.json():null).then(j=>{if(!j)return;G=j;if(j.through&&today()>j.through){const b=document.querySelector('#nav [data-go="holiday"]');if(b)b.remove()}if(typeof STATE!=='undefined'&&STATE.view==='holiday')render()}).catch(()=>{})}
 const MO=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
 const dbox=i=>{const d=(i.start||'').split('-');return d.length<3?'':'<span class="hg-d"><small>'+MO[+d[1]-1]+'</small>'+(+d[2])+'</span>'};
 const card=i=>'<div class="hg-row">'+dbox(i)+'<div class="hg-body"><b>'+(i.url?'<a href="'+X(i.url)+'" target="_blank" rel="noopener">'+X(i.t)+'</a>':X(i.t))+'</b>'+
  '<span class="hg-when">'+X(i.when)+(i.time?' · '+X(i.time):'')+'</span>'+
  '<span class="hg-where">'+X(i.where)+(i.town&&i.town!==i.where?', '+X(i.town):'')+'</span>'+
  (i.note?'<p class="hg-note">'+X(i.note)+'</p>':'')+(i.more?'<p class="hg-note hg-more">'+X(i.more)+'</p>':'')+
  ((i.addr||i.price)?'<span class="hg-facts">'+(i.addr?'<span class="hg-fact"><em>Address</em> '+X(i.addr)+'</span>':'')+(i.price?'<span class="hg-fact"><em>Cost</em> '+X(i.price)+'</span>':'')+'</span>':'')+
  (i.url?'<a class="hg-link" href="'+X(i.url)+'" target="_blank" rel="noopener">Event website ›</a>':'')+'</div></div>';
 window.vHoliday=function(){load();if(!G)return '<section class="box hg"><div class="hg-head"><h2>Holiday Guide</h2><p>Loading…</p></div></section>';
  const d=today();const secs=(G.sections||[]).map(s=>({label:s.label,items:(s.items||[]).filter(i=>(i.end||i.start||'')>=d)})).filter(s=>s.items.length);
  const RX=/holiday|christmas|santa|tree light|nutcracker|messiah|carol|new year|festival of lights/i;
  const st=(typeof STORIES!=='undefined'?STORIES:[]).slice().sort((a,b)=>(b.date||'').localeCompare(a.date||'')).filter(x=>x&&x.slug&&RX.test(x.title||'')&&(!x.until||x.until>=d)&&x.topic!=='crime').slice(0,10);
  return '<section class="box hg"><div class="hg-head"><h2>'+X(G.title)+'</h2><p>'+X(G.intro)+'</p></div>'+
   (st.length?'<details class="hg-sec" open><summary>Holiday Articles <span>'+st.length+' articles</span></summary><div class="hg-list">'+st.map(x=>'<button type="button" class="hg-row hg-story" data-story="'+X(x.slug)+'"><div class="hg-body"><b>'+X(x.title)+'</b><p class="hg-note">'+X(x.dek||'')+'</p><span class="hg-link">Read the article ›</span></div></button>').join('')+'</div></details>':'')+
   secs.map((s,k)=>'<details class="hg-sec"'+(k?'':' open')+'><summary>'+X(s.label)+' <span>'+s.items.length+' events</span></summary><div class="hg-list">'+s.items.map(card).join('')+'</div></details>').join('')+
   '<p class="hg-foot">Dates, times and prices come from each organizer’s listing. Check before you go.</p></section>'};
 const css=document.createElement('style');css.id='holidayCss';css.textContent=`
#nav>[data-go="holiday"]{order:-5!important;color:#fff!important;background:#14532d!important;border-color:#e8c15a!important}
.hg{--hg-gold:#e8c15a;border-top-color:#b5001a!important;padding-bottom:16px}
.hg-head{padding:22px 18px 8px}.hg-head h2{margin:0 0 6px;font:700 clamp(26px,5vw,40px)/1.1 "Playfair Display",Georgia,serif;color:var(--hg-gold)}.hg-head p{margin:0;font:400 16px/1.45 Georgia,serif;color:#f1e9d6}
.hg-sec{margin:10px 18px 0;border:1px solid #e8c15a44;border-radius:6px;background:#ffffff06}
.hg-sec>summary{list-style:none;cursor:pointer;display:flex;justify-content:space-between;align-items:center;gap:10px;padding:13px 15px;font:800 15px/1.2 "Libre Franklin",system-ui,sans-serif;letter-spacing:.08em;text-transform:uppercase;color:var(--hg-gold)}
.hg-sec>summary::-webkit-details-marker{display:none}.hg-sec>summary::after{content:"▾";font-size:16px;transition:transform .2s}.hg-sec[open]>summary::after{transform:rotate(180deg)}
.hg-sec>summary span{margin-left:auto;font:600 13px/1 "Libre Franklin",system-ui,sans-serif;letter-spacing:0;text-transform:none;color:#d9cfb8}
.hg-list{border-top:1px solid #e8c15a33}
.hg .hg-row{display:flex!important;box-shadow:none!important;border-radius:0!important;gap:14px;width:100%;padding:14px 15px;border:0;border-bottom:1px solid #ffffff14!important;background:none!important;color:#f6efdf!important;text-align:left!important;margin:0!important;font:inherit}
.hg .hg-row:last-child{border-bottom:0}.hg-story{cursor:pointer}.hg .hg-story:hover{background:#ffffff0d!important}
.hg-d{flex:0 0 52px;height:56px;display:flex;flex-direction:column;align-items:center;justify-content:center;border:1px solid #e8c15a66;border-radius:5px;background:#14532d;font:700 22px/1 "Playfair Display",Georgia,serif;color:#fff}
.hg-d small{font:800 11px/1.2 "Libre Franklin",system-ui,sans-serif;letter-spacing:.1em;text-transform:uppercase;color:var(--hg-gold)}
.hg-body{flex:1;min-width:0;display:flex;flex-direction:column;gap:4px}
.hg-body b{font:700 19px/1.25 "Playfair Display",Georgia,serif;color:#fff}.hg-body b a{color:#fff!important;text-decoration:none}.hg-body b a:hover{text-decoration:underline}
.hg-when{font:800 13px/1.3 "Libre Franklin",system-ui,sans-serif;letter-spacing:.04em;text-transform:uppercase;color:var(--hg-gold)}
.hg-where{font:600 15px/1.35 "Libre Franklin",system-ui,sans-serif;color:#d9cfb8}
.hg-note{margin:4px 0 0;font:400 16px/1.55 Georgia,serif;color:#ece4d1;max-width:70ch}.hg-more{color:#d6ccb6}
.hg-facts{display:flex;flex-wrap:wrap;gap:4px 16px;margin-top:4px}.hg-fact{font:600 14px/1.4 "Libre Franklin",system-ui,sans-serif;color:#efe6d2}.hg-fact em{font-style:normal;font-weight:800;font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--hg-gold);margin-right:5px}
.hg-link{align-self:flex-start;margin-top:6px;font:700 14px/1.3 "Libre Franklin",system-ui,sans-serif;color:var(--hg-gold)!important;text-decoration:none}.hg-link:hover{text-decoration:underline}
@media(max-width:560px){.hg-sec{margin:10px 8px 0}.hg-row{gap:10px;padding:12px}.hg-d{flex-basis:44px;height:50px;font-size:19px}}
.hg-foot{margin:14px 18px 0;font:italic 13px/1.4 Georgia,serif;color:#b9b09c}`;document.head.appendChild(css);
 load();
})();

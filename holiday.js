/* Holiday guide tab: data/holiday.json holds the picks; past events drop off on their own. The tab goes away after the guide's last day. */
(function(){
 const X=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
 const today=()=>new Date().toLocaleDateString('en-CA',{timeZone:'America/New_York'});
 let G=null,asked=false;
 function load(){if(asked)return;asked=true;fetch('data/holiday.json?'+Math.floor(Date.now()/6e5),{cache:'no-store'}).then(r=>r.ok?r.json():null).then(j=>{if(!j)return;G=j;if(j.through&&today()>j.through){const b=document.querySelector('#nav [data-go="holiday"]');if(b)b.remove()}if(typeof STATE!=='undefined'&&STATE.view==='holiday')render()}).catch(()=>{})}
 const card=i=>{const inner='<span class="hg-when">'+X(i.when)+(i.time?' · '+X(i.time):'')+'</span><b>'+X(i.t)+'</b><span class="hg-where">'+X(i.where)+(i.town&&i.town!==i.where?', '+X(i.town):'')+'</span>'+(i.note?'<span class="hg-note">'+X(i.note)+'</span>':'');
  return i.url?'<a class="hg-card" href="'+X(i.url)+'" target="_blank" rel="noopener">'+inner+'</a>':'<div class="hg-card">'+inner+'</div>'};
 window.vHoliday=function(){load();if(!G)return '<section class="box hg"><div class="hg-head"><h2>Holiday Guide</h2><p>Loading…</p></div></section>';
  const d=today();const secs=(G.sections||[]).map(s=>({label:s.label,img:s.img,alt:s.alt,items:(s.items||[]).filter(i=>(i.end||i.start||'')>=d)})).filter(s=>s.items.length);
  const RX=/holiday|christmas|santa|tree light|nutcracker|messiah|carol|new year/i;
  const st=(typeof STORIES!=='undefined'?STORIES:[]).filter(x=>x&&x.slug&&RX.test(x.title||'')&&(!x.until||x.until>=d)&&x.topic!=='crime').slice(0,6);
  return '<section class="box hg"><div class="hg-head"><h2>'+X(G.title)+'</h2><p>'+X(G.intro)+'</p></div>'+
   (st.length?'<div class="hg-sec"><h3>Holiday Stories</h3><div class="hg-grid">'+st.map(x=>'<button type="button" class="hg-card hg-story" data-story="'+X(x.slug)+'"><b>'+X(x.title)+'</b><span class="hg-note">'+X(x.dek||'')+'</span></button>').join('')+'</div></div>':'')+
   secs.map(s=>'<div class="hg-sec"><h3>'+X(s.label)+'</h3>'+(s.img?'<img class="hg-art" src="'+X(s.img)+'" alt="'+X(s.alt||'')+'" loading="lazy">':'')+'<div class="hg-grid">'+s.items.map(card).join('')+'</div></div>').join('')+
   '<p class="hg-foot">Dates and times come from each organizer’s listing. Check before you go.</p></section>'};
 const css=document.createElement('style');css.id='holidayCss';css.textContent=`
#nav>[data-go="holiday"]{order:-5!important;color:#fff!important;background:#14532d!important;border-color:#e8c15a!important}
.hg{--hg-gold:#e8c15a;border-top-color:#b5001a!important;padding-bottom:16px}
.hg-head{padding:22px 18px 8px}.hg-head h2{margin:0 0 6px;font:700 clamp(26px,5vw,40px)/1.1 "Playfair Display",Georgia,serif;color:var(--hg-gold)}.hg-head p{margin:0;font:400 16px/1.45 Georgia,serif;color:#f1e9d6}
.hg-sec{padding:14px 18px 2px}.hg-sec h3{margin:0 0 10px;padding-bottom:6px;border-bottom:1px solid #e8c15a55;font:800 13px/1.2 "Libre Franklin",system-ui,sans-serif;letter-spacing:.14em;text-transform:uppercase;color:var(--hg-gold)}
.hg-art{display:block;width:100%;height:auto;aspect-ratio:3/2;margin:0 0 12px;border-radius:6px;border:1px solid #e8c15a55}
.hg-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,260px),1fr));gap:10px}
.hg-card{display:flex;flex-direction:column;gap:5px;min-width:0;padding:12px 13px;border:1px solid #e8c15a33;border-left:3px solid #b5001a;border-radius:6px;background:#ffffff0a;color:#f6efdf!important;text-align:left;text-decoration:none!important;font:inherit;cursor:pointer}
a.hg-card:hover,.hg-story:hover{background:#ffffff16}
.hg-card b{font:700 16px/1.25 "Playfair Display",Georgia,serif;color:#fff}.hg-when{font:800 11px/1.3 "Libre Franklin",system-ui,sans-serif;letter-spacing:.06em;text-transform:uppercase;color:var(--hg-gold)}
.hg-where{font:600 13px/1.3 "Libre Franklin",system-ui,sans-serif;color:#d9cfb8}.hg-note{font:400 13.5px/1.4 Georgia,serif;color:#e7dfcc}
.hg-story{border-left-color:var(--hg-gold)}.hg-foot{margin:14px 18px 0;font:italic 12px/1.4 Georgia,serif;color:#b9b09c}`;document.head.appendChild(css);
 load();
})();

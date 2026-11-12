/* "On sale soon" box on the Rhode Island Event Calendar: Rhode Island shows whose public sale or a
   presale starts in the next three weeks. Data: data/tm.json (tools/events/ticketmaster.py, daily).
   Shows nothing until that file exists. Tickets link to Ticketmaster. Compact, no big boxes. */
(function(){
 let D=null,asked=false;
 const X=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
 const U=u=>/^https:\/\//i.test(String(u||''))?X(u):'#';
 const when=s=>{const d=new Date(s);return isNaN(d)?'':d.toLocaleString('en-US',{timeZone:'America/New_York',weekday:'short',month:'short',day:'numeric',hour:'numeric',minute:'2-digit'})};
 const day=s=>{const d=new Date(String(s).slice(0,10)+'T12:00:00');return isNaN(d)?s:d.toLocaleDateString('en-US',{month:'short',day:'numeric'})};
 function load(){if(asked)return;asked=true;fetch('data/tm.json?'+Math.floor(Date.now()/6e5)).then(r=>r.ok?r.json():null).then(j=>{if(j){D=j;paint()}}).catch(()=>{})}
 function paint(){
  if(typeof STATE==='undefined'||STATE.view!=='cal'){return}
  const view=document.getElementById('view');if(!view)return;
  const old=view.querySelector('#tmSoon');if(old)old.remove();
  const now=new Date().toISOString();
  const L=(D&&D.onsale||[]).filter(x=>x.sale>now).slice(0,12);if(!L.length)return;
  const box=document.createElement('section');box.id='tmSoon';
  box.innerHTML='<h3>On sale soon</h3><ul>'+L.map(x=>'<li><a href="'+U(x.url)+'" target="_blank" rel="noopener"><b>'+X(x.name)+'</b></a> <span class="tm-s">'+X(x.venue)+(x.town?', '+X(x.town):'')+' · show '+X(day(x.date))+'</span><br><span class="tm-k">'+(x.kind==='presale'?'Presale':'Tickets on sale')+' '+X(when(x.sale))+'</span></li>').join('')+'</ul><p class="tm-s">From Ticketmaster. Sale times can change; check the ticket page.</p>';
  const intro=view.querySelector('.intro');(intro&&intro.parentNode?intro.parentNode.insertBefore(box,intro.nextSibling):view.prepend(box))}
 if(typeof window.render==='function'){const r0=window.render;window.render=function(){const out=r0.apply(this,arguments);try{if(STATE.view==='cal'){load();paint()}}catch(_){}return out}}
 const css=document.createElement('style');css.textContent=`
#tmSoon{margin:8px 0 12px;padding:6px 0;border-top:1px solid #D4ECF533;border-bottom:1px solid #D4ECF533}
#tmSoon h3{margin:0 0 4px;font-size:1em}#tmSoon ul{margin:0;padding-left:18px}#tmSoon li{margin:3px 0}
#tmSoon a{color:#D4ECF5}#tmSoon .tm-s{color:#B9CAD6;font-size:.9em}#tmSoon .tm-k{color:#E9C46A;font-size:.9em}`;document.head.appendChild(css);
 try{if(typeof STATE!=='undefined'&&STATE.view==='cal'){load()}}catch(_){}
})();

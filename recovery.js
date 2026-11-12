/* Recovery & Support Meetings page: its own section, kept out of the activities lists */
(function(){
(function(){if(document.getElementById('rcCss'))return;const s=document.createElement('style');s.id='rcCss';s.textContent='.rc-y{font-style:normal;font-weight:600}.rc-y-closed{color:#E9C46A}.rc-y-online,.rc-y-hybrid{color:#9FD8B5}.rc-x{margin:6px 0 0;font-size:12px;line-height:1.4;opacity:.8}body h2.room.rc-title{font:700 18px/1.2 "Libre Franklin",system-ui,sans-serif!important;letter-spacing:0!important;text-transform:none!important;text-shadow:none!important;animation:none!important;margin:4px 0 6px!important}body .intro.rc-intro{padding:5px 8px!important;box-shadow:none!important;animation:none!important;border-radius:3px!important;border-left-width:2px!important}body .intro.rc-intro b{display:none!important}body .intro.rc-intro p{font:400 13px/1.4 system-ui,sans-serif!important;font-size:13px!important;line-height:1.4!important}#recov .rc-bar{gap:8px!important;margin:4px 0!important;font-size:13px}#recov .rc-bar select{padding:3px 6px;font-size:13px}#recov .rc-c{font:600 12px/1 system-ui,sans-serif!important}#recov .rc-c b{font-size:13px!important}#recov .rc-r{gap:8px!important;padding:4px 2px!important;align-items:baseline}#recov .rc-t{width:78px!important;font:600 12px/1.3 system-ui,sans-serif!important}#recov .rc-n b{display:inline!important;font:600 14px/1.3 system-ui,sans-serif!important;margin-right:6px}#recov .rc-n small{display:inline!important;font-size:12px!important}#recov .rc-h{margin:10px 0 4px!important;font:700 14px/1.2 system-ui,sans-serif!important}#recov .rc-o{font-size:13px!important;line-height:1.45!important;padding-left:16px!important}#recov .rc-e{font-size:13px}';(document.head||document.documentElement).appendChild(s)})();
const H=x=>String(x==null?'':x).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const UH=u=>{const t=String(u==null?'':u);return /^(javascript|data|vbscript):/i.test(t.replace(/[\s\x00-\x1f]/g,''))?'#':H(t)}; // links: never allow script URLs from outside data
const DAYS=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'],DN=['sun','mon','tue','wed','thu','fri','sat'];
const TZ='America/New_York',ymd=d=>d.toLocaleDateString('en-CA',{timeZone:TZ});
function mins(t){const s=String(t||'');const m=s.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm|noon)?/i);if(!m)return 9999;let ap=m[3];if(!ap){const n=s.slice(m.index+m[0].length).match(/(am|pm)/i);if(!n)return 9999;ap=n[1];const e=s.slice(m.index+m[0].length).match(/(\d{1,2})(?::\d{2})?\s*(am|pm)/i);if(e&&/pm/i.test(e[2])&&+e[1]%12<+m[1]%12)ap='am'}let h=+m[1]%12;if(/pm/i.test(ap))h+=12;if(/noon/i.test(ap))h=12;return h*60+(+m[2]||0)}
const nt=s=>String(s||'').toLowerCase().replace(/\([^)]*\)/g,'').replace(/[^a-z0-9]+/g,' ').trim();
const key=r=>r.day+'|'+mins(r.t)+'|'+nt(r.n)+'|'+nt(r.v||r.h);
const FMT={open:'Open',closed:'Closed (members only)',online:'Online',hybrid:'Hybrid',family:'Family'};
const MEET=/\b(aa|na|al-?anon|alateen|alcoholics|narcotics|recovery|support group|support meeting|grief|bereave|caregiver|smart recovery|12[- ]step|sober|nar-?anon|codependen|overeaters|gamblers|dharma|meeting)\b/i,NOTMEET=/pantry|food|appointment|distribution|clinic|vaccin|screening/i;
let ROWS=null,ORGS=[],EXP=[],ST={town:'',day:new Date(new Date().toLocaleString('en-US',{timeZone:TZ})).getDay()};
function wk(w){return w==='every'||!w?'Every':w==='last'?'Last':w==='1st'?'1st':w==='2nd'?'2nd':w==='3rd'?'3rd':w==='4th'?'4th':w}
Promise.all([
 fetch('data/meetings.json',{cache:'no-cache'}).then(r=>r.ok?r.json():[]).catch(()=>[]),
 fetch('data/cal.json',{cache:'no-cache'}).then(r=>r.json()).catch(()=>({events:[]})),
 fetch('data/directory.json',{cache:'no-cache'}).then(r=>r.json()).catch(()=>({items:[]}))
]).then(([M,C,D])=>{
 const today=ymd(new Date()),lim=ymd(new Date(Date.now()+7*864e5));
 const rows=[],seen=new Set();EXP=[];
 M.forEach(m=>{const r={day:DN.indexOf(m.d),w:m.w,t:m.t,n:m.n,v:m.v,h:m.h,u:m.u,y:m.y||''};if(m.until&&m.until<today){EXP.push(r);return}const k=key(r);if(seen.has(k))return;seen.add(k);rows.push(r)});
 (C.events||[]).filter(e=>e.genre==='support'&&e.date>=today&&e.date<lim&&MEET.test(e.artists||'')&&!NOTMEET.test(e.artists||'')).forEach(e=>{const d=new Date(e.date+'T12:00:00').getDay();const r={day:d,w:'every',t:e.time,n:e.artists,v:e.venue,h:e.hood,u:e.url,date:e.date,y:''};const k=key(r);if(seen.has(k))return;seen.add(k);rows.push(r)});
 ROWS=rows;ORGS=(D.items||[]).filter(x=>/recovery and support/i.test(x.c||'')&&!/^Recovery and support meetings in /.test(x.n));
 if(typeof STATE!=='undefined'&&STATE.view==='recovery')try{render()}catch(_){}
});
window.vRecovery=function(){
 if(!ROWS)return '<h2 class="room rc-title">Recovery &amp; Support Meetings</h2><p>Loading…</p>';
 const towns=[...new Set(ROWS.map(r=>r.h).filter(Boolean))].sort();
 const L=ROWS.filter(r=>r.day===ST.day&&(!ST.town||r.h===ST.town)).sort((a,b)=>mins(a.t)-mins(b.t));
 const ex=EXP.filter(r=>r.day===ST.day&&(!ST.town||r.h===ST.town));
 const exNote=ex.length?'<p class="rc-x">'+ex.length+' East Bay Recovery Center meeting'+(ex.length>1?'s are':' is')+' not shown: the center has only posted its October 2026 schedule. Call the center to confirm this month&#39;s times.</p>':'';
 const rows=L.map(r=>{const u=/^https?:/.test(r.u||'')?r.u:'';return '<a class="rc-r"'+(u?' href="'+UH(u)+'" target="_blank" rel="noopener"':'')+'><span class="rc-t">'+H(r.t||'Time TBA')+'</span><span class="rc-n"><b>'+H(r.n)+'</b><small>'+H([r.v,r.h].filter(Boolean).join(' · '))+(r.w&&r.w!=='every'?' · '+H(wk(r.w))+' '+DAYS[r.day]+' of the month':'')+(FMT[r.y]?' · <i class="rc-y rc-y-'+H(r.y)+'">'+FMT[r.y]+'</i>':'')+'</small></span></a>'}).join('');
 const orgs=ORGS.map(o=>'<li><b>'+H(o.n)+'</b>'+(o.p?' · <a href="tel:'+H(o.p.replace(/[^0-9+]/g,''))+'">'+H(o.p)+'</a>':'')+(o.w?' · <a href="'+UH(o.w)+'" target="_blank" rel="noopener">Website</a>':'')+'</li>').join('');
 return '<h2 class="room rc-title">Recovery &amp; Support Meetings</h2><div class="intro rc-intro"><b>Meetings and help lines</b><p>Recovery, grief, caregiver and health support groups, taken from each group\'s own published meeting list. Lists change often, so confirm with the group before you go. In an emergency call 911; for a mental health crisis call or text 988.</p></div>'+
 '<div id="recov"><div class="rc-bar"><label>Day <select id="rcDay">'+DAYS.map((d,i)=>'<option value="'+i+'"'+(i===ST.day?' selected':'')+'>'+d+'</option>').join('')+'</select></label>'+(towns.length>1?'<label>Town <select id="rcTown"><option value="">All towns</option>'+towns.map(t=>'<option'+(t===ST.town?' selected':'')+'>'+H(t)+'</option>').join('')+'</select></label>':'')+'<span class="rc-c"><b>'+L.length+'</b> meetings</span></div>'+
 '<div class="rc-l">'+(rows||'<p class="rc-e">No meetings listed for this day and town.</p>')+'</div>'+exNote+'<p class="rc-x">Open: anyone may attend. Closed: only for people who want to stop drinking or using. Family: for relatives and friends.</p>'+(orgs?'<h3 class="rc-h">Help lines and organizations</h3><ul class="rc-o">'+orgs+'</ul>':'')+'</div>'};
document.addEventListener('change',e=>{if(e.target.id==='rcDay'){ST.day=+e.target.value;render()}else if(e.target.id==='rcTown'){ST.town=e.target.value;render()}});
function addBtn(){return;/* now reached through Help > Recovery meetings */const nav=document.getElementById('nav');if(!nav||nav.querySelector('[data-go="recovery"]'))return;const b=document.createElement('button');b.className='nb';b.dataset.go='recovery';b.type='button';b.textContent='Recovery & Support Meetings';nav.appendChild(b)}
addBtn();document.addEventListener('DOMContentLoaded',addBtn);
})();

/* Rhode Island Grants & Free Money: grants, scholarships, cash assistance, reimbursements and benefits.
   Data: data/grants.json (research snapshot reviewed Nov. 12, 2026). Closed, suspended and between-cycle
   programs go to a separate watchlist; advertised deadlines that pass move there automatically. No boxes. */
(function(){
 let D=null,asked=false,err=false;
 const st={q:'',cat:'',kind:'',stat:''};
 const X=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
 const uniq=a=>[...new Set(a.filter(Boolean))].sort((x,y)=>x.localeCompare(y));
 const today=()=>{const n=new Date();return n.getFullYear()+'-'+String(n.getMonth()+1).padStart(2,'0')+'-'+String(n.getDate()).padStart(2,'0')};
 const day=s=>new Date(s+'T12:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});
 const WATCH=['closed','suspended','between_cycles','upcoming'];
 // short reader-facing status labels: [label, colour class, filter group]
 const SL={open_deadline:['Open, deadline posted','gr-g','open'],seasonal_open:['Open this season','gr-g','open'],rolling:['Apply any time','gr-g','open'],
  school_cycle:['Through your school’s aid cycle','gr-b','check'],mixed_cycles:['Several cycles: check each award','gr-b','check'],tax_filing:['Claim on your tax return','gr-b','check'],enrollment_rules:['During enrollment periods','gr-b','check'],
  confirm_intake:['Confirm it’s taking applications','gr-y','confirm'],fund_dependent:['Depends on available funds','gr-y','confirm'],verify_season:['Season not confirmed','gr-y','confirm'],
  closed:['Closed: watch for next round','gr-r','watch'],suspended:['Suspended','gr-r','watch'],between_cycles:['Between rounds','gr-r','watch'],upcoming:['Next round announced','gr-r','watch']};
 const tel=p=>p.replace(/(\+?1?[-. ]?\(?\d{3}\)?[-. ]?\d{3}[-. ]\d{4}(?: ext\. \d+)?|\b211\b)|([\w.+-]+@[\w-]+\.[\w.]+)/g,(m,ph,em)=>em?'<a href="mailto:'+em+'">'+em+'</a>':'<a href="tel:'+ph.replace(/ext.*/,'').replace(/[^0-9]/g,'')+'">'+ph+'</a>');
 const passed=g=>g.deadline&&g.deadline<today();
 const isWatch=g=>WATCH.includes(g.status)||passed(g);
 function load(){if(asked)return;asked=true;fetch('data/grants.json?v=20261112a').then(r=>{if(!r.ok)throw new Error(r.status);return r.json()}).then(j=>{j.items.forEach(g=>g._s=JSON.stringify([g.name,g.who,g.amount,g.type,g.conditions,g.note,g.kind]).toLowerCase());D=j;fill()}).catch(()=>{err=true;asked=false;fill()})}
 const q=()=>st.q.trim().toLowerCase();
 const match=g=>(st.cat===''||String(g.cat)===st.cat)&&(!st.kind||g.kind===st.kind)&&(!q()||g._s.includes(q()));
 const statOk=g=>!st.stat||(SL[g.status]||[])[2]===st.stat;
 function row(g){const s=passed(g)?['Deadline passed: watch for next round','gr-r']:SL[g.status]||[g.status,''];
  return '<tr><td><b>'+X(g.name)+'</b><br><span class="gr-s">'+X(g.kind)+' · '+X(g.type)+'</span></td>'
   +'<td>'+X(g.amount)+'</td>'
   +'<td>'+X(g.who)+(g.conditions?'<br><span class="gr-s">'+X(g.conditions)+'</span>':'')+(g.watch&&g.watch.length?'<br><span class="gr-w">Before you apply: '+X(g.watch.join('; '))+'</span>':'')+(g.source_issue?'<br><span class="gr-s gr-n">Sources disagree: '+X(g.source_issue)+'</span>':'')+'</td>'
   +'<td><span class="'+s[1]+'">'+X(s[0])+'</span>'+(g.deadline&&!passed(g)?'<br><b>Deadline '+X(day(g.deadline))+'</b>':'')+(g.note?'<br><span class="gr-s">'+X(g.note)+'</span>':'')
   +'<br><a href="'+X(g.url)+'" target="_blank" rel="noopener">Official page</a>'+(g.sources||[]).map((u,i)=>' · <a href="'+X(u)+'" target="_blank" rel="noopener">source '+(i+2)+'</a>').join('')+(g.contact?'<br><span class="gr-s">'+tel(X(g.contact))+'</span>':'')+'</td></tr>'}
 const table=list=>'<div class="gr-scroll"><table class="gr-t"><thead><tr><th>Program</th><th>Money</th><th>Who and conditions</th><th>Status and how to apply</th></tr></thead><tbody>'+list.map(row).join('')+'</tbody></table></div>';
 function fill(){const root=document.getElementById('grRoot');if(!root)return;const B=root.querySelector('#grBody');
  if(err){B.innerHTML='<p>Couldn’t load the list. <button type="button" id="grRetry">Retry</button></p>';return}
  if(!D){B.innerHTML='<p>Loading…</p>';return}
  const C=root.querySelector('#grCat');if(C.options.length<2)C.innerHTML='<option value="">All categories</option>'+D.categories.map((c,i)=>'<option value="'+i+'">'+X(c)+'</option>').join('');
  const K=root.querySelector('#grKind');if(K.options.length<2)K.innerHTML='<option value="">All kinds of money</option>'+uniq(D.items.map(g=>g.kind)).map(k=>'<option>'+X(k)+'</option>').join('');
  C.value=st.cat;K.value=st.kind;root.querySelector('#grStat').value=st.stat;
  const live=D.items.filter(g=>!isWatch(g)&&match(g)&&statOk(g)),watch=D.items.filter(g=>isWatch(g)&&match(g));
  const soon=D.items.filter(g=>g.deadline&&!passed(g)).sort((a,b)=>a.deadline.localeCompare(b.deadline));
  root.querySelector('#grCount').textContent=live.length+' available or to confirm · '+watch.length+' on the watchlist';
  let h='';
  if(!st.cat&&!st.kind&&!st.stat&&!q()&&soon.length)h+='<h3>Deadlines coming up</h3><ul class="gr-l">'+soon.map(g=>'<li><b>'+X(day(g.deadline))+'</b>: '+X(g.name)+' · '+X(g.amount)+'</li>').join('')+'</ul>';
  if(st.stat!=='watch'){
   D.categories.forEach((c,i)=>{const L=live.filter(g=>g.cat===i);if(L.length)h+='<h3>'+X(c)+' <span class="gr-s">('+L.length+')</span></h3>'+table(L)});
   if(!live.length)h+='<p>Nothing open matches. Try fewer filters.</p>'}
  if(watch.length&&(!st.stat||st.stat==='watch'))h+='<h3>Watchlist: closed, suspended or between rounds <span class="gr-s">('+watch.length+')</span></h3><p class="gr-s">Not taking applications as of the review. Listed so you can watch for the next round.</p>'+table(watch);
  if(!st.cat&&!st.kind&&!st.stat&&!q()&&D.held_out&&D.held_out.length)h+='<h3>Left out on purpose</h3><ul class="gr-l">'+D.held_out.map(x=>'<li><b>'+X(x.name)+'</b>: '+X(x.why)+' '+x.urls.map(u=>'<a class="gr-s" href="'+X(u)+'" target="_blank" rel="noopener">source</a>').join(' ')+'</li>').join('')+'</ul>';
  h+='<p class="gr-s"><button type="button" class="gr-copy" data-scope="all">Copy all</button> <button type="button" class="gr-copy" data-scope="shown">Copy what’s shown</button> <span id="grCopyMsg" role="status"></span> · <a href="data/grants.json" download="Rhode-Island-Grants-and-Free-Money.json">Download the data (JSON)</a></p>';
  B.innerHTML=h}
 function asText(list){return list.map(g=>{const s=passed(g)?'Deadline passed':(SL[g.status]||[g.status])[0];
  return [g.name,'Money: '+g.amount+' ('+g.kind+', '+g.type+')','Who: '+g.who,g.conditions?'Conditions: '+g.conditions:'',g.watch&&g.watch.length?'Before you apply: '+g.watch.join('; '):'','Status: '+s+(g.deadline?' · deadline '+g.deadline:'')+(g.note?' · '+g.note:''),g.contact?'Contact: '+g.contact:'','Official page: '+g.url].filter(Boolean).join('\n')}).join('\n\n')}
 function copy(t){const all=t.dataset.scope==='all',list=all?D.items:D.items.filter(g=>match(g)&&(isWatch(g)?(!st.stat||st.stat==='watch'):(st.stat!=='watch'&&statOk(g))));
  const txt='Rhode Island Grants & Free Money (Rhode Island Hurricane, reviewed '+D.as_of+')\nPublic records, verify when needed. Amounts are published caps, not guaranteed awards.\n\n'+asText(list);
  const msg=document.getElementById('grCopyMsg'),ok=()=>{msg.textContent='Copied '+list.length+' entries'},bad=()=>{msg.textContent='Copy didn’t work. Use Download the data instead.'};
  const fallback=()=>{try{const a=document.createElement('textarea');a.value=txt;a.setAttribute('readonly','');a.style.position='fixed';a.style.opacity='0';document.body.appendChild(a);a.select();const r=document.execCommand('copy');a.remove();r?ok():bad()}catch(e){bad()}};
  if(navigator.clipboard&&window.isSecureContext)navigator.clipboard.writeText(txt).then(ok,fallback);else fallback()}
 window.vGrants=function(){setTimeout(()=>{load();const r=document.getElementById('grRoot');if(r)r.querySelector('#grQ').value=st.q;fill()},0);
  return '<section class="box gr" id="grRoot"><h2>Rhode Island Grants &amp; Free Money</h2>'
   +'<p class="gr-s">Grants, scholarships, cash assistance, reimbursements, tax credits and benefits Rhode Islanders can apply for, reviewed Nov. 12, 2026: 114 programs, from student and business grants to public benefits. Not all are open cash grants: some pay bills or approved costs, some reimburse money you spend first, and some are claimed on a tax return.</p>'
   +'<p class="gr-note"><b>Public records, verify when needed.</b> Drawn from official government, college, grantmaker and program pages. Amounts are published caps or descriptions, not guaranteed awards, and eligibility is summarized: read the provider’s full rules, deadlines and available funds before applying. Nobody has been found eligible for anything here. Rhode Island Hurricane does not run these programs or take applications. Never pay someone to “get you a grant.”</p>'
   +'<div class="gr-f"><input type="search" id="grQ" placeholder="Search a program, need or group" aria-label="Search grants">'
   +'<select id="grCat" aria-label="Category"><option value="">All categories</option></select>'
   +'<select id="grKind" aria-label="Kind of money"><option value="">All kinds of money</option></select>'
   +'<select id="grStat" aria-label="Status"><option value="">Any status</option><option value="open">Open or apply any time</option><option value="check">Through school, tax return or cycles</option><option value="confirm">Confirm it’s taking applications</option><option value="watch">Watchlist only</option></select>'
   +'<button type="button" id="grClear">Clear</button> <span id="grCount" class="gr-s"></span></div>'
   +'<div id="grBody"></div></section>'};
 document.addEventListener('input',e=>{const t=e.target;if(!t.closest||!t.closest('#grRoot'))return;const m={grQ:'q',grCat:'cat',grKind:'kind',grStat:'stat'}[t.id];if(!m)return;st[m]=t.value;fill()});
 document.addEventListener('click',e=>{const t=e.target;if(!t.closest||!t.closest('#grRoot'))return;
  if(t.id==='grRetry'){err=false;load();fill()}else if(t.id==='grClear'){Object.assign(st,{q:'',cat:'',kind:'',stat:''});document.getElementById('grQ').value='';fill()}
  else if(t.classList.contains('gr-copy')&&D)copy(t)});
 const css=document.createElement('style');css.textContent=`
#view #grRoot{display:block!important}
#grRoot>*{width:auto;max-width:100%}
#grRoot .gr-f{display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin:6px 0}
#view #grRoot .gr-f>input[type=search]{width:auto!important;flex:1 1 220px!important;min-width:0;height:30px;padding:0 8px;border:1px solid #D4ECF544;border-radius:4px;background:#0A1428;color:#fff;margin:0!important}
#view #grRoot .gr-f>select{width:auto!important;flex:0 1 220px!important;height:30px;padding:0 6px;border:1px solid #D4ECF544;border-radius:4px;background:#0A1428;color:#fff;margin:0!important}
#grRoot .gr-f button,#grRoot #grRetry,#grRoot .gr-copy{all:unset;cursor:pointer;padding:3px 8px;border:1px solid #D4ECF566;border-radius:4px;color:#D4ECF5}
#grRoot .gr-s{color:#B9CAD6}#grRoot .gr-n{font-style:italic}
#grRoot .gr-g{color:#8FD694;font-weight:700}#grRoot .gr-b{color:#9FC9E8;font-weight:700}#grRoot .gr-y{color:#E9C46A;font-weight:700}#grRoot .gr-r{color:#F4A6A6;font-weight:700}
#grRoot .gr-w{color:#E9C46A}
#grRoot .gr-note{margin:4px 0 6px;padding-left:8px;border-left:2px solid #E9C46A;color:#D4ECF5}
#grRoot .gr-scroll{overflow-x:auto}
#grRoot table.gr-t{width:100%;border-collapse:collapse}
#grRoot .gr-t th{text-align:left;color:#B9CAD6;border-bottom:1px solid #D4ECF544;padding:3px 6px;font-weight:600}
#grRoot .gr-t td{border-bottom:1px solid #D4ECF51f;padding:4px 6px;vertical-align:top}
#grRoot .gr-t td:first-child{min-width:150px}
#grRoot ul.gr-l{margin:4px 0;padding-left:18px}#grRoot ul.gr-l li{margin:4px 0}
#grRoot h3{margin:12px 0 4px}#grRoot a{color:#D4ECF5}`;document.head.appendChild(css);
 if(typeof STATE!=='undefined'&&STATE.view==='grants'&&!document.getElementById('grRoot')&&typeof render==='function')render();
})();

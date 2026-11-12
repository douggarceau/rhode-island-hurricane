/* Senior Jobs: part-time work, retirement jobs and paid training in Rhode Island for older jobseekers.
   Data: data/seniorjobs.json (research snapshot of official employer and program sources). Compact rows, no boxes.
   Also provides window.jobTabs(cur): the shared tab row for the three job pages. */
(function(){
 let D=null,asked=false,err=false;
 const st={q:'',town:'',exp:'',drive:'',pay:''};
 const X=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
 const uniq=a=>[...new Set(a.filter(Boolean))].sort((x,y)=>x.localeCompare(y));
 const NP=v=>!v||/^not published/i.test(v);
 const src=(u,t)=>u?'<a class="sj-src" href="'+X(u)+'" target="_blank" rel="noopener">'+(t||'source')+'</a>':'';
 const tel=p=>'<a href="tel:'+X(p.replace(/[^0-9]/g,'').slice(0,10))+'">'+X(p)+'</a>';
 const linkify=s=>X(s).replace(/\b(\d{3}-\d{3}-\d{4})\b/g,(m)=>tel(m)).replace(/\b([\w.+-]+@[\w-]+(?:\.[\w-]+)+)\b/g,'<a href="mailto:$1">$1</a>');
 const day=s=>{if(!s)return '';const t=new Date(s+'T12:00:00');return isNaN(t)?s:t.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})};
 const EXP={none:'No experience required',train:'Training provided',pref:'Experience preferred',req:'Experience required'};
 const expOf=j=>{const L=j.experience_label.toLowerCase();
  if(/no .*required/.test(L))return 'none';
  if(/(experience|years).*required|requires previous experience/.test(L))return 'req';
  if(/train/.test(L)&&!/preferred/.test(L))return 'train';
  return 'pref'};
 const drives=j=>/driver|driving/i.test(j.title+' '+j.requirements);
 window.jobTabs=cur=>'<div class="mj-tabs">'+[['jobs','Government jobs'],['majors','Major RI Employers'],['seniorjobs','Senior Jobs'],['techjobs','Tech Jobs'],['aijobs','AI Jobs'],['remotejobs','Remote Jobs']].map(([k,l])=>k===cur?'<button type="button" class="on">'+l+'</button>':'<button type="button" data-go="'+k+'">'+l+'</button>').join('')+'</div>';
 function load(){if(asked)return;asked=true;fetch('data/seniorjobs.json?d='+new Date().toISOString().slice(0,10)).then(r=>{if(!r.ok)throw new Error(r.status);return r.json()}).then(j=>{D=j;D.jobs.forEach(x=>{x._exp=expOf(x);x._drive=drives(x)});fill()}).catch(()=>{err=true;asked=false;fill()})}
 function fill(){const root=document.getElementById('sjRoot');if(!root)return;const B=root.querySelector('#sjBody');
  if(err){B.innerHTML='<p>Couldn’t load Senior Jobs. <button type="button" id="sjRetry">Retry</button></p>';return}
  if(!D){B.innerHTML='<p>Loading…</p>';return}
  const T=root.querySelector('#sjTown');if(T.options.length<2)T.innerHTML='<option value="">All towns</option>'+uniq(D.jobs.map(j=>j.municipality)).map(t=>'<option>'+X(t)+'</option>').join('');
  T.value=st.town;root.querySelector('#sjExp').value=st.exp;root.querySelector('#sjDrive').value=st.drive;root.querySelector('#sjPay').value=st.pay;
  const q=st.q.trim().toLowerCase();
  const jobs=D.jobs.filter(j=>(!st.town||j.municipality===st.town)&&(!st.exp||(st.exp==='easy'?['none','train'].includes(j._exp):j._exp===st.exp))&&(!st.drive||(st.drive==='no'?!j._drive:j._drive))&&(!st.pay||!NP(j.pay))&&(!q||JSON.stringify(j).toLowerCase().includes(q)))
   .sort((a,b)=>(a.priority-b.priority)||((b.posted_date||'').localeCompare(a.posted_date||'')));
  root.querySelector('#sjCount').textContent=jobs.length+' current job'+(jobs.length===1?'':'s')+(D.listing_check?' · closed listings removed daily, last check '+D.listing_check.date:'');
  const has=o=>!q||JSON.stringify(o).toLowerCase().includes(q);
  let h='<h3>Current jobs ('+jobs.length+')</h3><div class="sj-scroll"><table class="sj-t"><thead><tr><th>Job</th><th>Where</th><th>Pay · schedule</th><th>Experience · requirements</th><th>Physical duties</th></tr></thead><tbody>'
   +(jobs.map(j=>'<tr><td><a href="'+X(j.apply_url||j.source_url)+'" target="_blank" rel="noopener"><b>'+X(j.title)+'</b></a><br><span class="sj-s">'+X(j.employer)+'</span>'
    +(j.senior_recruitment_evidence?'<br><span class="sj-ret">Posting mentions retirees</span>':'')+(j.hiring_signal?'<br><span class="sj-s">'+X(j.hiring_signal)+'</span>':'')+'</td>'
    +'<td>'+X(j.municipality)+(j.address?'<br><span class="sj-s">'+X(j.address)+'</span>':'')+'</td>'
    +'<td>'+(NP(j.pay)?'<span class="sj-s">Pay not published</span>':X(j.pay))+'<br><span class="sj-s">'+X(j.schedule)+'</span></td>'
    +'<td><span class="sj-lv sj-'+j._exp+'">'+EXP[j._exp]+'</span>: '+X(j.experience_label)+'<br><span class="sj-s">'+X(j.requirements)+'</span>'+(j.notes?'<br><span class="sj-s sj-n">'+X(j.notes)+'</span>':'')+(j.application_alternative?'<br><span class="sj-s">'+X(j.application_alternative)+'</span>':'')+'</td>'
    +'<td><span class="sj-s">'+X(j.physical_duties)+'</span><br><span class="sj-s">Checked '+day(j.last_checked)+(j.closing_date?' · closes '+day(j.closing_date):'')+'</span></td></tr>').join('')||'<tr><td>No jobs match. Try fewer filters.</td></tr>')+'</tbody></table></div>';
  if(!st.town&&!st.exp&&!st.drive&&!st.pay){
   const camp=D.recruiting_campaigns.filter(has),lead=D.unverified_leads.filter(has),watch=D.employer_watchlist.filter(has),prog=D.programs.filter(has),inc=D.incentives.filter(has);
   if(camp.length)h+='<h3>Employers recruiting retirees and training pathways</h3><p class="sj-s">Ongoing hiring campaigns, not specific openings. Call to ask about a local assignment.</p><ul class="sj-l">'+camp.map(c=>'<li><b>'+X(c.employer)+': '+X(c.title)+'</b> <span class="sj-s">'+X(c.coverage)+'</span><br>'+X(c.requirements)+(c.experience?'. '+X(c.experience):'')+'. Pay '+(NP(c.pay)?'not published':X(c.pay))+'. '+(NP(c.contact_phone)?'':'Call '+tel(c.contact_phone)+'. ')+src(c.source_url)+'</li>').join('')+'</ul>';
   if(lead.length)h+='<h3>Not yet confirmed</h3><p class="sj-s">Seen in employer listings, but the job page couldn’t be opened or checked. They may be closed: check before applying.</p><ul class="sj-l">'+lead.map(l=>'<li><a href="'+X(l.source_url)+'" target="_blank" rel="noopener">'+X(l.employer)+': '+X(l.title)+'</a> <span class="sj-s">'+X(l.town)+(NP(l.pay)?'':' · '+X(l.pay))+'</span></li>').join('')+'</ul>';
   if(watch.length)h+='<h3>Employers worth checking</h3><ul class="sj-l">'+watch.map(w=>'<li><b>'+X(w.employer)+'</b> <span class="sj-s">Look for: '+X(w.roles_to_search.join(', '))+'</span><br><span class="sj-s">'+X(w.reason)+'</span> '+src(w.careers_url||w.source_url,'careers')+'</li>').join('')+'</ul>';
   if(prog.length)h+='<h3>Paid training, coaching and help for older workers</h3><ul class="sj-l">'+prog.map(p=>'<li><b>'+X(p.name)+'</b> <span class="sj-s">'+X(p.age)+'</span><br>'+X(p.benefit)+(p.eligibility?' <span class="sj-s">Who qualifies: '+X(p.eligibility)+'</span>':'')+(p.contact?'<br>'+linkify(p.contact):'')+(p.next_step?'<br><span class="sj-s">'+X(p.next_step)+'</span>':'')+(p.notes?'<br><span class="sj-s sj-n">'+X(p.notes)+'</span>':'')+' '+(p.sources||[]).map((u,i)=>src(u,i?'more':'source')).join(' ')+'</li>').join('')+'</ul>';
   if(inc.length)h+='<h3>Employer incentives (status as checked)</h3><ul class="sj-l">'+inc.map(i=>'<li><b>'+X(i.name)+'</b> <span class="sj-st">'+X(i.status.replace(/_/g,' '))+'</span><br>'+X(i.description)+(i.notes?' <span class="sj-s sj-n">'+X(i.notes)+'</span>':'')+(i.contact?' '+linkify(i.contact):'')+' '+(i.sources||[]).map((u,k)=>src(u,k?'more':'source')).join(' ')+'</li>').join('')+'</ul>';
   const a=D.age_discrimination;
   if(a&&has(a))h+='<h3>Age discrimination and where to get help</h3><p>'+X(a.summary)+'</p><ul class="sj-l"><li><b>Federal: '+X(a.federal.law)+'.</b> '+X(a.federal.coverage)+' '+X(a.federal.prohibited_conduct)+' '+src(a.federal.source)+'</li><li><b>Rhode Island: '+X(a.rhode_island.law)+'.</b> '+X(a.rhode_island.coverage)+' '+src(a.rhode_island.source)+'</li>'
    +a.filing.map(f=>'<li><b>'+X(f.agency)+'</b>: '+X(f.deadline)+'. '+(f.phone?tel(f.phone)+'. ':'')+(f.email?'<a href="mailto:'+X(f.email)+'">'+X(f.email)+'</a>. ':'')+(f.address?X(f.address)+'. ':'')+(f.cost?X(f.cost)+'. ':'')+src(f.url,'how to file')+'</li>').join('')+'</ul>'
    +'<p class="sj-s"><b>What to do:</b> '+a.practical_steps.map(X).join(' ')+'</p><p class="sj-s sj-n">General public information, not legal advice about any particular case.</p>'}
  h+='<p class="sj-s"><button type="button" id="sjCopy">Copy all text</button> <a href="data/seniorjobs.json" download="Rhode-Island-Hurricane-Senior-Jobs.json">Download the data (JSON)</a></p>';
  B.innerHTML=h}
 window.vSeniorJobs=function(){setTimeout(()=>{load();const r=document.getElementById('sjRoot');if(r)r.querySelector('#sjQ').value=st.q;fill()},0);
  return '<section class="box sj" id="sjRoot">'+jobTabs('seniorjobs')+'<h2>Senior Jobs: Part-Time Work, Retirement Jobs &amp; Paid Training in Rhode Island</h2>'
   +'<p class="sj-s">Paid work across Rhode Island for older jobseekers, starting with jobs that need the least experience, offer training or are part time. Each job shows required experience, physical duties and pay. These jobs are open to all qualified applicants; only programs like SCSEP (55+) have an age rule.</p>'
   +'<p class="mj-note sj-note"><b>Public records, verify when needed.</b> Listings reflect public employer and official program information checked Nov. 12, 2026. An online posting is not a guarantee of an open position, interview, hiring speed, hours or benefits: confirm with the employer or program. Rhode Island Hurricane is not the employer and does not take applications.</p>'
   +'<div class="sj-f"><input type="search" id="sjQ" placeholder="Search a job, employer or town" aria-label="Search senior jobs">'
   +'<select id="sjTown" aria-label="Town"><option value="">All towns</option></select>'
   +'<select id="sjExp" aria-label="Experience"><option value="">Any experience</option><option value="easy">No experience or training provided</option><option value="none">No experience required</option><option value="train">Training provided</option><option value="pref">Experience preferred</option><option value="req">Experience required</option></select>'
   +'<select id="sjDrive" aria-label="Driving"><option value="">Driving or not</option><option value="no">No driving</option><option value="yes">Driving jobs</option></select>'
   +'<select id="sjPay" aria-label="Pay"><option value="">Any pay info</option><option value="1">Pay published</option></select>'
   +'<button type="button" id="sjClear">Clear</button> <span id="sjCount" class="sj-s"></span></div>'
   +'<div id="sjBody"></div></section>'};
 document.addEventListener('input',e=>{const t=e.target;if(!t.closest||!t.closest('#sjRoot'))return;
  const m={sjQ:'q',sjTown:'town',sjExp:'exp',sjDrive:'drive',sjPay:'pay'}[t.id];if(!m)return;st[m]=t.value;fill()});
 document.addEventListener('click',e=>{const t=e.target;if(!t.closest||!t.closest('#sjRoot'))return;
  if(t.id==='sjRetry'){err=false;load();fill()}
  else if(t.id==='sjClear'){Object.assign(st,{q:'',town:'',exp:'',drive:'',pay:''});document.getElementById('sjQ').value='';fill()}
  else if(t.id==='sjCopy'){const txt=document.getElementById('sjRoot').innerText.replace(/Copy all text.*$/s,'').trim();
   const done=()=>{t.textContent='Copied';setTimeout(()=>t.textContent='Copy all text',1500)};
   if(navigator.clipboard)navigator.clipboard.writeText(txt).then(done,()=>{t.textContent='Copy failed'});else{const a=document.createElement('textarea');a.value=txt;document.body.appendChild(a);a.select();document.execCommand('copy');a.remove();done()}}});
 const css=document.createElement('style');css.textContent=`
#view :is(#sjRoot,#tjRoot,#aiRoot,#rmRoot){display:block!important}
#rmRoot>*,#aiRoot>*,#tjRoot>*,#sjRoot>*{width:auto;max-width:100%}
:is(#sjRoot,#tjRoot,#aiRoot,#rmRoot) .sj-f{display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin:6px 0}
#view :is(#sjRoot,#tjRoot,#aiRoot,#rmRoot) .sj-f>input[type=search]{width:auto!important;flex:1 1 220px!important;min-width:0;height:30px;padding:0 8px;border:1px solid #D4ECF544;border-radius:4px;background:#0A1428;color:#fff;margin:0!important}
#view :is(#sjRoot,#tjRoot,#aiRoot,#rmRoot) .sj-f>select{width:auto!important;flex:0 1 200px!important;height:30px;padding:0 6px;border:1px solid #D4ECF544;border-radius:4px;background:#0A1428;color:#fff;margin:0!important}
:is(#sjRoot,#tjRoot,#aiRoot,#rmRoot) .sj-f button,:is(#sjRoot,#tjRoot,#aiRoot,#rmRoot) #sjRetry,:is(#sjRoot,#tjRoot,#aiRoot,#rmRoot) #sjCopy{all:unset;cursor:pointer;padding:3px 8px;border:1px solid #D4ECF566;border-radius:4px;color:#D4ECF5}
:is(#sjRoot,#tjRoot,#aiRoot,#rmRoot) .sj-s{color:#B9CAD6}
:is(#sjRoot,#tjRoot,#aiRoot,#rmRoot) .sj-n{font-style:italic}
:is(#sjRoot,#tjRoot,#aiRoot,#rmRoot) .sj-st{color:#E9C46A}
:is(#sjRoot,#tjRoot,#aiRoot,#rmRoot) .sj-ret{color:#8FD694;font-weight:700}
:is(#sjRoot,#tjRoot,#aiRoot,#rmRoot) .mj-note{margin:4px 0 6px;padding-left:8px;border-left:2px solid #E9C46A;color:#D4ECF5}
:is(#sjRoot,#tjRoot,#aiRoot,#rmRoot) .sj-scroll{overflow-x:auto}
:is(#sjRoot,#tjRoot,#aiRoot,#rmRoot) table.sj-t{width:100%;border-collapse:collapse}
:is(#sjRoot,#tjRoot,#aiRoot,#rmRoot) .sj-t th{text-align:left;color:#B9CAD6;border-bottom:1px solid #D4ECF544;padding:3px 6px;font-weight:600}
:is(#sjRoot,#tjRoot,#aiRoot,#rmRoot) .sj-t td{border-bottom:1px solid #D4ECF51f;padding:4px 6px;vertical-align:top}
:is(#sjRoot,#tjRoot,#aiRoot,#rmRoot) .sj-lv{font-weight:700}
:is(#sjRoot,#tjRoot,#aiRoot,#rmRoot) .sj-none,:is(#sjRoot,#tjRoot,#aiRoot,#rmRoot) .sj-train{color:#8FD694}
:is(#sjRoot,#tjRoot,#aiRoot,#rmRoot) .sj-pref{color:#9FC9E8}
:is(#sjRoot,#tjRoot,#aiRoot,#rmRoot) .sj-req{color:#E9C46A}
:is(#sjRoot,#tjRoot,#aiRoot,#rmRoot) .sj-src{font-size:.85em;color:#8FB8D0}
:is(#sjRoot,#tjRoot,#aiRoot,#rmRoot) ul.sj-l{margin:4px 0;padding-left:18px}
:is(#sjRoot,#tjRoot,#aiRoot,#rmRoot) ul.sj-l li{margin:5px 0}
:is(#sjRoot,#tjRoot,#aiRoot,#rmRoot) h3{margin:12px 0 4px}
:is(#sjRoot,#tjRoot,#aiRoot,#rmRoot) a{color:#D4ECF5}`;document.head.appendChild(css);
 if(typeof STATE!=='undefined'&&STATE.view==='seniorjobs'&&!document.getElementById('sjRoot')&&typeof render==='function')render();
})();

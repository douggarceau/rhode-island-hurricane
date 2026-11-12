/* Major RI Employers: entry-level jobs and paid training with large employers in Rhode Island.
   Data: data/majors.json (research snapshot of official employer career pages). Compact rows, no boxes. */
(function(){
 let D=null,asked=false,err=false;
 const st={q:'',emp:'',level:'',town:'',sort:'emp'};
 const X=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
 const U=u=>{const t=String(u==null?'':u);return /^(javascript|data|vbscript):/i.test(t.replace(/[\s\x00-\x1f]/g,''))?'#':X(t)}; // links: never allow script URLs from outside data
 const uniq=a=>[...new Set(a.filter(Boolean))].sort((x,y)=>x.localeCompare(y));
 const NP='<span class="mj-s">not published</span>';
 const LEVEL={entry_no_experience:'No experience needed',entry_training:'Paid / employer training',entry_certificate_required:'Entry level, certificate required',beginner_requirements:'Beginner role, confirm requirements',early_career_one_year:'1 year experience required'};
 const TYPE={full_time:'Full time',part_time:'Part time',per_diem:'Per diem',seasonal_part_time:'Seasonal part time'};
 const day=s=>{if(!s)return '';const t=new Date(s+'T12:00:00');return isNaN(t)?s:t.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})};
 const pay=p=>{if(!p||p.min==null)return NP;const f=n=>'$'+(+n).toFixed(2).replace(/\.00$/,'');return f(p.min)+(p.max?'–'+f(p.max):'+')+(p.period?'/'+p.period:' <span class="mj-s">(period not stated)</span>')};
 const tabs=()=>window.jobTabs?jobTabs('majors'):'';
 function load(){if(asked)return;asked=true;fetch('data/majors.json?d='+new Date().toISOString().slice(0,10)).then(r=>{if(!r.ok)throw new Error(r.status);return r.json()}).then(j=>{D=j;D.E={};j.employers.forEach(e=>D.E[e.id]=e);fill()}).catch(()=>{err=true;asked=false;fill()})}
 function contactList(e){
  const rec=e.contacts.filter(c=>c.purpose==='recruiting'),oth=e.contacts.filter(c=>c.purpose!=='recruiting');
  const one=c=>{const v=c.channel==='email'?'<a href="mailto:'+X(c.value)+'">'+X(c.value)+'</a>':c.channel==='phone'?'<a href="tel:'+X(c.value.replace(/[^0-9]/g,'').slice(0,10))+'">'+X(c.value)+'</a>':'<a href="'+U(c.value)+'" target="_blank" rel="noopener">web form</a>';return v+' <span class="mj-s">'+X(c.label)+'</span>'};
  return (rec.length?'<div><b>Hiring contacts:</b> '+rec.map(one).join(' · ')+'</div>':'<div><b>Hiring contacts:</b> <span class="mj-s">no recruiter phone or email published. Apply through the careers site.</span></div>')
   +(oth.length?'<div class="mj-s">Other published numbers (not recruiters): '+oth.map(one).join(' · ')+'</div>':'')}
 function fill(){const root=document.getElementById('mjRoot');if(!root)return;const B=root.querySelector('#mjBody');
  if(err){B.innerHTML='<p>Couldn’t load the employer list. <button type="button" id="mjRetry">Retry</button></p>';return}
  if(!D){B.innerHTML='<p>Loading…</p>';return}
  const E=root.querySelector('#mjEmp'),T=root.querySelector('#mjTown');
  if(E.options.length<2){E.innerHTML='<option value="">All employers</option>'+D.employers.map(e=>'<option value="'+X(e.id)+'">'+X(e.name)+'</option>').join('');T.innerHTML='<option value="">All towns</option>'+uniq(D.jobs.map(j=>j.city)).map(t=>'<option>'+X(t)+'</option>').join('')}
  E.value=st.emp;T.value=st.town;root.querySelector('#mjLevel').value=st.level;root.querySelector('#mjSort').value=st.sort;
  const q=st.q.trim().toLowerCase();
  const ok=j=>(!st.emp||j.employer_id===st.emp)&&(!st.level||j.skill_level===st.level)&&(!st.town||j.city===st.town)&&(!q||JSON.stringify([j,D.E[j.employer_id].name,D.E[j.employer_id].sector]).toLowerCase().includes(q));
  let jobs=D.jobs.filter(ok);
  root.querySelector('#mjCount').textContent=jobs.length+' current listing'+(jobs.length===1?'':'s')+(D.listing_check?' · closed listings removed daily, last check '+D.listing_check.date:'');
  const row=j=>'<tr><td><a href="'+U(j.source_url)+'" target="_blank" rel="noopener"><b>'+X(j.title)+'</b></a><br><span class="mj-lv mj-'+X(j.skill_level)+'">'+X(LEVEL[j.skill_level]||j.skill_level)+'</span>'+(j.employer_stated_openings?' <span class="mj-s">· employer says '+j.employer_stated_openings+' openings</span>':'')+'</td>'
   +'<td>'+X(j.city)+'<br><span class="mj-s">'+X(j.address||'')+'</span></td>'
   +'<td class="mj-nw">'+pay(j.pay)+'<br><span class="mj-s">'+X(TYPE[j.employment_type]||j.employment_type||'')+(j.hours_per_week?', '+j.hours_per_week+' hrs/wk':'')+'</span></td>'
   +'<td>'+X(j.requirements)+'<br><span class="mj-s">Schedule: '+X(j.shift||'not published')+(j.notes?' · '+X(j.notes):'')+'</span></td>'
   +'<td class="mj-nw">'+(j.closing_date?'Closes '+day(j.closing_date):'<span class="mj-s">No close date</span>')+(j.posted_date?'<br><span class="mj-s">Posted '+day(j.posted_date)+'</span>':'')+'</td></tr>';
  let html='';
  const order=st.sort==='pay'?null:D.employers.map(e=>e.id);
  if(st.sort==='pay'){jobs.sort((a,b)=>((b.pay&&b.pay.min)||0)-((a.pay&&a.pay.min)||0));
   html='<div class="mj-scroll"><table class="mj-t"><thead><tr><th>Job</th><th>Where</th><th>Pay</th><th>Requirements</th><th>Dates</th></tr></thead><tbody>'+jobs.map(j=>row(j).replace('</b></a>','</b></a> <span class="mj-s">· '+X(D.E[j.employer_id].name)+'</span>')).join('')+'</tbody></table></div>'}
  else{
   const showEmp=D.employers.filter(e=>(!st.emp||e.id===st.emp)&&(jobs.some(j=>j.employer_id===e.id)||(!st.level&&!st.town&&(!q||JSON.stringify(e).toLowerCase().includes(q)))));
   html=showEmp.map(e=>{const J=jobs.filter(j=>j.employer_id===e.id),P=(D.pending_listings||[]).filter(p=>p.employer_id===e.id);
    return '<div class="mj-emp"><h3>'+X(e.name)+' <span class="mj-s">'+X(e.sector)+' · '+J.length+' current listing'+(J.length===1?'':'s')+'</span></h3>'
     +'<div><a href="'+U(e.career_url)+'" target="_blank" rel="noopener">Official careers site</a> <span class="mj-s">· apply here, not by phone or email</span></div>'
     +(J.length?'<div class="mj-scroll"><table class="mj-t"><thead><tr><th>Job</th><th>Where</th><th>Pay</th><th>Requirements</th><th>Dates</th></tr></thead><tbody>'+J.map(row).join('')+'</tbody></table></div>':'<div class="mj-s">No current entry-level listing confirmed. Check the careers site.</div>')
     +'<details class="mj-more"><summary>Addresses, phone numbers and notes</summary><div class="mj-s">'+e.locations.map(X).join(' · ')+'</div>'+contactList(e)+(e.notes?'<div class="mj-s mj-n">'+X(e.notes)+'</div>':'')+'</details>'
     +(P.length&&!st.level?'<div class="mj-pend"><b>Not yet confirmed</b> <span class="mj-s">(seen in the employer’s listings but the job page wouldn’t open; may be closed)</span><ul>'+P.map(p=>'<li><a href="'+U(p.source_url)+'" target="_blank" rel="noopener">'+X(p.title)+'</a> <span class="mj-s">'+X(p.city)+(p.site?', '+X(p.site):'')+(p.shift?' · '+X(p.shift):'')+'</span></li>').join('')+'</ul></div>':'')
     +'</div>'}).join('')||'<p>No employers or jobs match. Try fewer words.</p>'}
  B.innerHTML=html}
 window.vMajors=function(){setTimeout(()=>{load();const r=document.getElementById('mjRoot');if(r)r.querySelector('#mjQ').value=st.q;fill()},0);
  return '<section class="box mj" id="mjRoot">'+tabs()+'<h2>Major RI Employers: Entry-Level Jobs &amp; Paid Training</h2>'
   +'<p class="mj-s">Entry-level jobs and paid training with large employers in Rhode Island. Compare requirements, pay, schedules and locations, then apply directly with the employer. Listings checked on official career pages Nov. 12, 2026.</p>'
   +'<p class="mj-note"><b>Public records, verify when needed.</b> Drawn from public employer sources on the date checked. Jobs close, and pay, requirements and contacts change: confirm with the employer before relying on a listing. Published pay ranges are not promised offers. Rhode Island Hurricane is an independent publisher, not the employer or a hiring agent, and does not take applications.</p>'
   +'<div class="mj-f"><input type="search" id="mjQ" placeholder="Search a job, employer or town" aria-label="Search employers">'
   +'<select id="mjEmp" aria-label="Employer"><option value="">All employers</option></select>'
   +'<select id="mjLevel" aria-label="Experience"><option value="">Any experience level</option>'+Object.entries(LEVEL).map(([k,v])=>'<option value="'+k+'">'+v+'</option>').join('')+'</select>'
   +'<select id="mjTown" aria-label="Town"><option value="">All towns</option></select>'
   +'<select id="mjSort" aria-label="Sort"><option value="emp">Group by employer</option><option value="pay">Highest starting pay</option></select>'
   +'<button type="button" id="mjClear">Clear</button> <span id="mjCount" class="mj-s"></span></div>'
   +'<div id="mjBody"></div></section>'};
  document.addEventListener('input',e=>{const t=e.target;if(!t.closest||!t.closest('#mjRoot'))return;
  if(t.id==='mjQ')st.q=t.value;else if(t.id==='mjEmp')st.emp=t.value;else if(t.id==='mjLevel')st.level=t.value;else if(t.id==='mjTown')st.town=t.value;else if(t.id==='mjSort')st.sort=t.value;else return;fill()});
 document.addEventListener('click',e=>{const t=e.target;if(!t.closest||!t.closest('#mjRoot'))return;
  if(t.id==='mjRetry'){err=false;load();fill()}else if(t.id==='mjClear'){Object.assign(st,{q:'',emp:'',level:'',town:'',sort:'emp'});document.getElementById('mjQ').value='';fill()}});
 const css=document.createElement('style');css.textContent=`
#view #mjRoot{display:block!important}
#mjRoot>*{width:auto;max-width:100%}
.mj-tabs{display:flex;flex-wrap:wrap;gap:4px;margin:0 0 6px}
.mj-tabs button{all:unset;cursor:pointer;padding:3px 9px;border:1px solid #D4ECF544;border-radius:4px;color:#D4ECF5}
.mj-tabs button.on{background:#D4ECF5;color:#0A1428;font-weight:700;cursor:default}
#mjRoot .mj-f{display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin:6px 0}
#view #mjRoot .mj-f>input[type=search]{width:auto!important;flex:1 1 220px!important;min-width:0;height:30px;padding:0 8px;border:1px solid #D4ECF544;border-radius:4px;background:#0A1428;color:#fff;margin:0!important}
#view #mjRoot .mj-f>select{width:auto!important;flex:0 1 190px!important;height:30px;padding:0 6px;border:1px solid #D4ECF544;border-radius:4px;background:#0A1428;color:#fff;margin:0!important}
#mjRoot .mj-f button,#mjRoot #mjRetry{all:unset;cursor:pointer;padding:3px 8px;border:1px solid #D4ECF566;border-radius:4px;color:#D4ECF5}
#mjRoot .mj-s{color:#B9CAD6}
#mjRoot .mj-n{font-style:italic}
#mjRoot .mj-note{margin:4px 0 6px;padding-left:8px;border-left:2px solid #E9C46A;color:#D4ECF5}
#mjRoot .mj-emp{margin:10px 0 14px;padding-top:6px;border-top:1px solid #D4ECF533}
#mjRoot h3{margin:0 0 2px}
#mjRoot .mj-scroll{overflow-x:auto;margin-top:4px}
#mjRoot table.mj-t{width:100%;border-collapse:collapse}
#mjRoot .mj-t th{text-align:left;color:#B9CAD6;border-bottom:1px solid #D4ECF544;padding:3px 6px;font-weight:600}
#mjRoot .mj-t td{border-bottom:1px solid #D4ECF51f;padding:4px 6px;vertical-align:top}
#mjRoot .mj-nw{white-space:nowrap}
#mjRoot .mj-lv{font-weight:700;color:#8FD694}
#mjRoot .mj-early_career_one_year,#mjRoot .mj-entry_certificate_required{color:#E9C46A}
#mjRoot .mj-beginner_requirements{color:#9FC9E8}
#mjRoot .mj-pend{margin-top:4px}
#mjRoot .mj-pend ul{margin:2px 0;padding-left:18px}
#mjRoot a{color:#D4ECF5}
#mjRoot details.mj-more{margin:4px 0 2px}#mjRoot details.mj-more summary{cursor:pointer;color:#B9CAD6}`;document.head.appendChild(css);
 if(typeof STATE!=='undefined'&&STATE.view==='majors'&&!document.getElementById('mjRoot')&&typeof render==='function')render();
})();

/* Jobs: open public-sector jobs in Rhode Island (state, cities and towns, school districts, colleges, state authorities).
   Data: data/jobs.json, refreshed every morning by tools/jobs/refresh_jobs.py (GitHub Actions).
   window.JOBS_HOME = list of towns to show first (Jamestown Island News sets it). Compact rows, no boxes. */
(function(){
 let D=null,asked=false,err=false,lim=200;
 const HOME=window.JOBS_HOME||null;
 const st={q:'',type:'',town:HOME?'__near':'',sort:'new'};
 const X=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
 const uniq=a=>[...new Set(a.filter(Boolean))].sort((x,y)=>x.localeCompare(y));
 const TYPES={state:'State of Rhode Island',town:'City or town',school:'School district',college:'College',authority:'State authority'};
 const fmt=d=>{if(!d)return '';const t=new Date(d+'T12:00:00');return isNaN(t)?d:t.toLocaleDateString('en-US',{month:'short',day:'numeric'})};
 function load(){if(asked)return;asked=true;fetch('data/jobs.json?'+Math.floor(Date.now()/36e5)).then(r=>{if(!r.ok)throw new Error(r.status);return r.json()}).then(j=>{D=j;fill()}).catch(()=>{err=true;asked=false;fill()})}
 const inTown=(r,t)=>t==='__near'?HOME.includes(r.town):(!t||r.town===t);
 function fill(){const root=document.getElementById('jbRoot');if(!root)return;
  const L=root.querySelector('#jbList'),C=root.querySelector('#jbCount'),E=root.querySelector('#jbEmp');
  if(err){L.innerHTML='<p>Couldn’t load the job list. <button type="button" id="jbRetry">Retry</button></p>';return}
  if(!D){L.innerHTML='<p>Loading open jobs…</p>';return}
  root.querySelector('#jbUpd').textContent='Updated '+new Date(D.updated).toLocaleString('en-US',{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'});
  const T=root.querySelector('#jbTown');
  if(T.options.length<2){const towns=uniq(D.listings.map(r=>r.town).concat(D.employers.map(e=>e.town)));T.innerHTML=(HOME?'<option value="__near">Jamestown & nearby</option>':'')+'<option value="">All of Rhode Island</option>'+towns.map(t=>'<option>'+X(t)+'</option>').join('')}
  T.value=st.town;root.querySelector('#jbType').value=st.type;root.querySelector('#jbSort').value=st.sort;
  const q=st.q.trim().toLowerCase();
  let rows=D.listings.filter(r=>(!st.type||r.type===st.type)&&inTown(r,st.town)&&(!q||(r.title+' '+r.employer+' '+(r.town||'')+' '+(r.dept||'')).toLowerCase().includes(q)));
  if(st.sort==='close')rows.sort((a,b)=>(a.closes||'9999').localeCompare(b.closes||'9999'));
  else if(st.sort==='pay')rows.sort((a,b)=>(b.pay_max||0)-(a.pay_max||0));
  else rows.sort((a,b)=>(b.posted||'').localeCompare(a.posted||''));
  C.textContent=rows.length.toLocaleString()+' open job'+(rows.length===1?'':'s');
  L.innerHTML=rows.length?'<table class="jb-t"><thead><tr><th>Job</th><th>Employer</th><th>Pay</th><th>Posted</th><th>Closes</th></tr></thead><tbody>'+rows.slice(0,lim).map(r=>'<tr><td><a href="'+X(r.url)+'" target="_blank" rel="noopener"><b>'+X(r.title)+'</b></a>'+(r.dept?'<br><span class="jb-s">'+X(r.dept)+'</span>':'')+'</td><td>'+X(r.employer)+(r.town?'<br><span class="jb-s">'+X(r.town)+'</span>':'')+'</td><td class="jb-n">'+X(r.pay||'')+'</td><td class="jb-n">'+fmt(r.posted)+'</td><td class="jb-n">'+(r.closes?fmt(r.closes):'<span class="jb-s" title="No closing date posted: check the listing">—</span>')+'</td></tr>').join('')+'</tbody></table>'+(rows.length>lim?'<button type="button" id="jbMore">Show more ('+(rows.length-lim).toLocaleString()+' left)</button>':''):'<p>No open jobs match. Try fewer words, another town, or check the employer pages below.</p>';
  const emps=D.employers.filter(e=>!e.feed&&(!st.type||e.type===st.type)&&inTown(e,st.town)&&(!q||(e.name+' '+(e.town||'')).toLowerCase().includes(q)));
  E.innerHTML=emps.length?'<h3>Check these job pages directly ('+emps.length+')</h3><p class="jb-s">These employers post openings on their own sites without a feed we can read. The link goes to their official jobs page.</p><ul class="jb-e">'+emps.map(e=>'<li><a href="'+X(e.page)+'" target="_blank" rel="noopener">'+X(e.name)+'</a> <span class="jb-s">'+X(TYPES[e.type]||'')+'</span></li>').join('')+'</ul>':''}
 window.vJobs=function(){setTimeout(()=>{load();const r=document.getElementById('jbRoot');if(r)r.querySelector('#jbQ').value=st.q;fill()},0);
  return '<section class="box jb" id="jbRoot"><h2>Jobs: open positions in Rhode Island government</h2>'
   +'<p class="jb-s">Openings posted by the State of Rhode Island, cities and towns, school districts, public colleges and state authorities, pulled from their official job boards every morning. <span id="jbUpd"></span>.</p>'
   +'<p class="jb-note"><b>Public records.</b> These listings come from public job postings. Titles, pay, dates and requirements can change or close early: verify every detail with the employer, and apply only on the employer’s official site. Rhode Island Hurricane is not the employer and does not take applications.</p>'
   +'<div class="jb-f"><input type="search" id="jbQ" placeholder="Search a job title, employer or town" aria-label="Search jobs">'
   +'<select id="jbType" aria-label="Employer type"><option value="">All employers</option>'+Object.entries(TYPES).map(([k,v])=>'<option value="'+k+'">'+v+'</option>').join('')+'</select>'
   +'<select id="jbTown" aria-label="Town"><option value="">All of Rhode Island</option></select>'
   +'<select id="jbSort" aria-label="Sort"><option value="new">Newest first</option><option value="close">Closing soonest</option><option value="pay">Highest pay</option></select>'
   +'<button type="button" id="jbClear">Clear</button> <span id="jbCount" class="jb-s"></span></div>'
   +'<div id="jbList"></div><div id="jbEmp"></div></section>'};
 document.addEventListener('input',e=>{const t=e.target;if(!t.closest||!t.closest('#jbRoot'))return;
  if(t.id==='jbQ')st.q=t.value;else if(t.id==='jbType')st.type=t.value;else if(t.id==='jbTown')st.town=t.value;else if(t.id==='jbSort')st.sort=t.value;else return;lim=200;fill()});
 document.addEventListener('click',e=>{const t=e.target;if(!t.closest||!t.closest('#jbRoot'))return;
  if(t.id==='jbMore'){lim+=300;fill()}else if(t.id==='jbRetry'){err=false;load();fill()}
  else if(t.id==='jbClear'){st.q='';st.type='';st.town=HOME?'__near':'';st.sort='new';document.getElementById('jbQ').value='';lim=200;fill()}});
 const css=document.createElement('style');css.textContent=`
#view #jbRoot{display:block!important}
#jbRoot>*{width:auto;max-width:100%}
#jbRoot .jb-f{display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin:6px 0}
#view #jbRoot .jb-f>input[type=search]{width:auto!important;flex:1 1 220px!important;min-width:0;height:30px;padding:0 8px;border:1px solid #D4ECF544;border-radius:4px;background:#0A1428;color:#fff;margin:0!important}
#view #jbRoot .jb-f>select{width:auto!important;flex:0 1 190px!important;height:30px;padding:0 6px;border:1px solid #D4ECF544;border-radius:4px;background:#0A1428;color:#fff;margin:0!important}
#jbRoot .jb-f button,#jbRoot #jbMore,#jbRoot #jbRetry{all:unset;cursor:pointer;padding:3px 8px;border:1px solid #D4ECF566;border-radius:4px;color:#D4ECF5}
#jbRoot #jbMore{display:block;margin:8px auto}
#jbRoot .jb-s{color:#B9CAD6}
#jbRoot .jb-note{margin:4px 0 6px;padding-left:8px;border-left:2px solid #E9C46A;color:#D4ECF5}
#jbRoot #jbList{overflow-x:auto}
#jbRoot table.jb-t{width:100%;border-collapse:collapse}
#jbRoot .jb-t th{text-align:left;color:#B9CAD6;border-bottom:1px solid #D4ECF544;padding:4px 6px}
#jbRoot .jb-t td{vertical-align:top;border-bottom:1px solid #D4ECF51f;padding:4px 6px}
#jbRoot .jb-t a{color:#E9C46A}
#jbRoot .jb-n{white-space:nowrap}
#jbRoot ul.jb-e{list-style:none;margin:4px 0 0;padding:0;columns:3 240px;column-gap:16px}
#jbRoot ul.jb-e li{break-inside:avoid;padding:2px 0;border-bottom:1px solid #D4ECF51f}
#jbRoot ul.jb-e a{color:#E9C46A}
@media (max-width:700px){#jbRoot .jb-t th:nth-child(4),#jbRoot .jb-t td:nth-child(4){display:none}}`;
 document.head.appendChild(css);
 if(typeof STATE!=='undefined'&&STATE.view==='jobs'&&typeof render==='function')render();
})();

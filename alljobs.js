/* All RI jobs: every job posted in Rhode Island in the last 30 days, collected daily by Adzuna
   (data/alljobs.json, tools/jobs/adzuna.py). Jobs already on our other job tabs are left out there.
   The tab appears in the Job lists row only once the data file exists (see jobnav.js). No boxes. */
(function(){
 let D=null,asked=false,err=false,lim=100;
 const st={q:'',town:'',cat:'',hours:'',sort:'new'};
 const X=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
 const U=u=>/^https:\/\//i.test(String(u||''))?X(u):'#';
 const uniq=a=>[...new Set(a.filter(Boolean))].sort((x,y)=>x.localeCompare(y));
 const day=s=>{const d=new Date(String(s).slice(0,10)+'T12:00:00');return isNaN(d)?'':d.toLocaleDateString('en-US',{month:'short',day:'numeric'})};
 function load(){if(asked)return;asked=true;fetch('data/alljobs.json?d='+new Date().toLocaleDateString('en-CA',{timeZone:'America/New_York'})).then(r=>{if(!r.ok)throw new Error(r.status);return r.json()}).then(j=>{j.jobs.forEach(o=>o._s=(o.title+' '+o.employer+' '+o.town+' '+o.where+' '+o.cat+' '+o.snippet).toLowerCase());D=j;fill()}).catch(()=>{err=true;asked=false;fill()})}
 const opt=(id,k,first,vals)=>{const s=document.getElementById(id);if(s.options.length<2)s.innerHTML='<option value="">'+first+'</option>'+vals.map(v=>'<option>'+X(v)+'</option>').join('');s.value=st[k]};
 function fill(){const root=document.getElementById('ajRoot');if(!root)return;const B=root.querySelector('#ajBody');
  if(err){B.innerHTML='<p>Couldn’t load the list. <button type="button" id="ajRetry">Retry</button></p>';return}
  if(!D){B.innerHTML='<p>Loading jobs…</p>';return}
  opt('ajTown','town','All towns',uniq(D.jobs.map(j=>j.town)));opt('ajCat','cat','All kinds of work',uniq(D.jobs.map(j=>j.cat)));
  root.querySelector('#ajHours').value=st.hours;root.querySelector('#ajSort').value=st.sort;
  const q=st.q.trim().toLowerCase();
  const rows=D.jobs.filter(j=>(!st.town||j.town===st.town)&&(!st.cat||j.cat===st.cat)&&(!st.hours||j.hours===st.hours)&&(!q||j._s.includes(q)));
  if(st.sort==='pay')rows.sort((a,b)=>(b.pay_max||0)-(a.pay_max||0)||b.posted.localeCompare(a.posted));else rows.sort((a,b)=>b.posted.localeCompare(a.posted));
  root.querySelector('#ajCount').textContent=rows.length.toLocaleString()+' job'+(rows.length===1?'':'s')+' · updated '+new Date(D.updated).toLocaleDateString('en-US',{month:'short',day:'numeric',timeZone:'America/New_York'});
  B.innerHTML=rows.length?'<div class="aj-scroll"><table class="aj-t"><thead><tr><th>Job</th><th>Where</th><th>Pay · hours</th><th>Posted</th></tr></thead><tbody>'+rows.slice(0,lim).map(j=>'<tr><td><a href="'+U(j.url)+'" target="_blank" rel="noopener nofollow"><b>'+X(j.title)+'</b></a><br><span class="aj-s">'+X(j.employer)+(j.cat?' · '+X(j.cat):'')+'</span>'+(j.snippet?'<br><span class="aj-s aj-n">'+X(j.snippet.replace(/[.…\s]+$/,''))+'…</span>':'')+'</td><td>'+X(j.town||j.where)+'</td><td>'+(j.pay?X(j.pay):'<span class="aj-s">Pay not published</span>')+(j.hours||j.kind?'<br><span class="aj-s">'+X([j.hours,j.kind].filter(Boolean).join(' · '))+'</span>':'')+'</td><td class="aj-nw">'+X(day(j.posted))+'</td></tr>').join('')+'</tbody></table></div>'+(rows.length>lim?'<button type="button" id="ajMore">Show more ('+(rows.length-lim).toLocaleString()+' left)</button>':''):'<p>No jobs match. Try fewer filters.</p>'}
 window.vAllJobs=function(){setTimeout(()=>{load();const r=document.getElementById('ajRoot');if(r)r.querySelector('#ajQ').value=st.q;fill()},0);
  return '<section class="box aj" id="ajRoot">'+(window.jobTabs?jobTabs('alljobs'):'')+'<h2>All Rhode Island Jobs</h2>'
   +'<p class="aj-s">Every job posted in Rhode Island in the last 30 days, gathered each morning from job sites and employers by Adzuna. Jobs already on our other lists are left out here, so check those tabs too.</p>'
   +'<p class="mj-note"><b>Public records, verify when needed.</b> Listings come from outside job sites and can be out of date. Check the details on the employer’s page before applying. Never pay to apply. Rhode Island Hurricane is not the employer and does not take applications.</p>'
   +'<div class="aj-f"><input type="search" id="ajQ" placeholder="Search a job, employer or skill" aria-label="Search jobs"><select id="ajTown" aria-label="Town"></select><select id="ajCat" aria-label="Kind of work"></select>'
   +'<select id="ajHours" aria-label="Hours"><option value="">Full or part-time</option><option>Full-time</option><option>Part-time</option></select>'
   +'<select id="ajSort" aria-label="Sort"><option value="new">Newest first</option><option value="pay">Highest pay first</option></select></div>'
   +'<p class="aj-s" id="ajCount"></p><div id="ajBody"></div>'
   +'<p class="aj-s aj-credit"><a href="https://www.adzuna.com/" target="_blank" rel="noopener">Jobs by Adzuna</a></p></section>'};
 let tq;
 document.addEventListener('input',e=>{const t=e.target;if(!t.closest||!t.closest('#ajRoot'))return;const m={ajQ:'q',ajTown:'town',ajCat:'cat',ajHours:'hours',ajSort:'sort'}[t.id];if(!m)return;st[m]=t.value;lim=100;clearTimeout(tq);tq=setTimeout(fill,t.id==='ajQ'?150:0)});
 document.addEventListener('click',e=>{const t=e.target;if(!t.closest||!t.closest('#ajRoot'))return;if(t.id==='ajMore'){lim+=100;fill()}else if(t.id==='ajRetry'){err=false;load();fill()}});
 const css=document.createElement('style');css.textContent=`
#view #ajRoot{display:block!important}#ajRoot>*{max-width:100%}
#ajRoot .aj-s{color:#B9CAD6;font-size:.9em}#ajRoot .aj-n{font-size:.85em}#ajRoot a{color:#D4ECF5}
#ajRoot .aj-f{display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin:6px 0}
#view #ajRoot .aj-f>input[type=search]{width:auto!important;flex:1 1 220px!important;min-width:0;height:30px;padding:0 8px;border:1px solid #D4ECF544;border-radius:4px;background:#0A1428;color:#fff;margin:0!important}
#ajRoot .aj-f select{height:30px;max-width:100%}
#ajRoot table.aj-t{width:100%;border-collapse:collapse}
#ajRoot .aj-t th{text-align:left;color:#B9CAD6;border-bottom:1px solid #D4ECF544;padding:3px 6px;font-weight:600}
#ajRoot .aj-t td{border-bottom:1px solid #D4ECF51f;padding:4px 6px;vertical-align:top}#ajRoot .aj-nw{white-space:nowrap}
#ajRoot .aj-credit{margin-top:10px}`;document.head.appendChild(css);
 if(typeof STATE!=='undefined'&&STATE.view==='alljobs'&&!document.getElementById('ajRoot')&&typeof render==='function')render();
})();

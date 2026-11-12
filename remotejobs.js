/* Remote Jobs: entry-level remote jobs (no experience, entry level and early career), from employer job feeds.
   Data: data/remotejobs.json (research snapshot, compact rows). No boxes. */
(function(){
 let D=null,asked=false,err=false,lim=100;
 const st={q:'',grp:'',sub:'',emp:'',agency:'',hideX:'1',sort:'easy'};
 const X=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
 const uniq=a=>[...new Set(a.filter(Boolean))].sort((x,y)=>x.localeCompare(y));
 const GC=['sj-none','sj-none','sj-none','sj-pref','sj-req'];
 function load(){if(asked)return;asked=true;fetch('data/remotejobs.json?d='+new Date().toISOString().slice(0,10)).then(r=>{if(!r.ok)throw new Error(r.status);return r.json()}).then(j=>{const c=j.cols;j.jobs=j.jobs.map(r=>{const o={};c.forEach((k,i)=>o[k]=r[i]);o._s=(o.emp+' '+o.title+' '+o.sub+' '+o.loc+' '+o.exp).toLowerCase();return o});D=j;fill()}).catch(()=>{err=true;asked=false;fill()})}
 const opt=(id,k,first,vals,lab)=>{const s=document.getElementById(id);if(s.options.length<2)s.innerHTML='<option value="">'+first+'</option>'+vals.map(v=>'<option value="'+X(v)+'">'+X(lab?lab(v):v)+'</option>').join('');s.value=st[k]};
 function fill(){const root=document.getElementById('rmRoot');if(!root)return;const B=root.querySelector('#rmBody');
  if(err){B.innerHTML='<p>Couldn’t load remote jobs. <button type="button" id="rmRetry">Retry</button></p>';return}
  if(!D){B.innerHTML='<p>Loading remote jobs…</p>';return}
  opt('rmGrp','grp','Any experience level',['0','1','2','3','4'],k=>D.groups[k]);
  opt('rmSub','sub','All kinds of work',uniq(D.jobs.map(j=>j.sub)));
  opt('rmEmp','emp','All employers',uniq(D.jobs.map(j=>j.emp)));
  root.querySelector('#rmAgency').value=st.agency;root.querySelector('#rmHideX').checked=st.hideX==='1';root.querySelector('#rmSort').value=st.sort;
  const q=st.q.trim().toLowerCase();
  const rows=D.jobs.filter(j=>(st.grp===''||String(j.grp)===st.grp)&&(!st.sub||j.sub===st.sub)&&(!st.emp||j.emp===st.emp)&&(!st.agency||String(j.agency)===st.agency)&&(st.hideX!=='1'||j.rif!==2)&&(!q||j._s.includes(q)));
  if(st.sort==='easy')rows.sort((a,b)=>(a.grp-b.grp)||a.emp.localeCompare(b.emp));
  else if(st.sort==='pay')rows.sort((a,b)=>(!!b.pay-!!a.pay)||(a.grp-b.grp));
  else rows.sort((a,b)=>a.emp.localeCompare(b.emp)||a.title.localeCompare(b.title));
  const hidden=st.hideX==='1'?D.jobs.filter(j=>j.rif===2).length:0;
  root.querySelector('#rmCount').textContent=rows.length+' job'+(rows.length===1?'':'s')+(hidden?' ('+hidden+' that exclude Rhode Island hidden)':'')+(D.listing_check?' · closed listings removed daily, last check '+D.listing_check.date:'');
  B.innerHTML=rows.length?'<div class="sj-scroll"><table class="sj-t"><thead><tr><th>Job</th><th>Experience</th><th>Where you can work from</th><th>Pay · type</th></tr></thead><tbody>'+rows.slice(0,lim).map(j=>'<tr><td><a href="'+X(j.url)+'" target="_blank" rel="noopener"><b>'+X(j.title)+'</b></a><br><span class="sj-s">'+X(j.emp)+(j.agency?' · <b>staffing agency</b>':'')+' · '+X(j.sub)+'</span>'+(j.links&&j.links.length>1?'<br><span class="sj-s">Also posted: '+j.links.slice(1).map((u,i)=>'<a class="sj-src" href="'+X(u)+'" target="_blank" rel="noopener">'+(i+2)+'</a>').join(' ')+'</span>':'')+'</td>'
   +'<td><span class="sj-lv '+GC[j.grp]+'">'+X(D.groups[j.grp])+'</span><br><span class="sj-s">'+X(j.exp)+'</span></td>'
   +'<td>'+X(j.loc)+'<br><span class="'+(j.rif===2?'sj-req':'sj-s')+'">Rhode Island: '+X(j.ri)+'</span>'+(j.notes?'<br><span class="sj-s sj-n">'+X(j.notes)+'</span>':'')+'</td>'
   +'<td>'+(j.pay?X(j.pay):'<span class="sj-s">Pay not published</span>')+(j.type?'<br><span class="sj-s">'+X(j.type)+'</span>':'')+(j.close?'<br>Closes '+X(j.close):'')+'</td></tr>').join('')+'</tbody></table></div>'+(rows.length>lim?'<button type="button" id="rmMore">Show more ('+(rows.length-lim)+' left)</button>':''):'<p>No jobs match. Try fewer filters.</p>'}
 window.vRemoteJobs=function(){setTimeout(()=>{load();const r=document.getElementById('rmRoot');if(r)r.querySelector('#rmQ').value=st.q;fill()},0);
  return '<section class="box sj" id="rmRoot">'+(window.jobTabs?jobTabs('remotejobs'):'')+'<h2>Entry-Level Remote Jobs</h2>'
   +'<p class="sj-s">Remote jobs that need no experience, are labeled entry level by the employer, or ask for two years or less, taken from employer and staffing-agency job feeds on Nov. 12, 2026. “Early career” jobs still require up to two years; they are not no-experience jobs.</p>'
   +'<p class="mj-note"><b>Public records, verify when needed.</b> “Remote” rarely means anywhere: most postings limit which countries or states you can work from, and none of these has been confirmed open to Rhode Island residents. Check eligibility, pay and terms on the employer’s page before applying. Many AI-training and freelance projects don’t guarantee hours or pay. Never pay to apply. Rhode Island Hurricane is not the employer and does not take applications.</p>'
   +'<div class="sj-f"><input type="search" id="rmQ" placeholder="Search a job, employer or skill" aria-label="Search remote jobs">'
   +'<select id="rmGrp" aria-label="Experience"></select><select id="rmSub" aria-label="Kind of work"></select><select id="rmEmp" aria-label="Employer"></select>'
   +'<select id="rmAgency" aria-label="Employer type"><option value="">Employers and agencies</option><option value="0">Direct employers only</option><option value="1">Staffing agencies only</option></select>'
   +'<select id="rmSort" aria-label="Sort"><option value="easy">Least experience first</option><option value="pay">Pay published first</option><option value="emp">By employer</option></select>'
   +'<label class="sj-s"><input type="checkbox" id="rmHideX" checked> Hide jobs that exclude Rhode Island</label>'
   +'<button type="button" id="rmClear">Clear</button> <span id="rmCount" class="sj-s"></span></div>'
   +'<div id="rmBody"></div></section>'};
 document.addEventListener('input',e=>{const t=e.target;if(!t.closest||!t.closest('#rmRoot'))return;
  if(t.id==='rmHideX'){st.hideX=t.checked?'1':'';lim=100;fill();return}
  const m={rmQ:'q',rmGrp:'grp',rmSub:'sub',rmEmp:'emp',rmAgency:'agency',rmSort:'sort'}[t.id];if(!m)return;st[m]=t.value;lim=100;fill()});
 document.addEventListener('click',e=>{const t=e.target;if(!t.closest||!t.closest('#rmRoot'))return;
  if(t.id==='rmMore'){lim+=200;fill()}else if(t.id==='rmRetry'){err=false;load();fill()}
  else if(t.id==='rmClear'){Object.assign(st,{q:'',grp:'',sub:'',emp:'',agency:'',hideX:'1',sort:'easy'});document.getElementById('rmQ').value='';lim=100;fill()}});
 const css=document.createElement('style');css.textContent=`#view #rmRoot{display:block!important}#rmRoot #rmMore{all:unset;cursor:pointer;display:block;margin:8px auto;padding:3px 8px;border:1px solid #D4ECF566;border-radius:4px;color:#D4ECF5}#rmRoot label{display:inline-flex;gap:4px;align-items:center}`;document.head.appendChild(css);
 if(typeof STATE!=='undefined'&&STATE.view==='remotejobs'&&!document.getElementById('rmRoot')&&typeof render==='function')render();
})();

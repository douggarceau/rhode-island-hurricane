/* Tech Jobs: entry-level IT support, field technology, software and technical jobs in Rhode Island, lowest experience first.
   Data: data/techjobs.json (research snapshot). Compact rows, no boxes. */
(function(){
 let D=null,asked=false,err=false;
 const st={q:'',status:''};
 const X=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
 const linkify=s=>X(s).replace(/\b(\d{3}-\d{3}-\d{4})\b/g,m=>'<a href="tel:'+m.replace(/-/g,'')+'">'+m+'</a>').replace(/\b([\w.+-]+@[\w-]+(?:\.[\w-]+)+)\b/g,'<a href="mailto:$1">$1</a>');
 const STAT={verified:['Checked on the employer’s own job page','sj-none'],indexed:['On the employer’s site; page could not be opened, so reconfirm','sj-pref'],employer_ad:['Employer’s ad on LinkedIn; confirm on the employer’s site','sj-pref'],lead:['Lead: seen on a job board; confirm with the employer before applying','sj-req']};
 function load(){if(asked)return;asked=true;fetch('data/techjobs.json?d='+new Date().toISOString().slice(0,10)).then(r=>{if(!r.ok)throw new Error(r.status);return r.json()}).then(j=>{D=j;fill()}).catch(()=>{err=true;asked=false;fill()})}
 function fill(){const root=document.getElementById('tjRoot');if(!root)return;const B=root.querySelector('#tjBody');
  if(err){B.innerHTML='<p>Couldn’t load Tech Jobs. <button type="button" id="tjRetry">Retry</button></p>';return}
  if(!D){B.innerHTML='<p>Loading…</p>';return}
  root.querySelector('#tjStatus').value=st.status;
  const q=st.q.trim().toLowerCase();
  const jobs=D.jobs.filter(j=>(!st.status||(st.status==='ok'?j.status!=='lead':j.status==='lead'))&&(!q||JSON.stringify(j).toLowerCase().includes(q))).sort((a,b)=>a.rank-b.rank);
  root.querySelector('#tjCount').textContent=jobs.length+' job'+(jobs.length===1?'':'s')+(D.listing_check?' · closed listings removed daily, last check '+D.listing_check.date:'');
  let h='<div class="sj-scroll"><table class="sj-t"><thead><tr><th>#</th><th>Job</th><th>Experience · education</th><th>Pay</th><th>The work · conditions</th></tr></thead><tbody>'
   +(jobs.map(j=>{const s=STAT[j.status];return '<tr><td class="tj-r">'+j.rank+'</td><td><a href="'+X(j.url)+'" target="_blank" rel="noopener"><b>'+X(j.title)+'</b></a><br><span class="sj-s">'+X(j.employer)+' · '+X(j.location)+'</span>'+(j.job_id?'<br><span class="sj-s">Job ID '+X(j.job_id)+'</span>':'')+'<br><span class="sj-lv '+s[1]+'">'+s[0]+'</span>'
    +(j.ad_url?'<br><a class="sj-src" href="'+X(j.ad_url)+'" target="_blank" rel="noopener">job-board ad</a>':'')+(j.apply_url?' <a class="sj-src" href="'+X(j.apply_url)+'" target="_blank" rel="noopener">employer application</a>':'')+(j.site_url?' <a class="sj-src" href="'+X(j.site_url)+'" target="_blank" rel="noopener">employer site</a>':'')+'</td>'
    +'<td><b>'+X(j.experience)+'</b><br><span class="sj-s">'+X(j.education||'')+'</span></td>'
    +'<td>'+X(j.pay)+'</td>'
    +'<td>'+X(j.work)+'<br><span class="sj-s">'+X(j.conditions||'')+'</span>'+(j.contact?'<br><span class="sj-s">'+linkify(j.contact)+'</span>':'')+'</td></tr>'}).join('')||'<tr><td colspan="5">No jobs match.</td></tr>')+'</tbody></table></div>';
  if(!st.status){const tr=D.training.filter(t=>!q||JSON.stringify(t).toLowerCase().includes(q));
   if(tr.length)h+='<h3>Paid apprenticeships and training</h3><p class="sj-s">Routes into tech work. These are programs, not open jobs.</p><ul class="sj-l">'+tr.map(t=>'<li><b>'+X(t.name)+'</b><br>'+X(t.summary)+(t.contact?'<br>Contact: '+linkify(t.contact):'')+' '+t.links.map((u,i)=>'<a class="sj-src" href="'+X(u)+'" target="_blank" rel="noopener">'+(i?'more':'source')+'</a>').join(' ')+'</li>').join('')+'</ul>'}
  B.innerHTML=h}
 window.vTechJobs=function(){setTimeout(()=>{load();const r=document.getElementById('tjRoot');if(r)r.querySelector('#tjQ').value=st.q;fill()},0);
  return '<section class="box sj" id="tjRoot">'+(window.jobTabs?jobTabs('techjobs'):'')+'<h2>Rhode Island Tech Jobs: Entry Level</h2>'
   +'<p class="sj-s">IT support, field technology, software and technical jobs at Rhode Island workplaces, ordered by how little experience the employer says it requires. Required and preferred experience are kept separate. Researched Nov. 12, 2026: a shortlist, not every opening in the state.</p>'
   +'<p class="mj-note"><b>Public records, verify when needed.</b> A visible posting doesn’t guarantee the job is still open. Pay is the advertised amount, not a promised offer. Several listings are marked as leads that still need confirmation with the employer. Rhode Island Hurricane is not the employer and does not take applications.</p>'
   +'<div class="sj-f"><input type="search" id="tjQ" placeholder="Search a job, employer, town or skill" aria-label="Search tech jobs">'
   +'<select id="tjStatus" aria-label="Verification"><option value="">All listings and leads</option><option value="ok">Employer-posted only</option><option value="lead">Leads to confirm</option></select>'
   +'<button type="button" id="tjClear">Clear</button> <span id="tjCount" class="sj-s"></span></div>'
   +'<div id="tjBody"></div></section>'};
 document.addEventListener('input',e=>{const t=e.target;if(!t.closest||!t.closest('#tjRoot'))return;if(t.id==='tjQ')st.q=t.value;else if(t.id==='tjStatus')st.status=t.value;else return;fill()});
 document.addEventListener('click',e=>{const t=e.target;if(!t.closest||!t.closest('#tjRoot'))return;
  if(t.id==='tjRetry'){err=false;load();fill()}else if(t.id==='tjClear'){st.q='';st.status='';document.getElementById('tjQ').value='';fill()}});
 const css=document.createElement('style');css.textContent=`#view #tjRoot{display:block!important}#tjRoot .tj-r{color:#B9CAD6;width:1.5em}`;document.head.appendChild(css);
 if(typeof STATE!=='undefined'&&STATE.view==='techjobs'&&!document.getElementById('tjRoot')&&typeof render==='function')render();
})();

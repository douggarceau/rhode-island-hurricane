/* AI Jobs: AI-related job listings in Rhode Island, nearby, remote and worldwide, from employer career feeds.
   Data: data/aijobs.json (research snapshot, compact rows). No boxes. */
(function(){
 let D=null,asked=false,err=false,lim=100;
 const st={q:'',geo:'',lvl:'',arr:'',type:'',cat:'',emp:'',sort:'geo'};
 const X=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
 const uniq=a=>[...new Set(a.filter(Boolean))].sort((x,y)=>x.localeCompare(y));
 const day=s=>{if(!s)return '';const t=new Date(s.slice(0,10)+'T12:00:00');return isNaN(t)?s:t.toLocaleDateString('en-US',{month:'short',day:'numeric'})};
 const LC={'0':'sj-none','1':'sj-none','2':'sj-pref','3':'sj-req','4':'sj-req','5':'sj-req','U':'sj-s'};
 const LORD={'0':0,'1':1,'2':2,'U':3,'3':4,'4':5,'5':6};
 function load(){if(asked)return;asked=true;fetch('data/aijobs.json?d='+new Date().toISOString().slice(0,10)).then(r=>{if(!r.ok)throw new Error(r.status);return r.json()}).then(j=>{const c=j.cols;j.jobs=j.jobs.map(r=>{const o={};c.forEach((k,i)=>o[k]=r[i]);o._s=(o.emp+' '+o.title+' '+o.cat+' '+o.loc).toLowerCase();return o});D=j;fill()}).catch(()=>{err=true;asked=false;fill()})}
 const opt=(id,first,vals,lab)=>{const s=document.getElementById(id);if(s.options.length<2)s.innerHTML='<option value="">'+first+'</option>'+vals.map(v=>'<option value="'+X(v)+'">'+X(lab?lab(v):v)+'</option>').join('');s.value=st[{aiGeo:'geo',aiLvl:'lvl',aiArr:'arr',aiType:'type',aiCat:'cat',aiEmp:'emp'}[id]]};
 function fill(){const root=document.getElementById('aiRoot');if(!root)return;const B=root.querySelector('#aiBody');
  if(err){B.innerHTML='<p>Couldn’t load AI jobs. <button type="button" id="aiRetry">Retry</button></p>';return}
  if(!D){B.innerHTML='<p>Loading AI jobs…</p>';return}
  opt('aiGeo','Anywhere',D.geos.map((g,i)=>String(i)),i=>D.geos[i]);
  opt('aiLvl','Any level',['0','1','2','3','4','5','U'],k=>D.levels[k]);
  opt('aiArr','Any work arrangement',['Remote','Hybrid','On-site']);
  opt('aiType','Jobs, internships and contracts',uniq(D.jobs.map(j=>j.type)));
  opt('aiCat','All AI fields',uniq(D.jobs.map(j=>j.cat)));
  opt('aiEmp','All employers',uniq(D.jobs.map(j=>j.emp)));
  root.querySelector('#aiSort').value=st.sort;
  const q=st.q.trim().toLowerCase();
  const rows=D.jobs.filter(j=>(st.geo===''||String(j.geo)===st.geo)&&(!st.lvl||j.lvl===st.lvl)&&(!st.arr||j.arr.includes(st.arr))&&(!st.type||j.type===st.type)&&(!st.cat||j.cat===st.cat)&&(!st.emp||j.emp===st.emp)&&(!q||j._s.includes(q)));
  if(st.sort==='geo')rows.sort((a,b)=>(a.geo-b.geo)||(LORD[a.lvl]-LORD[b.lvl]));
  else if(st.sort==='lvl')rows.sort((a,b)=>(LORD[a.lvl]-LORD[b.lvl])||(a.geo-b.geo));
  else rows.sort((a,b)=>(b.posted||'').localeCompare(a.posted||''));
  root.querySelector('#aiCount').textContent=rows.length.toLocaleString()+' listing'+(rows.length===1?'':'s')+(D.listing_check?' · closed listings removed daily, last check '+D.listing_check.date:'');
  B.innerHTML=rows.length?'<div class="sj-scroll"><table class="sj-t"><thead><tr><th>Job</th><th>Where</th><th>Level</th><th>Pay</th><th>Dates</th></tr></thead><tbody>'+rows.slice(0,lim).map(j=>'<tr><td><a href="'+X(j.url)+'" target="_blank" rel="noopener"><b>'+X(j.title)+'</b></a><br><span class="sj-s">'+X(j.emp)+' · '+X(j.cat)+(j.type!=='Role posting'?' · <b>'+X(j.type)+'</b>':'')+'</span></td>'
   +'<td>'+X(j.loc.length>90?j.loc.slice(0,90)+'…':j.loc)+'<br><span class="sj-s">'+X(D.geos[j.geo])+(j.arr&&j.arr!=='Not published'?' · '+X(j.arr):'')+'</span>'+(j.elig?'<br><span class="sj-s sj-n">'+X(j.elig)+'</span>':'')+'</td>'
   +'<td><span class="sj-lv '+LC[j.lvl]+'">'+X(D.levels[j.lvl])+'</span>'+(j.exp?'<br><span class="sj-s">'+X(j.exp)+'</span>':'')+'</td>'
   +'<td>'+(j.pay?X(j.pay):'<span class="sj-s">not published</span>')+'</td>'
   +'<td class="ai-nw">'+(j.posted?'<span class="sj-s">Posted '+day(j.posted)+'</span>':'')+(j.deadline?'<br>Apply by '+day(j.deadline):'')+'</td></tr>').join('')+'</tbody></table></div>'+(rows.length>lim?'<button type="button" id="aiMore">Show more ('+(rows.length-lim)+' left)</button>':''):'<p>No listings match. Try fewer filters.</p>'}
 window.vAIJobs=function(){setTimeout(()=>{load();const r=document.getElementById('aiRoot');if(r)r.querySelector('#aiQ').value=st.q;fill()},0);
  return '<section class="box sj" id="aiRoot">'+(window.jobTabs?jobTabs('aijobs'):'')+'<h2>AI Jobs: Rhode Island, Nearby &amp; Worldwide</h2>'
   +'<p class="sj-s">AI-related listings from 32 employers (500 at first collection), taken from the employers’ own job feeds and career pages on Nov. 12, 2026. Rhode Island jobs come first, then Massachusetts and Connecticut, remote, the rest of the U.S. and international. Level labels are our reading of each posting’s published experience; “level not stated” is not entry level.</p>'
   +'<p class="mj-note"><b>Public records, verify when needed.</b> Each listing is one employer posting, not a guaranteed opening. Jobs close and pay, location and eligibility rules change: check the employer’s page before applying. Published pay ranges are not promised offers. Rhode Island Hurricane is not the employer and does not take applications.</p>'
   +'<div class="sj-f"><input type="search" id="aiQ" placeholder="Search a job, employer, skill or city" aria-label="Search AI jobs">'
   +'<select id="aiGeo" aria-label="Where"></select><select id="aiLvl" aria-label="Level"></select><select id="aiArr" aria-label="Work arrangement"></select>'
   +'<select id="aiType" aria-label="Type"></select><select id="aiCat" aria-label="Field"></select><select id="aiEmp" aria-label="Employer"></select>'
   +'<select id="aiSort" aria-label="Sort"><option value="geo">Rhode Island first</option><option value="lvl">Least experience first</option><option value="new">Newest first</option></select>'
   +'<button type="button" id="aiClear">Clear</button> <span id="aiCount" class="sj-s"></span></div>'
   +'<div id="aiBody"></div></section>'};
 document.addEventListener('input',e=>{const t=e.target;if(!t.closest||!t.closest('#aiRoot'))return;
  const m={aiQ:'q',aiGeo:'geo',aiLvl:'lvl',aiArr:'arr',aiType:'type',aiCat:'cat',aiEmp:'emp',aiSort:'sort'}[t.id];if(!m)return;st[m]=t.value;lim=100;fill()});
 document.addEventListener('click',e=>{const t=e.target;if(!t.closest||!t.closest('#aiRoot'))return;
  if(t.id==='aiMore'){lim+=200;fill()}else if(t.id==='aiRetry'){err=false;load();fill()}
  else if(t.id==='aiClear'){Object.assign(st,{q:'',geo:'',lvl:'',arr:'',type:'',cat:'',emp:'',sort:'geo'});document.getElementById('aiQ').value='';lim=100;fill()}});
 const css=document.createElement('style');css.textContent=`#view #aiRoot{display:block!important}#aiRoot .ai-nw{white-space:nowrap}#aiRoot #aiMore{all:unset;cursor:pointer;display:block;margin:8px auto;padding:3px 8px;border:1px solid #D4ECF566;border-radius:4px;color:#D4ECF5}`;document.head.appendChild(css);
 if(typeof STATE!=='undefined'&&STATE.view==='aijobs'&&!document.getElementById('aiRoot')&&typeof render==='function')render();
})();

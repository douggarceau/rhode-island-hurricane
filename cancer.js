/* Cancer Help & Recovery: third tab of Help & Benefits. 72 nationwide programs and benefit routes (data/cancer.json,
   built by tools/cancer/cancer_build.py from the Nov. 10, 2026 research). Free for everyone, no sign-up, no locks.
   Rules kept: no eligibility verdicts; closed and ended funds are kept out of the default list and never get an "Apply" button;
   maximum awards are labeled as ceilings; navigation, grants, coverage and donated services are labeled separately;
   "after treatment" is shown on every card. Nothing chosen here is saved or sent anywhere. */
(function(){
 const X=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const okUrl=u=>/^https?:\/\//i.test(String(u||''));
 const telA=p=>'<a class="hp-tel" href="tel:+1'+p.replace(/\D/g,'')+'">'+X(p)+'</a>';
 const telify=s=>X(s).replace(/(?<![\d-])(\d{3}-\d{3}-\d{4})(?![\d-])/g,m=>telA(m));
 let C=null,asked=false;
 function load(){if(asked)return;asked=true;fetch('data/cancer.json?'+Math.floor(Date.now()/6e5),{cache:'no-store'}).then(r=>r.json()).then(j=>{C=j;if(window.__hpRedraw)__hpRedraw()}).catch(()=>{asked=false})}
 const POST={yes:['After treatment: yes','#2F5B4F'],conditional:['After treatment: with limits','#6b5a00'],no:['Active treatment only','#7a2a2a'],not_published:['After treatment: not stated, ask','#4a5563']};
 const STAT={open:['Open (checked Nov. 10)','#2F5B4F'],variable:['Status varies by fund','#6b5a00'],waitlist:['Waitlist','#6b5a00'],closed:['Closed now','#7a2a2a'],ended:['Ended','#7a2a2a'],not_confirmed:['Ongoing program · status not confirmed','#4a5563']};
 const SCOPE={national:'Nationwide',state_administered:'Through your state',local_network:'Depends on local provider',regional:'New England only'};
 const ROUTE={self:'You can apply yourself',professional:'Your care team must apply',either:'You or your care team can apply'};
 const TYPES=[['prostate','Prostate'],['breast','Breast'],['blood','Blood cancers'],['pancreatic','Pancreatic'],['colorectal','Colorectal'],['ovarian','Ovarian'],['brain','Brain'],['sarcoma','Sarcoma'],['childhood','Childhood cancer']];
 const WINDOWED=[22,56,62];const SURVIVOR_ONLY=[25,56,72];
 const nOf=r=>r.research_entry_ids[0];
 function pass(r,st,skipCat){
  if(!skipCat&&st.ccat&&!r.categories.includes(st.ccat))return false;
  const stt=st.cstat||'avail';
  if(stt==='avail'&&['closed','ended'].includes(r.application_status))return false;
  if(stt==='open'&&r.application_status!=='open')return false;
  if(st.cstage==='active'&&SURVIVOR_ONLY.includes(nOf(r)))return false;
  if(st.cstage==='after'&&r.post_treatment_eligibility==='no')return false;
  if(st.cstage==='long'&&(r.post_treatment_eligibility==='no'||WINDOWED.includes(nOf(r))))return false;
  if(st.cstage==='caregiver'&&!/caregiver|famil|loved one|relative|spouse|guardian/i.test(r.eligibility_text+' '+r.summary+' '+r.application_instructions))return false;
  if(st.ctype&&!(r.cancer_types.includes('all')||r.cancer_types.includes(st.ctype)))return false;
  if(st.ctype==='childhood'&&r.age_groups.length&&!r.age_groups.includes('child'))return false;
  if(st.cage&&r.age_groups.length&&!r.age_groups.includes(st.cage)&&!r.age_groups.includes('any_disabled'))return false;
  if(st.cage&&st.cage!=='adult'&&r.age_groups.includes('adult')&&st.cage==='child')return false;
  if(st.cscope&&r.geographic_scope!==st.cscope)return false;
  if(st.croute&&!(r.application_route===st.croute||r.application_route==='either'))return false;
  if(st.cmode&&r.mode!==st.cmode)return false;
  if(st.cnoinc&&r.income_test)return false;
  const q=(st.cq||'').trim().toLowerCase();if(q&&!(r.title+' '+r.summary+' '+r.eligibility_text+' '+r.cancer_types.join(' ')+' '+r.categories.join(' ')+' '+r.amount_text).toLowerCase().includes(q))return false;
  return true}
 const badge=(a)=>'<span class="hp-role" style="background:'+a[1]+'">'+X(a[0])+'</span>';
 const isMax=s=>/up to|maximum|averag|lists \$|\$[\d,]+/i.test(s);
 function card(r,H){const n=nOf(r),p=POST[r.post_treatment_eligibility],s=STAT[r.application_status];
  const closed=['closed','ended'].includes(r.application_status);
  const link=okUrl(r.application_url)?'<a class="hp-go cn-act" href="'+X(r.application_url)+'" target="_blank" rel="noopener noreferrer">'+X(closed&&r.action==='Apply'?'Check eligibility':r.action)+' ›</a>':'';
  const ri=(r.ri_links||[]).map(l=>{const o=l.kind==='b'?(H&&H.benefits||[]).find(b=>b.id===l.id):(H&&H.services||[]).find(x=>x.id===l.id);if(!o)return '';
   return '<button type="button" class="cn-ri" data-cnri="'+X(l.kind)+'|'+X(l.kind==='b'?o.name:((o.cats||[])[0]||''))+'">Rhode Island: '+X(o.name)+' ›</button>'}).filter(Boolean).join(' ');
  return '<details class="hp-card"><summary><span class="cn-badges">'+badge(s)+badge(p)+'<span class="hp-warn" style="background:#29405e">'+X(SCOPE[r.geographic_scope])+'</span>'+(r.application_route==='professional'?'<span class="hp-warn">Care team must apply</span>':'')+'</span>'+
   '<b>'+X(r.program_name)+'</b>'+(r.organization!==r.program_name?'<span class="hp-org">'+X(r.organization)+'</span>':'')+'<span class="hp-desc">'+X(r.summary)+'</span>'+
   (closed||r.application_status==='variable'||n===66?'<span class="cn-stat">⚠ '+X(r.application_status_notes)+'</span>':'')+
   (r.post_treatment_eligibility!=='yes'?'<span class="cn-post"><strong>After treatment:</strong> '+X(r.post_treatment_notes)+'</span>':'')+
   '<span class="hp-tags"><i>'+X(r.amount_text.length>110?r.amount_text.slice(0,107)+'…':r.amount_text)+'</i>'+(isMax(r.amount_text)?'<i class="cn-max">A maximum, not a promise</i>':'')+(r.cancer_types[0]!=='all'?'<i>'+X(r.cancer_types.join(', '))+' cancer</i>':'<i>All cancers</i>')+(r.age_notes?'<i>'+X(r.age_notes)+'</i>':'')+(r.income_test?'<i>Income rules apply</i>':'')+'</span>'+
   '<span class="hp-call">'+(r.phones.length?'📞 '+r.phones.map(telA).join(' · ')+' ':'')+link+'</span>'+
   '<span class="hp-avail">Source reviewed '+X(r.source_reviewed_at)+(r.last_reverified_at?'; status rechecked '+X(r.last_reverified_at):'')+'. This is not an eligibility decision.</span></summary><div class="hp-more">'+
   row('Who qualifies',r.eligibility_text)+row('After treatment',r.post_treatment_notes)+row('Amount or cost',r.amount_text+(isMax(r.amount_text)?' A published maximum or typical amount is not a guaranteed award.':''))+
   '<p class="hp-row"><em>How to apply</em> '+telify(r.application_instructions)+' <strong>'+X(ROUTE[r.application_route])+'.</strong></p>'+
   row('Application status',r.application_status_notes+' (as of '+r.status_as_of+')')+(r.research_status_text!==r.application_status_notes?row('Research note',r.research_status_text):'')+
   row('Where',SCOPE[r.geographic_scope]+(r.mode==='local'?'; in person or through a local provider.':'; by phone or online.'))+
   (ri?'<p class="hp-row"><em>Already in Help &amp; Benefits</em> '+ri+'</p>':'')+
   '<p class="hp-src">Official sources: '+r.sources.filter(x=>okUrl(x.url)).map((x,i)=>'<a href="'+X(x.url)+'" target="_blank" rel="noopener noreferrer">'+(i+1)+'</a>').join(' ')+' · research entry #'+n+'</p></div></details>'}
 const row=(k,v)=>'<p class="hp-row"><em>'+X(k)+'</em> '+X(v||'Not published')+'</p>';
 const sel=(k,label,opts,st,any)=>'<label>'+X(label)+'<select data-hp="'+k+'"><option value="">'+X(any||'Any')+'</option>'+opts.map(([v,t])=>'<option value="'+X(v)+'"'+(st[k]===v?' selected':'')+'>'+X(t)+'</option>').join('')+'</select></label>';
 window.hpCancer=function(st,H){load();if(!C)return '<p class="hp-note">Loading…</p>';
  const cats=C.meta.categories;const cnt={};let all=0;for(const r of C.records){if(!pass(r,st,true))continue;all++;for(const c of r.categories)cnt[c]=(cnt[c]||0)+1}
  const L=C.records.filter(r=>pass(r,st)).sort((a,b)=>(a.application_status==='closed')-(b.application_status==='closed')||nOf(a)-nOf(b));
  const hid=C.records.filter(r=>['closed','ended'].includes(r.application_status)).length;
  const seniors=!!document.querySelector('#nav [data-go="seniors"]');
  return '<div class="cn-intro"><p><b>For people in treatment, recovering, living with lasting effects, and caregivers.</b> Money and grants, disability, medical bills, food and utilities, rides and lodging, help at home, and recovery. Nationwide, plus one New England program for Rhode Islanders. All ages and cancer types.</p>'+
   '<p class="cn-tip"><b>Best first step:</b> ask your oncology social worker: “Please screen me for financial assistance, disability benefits, hospital bill reductions, medication help, transportation, home services and survivorship rehabilitation, including programs that accept people after treatment, and tell me which applications your office must submit.”</p>'+
   '<p class="cn-x">Also on this site: <button type="button" class="cn-ri" data-go="mh">Mental health &amp; support groups ›</button>'+(seniors?' <button type="button" class="cn-ri" data-go="seniors">Seniors ›</button>':'')+' <button type="button" class="cn-ri" data-cnfind="Transportation">Local rides ›</button> <button type="button" class="cn-ri" data-cnfind="Household assistance">Local help at home ›</button></p></div>'+
   '<div class="mh-cats cn-cats"><button type="button" data-cnc="" class="'+(st.ccat?'':'on')+'">All <small>'+all+'</small></button>'+cats.map(([k,t])=>'<button type="button" data-cnc="'+k+'" class="'+(st.ccat===k?'on':'')+'">'+X(t)+' <small>'+(cnt[k]||0)+'</small></button>').join('')+'</div>'+
   '<div class="hp-filters">'+
    '<label class="hp-wide">Search<input data-hp="cq" type="search" placeholder="e.g. rent, prostate, rides, copay" value="'+X(st.cq)+'"></label>'+
    sel('cstage','Where you are now',[['active','In active treatment'],['after','Finished treatment / recovering'],['long','Longer-term survivor'],['caregiver','Caregiver or family']],st,'Any stage')+
    sel('ctype','Cancer type',TYPES,st,'All cancers')+
    sel('cage','Age group',[['child','Child or teen'],['young','Young adult (18–39)'],['senior','65+ or on Medicare']],st,'Any age')+
    sel('cscope','Where it works',Object.entries(SCOPE),st,'Anywhere')+
    sel('croute','Who applies',[['self','I can apply myself'],['professional','My care team applies']],st,'Either')+
    sel('cmode','How',[['remote','Phone or online'],['local','In person / local provider']],st,'Any way')+
    sel('cstat','Status',[['open','Only open (checked Nov. 10)'],['all','Include closed and ended ('+hid+')']],st,'Available or not confirmed')+
    '<label class="hp-chk"><input type="checkbox" data-hp="cnoinc"'+(st.cnoinc?' checked':'')+'> Only programs with no published income test</label></div>'+
   '<p class="hp-count" role="status" aria-live="polite"><b>'+L.length+'</b> programs. These may be worth checking; this list doesn’t decide who qualifies. '+((st.cstat||'')!=='all'?hid+' closed or ended programs hidden.':'')+'</p>'+
   (L.length?L.map(r=>card(r,H)).join(''):'<p class="hp-note">Nothing matched. Try fewer filters, or call CancerCare’s free navigators at '+telA('800-813-4673')+'.</p>')+
   '<p class="hp-foot">'+X(C.meta.scope_note)+' Research of official sources Nov. 10, 2026; closed and time-sensitive statuses rechecked that day. Always confirm with the program.</p>'};
 document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('[data-cnc],[data-cnri],[data-cnfind]');if(!b||!b.closest('.hp'))return;e.preventDefault();
  if(b.dataset.cnc!=null){if(window.hpOpen)hpOpen({tab:'cancer',ccat:b.dataset.cnc});return}
  if(b.dataset.cnfind){if(window.hpOpen)hpOpen({tab:'find',cat:b.dataset.cnfind});return}
  const i=b.dataset.cnri.indexOf('|'),k=b.dataset.cnri.slice(0,i),v=b.dataset.cnri.slice(i+1);if(!window.hpOpen)return;
  if(k==='b')hpOpen({tab:'benefits',view:'',bcat:'',closed:false,q:v});else hpOpen({tab:'find',cat:v})});
 const css=document.createElement('style');css.textContent=`
.cn-intro{margin:10px 18px}.cn-intro p{margin:5px 0;font:400 14px/1.45 Georgia,serif;color:#EEE9E5}.cn-tip{padding:10px 12px;border-left:4px solid #2F5B4F;background:#2F5B4F22}
.cn-badges{display:flex;flex-wrap:wrap;gap:6px}.cn-stat{font:600 14px/1.45 "Libre Franklin",system-ui,sans-serif;color:#E9C46A}.cn-post{font:400 15px/1.45 Georgia,serif;color:#EEE9E5}.cn-post b{font-size:15px;color:#fff}
.hp-tags i.cn-max{border-style:dashed;color:#E9C46A}.cn-act{display:inline-block;margin-left:6px}
.cn-ri{all:unset;cursor:pointer;margin:4px 10px 4px 0;font:700 15px/1.3 "Libre Franklin",system-ui,sans-serif;color:#D4ECF5;text-decoration:underline}
.cn-cats{margin:12px 18px 4px}.cn-cats button{all:unset;cursor:pointer;padding:6px 10px;border-radius:5px;border:1px solid #D4ECF566;font:700 13px/1.1 "Libre Franklin",system-ui,sans-serif;color:#fff}.cn-cats button small{opacity:.8;font-weight:600}.cn-cats button.on{background:#D4ECF5;color:#0A1428;border-color:#D4ECF5}
.cn-cats{display:flex;flex-wrap:wrap;gap:8px}.cn-ri:focus-visible,.cn-cats button:focus-visible{outline:3px solid #E9C46A;outline-offset:2px}
@media(max-width:560px){.cn-intro,.cn-cats{margin-left:8px;margin-right:8px}}`;document.head.appendChild(css);
})();

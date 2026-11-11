/* Help & Benefits tab: "Find help near me" (Senior Help Network, 148 services) and "Benefits & programs" (Benefits Intelligence Center, 144 records).
   Free for everyone. Independent and privately run. Data: data/help.json (built by tools/help/help_build.py).
   Rules from the research handoffs: "not published" is shown as written and never read as free, zero or no limit; no "available now" claims;
   closed and contact-only records are kept out of the main results; nothing typed here is stored or sent anywhere. */
(function(){
 const X=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const NP='not published';const np=v=>v==null||v===''||v===NP;
 const okUrl=u=>/^https?:\/\//i.test(String(u||''));
 const link=(u,t)=>okUrl(u)?'<a class="hp-go" href="'+X(u)+'" target="_blank" rel="noopener">'+X(t)+' ›</a>':'';
 const tels=p=>{if(np(p))return '';return String(p).split(/;\s*|\s+or\s+/).map(x=>{const d=x.replace(/[^\d]/g,'');const m=d.match(/^1?(\d{10})/);return m?'<a class="hp-tel" href="tel:+1'+m[1]+'">'+X(x.trim())+'</a>':X(x.trim())}).join(' · ')};
 const mail=e=>np(e)||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)?'':'<a href="mailto:'+X(e)+'">'+X(e)+'</a>';
 const JT=/jamestown/i.test(location.hostname+document.title);
 let H=null,asked=false,herr=false;
 const st={ccat:'',cstage:'',ctype:'',cage:'',cscope:'',croute:'',cmode:'',cstat:'',cq:'',cnoinc:false,tab:'find',town:JT?'Jamestown':'',cat:'',age:'',cost:'',home:false,ride:false,role:'',strict:false,prudence:'',zip:'',view:'',bcat:'',q:'',closed:false};
 try{const s=JSON.parse(sessionStorage.getItem('hpState')||'null');if(s)Object.assign(st,s,{town:s.town||st.town})}catch(_){}
 const save=()=>{try{sessionStorage.setItem('hpState',JSON.stringify({tab:st.tab,town:st.town,cat:st.cat,view:st.view}))}catch(_){}};
 const rr=()=>{try{if(typeof STATE!=='undefined'&&STATE.view==='help'&&typeof render==='function')render()}catch(_){}};
 function load(){if(asked)return;asked=true;herr=false;fetch('data/help.json?'+Math.floor(Date.now()/6e5),{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error(r.status);return r.json()}).then(j=>{H=j;rr()}).catch(()=>{asked=false;herr=true;rr()})}
 document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('[data-hpretry]');if(!b)return;e.preventDefault();herr=false;load();rr()});
 const ROLE={direct_service:'Provides the service',coordinated_service:'Arranges the service',financial_assistance:'Helps pay for it',referral_only:'Referral only'};
 const COST={free:'Free',donation:'Optional donation',subsidized:'Subsidized',membership:'Membership',paid:'Paid',mixed:'Mixed costs','not published':'Cost not published'};
 const HOME={yes:'Comes to your home',conditional:'May come to your home',no:'Not at home','not published':'Home service not published'};
 const age=()=>{const a=parseInt(st.age,10);return isNaN(a)?null:a};
 const numAge=v=>/^\s*\d+\s*$/.test(String(v==null?'':v))?parseInt(v,10):null;
 const ageTxt=(v,sfx)=>{if(np(v)||v===0||v==='0')return '';const n=numAge(v);return n!=null?'Age '+n+'+'+(sfx||''):'Age rules: '+String(v).replace(/[.\s]+$/,'')};
 const ageFit=s=>{const a=age();if(a==null)return '';const m=numAge(s.min_age);if(m==null)return np(s.min_age)?'Age rule not published':'See age rules';if(a>=m)return 'Meets published age ('+m+'+)';return np(s.age_ex)?'below':'Possible exception: '+s.age_ex};
 const prud=s=>/prudence/i.test((s.excluded||[]).join(' ')+' '+s.limits+' '+s.cov_notes);
 function findList(){const T=st.town;let out=[],hidden={age:0},local=[];
  for(const s of H.services){
   if(s.status==='closed')continue;
   if(T&&!(s.towns||[]).includes(T))continue;
   if(s.status==='contact_only'){local.push(s);continue}
   if(st.cat&&!(s.cats||[]).includes(st.cat))continue;
   if(st.strict&&s.cov!=='published')continue;
   if(st.cost==='free'&&s.cost_type!=='free')continue;
   if(st.cost==='freeish'&&!['free','donation'].includes(s.cost_type))continue;
   if(st.home&&!['yes','conditional'].includes(s.home))continue;
   if(st.ride&&!(s.transport==='yes'||s.transport==='conditional'||(s.cats||[]).includes('Transportation')))continue;
   if(st.role&&s.role!==st.role)continue;
   if(T==='Portsmouth'&&st.prudence==='yes'&&prud(s))continue;
   if(ageFit(s)==='below'){hidden.age++;continue}
   out.push(s)}
  out.sort((a,b)=>(a.cov==='published'?0:1)-(b.cov==='published'?0:1)||(a.role==='referral_only')-(b.role==='referral_only'));
  return {out,hidden,local}}
 function svcCard(s){const af=ageFit(s),cf=s.cov!=='published';
  return '<details class="hp-card"><summary><span class="hp-role">'+X(ROLE[s.role]||s.role)+'</span>'+(cf?'<span class="hp-warn">Confirm address / route</span>':'')+
   '<b>'+X(s.name)+'</b><span class="hp-org">'+X(s.org)+'</span><span class="hp-desc">'+X(s.desc)+'</span>'+
   '<span class="hp-tags"><i>'+X(COST[s.cost_type]||s.cost_type)+'</i><i>'+X(HOME[s.home]||s.home)+'</i>'+(s.transport==='yes'?'<i>Rides</i>':'')+(af&&af!=='below'?'<i>'+X(af)+'</i>':'')+'</span>'+
   '<span class="hp-call">'+(np(s.phone)?'Phone not published':'📞 '+tels(s.phone)+(np(s.phone_role)?'':' <small>('+X(s.phone_role)+')</small>'))+'</span>'+
   '<span class="hp-avail">Verified online '+X(s.verified)+'. Current availability: call to confirm.</span></summary><div class="hp-more">'+
   row('Cost',s.cost)+row('Who it’s for',[np(s.min_age)?'Age: not published':ageTxt(s.min_age),np(s.age_ex)?'':'Exceptions: '+s.age_ex,s.elig].filter(x=>x&&!np(x)).join('. '))+
   row('Income rules',s.income)+row('At home',s.home_scope)+row('Schedule',s.schedule)+row('Waiting list',s.wait)+row('Who does the work',s.workforce)+
   row('How to apply',s.apply)+row('Email',mail(s.email),1)+(cf?row('Coverage',s.cov_notes):'')+((s.excluded||[]).length?row('Not covered',s.excluded.join('; ')):'')+row('Limits',s.limits)+
   '<p class="hp-links">'+link(s.site,'Official website')+(okUrl(s.apply_link)?link(s.apply_link,'Apply'):'')+'</p>'+
   '<p class="hp-src">Sources: '+(s.sources||[]).filter(okUrl).map((u,i)=>'<a href="'+X(u)+'" target="_blank" rel="noopener">'+(i+1)+'</a>').join(' ')+'</p></div></details>'}
 const row=(k,v,raw)=>np(v)||v===''?'<p class="hp-row"><em>'+X(k)+'</em> not published</p>':'<p class="hp-row"><em>'+X(k)+'</em> '+(raw?v:X(v))+'</p>';
 function vFind(){const towns=H.meta.towns_list,cats=H.meta.categories;const T=st.town,TI=T&&H.towns[T];
  let h='<div class="hp-filters">'+
   '<label>Your town<select data-hp="town"><option value="">Choose a town…</option>'+towns.map(t=>'<option'+(t===T?' selected':'')+' value="'+X(t)+'">'+X(t==='New Shoreham'?'New Shoreham (Block Island)':t)+'</option>').join('')+'</select></label>'+
   '<label>Or ZIP<input data-hp="zip" inputmode="numeric" maxlength="5" placeholder="02835" value="'+X(st.zip)+'"></label>'+
   '<label>What do you need?<select data-hp="cat"><option value="">Any kind of help</option>'+cats.map(c=>'<option'+(c===st.cat?' selected':'')+'>'+X(c)+'</option>').join('')+'</select></label>'+
   '<label>Age (optional)<input data-hp="age" inputmode="numeric" maxlength="3" placeholder="e.g. 72" value="'+X(st.age)+'"></label>'+
   '<label>Cost<select data-hp="cost"><option value="">Any cost</option><option value="free"'+(st.cost==='free'?' selected':'')+'>Free only</option><option value="freeish"'+(st.cost==='freeish'?' selected':'')+'>Free or optional donation</option></select></label>'+
   '<label>Type of provider<select data-hp="role"><option value="">Any</option>'+Object.entries(ROLE).map(([k,v])=>'<option value="'+k+'"'+(st.role===k?' selected':'')+'>'+X(v)+'</option>').join('')+'</select></label>'+
   '<label class="hp-chk"><input type="checkbox" data-hp="home"'+(st.home?' checked':'')+'> Comes to my home</label>'+
   '<label class="hp-chk"><input type="checkbox" data-hp="ride"'+(st.ride?' checked':'')+'> I need a ride</label>'+
   '<label class="hp-chk"><input type="checkbox" data-hp="strict"'+(st.strict?' checked':'')+'> Only places that clearly serve my town</label></div>';
  if(T==='Portsmouth')h+='<div class="hp-ask"><b>Is the address on Prudence Island?</b> Some programs, including PACE, don’t serve Prudence Island. <label><input type="radio" name="hppr" data-hp="prudence" value="yes"'+(st.prudence==='yes'?' checked':'')+'> Yes</label> <label><input type="radio" name="hppr" data-hp="prudence" value="no"'+(st.prudence==='no'?' checked':'')+'> No</label></div>';
  if(st.zip&&st.zip!=='02835')h+='<p class="hp-note">'+(st.zip.length<5?'Enter all 5 digits of your ZIP, or pick your town.':'ZIP '+X(st.zip)+' not recognized — pick your town above. We can only match 02835 (Jamestown) for now; no match doesn’t mean there’s no help.')+'</p>';
  if(!T)return h+'<p class="hp-note">Choose your town to see help that serves it. Statewide programs show up for every town.</p>';
  const R=findList();
  if(TI)h+='<div class="hp-local"><b>Start here in '+X(T)+':</b> '+X(TI.local)+(np(TI.local_phone)?'':' · '+tels(TI.local_phone))+' '+link(TI.local_source,'Website')+(TI.local_status==='contact_only'?' <small>(contact only: ask what they offer)</small>':'')+(np(TI.island)?'':'<br><span class="hp-isl">⚠ '+X(TI.island)+'</span>')+'</div>';
  h+='<p class="hp-count"><b>'+R.out.length+'</b> services for '+X(T)+(st.cat?' · '+X(st.cat):'')+(R.hidden.age?' · '+R.hidden.age+' hidden because the published minimum age is above '+age():'')+'</p>'+
   (R.out.length?R.out.map(svcCard).join(''):'<p class="hp-note">Nothing matched these filters. Try fewer filters, or call 211 or the local contact above. No match doesn’t mean there’s no help.</p>');
  if(R.local.length)h+='<details class="hp-card hp-locals"><summary><b>More local contacts</b><span class="hp-desc">Places to call and ask; specific services not confirmed online.</span></summary><div class="hp-more">'+R.local.map(s=>'<p class="hp-row"><em>'+X(s.org)+'</em> '+tels(s.phone)+' '+link(s.site,'Website')+'</p>').join('')+'</div></details>';
  if(TI&&!np(TI.task_gaps))h+='<p class="hp-gap"><b>Not found in this research for '+X(T)+':</b> '+X(TI.cat_gaps==='none; specific task gaps still apply'?'':TI.cat_gaps+'. ')+X(TI.task_gaps)+' This isn’t proof no help exists.</p>';
  return h}
 const BV={A:'Senior benefits',B:'Income-based help',energy:'Home energy & repairs'};
 const PHASE={seasonal_distribution_closed_redemption_open:['Coupons handed out · redeem through season','#6b5a00'],season_closed:['Season closed','#7a2a2a'],prior_year_claim_closed_next_year_unverified:['Last claim period closed','#7a2a2a'],'2026_season_ended_2027_unverified':['2026 season ended','#7a2a2a'],published_rounds_closed_next_round_unverified:['Rounds closed · next not announced','#7a2a2a']};
 const isClosed=b=>b.pub==='historical_notice'||(/expired|terminated|closed|ended/.test(b.status||'')&&!/redemption_open/.test(b.status||''));
 const BST=s=>PHASE[s]?PHASE[s]:/expired|terminated|closed|ended/.test(s)?['Closed','#7a2a2a']:/announced_upcoming/.test(s)?['Coming soon','#6b5a00']:/conflict|unverified|confirmation_required|dependent|varies|capacity/.test(s)?['Check current status','#6b5a00']:['Published program','#2F5B4F'];
 function benList(){const q=st.q.trim().toLowerCase();return H.benefits.filter(b=>{
  if(!st.closed&&isClosed(b))return false;
  if(st.view&&!(b.views||[]).includes(st.view))return false;if(st.bcat&&b.cat!==st.bcat)return false;
  if(!JT&&b.class&&/municipal/.test(b.class)&&st.town!=='Jamestown')return false;
  if(q&&!(b.name+' '+b.benefit+' '+b.admin+' '+b.cat).toLowerCase().includes(q))return false;return true})}
 function benCard(b){const s=BST(b.status||'');
  return '<details class="hp-card"><summary><span class="hp-role" style="background:'+s[1]+'">'+X(s[0])+'</span>'+(/municipal/.test(b.class||'')?'<span class="hp-warn" style="background:#29405e">Jamestown only</span>':'')+(b.pub==='lead_only'?'<span class="hp-warn">Research lead</span>':b.pub==='manual_review'?'<span class="hp-warn">Under review</span>':'')+
   '<b>'+X(b.name)+'</b><span class="hp-org">'+X(b.admin)+' · '+X(String(b.cat||'').replace(/_/g,' '))+'</span><span class="hp-desc">'+X(b.benefit)+'</span>'+
   '<span class="hp-tags"><i>'+X(np(b.value)?'Amount not published':b.value)+'</i>'+(ageTxt(b.min_age)?'<i>'+X(ageTxt(b.min_age,' (check exceptions)'))+'</i>':'')+'</span>'+
   (b.caveats&&b.caveats[0]?'<span class="hp-avail">⚠ '+X(b.caveats[0])+'</span>':'')+
   '<span class="hp-call">'+(np(b.phone)?'':'📞 '+tels(b.phone)+' ')+(okUrl(b.url)?link(b.url,'Apply or learn how'):'')+'</span><span class="hp-avail">Verified online '+X(b.verified)+'. This is not an eligibility decision.</span></summary><div class="hp-more">'+
   row('Status',b.status_detail)+row('Effective',b.effective)+row('Income limits',b.income)+row('Income year',b.income_year)+row('Assets',b.assets)+row('Household',b.household)+row('Residency and other rules',b.residency)+row('Homeowner or renter',b.tenure)+
   row('Combining benefits',b.combine)+row('How to apply',b.apply)+row('Documents',b.docs)+row('Enrollment',b.enroll)+row('Deadlines',b.deadlines)+row('Renewal',b.renewal)+row('Email',mail(b.email),1)+
   ((b.caveats||[]).length>1?'<p class="hp-row"><em>Caveats</em> '+b.caveats.slice(1).map(X).join(' · ')+'</p>':'')+
   '<p class="hp-src">Official sources: '+(b.sources||[]).filter(okUrl).map((u,i)=>'<a href="'+X(u)+'" target="_blank" rel="noopener">'+(i+1)+'</a>').join(' ')+'</p></div></details>'}
 function vBen(){const cats=[...new Set(H.benefits.map(b=>b.cat))].sort();const L=benList();
  return '<div class="hp-filters">'+
   '<label>Show<select data-hp="view"><option value="">All programs</option>'+Object.entries(BV).map(([k,v])=>'<option value="'+k+'"'+(st.view===k?' selected':'')+'>'+X(v)+'</option>').join('')+'</select></label>'+
   '<label>Kind of help<select data-hp="bcat"><option value="">Any</option>'+cats.map(c=>'<option value="'+X(c)+'"'+(st.bcat===c?' selected':'')+'>'+X(String(c).replace(/_/g,' '))+'</option>').join('')+'</select></label>'+
   '<label class="hp-wide">Search<input data-hp="q" type="search" placeholder="e.g. heating, Medicare, property tax" value="'+X(st.q)+'"></label>'+
   (JT?'':'<label>Your town<select data-hp="town"><option value="">Statewide only</option>'+H.meta.towns_list.map(t=>'<option'+(t===st.town?' selected':'')+' value="'+X(t)+'">'+X(t)+'</option>').join('')+'</select></label>')+
   '<label class="hp-chk"><input type="checkbox" data-hp="closed"'+(st.closed?' checked':'')+'> Include closed and historical programs</label></div>'+
   (JT?'':'<p class="hp-note hp-sm">'+(st.town==='Jamestown'?'Showing statewide programs plus Jamestown town programs.':'Statewide and federal programs. Town programs are researched for Jamestown so far: pick Jamestown to include them.')+'</p>')+
   '<p class="hp-count"><b>'+L.length+'</b> programs'+(st.view?' · '+X(BV[st.view]):'')+'. Program pages don’t prove money is left or that you qualify; check with the administrator.</p>'+L.map(benCard).join('')}
 window.helpBar=function(a){const T=[['find','Find help near me'],['benefits','Benefits'],['cancer','Cancer help'],['mh','Mental health'],['recovery','Recovery meetings']];if(document.querySelector('script[src^="seniors.js"]'))T.splice(1,0,['seniors','Seniors']);
  return '<div class="hp-tabs" role="tablist" aria-label="Help sections">'+T.map(([k,v])=>'<button type="button" role="tab" data-hbar="'+k+'" aria-selected="'+(a===k)+'" class="'+(a===k?'on':'')+'">'+v+'</button>').join('')+'</div>'};
 document.addEventListener('click',e=>{const t=e.target.closest&&e.target.closest('[data-hbar]');if(!t)return;e.preventDefault();const k=t.dataset.hbar;
  if(k==='mh'||k==='seniors'||k==='recovery'){if(typeof go==='function')go(k);return}
  if(typeof STATE!=='undefined'&&STATE.view!=='help'){window.hpOpen({tab:k});return}
  st.tab=k;save();document.querySelectorAll('.hp-tabs button').forEach(b=>{const on=b.dataset.hbar===k;b.classList.toggle('on',on);b.setAttribute('aria-selected',on)});redraw()});
 window.__hpRedraw=()=>{try{redraw()}catch(_){}};window.hpOpen=function(o){Object.assign(st,o||{});save();if(typeof go==='function')go('help')};
 window.vHelp=function(){load();
  const head='<div class="hp-head"><h2>Help &amp; Benefits'+(JT?' for Jamestown':' for Rhode Islanders')+'</h2><p>Free to use. Find practical help near you, and the benefits and programs you may qualify for. Independent and privately run by '+(JT?'Jamestown Island News':'Rhode Island Hurricane')+'; not a government agency.</p>'+
   '<p class="hp-urgent"><b>Emergency? Call 911.</b> For help finding services any time, call <a class="hp-tel" href="tel:211">211</a>.</p>'+
   helpBar(st.tab)+'</div>';
  if(!H)return '<section class="box hp">'+head+(herr?'<p class="hp-note">Couldn’t load the help listings. <button type="button" class="hp-retry" data-hpretry>Retry</button> You can still call <a class="hp-tel" href="tel:211">211</a>.</p>':'<p class="hp-note">Loading…</p>')+'</section>';
  return '<section class="box hp">'+head+'<div id="hpBody">'+((st.tab==='cancer'?(window.hpCancer?hpCancer(st,H):''):st.tab==='find'?vFind():vBen()))+'</div><p class="hp-foot">Research of official published information as of Nov. 10, 2026. Nothing you choose here is saved on a server or sent to any provider. Always confirm with the provider before you go.</p></section>'};
 const redraw=()=>{const b=document.getElementById('hpBody');if(!b||!H)return;const f=document.activeElement&&document.activeElement.dataset?document.activeElement.dataset.hp:null;b.innerHTML=(st.tab==='cancer'?(window.hpCancer?hpCancer(st,H):''):st.tab==='find'?vFind():vBen());if(f){const e=b.querySelector('[data-hp="'+f+'"]');if(e&&e.tagName==='INPUT'&&e.type!=='checkbox'&&e.type!=='radio'){e.focus();const v=e.value;try{e.setSelectionRange(v.length,v.length)}catch(_){}}}save()};
 document.addEventListener('input',e=>{const k=e.target.dataset&&e.target.dataset.hp;if(!k||!e.target.closest('.hp'))return;const el=e.target;
  if(el.type==='checkbox')st[k]=el.checked;else if(el.type==='radio')st[k]=el.value;else st[k]=el.value;
  if(k==='zip'){st.zip=el.value.replace(/\D/g,'').slice(0,5);if(st.zip==='02835')st.town='Jamestown';else if(st.zip)st.town=''}
  if(k==='town'){st.prudence='';st.zip=''}
  if(el.tagName==='SELECT'||el.type==='checkbox'||el.type==='radio'||k==='zip')redraw();else{clearTimeout(window.__hpT);window.__hpT=setTimeout(redraw,250)}});
 document.addEventListener('change',e=>{const k=e.target.dataset&&e.target.dataset.hp;if(k&&e.target.tagName==='SELECT'&&e.target.closest('.hp')){st[k]=e.target.value;if(k==='town'){st.prudence='';st.zip=''}redraw()}});
 document.addEventListener('click',e=>{const t=e.target.closest&&e.target.closest('[data-hpt]');if(!t)return;e.preventDefault();st.tab=t.dataset.hpt;document.querySelectorAll('.hp-tabs button').forEach(b=>{const on=b.dataset.hpt===st.tab;b.classList.toggle('on',on);b.setAttribute('aria-selected',on)});redraw()});
 const css=document.createElement('style');css.id='hpCss';css.textContent=`
.hp{--hp-a:#D4ECF5;padding-bottom:8px}.hp-head{padding:8px 12px 2px}.hp-head h2{margin:0 0 3px;font:700 18px/1.2 "Playfair Display",Georgia,serif;color:var(--hp-a)}.hp-head p{margin:0 0 3px;font:400 13px/1.4 Georgia,serif;color:#EEE9E5}
.hp-urgent{padding:3px 8px;border-left:3px solid #B5123A;background:#ffffff0d}.hp-urgent b{color:#fff}
.hp-tel{font-weight:700;color:#fff!important;text-decoration:underline;text-underline-offset:2px;white-space:nowrap}
.hp-tabs{display:flex;flex-wrap:wrap;gap:4px;margin:6px 0 2px}.hp-tabs button{all:unset;cursor:pointer;padding:4px 8px;border-radius:4px;border:1px solid #D4ECF566;font:600 12px/1.2 "Libre Franklin",system-ui,sans-serif;color:#fff}.hp-tabs button.on{background:#D4ECF5;color:#0A1428;border-color:#D4ECF5}
#hpBody{display:grid;grid-template-columns:repeat(auto-fill,minmax(290px,1fr));gap:0 12px;align-items:start;padding:0 12px}#hpBody>*{margin-left:0!important;margin-right:0!important}#hpBody>*:not(.hp-card),#hpBody>.hp-card[open],#hpBody>.hp-locals{grid-column:1/-1}
.hp-filters{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:6px;margin:6px 0}.hp-filters label{display:flex;flex-direction:column;gap:2px;font:600 11px/1.2 "Libre Franklin",system-ui,sans-serif;letter-spacing:.02em;color:var(--hp-a)}
.hp-filters select,.hp-filters input:not([type=checkbox]):not([type=radio]){padding:4px 6px;border:1px solid #D4ECF588;border-radius:4px;background:#0A1428;color:#fff;font:400 13px/1.2 "Libre Franklin",system-ui,sans-serif;min-width:0}
.hp-filters .hp-chk{flex-direction:row;align-items:center;gap:6px;font-size:12px;letter-spacing:0;color:#EEE9E5}.hp-chk input{width:14px;height:14px}.hp-wide{grid-column:span 2}
.hp-ask,.hp-local,.hp-note,.hp-count,.hp-gap,.hp-foot{margin:4px 12px;font:400 13px/1.4 Georgia,serif;color:#EEE9E5}.hp-ask,.hp-local{padding:4px 8px;border-left:2px solid #D4ECF566;background:#ffffff06}.hp-ask label{margin-right:10px;font-weight:700}
.hp-isl{display:inline-block;margin-top:2px;font:400 12px/1.4 Georgia,serif;color:#E9C46A}
.hp-count{font-size:12px;color:#C9D6DF}.hp-count b{color:#fff}.hp-gap{font-size:12px;color:#C9D6DF}.hp-foot{font-size:12px;color:#C9D6DF;font-style:italic}
.hp-card{margin:0;border:0;border-top:1px solid #D4ECF52e;border-radius:0;background:none}.hp-card>summary{list-style:none;cursor:pointer;display:flex;flex-direction:column;gap:2px;padding:5px 2px}.hp-card>summary::-webkit-details-marker{display:none}
.hp-card>summary::after{content:"Details ▸";align-self:flex-start;font:600 12px/1.3 "Libre Franklin",system-ui,sans-serif;color:var(--hp-a)}.hp-card[open]>summary::after{content:"Hide details ▾"}
.hp-card b{font:600 14px/1.25 "Libre Franklin",system-ui,sans-serif;color:#fff}.hp-org{font:600 12px/1.3 "Libre Franklin",system-ui,sans-serif;color:var(--hp-a)}.hp-desc{font:400 13px/1.4 Georgia,serif;color:#EEE9E5}
.hp-role,.hp-warn{align-self:flex-start;padding:1px 4px;border-radius:3px;background:#2F5B4F;color:#fff;font:700 10px/1.3 "Libre Franklin",system-ui,sans-serif;letter-spacing:.04em;text-transform:uppercase}.hp-warn{background:#8A5A00}
.hp-tags{display:flex;flex-wrap:wrap;gap:4px}.hp-tags i{font-style:normal;padding:0 6px;border-radius:10px;border:1px solid #D4ECF544;font:600 11px/1.5 "Libre Franklin",system-ui,sans-serif;color:#EEE9E5}
.hp-call{font:600 13px/1.4 "Libre Franklin",system-ui,sans-serif;color:#fff}.hp .hp-call small{color:#C9D6DF!important;text-transform:none!important;letter-spacing:0!important;font-size:12px!important;font-weight:400!important}.hp-avail{font:italic 12px/1.35 Georgia,serif;color:#C9D6DF}
.hp-more{padding:0 2px 6px;border-top:1px solid #ffffff14}.hp-row{margin:3px 0 0;font:400 13px/1.4 Georgia,serif;color:#EEE9E5}.hp-row em{margin-right:6px;font:700 11px/1.3 "Libre Franklin",system-ui,sans-serif;font-style:normal;letter-spacing:.04em;text-transform:uppercase;color:var(--hp-a)}
.hp-go{font:600 13px/1.3 "Libre Franklin",system-ui,sans-serif;color:var(--hp-a)!important;margin-right:10px}.hp-links{margin:5px 0 0}.hp-src{margin:3px 0 0;font:12px/1.4 Georgia,serif;color:#C9D6DF}.hp-src a{color:#C9D6DF!important;margin-right:5px}
.hp-sm{font-size:12px!important;color:#C9D6DF!important;margin-top:0!important}.hp-retry{all:unset;cursor:pointer;font:700 12px/1 "Libre Franklin",system-ui,sans-serif;padding:3px 7px;border:1px solid #D4ECF566;border-radius:4px;color:#fff}
.hp a:focus-visible,.hp button:focus-visible,.hp select:focus-visible,.hp input:focus-visible,.hp summary:focus-visible{outline:2px solid #E9C46A;outline-offset:2px}
@media(max-width:560px){.hp-head{padding:8px 8px 2px}#hpBody{padding:0 8px;grid-template-columns:minmax(0,1fr)}.hp-filters{grid-template-columns:minmax(0,1fr) minmax(0,1fr)}.hp-wide{grid-column:1/-1}}`;document.head.appendChild(css);
 load();
 try{if(typeof STATE!=='undefined'&&STATE.view==='help'&&typeof render==='function')render()}catch(_){}
})();

/* Mental Health & Self-Help tab: 182 public records (139 services, 36 meeting listings, 7 official finders) and 39-town routing.
   Free for everyone: no registration, no paywall, no blur. Data: data/mh.json (built by tools/mh/mh_build.py).
   Handoff rules kept: no diagnosis, no risk scores, no recommendations or "best for you" ranking; "not published" is shown as written;
   "free" always keeps its condition; no "accepting patients" or "available" badges; only bounded, source-dated meetings go on the calendar;
   nothing chosen here is stored, put in the address bar or sent to analytics (Google Analytics is switched off while this page is open). */
(function(){
 const X=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const NP='not published';const np=v=>v==null||v===''||v===NP||(Array.isArray(v)&&(!v.length||v.every(np)));
 const okUrl=u=>/^https?:\/\//i.test(String(u||''));
 const A=(u,t,c)=>okUrl(u)?'<a class="'+(c||'mh-go')+'" href="'+X(u)+'" target="_blank" rel="noopener noreferrer">'+X(t)+'</a>':'';
 const tel=(p,label)=>{if(np(p))return '';const d=String(p).replace(/[^\d]/g,'');const m=d.match(/^1?(\d{10})/);const n=m?'+1'+m[1]:(d.length===3?d:'');return n?'<a class="mh-tel" href="tel:'+n+'"'+(label?' aria-label="'+X(label)+': '+X(p)+'"':'')+'>'+X(p)+'</a>':X(p)};
 const mail=e=>np(e)||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)?'':'<a href="mailto:'+X(e)+'">'+X(e)+'</a>';
 const JT=/jamestown/i.test(location.hostname+document.title);
 const GA=JT?'G-DV1X96RQP3':'G-0SRZ2YPEXK';
 const ALIAS={'New Shoreham':'Block Island','South Kingstown':'Wakefield, Peace Dale, Kingston','East Providence':'Riverside','Burrillville':'Pascoag','Smithfield':'Greenville'};
 let D=null,asked=false;
 // Search state lives only in memory: never saved, never in the URL.
 const st={town:JT?'Jamestown':'',rel:'',cat:'',age:'',cost:'',ins:'',lang:'',acc:false,kind:'',mode:'',q:'',unk:true};
 function load(){if(asked)return;asked=true;fetch('data/mh.json?'+Math.floor(Date.now()/6e5),{cache:'no-store'}).then(r=>r.json()).then(j=>{D=j;try{if(typeof STATE!=='undefined'&&STATE.view==='mh'&&typeof render==='function')render()}catch(_){}}).catch(()=>{asked=false})}
 const CLS={licensed_treatment:'Licensed treatment',supervised_training_clinic:'Supervised training clinic',counseling_credentials_to_confirm:'Counseling (credentials not published)',treatment_navigation:'Treatment navigation',
  crisis_counseling:'Crisis counseling',crisis_response:'Crisis response',crisis_navigation:'Crisis triage',violence_support:'Violence survivor support',
  peer_support:'Peer support (not medical treatment)',faith_based_peer_support:'Faith-based peer support',grief_support:'Grief support',
  housing_navigation:'Housing help',education:'Education',community_assistance:'Community help',navigation:'Resource navigation',recovery_education_navigation:'Recovery navigation',faith_based_navigation:'Faith-based navigation',
  directory:'Official finder (a directory, not a clinic or meeting)'};
 const KIND={clinical:['licensed_treatment','supervised_training_clinic','counseling_credentials_to_confirm','treatment_navigation'],crisis:['crisis_counseling','crisis_response','crisis_navigation','violence_support'],
  peer:['peer_support','faith_based_peer_support','grief_support'],community:['housing_navigation','education','community_assistance','navigation','recovery_education_navigation','faith_based_navigation'],directory:['directory']};
 const KINDL={clinical:'Clinical care',crisis:'Crisis and survivor support',peer:'Peer support and groups',community:'Community, housing and navigation',directory:'Official finders'};
 const COST={free:'Free',free_if_eligible:'Free if eligible',free_for_eligible_students:'Free for eligible students',sliding_scale:'Sliding scale (not necessarily free)',low_cost:'Low cost, published fee',self_pay:'Self-pay',
  insurance_based:'Insurance-based',subsidized_if_eligible:'Subsidized if eligible',subsidized:'Subsidized',financial_assistance:'Financial assistance offered',fee_assistance_needs_confirmation:'Fee help: confirm with provider',no_dues:'No dues or fees','not published':'Cost not published'};
 const COSTF=['free','free_if_eligible','free_for_eligible_students','sliding_scale','low_cost','insurance_based','subsidized_if_eligible','no_dues','not published'];
 const MODE={in_person:'In person',phone:'Phone',text:'Text',online_chat:'Online chat',telehealth:'Telehealth',virtual:'Virtual',hybrid:'Hybrid',home:'At home',mobile:'Mobile team',community:'In the community',hospital:'Hospital',online_resource:'Online resource',mobile_app:'App'};
 const MODEF={in_person:['in_person','hybrid','hospital'],remote:['phone','text','online_chat'],video:['telehealth','virtual','hybrid','online_resource','mobile_app'],home:['home','mobile','community']};
 const MODEFL={in_person:'In person',remote:'Phone, text or chat',video:'Telehealth or online',home:'Comes to you (home, mobile, community)'};
 const INS=['Medicaid','Medicare','Blue Cross Blue Shield','UnitedHealthcare','Aetna','Tufts','Neighborhood Health Plan','Cigna','TRICARE'];
 const LANG=['English','Spanish','Mandarin','Cantonese'];
 const ONLINE=['telehealth','virtual','phone','text','online_chat','online_resource','mobile_app'];
 const L=v=>Array.isArray(v)?v.filter(x=>!np(x)):(np(v)?[]:[v]);
 function rel(r,T){if(!T)return 'any';
  if(r.locs.some(l=>l.town===T)&&r.pub!=='contact_only_until_resolved')return 'here';
  if(Array.isArray(r.towns)&&r.towns.includes(T))return 'serves';
  if(r.statewide)return 'state';
  if(r.modes.some(m=>ONLINE.includes(m)))return 'online';
  return ''}
 const RELL={here:'Located in ',serves:'Serves ',state:'Statewide access',online:'Phone or online'};
 const RANK={here:0,serves:1,state:2,online:3,any:4,'':5};
 const age=()=>{const a=parseInt(st.age,10);return isNaN(a)||a<0||a>120?null:a};
 const household=r=>/household|not caregiver|child in/i.test(r.agetxt||'');
 function ageNote(r){const a=age();if(a==null)return null;const mn=parseInt(r.min,10),mx=parseInt(r.max,10);
  if(household(r))return {ok:true,t:'Age rule is for the child in the household: ask provider'};
  if(!isNaN(mn)&&a<mn)return {ok:false};
  if(!isNaN(mx)&&a>mx)return {ok:true,t:'Ask provider: published age limit '+r.max};
  if(!np(r.agetxt)&&/confirm|up to/i.test(r.agetxt))return {ok:true,t:'Ask provider: '+r.agetxt};
  if(isNaN(mn)&&isNaN(mx))return {ok:true,t:'Age rule not published: ask provider'};
  return {ok:true,t:'Meets published minimum age'+(isNaN(mn)?'':' ('+mn+'+)')}}
 function insMatch(r){if(!st.ins)return {ok:true};const l=L(r.ins);
  const hit=l.find(x=>x.toLowerCase().startsWith(st.ins.toLowerCase()));
  if(hit)return {ok:true,t:'Lists '+hit+'. A brand is not a guarantee your exact plan is in network.'};
  if(l.some(x=>/does not (bill|accept) insurance/i.test(x)))return {ok:false};
  const named=l.filter(x=>INS.some(n=>x.toLowerCase().startsWith(n.toLowerCase())));
  if(named.length&&!l.some(x=>/most|all|major|commercial|third-party|state and/i.test(x)))return {ok:false};
  return st.unk?{ok:true,t:np(r.ins)?'Insurance not published: ask about '+st.ins:'Says "'+l.find(x=>/most|all|major|commercial|third-party|state and/i.test(x))+'": ask about '+st.ins,u:1}:{ok:false}}
 function langMatch(r){if(!st.lang)return {ok:true};const l=L(r.lang);if(l.includes(st.lang))return {ok:true};if(!l.length&&st.unk)return {ok:true,t:'Languages not published: ask',u:1};return {ok:false}}
 function pass(r,skipCat){const T=st.town,R=rel(r,T);
  if(T){if(!R&&st.rel!=='all')return 'town';if(st.rel&&st.rel!=='all'&&R!==st.rel)return 'town'}
  if(!skipCat&&st.cat&&!r.cats.includes(st.cat))return 'cat';
  if(st.cost&&!r.cost.includes(st.cost)&&!(st.cost==='subsidized_if_eligible'&&r.cost.includes('subsidized')))return 'f';
  if(st.kind&&!KIND[st.kind].includes(r.cls))return 'f';
  if(st.mode&&!r.modes.some(m=>MODEF[st.mode].includes(m)))return 'f';
  if(st.acc&&np(r.acc)&&!r.locs.some(l=>!np(l.acc)))return 'f';
  if(!insMatch(r).ok||!langMatch(r).ok)return 'f';
  const an=ageNote(r);if(an&&!an.ok)return 'age';
  const q=st.q.trim().toLowerCase();if(q&&!(r.org+' '+r.prog+' '+r.desc+' '+r.pop+' '+r.locs.map(l=>l.town+' '+l.venue).join(' ')+' '+L(r.towns).join(' ')).toLowerCase().includes(q))return 'f';
  return ''}
 function list(){const out=[],why={town:0,age:0};for(const r of D.records){const p=pass(r);if(!p)out.push(r);else if(why[p]!=null)why[p]++}
  out.sort((a,b)=>RANK[rel(a,st.town)]-RANK[rel(b,st.town)]||(a.type==='directory')-(b.type==='directory')||a.org.localeCompare(b.org)||a.prog.localeCompare(b.prog));return {out,why}}
 const t12=t=>{const m=String(t||'').match(/^(\d{1,2}):(\d{2})$/);if(!m)return '';let h=+m[1];const ap=h>=12?'pm':'am';h=h%12||12;return h+(m[2]==='00'?'':':'+m[2])+' '+ap};
 const SST={schedule_confirmation_required:'Schedule not confirmed: check the official list before you go',conflicting_official_pages:'Official pages list different times: call before you go',
  dated_official_monthly_list:'On the official dated list',explicit_provider_dates:'Provider-listed dates'};
 function schedTxt(s){if(!s||typeof s!=='object')return np(s)?'':String(s);
  const days=L(s.days).join(', '),tm=t12(s.start_time)+(t12(s.end_time)?'–'+t12(s.end_time):'');
  let w=(s.recurrence==='explicit_dates_only'?'Listed dates: '+L(s.explicit_dates).join(', '):(s.recurrence&&!np(s.recurrence)?s.recurrence.replace(/_/g,' ')+' ':'')+days)+(tm?' · '+tm:'');
  if(!days&&!tm&&s.recurrence==='not published')w='Times not published';
  return w+(np(s.source_updated_at)?'':' · list updated '+s.source_updated_at)}
 function warn(r){const w=[];
  if(r.pub==='contact_only_until_resolved')w.push('Location conflict: call to confirm');
  if(r.pub==='directory_only_confirm_schedule')w.push(r.vstat==='conflicting_schedule'?'Conflicting times':'Confirm schedule');
  if(/temporary_location/.test(r.vstat))w.push('Temporary location: confirm address');
  if(r.cls==='supervised_training_clinic')w.push('Training clinic');
  if(r.cls==='counseling_credentials_to_confirm')w.push('Credentials not published');
  return w}
 const row=(k,v,raw)=>'<p class="mh-row"><em>'+X(k)+'</em> '+(np(v)?'not published':(raw?v:X(v)))+'</p>';
 function where(r){if(r.pub==='contact_only_until_resolved')return 'Address withheld: official sources conflict. Call to confirm the location.';
  const l=r.locs.filter(x=>!np(x.addr)||!np(x.town));if(!l.length)return np(r.area)?'Location not published':r.area;
  return l.map(x=>(np(x.venue)?'':x.venue+', ')+(np(x.addr)?'':x.addr+', ')+(np(x.town)?'':x.town)).join(' · ')}
 function card(r){const R=rel(r,st.town),an=ageNote(r),im=insMatch(r),lm=langMatch(r),w=warn(r),web=r.cstat&&/web_route_only/.test(r.cstat);
  const sched=r.type==='meeting'?schedTxt(r.sched):'';const ss=r.sched&&r.sched.schedule_status;
  const costs=r.cost.map(c=>COST[c]||c.replace(/_/g,' '));
  return '<details class="mh-card"><summary><span class="mh-badges"><span class="mh-cls">'+X(CLS[r.cls]||r.cls.replace(/_/g,' '))+'</span>'+w.map(x=>'<span class="mh-warn">'+X(x)+'</span>').join('')+'</span>'+
   '<b>'+X(r.prog)+'</b><span class="mh-org">'+X(r.org)+'</span><span class="mh-desc">'+X(r.desc)+'</span>'+
   '<span class="mh-where">📍 '+X(where(r))+'</span>'+
   (sched?'<span class="mh-sched">🗓 '+X(sched)+(ss&&SST[ss]?' <span class="mh-sm">('+X(SST[ss])+')</span>':'')+'</span>':'')+
   '<span class="mh-tags">'+(st.town&&RELL[R]?'<i class="mh-rel">'+X(RELL[R]+(R==='here'||R==='serves'?st.town:''))+'</i>':'')+costs.map(c=>'<i>'+X(c)+'</i>').join('')+
    r.modes.filter(m=>MODE[m]).slice(0,4).map(m=>'<i>'+X(MODE[m])+'</i>').join('')+(an&&an.t?'<i class="mh-ask">'+X(an.t)+'</i>':'')+(im.t?'<i class="mh-ask">'+X(im.t)+'</i>':'')+(lm.t?'<i class="mh-ask">'+X(lm.t)+'</i>':'')+'</span>'+
   '<span class="mh-call">'+(np(r.phone)?(web?'Phone/email not published in reviewed source; use the official source.':'Phone not published'):'📞 '+tel(r.phone,'Call '+r.org+(np(r.role)?'':' '+r.role))+(np(r.role)?'':' <span class="mh-sm">('+X(r.role)+')</span>'))+'</span>'+
   '<span class="mh-avail">Contact source checked '+X(r.checked)+'. Availability not confirmed: call the provider.</span></summary><div class="mh-more">'+
   row('Who it’s for',r.pop)+row('Eligibility',r.elig)+row('Age',[np(r.min)?'':'Minimum '+r.min,np(r.max)?'':'Maximum '+r.max,np(r.agetxt)?'':r.agetxt].filter(Boolean).join('. ')||NP)+
   row('Cost',costs.join(' · ')+(np(r.costs)?'':'. '+r.costs))+row('Insurance listed',L(r.ins).join('; ')+(L(r.ins).length?'. A listed brand is not confirmation your exact plan is in network.':''))+
   row('How to start',r.ref)+row('Intake',r.intake)+row('Hours',r.hours)+(r.type==='meeting'?row('Meeting',sched):'')+
   row('Service area',(np(r.area)?'':r.area)+(L(r.towns).length?' Towns: '+L(r.towns).join(', ')+'.':'')||NP)+
   row('Delivery',r.modes.map(m=>MODE[m]||m).join(', '))+row('Languages',L(r.lang).join(', '))+row('Accessibility',[r.acc].concat(r.locs.map(l=>l.acc)).filter(x=>!np(x)).join('; '))+
   row('Religious affiliation required',r.relig)+row('Email',mail(r.email),1)+
   (L(r.notes).length?'<p class="mh-row"><em>Notes</em> '+L(r.notes).map(X).join(' · ')+'</p>':'')+
   '<p class="mh-links">'+A(r.site,'Official website ›')+A(r.dir,'Official directory ›')+A(r.apply,'Apply or register ›')+
    (r.sched&&typeof r.sched==='object'?A(r.sched.official_meeting_list_url,'Official meeting list ›')+(r.sched.join_url!==r.sched.official_meeting_list_url?A(r.sched.join_url,'Joining page ›'):''):'')+'</p>'+
   '<p class="mh-src">Sources (checked '+X(r.srcchk)+'): '+L(r.src).filter(okUrl).map((u,i)=>A(u,String(i+1),'mh-s')).join(' ')+'</p></div></details>'}
 // ---- bounded meetings calendar: only series the release marks calendar-eligible, only inside their dated window, recomputed against today in New York
 function nyNow(){const p=Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(new Date()).map(x=>[x.type,x.value]));return {d:p.year+'-'+p.month+'-'+p.day,m:(+p.hour)*60+(+p.minute)}}
 const addDay=(s,n)=>{const [y,m,d]=s.split('-').map(Number);const t=new Date(Date.UTC(y,m-1,d+n));return t.toISOString().slice(0,10)};
 const dow=s=>{const [y,m,d]=s.split('-').map(Number);return ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][new Date(Date.UTC(y,m-1,d)).getUTCDay()]};
 const mins=t=>{const m=String(t||'').match(/^(\d{1,2}):(\d{2})$/);return m?(+m[1])*60+(+m[2]):null};
 function occurrences(){const now=nyNow(),ev=[],horizon=addDay(now.d,31);
  for(const r of D.records){if(!r.cal||!r.sched||typeof r.sched!=='object')continue;const s=r.sched;
   if(st.q&&pass(r,true)==='f')continue;
   let dates=[];
   if(s.recurrence==='explicit_dates_only')dates=L(s.explicit_dates);
   else if(s.schedule_status==='dated_official_monthly_list'&&!np(s.effective_start)&&!np(s.effective_end)&&s.recurrence==='weekly'){
    for(let d=s.effective_start;d<=s.effective_end;d=addDay(d,1))if(L(s.days).includes(dow(d)))dates.push(d)}
   for(const d of dates){if(d<now.d||d>horizon)continue;if(!np(s.effective_end)&&d>s.effective_end)continue;
    const end=mins(s.end_time),start=mins(s.start_time);if(d===now.d&&(end!=null?end:start!=null?start:1440)<=now.m)continue;
    ev.push({d,start:s.start_time,end:s.end_time,r})}}
  ev.sort((a,b)=>a.d.localeCompare(b.d)||String(a.start).localeCompare(String(b.start)));return {ev,now}}
 function vCal(){const {ev,now}=occurrences();const fmt=d=>{const [y,m,dd]=d.split('-').map(Number);return new Date(Date.UTC(y,m-1,dd)).toLocaleDateString('en-US',{timeZone:'UTC',weekday:'long',month:'long',day:'numeric'})};
  let h='<p class="mh-note">Only meetings with dated official schedules appear here, and only inside the dates those sources cover. Times are New York time. Groups can cancel or fill up: check the official list before you go.</p>';
  if(!ev.length)h+='<p class="mh-note"><b>No confirmed dated meetings right now.</b> Use the official finders below; they list current meetings.</p>';
  let last='';for(const e of ev){if(e.d!==last){h+='<h3 class="mh-day">'+(e.d===now.d?'Today · ':e.d===addDay(now.d,1)?'Tomorrow · ':'')+X(fmt(e.d))+'</h3>';last=e.d}
   const r=e.r,s=r.sched;h+='<div class="mh-ev"><span class="mh-evt">'+X(t12(e.start))+(t12(e.end)?'–'+X(t12(e.end)):'')+'</span><span><b>'+X(r.prog)+'</b> <span class="mh-org">'+X(r.org)+'</span><br><span class="mh-sm">'+X(where(r))+(r.modes.includes('virtual')||r.modes.includes('hybrid')?' · '+X(r.modes.map(m=>MODE[m]||m).join('/')):'')+'</span><br>'+
    A(s.official_meeting_list_url,'Official list ›')+(s.join_url!==s.official_meeting_list_url?A(s.join_url,'Joining page ›'):'')+'<span class="mh-sm mh-avail"> Source checked '+X(r.srcchk)+'.</span></span></div>'}
  const dirs=D.records.filter(r=>r.type==='directory');
  h+='<h3 class="mh-day">Official meeting finders</h3>'+dirs.map(card).join('');
  return h}
 function routing(){const T=st.town,R=T&&D.routing[T];if(!R)return '';
  const cr=D.records.filter(r=>r.cls==='crisis_response'&&r.org===R.ccbhc&&/Regional behavioral health crisis/.test(r.prog));
  const crl=cr.length===1?tel(cr[0].phone,'Call '+R.ccbhc+' crisis line'):cr.map(r=>X((r.id.split('-').pop()||'').replace(/^./,c=>c.toUpperCase()))+' '+tel(r.phone,'Call '+R.ccbhc+' crisis line')).join(' · ');
  return '<div class="mh-route"><b>Starting points for '+X(T)+'</b>'+
   '<p>Regional community mental health center: <b>'+X(R.ccbhc)+'</b> '+tel(R.ccbhc_phone,'Call '+R.ccbhc+' intake')+' <span class="mh-sm">(intake). Clinics like this take people regardless of age, insurance, where they live or ability to pay; you may choose another one.</span></p>'+
   (crl?'<p>'+X(R.ccbhc)+' 24/7 crisis line'+(cr.length>1?'s (call the one for your region)':'')+': '+crl+'</p>':'')+
   '<p>Youth mobile crisis team (ages 2 up to 21): <b>'+X(R.mrss)+'</b> '+tel(R.mrss_phone,'Call '+R.mrss+' youth mobile crisis team')+'</p>'+
   (R.local_clinical?'':'<p><span class="mh-sm">This research found no clinical office located in '+X(T)+' itself; the services below serve '+X(T)+' from nearby towns, statewide or by phone and video.</span></p>')+'</div>'}
 function vList(){const towns=D.meta.towns_list,cats=D.meta.categories,T=st.town;
  const counts={};for(const c of cats)counts[c]=0;let all=0;for(const r of D.records){if(pass(r,true))continue;all++;for(const c of r.cats)counts[c]++}
  let h='<div class="mh-cats" role="group" aria-label="Categories"><button type="button" data-mhc="" class="'+(st.cat?'':'on')+'">All <span class="mh-sm">'+all+'</span></button>'+cats.map(c=>'<button type="button" data-mhc="'+X(c)+'" class="'+(st.cat===c?'on':'')+'">'+X(c)+' <span class="mh-sm">'+(c==='Meetings Calendar'?'':counts[c])+'</span></button>').join('')+'</div>'+
  '<div class="mh-filters">'+
   '<label>Your town<select data-mh="town"><option value="">All of Rhode Island</option>'+towns.map(t=>'<option'+(t===T?' selected':'')+' value="'+X(t)+'">'+X(t+(ALIAS[t]?' ('+ALIAS[t]+')':''))+'</option>').join('')+'</select></label>'+
   (T?'<label>Show places that…<select data-mh="rel"><option value="">Are in, serve or reach '+X(T)+'</option><option value="here"'+(st.rel==='here'?' selected':'')+'>Are located in '+X(T)+'</option><option value="serves"'+(st.rel==='serves'?' selected':'')+'>Say they serve '+X(T)+'</option><option value="state"'+(st.rel==='state'?' selected':'')+'>Are open statewide</option><option value="online"'+(st.rel==='online'?' selected':'')+'>Work by phone or online</option><option value="all"'+(st.rel==='all'?' selected':'')+'>Anywhere in Rhode Island</option></select></label>':'')+
   '<label>Search<input data-mh="q" type="search" placeholder="e.g. grief, veterans, Newport" value="'+X(st.q)+'"></label>'+
   '<label>Age (optional)<input data-mh="age" inputmode="numeric" maxlength="3" placeholder="e.g. 67" value="'+X(st.age)+'"></label>'+
   '<label>Cost<select data-mh="cost"><option value="">Any cost</option>'+COSTF.map(c=>'<option value="'+X(c)+'"'+(st.cost===c?' selected':'')+'>'+X(COST[c])+'</option>').join('')+'</select></label>'+
   '<label>Insurance<select data-mh="ins"><option value="">Any</option>'+INS.map(c=>'<option'+(st.ins===c?' selected':'')+'>'+X(c)+'</option>').join('')+'</select></label>'+
   '<label>Kind of help<select data-mh="kind"><option value="">Any</option>'+Object.entries(KINDL).map(([k,v])=>'<option value="'+k+'"'+(st.kind===k?' selected':'')+'>'+X(v)+'</option>').join('')+'</select></label>'+
   '<label>How<select data-mh="mode"><option value="">Any way</option>'+Object.entries(MODEFL).map(([k,v])=>'<option value="'+k+'"'+(st.mode===k?' selected':'')+'>'+X(v)+'</option>').join('')+'</select></label>'+
   '<label>Language<select data-mh="lang"><option value="">Any</option>'+LANG.map(c=>'<option'+(st.lang===c?' selected':'')+'>'+X(c)+'</option>').join('')+'</select></label>'+
   '<label class="mh-chk"><input type="checkbox" data-mh="acc"'+(st.acc?' checked':'')+'> Only listings with published accessibility details</label>'+
   '<label class="mh-chk"><input type="checkbox" data-mh="unk"'+(st.unk?' checked':'')+'> Include listings where insurance or language isn’t published</label>'+
   '<button type="button" class="mh-reset" data-mhreset="1">Reset filters</button></div>';
  h+=routing();
  if(st.cat==='Senior Mental Health')h+='<p class="mh-note">For senior benefits, home help and rides, see <button type="button" class="mh-link" data-go="help">Help &amp; Benefits ›</button></p>';
  if(st.cat==='Addiction & Recovery'||st.cat==='Support Groups')h+='<p class="mh-note">There’s also a local week-by-week list on <button type="button" class="mh-link" data-go="recovery">Recovery &amp; Support Meetings ›</button></p>';
  if(st.cat==='Meetings Calendar')return h+'<div id="mhRes">'+vCal()+'<h3 class="mh-day">Other meeting listings (schedules not confirmed)</h3>'+res(true)+'</div>';
  return h+'<div id="mhRes">'+res()+'</div>'}
 function res(meetOnly){const {out,why}=list();const o=meetOnly?out.filter(r=>r.type==='meeting'&&!r.cal):out;
  let h='<p class="mh-count" role="status" aria-live="polite"><b>'+o.length+'</b> listings'+(st.town?' for '+X(st.town):'')+(st.cat&&!meetOnly?' · '+X(st.cat):'')+'.'+
   (why.age?' '+why.age+' not shown because their published minimum age is above '+age()+'.':'')+(why.town&&st.town?' '+why.town+' others aren’t linked to '+X(st.town)+' (<button type="button" class="mh-link" data-mhrel="all">show all of Rhode Island</button>).':'')+'</p>';
  return h+(o.length?o.map(card).join(''):'<p class="mh-note">Nothing matched these filters. Try fewer filters, or call 211 any time. No match doesn’t mean there’s no help.</p>')}
 const CRISIS='<div class="mh-crisis" role="region" aria-label="Crisis help, available now">'+
  '<p><b>In danger or a medical emergency? Call <a class="mh-tel" href="tel:911">911</a>.</b></p>'+
  '<p><b>Crisis counseling, 24/7, free:</b> call or text <a class="mh-tel" href="tel:988" aria-label="Call 988 Suicide and Crisis Lifeline">988</a> (<a class="mh-tel" href="sms:988" aria-label="Text 988">text</a>) or <a class="mh-tel" href="https://988lifeline.org/chat/" target="_blank" rel="noopener noreferrer">chat online</a>.</p>'+
  '<p><b>BH Link</b> walk-in crisis center for adults 18+, 24/7, 975 Waterman Ave., East Providence: <a class="mh-tel" href="tel:+14014145465">401-414-5465</a> <span class="mh-sm">(cost not published)</span></p>'+
  '<p><b>Kids’ Link RI</b> for children and teens, 24/7, no charge: <a class="mh-tel" href="tel:+18555435465">855-543-5465</a></p>'+
  '<p><b>Domestic violence helpline</b>, 24/7: <a class="mh-tel" href="tel:+18004948100">800-494-8100</a> · Other help any time: <a class="mh-tel" href="tel:211">211</a></p></div>';
 window.vMH=function(){load();try{window['ga-disable-'+GA]=true}catch(_){}
  const head='<a class="mh-skip" href="#mhRes">Skip to listings</a><div class="mh-head"><h2>Mental Health &amp; Self-Help'+(JT?' for Jamestown':' in Rhode Island')+'</h2>'+CRISIS+
   '<p>Free to use, no sign-up. Counseling, low-cost care, support groups, recovery, family and senior help across all 39 towns. This is a directory, not medical advice: it doesn’t diagnose or recommend treatment. Independent and privately run by '+(JT?'Jamestown Island News':'Rhode Island Hurricane')+'.</p></div>';
  if(!D)return '<section class="box mh">'+head+'<p class="mh-note">Loading…</p></section>';
  return '<section class="box mh">'+head+'<div id="mhBody">'+vList()+'</div><p class="mh-foot">'+D.meta.record_count+' listings ('+D.meta.counts_by_record_type.service+' services, '+D.meta.counts_by_record_type.meeting+' meeting listings, '+D.meta.counts_by_record_type.directory+' official finders) from '+D.meta.source_count+' sources, checked Nov. 10, 2026. No provider was called; “checked” means the official source was reviewed, not that anyone is accepting patients. Not a complete list of every clinician or meeting. “Not published” means the source didn’t say. Nothing you choose here is saved, put in the address bar or sent to analytics.</p></section>'};
 const redraw=()=>{const b=document.getElementById('mhBody');if(!b||!D)return;const f=document.activeElement&&document.activeElement.dataset?document.activeElement.dataset.mh:null;b.innerHTML=vList();
  if(f){const e=b.querySelector('[data-mh="'+f+'"]');if(e){e.focus();if(e.tagName==='INPUT'&&e.type!=='checkbox'){const v=e.value;try{e.setSelectionRange(v.length,v.length)}catch(_){}}}}};
 document.addEventListener('input',e=>{const el=e.target,k=el.dataset&&el.dataset.mh;if(!k||!el.closest('.mh'))return;
  st[k]=el.type==='checkbox'?el.checked:el.value;if(k==='town')st.rel='';
  if(el.tagName==='SELECT'||el.type==='checkbox')redraw();else{clearTimeout(window.__mhT);window.__mhT=setTimeout(redraw,250)}});
 document.addEventListener('change',e=>{const el=e.target,k=el.dataset&&el.dataset.mh;if(k&&el.tagName==='SELECT'&&el.closest('.mh')&&st[k]!==el.value){st[k]=el.value;if(k==='town')st.rel='';redraw()}});
 document.addEventListener('click',e=>{const c=e.target.closest&&e.target.closest('[data-mhc],[data-mhreset],[data-mhrel]');if(!c||!c.closest('.mh'))return;e.preventDefault();
  if(c.dataset.mhreset){Object.assign(st,{town:JT?'Jamestown':'',rel:'',cat:'',age:'',cost:'',ins:'',lang:'',acc:false,kind:'',mode:'',q:'',unk:true})}
  else if(c.dataset.mhrel)st.rel=c.dataset.mhrel;else st.cat=c.dataset.mhc;redraw()});
 const css=document.createElement('style');css.id='mhCss';css.textContent=`
.mh{--mh-a:#D4ECF5;padding-bottom:16px}.mh-skip{position:absolute;left:-9999px}.mh-skip:focus{left:12px;top:12px;z-index:50;padding:10px 14px;background:#E9C46A;color:#0A1428!important;font-weight:800}
.mh-head{padding:22px 18px 6px}.mh-head h2{margin:0 0 10px;font:700 clamp(26px,5vw,40px)/1.1 "Playfair Display",Georgia,serif;color:var(--mh-a)}.mh-head>p{margin:10px 0 4px;font:400 17px/1.5 Georgia,serif;color:#EEE9E5}
.mh-crisis{padding:12px 14px;border-left:5px solid #B5123A;background:#ffffff10;border-radius:4px}.mh-crisis p{margin:4px 0;font:400 16px/1.5 Georgia,serif;color:#EEE9E5}.mh-crisis b{color:#fff}.mh-crisis small{color:#C9D6DF}
.mh .mh-sm{font:inherit;font-size:.92em;letter-spacing:0;text-transform:none;color:#C9D6DF}.mh-tel{font-weight:800;color:#fff!important;text-decoration:underline;text-underline-offset:3px;white-space:nowrap}
.mh-cats{display:flex;flex-wrap:wrap;gap:8px;margin:14px 18px 4px}.mh-cats button{all:unset;cursor:pointer;min-height:24px;padding:10px 14px;border-radius:6px;border:2px solid #D4ECF566;font:800 15px/1.1 "Libre Franklin",system-ui,sans-serif;color:#fff}.mh-cats button small{font-weight:600;opacity:.8}.mh-cats button.on{background:#D4ECF5;color:#0A1428;border-color:#D4ECF5}
.mh-filters{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:10px;margin:12px 18px}.mh-filters label{display:flex;flex-direction:column;gap:5px;font:800 13px/1.2 "Libre Franklin",system-ui,sans-serif;letter-spacing:.04em;color:var(--mh-a)}
.mh-filters select,.mh-filters input:not([type=checkbox]){padding:12px;border:1px solid #D4ECF588;border-radius:6px;background:#0A1428;color:#fff;font:500 17px/1.2 "Libre Franklin",system-ui,sans-serif;min-width:0}
.mh-filters .mh-chk{flex-direction:row;align-items:center;gap:8px;font-size:15px;letter-spacing:0;color:#EEE9E5}.mh-chk input{width:22px;height:22px;flex:none}
.mh-reset,.mh-link{all:unset;cursor:pointer;font:700 15px/1.3 "Libre Franklin",system-ui,sans-serif;color:var(--mh-a);text-decoration:underline}.mh-reset{align-self:end;padding:12px 0}
.mh-route,.mh-note,.mh-count,.mh-foot{margin:10px 18px;font:400 16px/1.5 Georgia,serif;color:#EEE9E5}.mh-route{padding:12px 14px;border:1px solid #D4ECF555;border-radius:8px;background:#ffffff08}.mh-route p{margin:6px 0}.mh-route small{color:#C9D6DF}.mh-foot{font-size:13px;color:#C9D6DF;font-style:italic}
.mh-card{margin:8px 18px;border:1px solid #D4ECF544;border-radius:8px;background:#ffffff08}.mh-card>summary{list-style:none;cursor:pointer;display:flex;flex-direction:column;gap:5px;padding:14px}.mh-card>summary::-webkit-details-marker{display:none}
.mh-card b{font:700 19px/1.25 "Playfair Display",Georgia,serif;color:#fff}.mh-org{font:700 14px/1.3 "Libre Franklin",system-ui,sans-serif;color:var(--mh-a)}.mh-desc,.mh-where,.mh-sched{font:400 16px/1.45 Georgia,serif;color:#EEE9E5}.mh-sched small{color:#E9C46A}
.mh-badges{display:flex;flex-wrap:wrap;gap:6px}.mh-cls,.mh-warn{padding:3px 8px;border-radius:4px;background:#2F5B4F;color:#fff;font:800 12px/1.3 "Libre Franklin",system-ui,sans-serif;letter-spacing:.05em;text-transform:uppercase}.mh-warn{background:#8A5A00}
.mh-tags{display:flex;flex-wrap:wrap;gap:6px}.mh-tags i{font-style:normal;padding:3px 8px;border-radius:12px;border:1px solid #D4ECF555;font:600 13px/1.3 "Libre Franklin",system-ui,sans-serif;color:#EEE9E5}.mh-tags i.mh-rel{border-color:#D4ECF5;color:#fff}.mh-tags i.mh-ask{border-style:dashed;color:#E9C46A}
.mh-call{font:600 16px/1.5 "Libre Franklin",system-ui,sans-serif;color:#fff}.mh-call small{color:#C9D6DF}.mh-avail{font:italic 13px/1.4 Georgia,serif;color:#C9D6DF}
.mh-more{padding:0 14px 14px;border-top:1px solid #ffffff14}.mh-row{margin:8px 0 0;font:400 15px/1.5 Georgia,serif;color:#EEE9E5}.mh-row em{display:block;font:800 11px/1.3 "Libre Franklin",system-ui,sans-serif;font-style:normal;letter-spacing:.08em;text-transform:uppercase;color:var(--mh-a)}
.mh-go{font:700 15px/1.3 "Libre Franklin",system-ui,sans-serif;color:var(--mh-a)!important;margin-right:14px}.mh-links{margin:10px 0 0}.mh-src{font:12px/1.4 Georgia,serif;color:#C9D6DF}.mh-s{color:#C9D6DF!important;margin-right:6px}
.mh-day{margin:18px 18px 6px;font:800 15px/1.3 "Libre Franklin",system-ui,sans-serif;letter-spacing:.06em;text-transform:uppercase;color:var(--mh-a)}
.mh-ev{display:grid;grid-template-columns:110px minmax(0,1fr);gap:10px;margin:6px 18px;padding:10px 12px;border:1px solid #D4ECF544;border-radius:8px;font:400 15px/1.45 Georgia,serif;color:#EEE9E5}.mh-ev b{font:700 17px/1.3 "Playfair Display",Georgia,serif;color:#fff}.mh-evt{font:800 15px/1.3 "Libre Franklin",system-ui,sans-serif;color:#fff}.mh-ev small{color:#C9D6DF}
.mh a:focus-visible,.mh button:focus-visible,.mh select:focus-visible,.mh input:focus-visible,.mh summary:focus-visible{outline:3px solid #E9C46A;outline-offset:2px}
@media(max-width:560px){.mh-head{padding:18px 12px 6px}.mh-filters{margin:10px 8px;grid-template-columns:minmax(0,1fr)}.mh-cats{margin:12px 8px 4px}.mh-card,.mh-route,.mh-note,.mh-count,.mh-foot,.mh-ev,.mh-day{margin-left:8px;margin-right:8px}.mh-ev{grid-template-columns:minmax(0,1fr)}}
@media(prefers-reduced-motion:reduce){.mh *{transition:none!important;animation:none!important}}`;document.head.appendChild(css);
 load();
 try{if(typeof STATE!=='undefined'&&STATE.view==='mh'&&typeof render==='function')render()}catch(_){}
})();

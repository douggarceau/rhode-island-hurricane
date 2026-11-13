/* Right-hand "Related links" column for wide screens on the pages that don't show the side story
   spots (jobs, grants, government, help). Mirrors the business directory column on the left.
   Contents: jump links to this page's sections, related pages on this site, and official resources.
   Official links are agency home pages or pages checked to load. Compact text, no big boxes. */
(function(){
 const X=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
 // [label, target]: a site page key (internal) or an https link (official resource)
 const JOBS_SITE=[['Government jobs','jobs'],['Major RI Employers','majors'],['Senior Jobs','seniorjobs'],['Tech Jobs','techjobs'],['AI Jobs','aijobs'],['Remote Jobs','remotejobs'],['Grants & Free Money','grants'],['Help & Benefits','help']];
 const JOBS_OFF=[['EmployRI: state job bank and career centers','https://www.employri.org/'],['RI Dept. of Labor and Training (unemployment, job training)','https://dlt.ri.gov/'],['Skills for Rhode Island’s Future','https://skillsforri.com/'],['State of Rhode Island jobs','https://ri.wd5.myworkdayjobs.com/RI'],['USAJOBS: federal jobs','https://www.usajobs.gov/'],['CCRI: courses and workforce training','https://www.ccri.edu/'],['HealthSource RI: health coverage between jobs','https://www.healthsourceri.com/'],['Report a job scam (FTC)','https://reportfraud.ftc.gov/']];
 const GROUPS={
  jobs:{site:JOBS_SITE,off:JOBS_OFF},
  grants:{site:[['Help & Benefits','help'],['Government jobs','jobs'],['Senior Jobs','seniorjobs'],['Town & state government','gov']],
   off:[['RI Dept. of Human Services (SNAP, heating help, child care)','https://dhs.ri.gov/'],['RIHousing: rent, mortgage and repair help','https://www.rihousing.com/'],['United Way of RI: call 2-1-1 for help finding programs','https://www.unitedwayri.org/'],['Grants.gov: federal grants','https://www.grants.gov/'],['USA.gov: government benefits finder','https://www.usa.gov/benefits'],['Federal student aid (FAFSA)','https://studentaid.gov/'],['IRS Free File','https://www.irs.gov/filing/irs-free-file-do-your-taxes-for-free'],['RI Commerce: small business grants and loans','https://commerceri.com/'],['Rhode Island Foundation grants','https://rifoundation.org/'],['Rhode Island Legal Services','https://www.rils.org/']]},
  gov:{site:[['Government jobs','jobs'],['State email directory','emails'],['Grants & Free Money','grants'],['Help & Benefits','help']],
   off:[['RI.gov: state services','https://www.ri.gov/'],['RI General Assembly: bills and votes','https://www.rilegislature.gov/'],['Open meetings portal (Secretary of State)','https://opengov.sos.ri.gov/'],['RI Secretary of State','https://sos.ri.gov/'],['RI Board of Elections','https://elections.ri.gov/'],['Office of the Governor','https://governor.ri.gov/'],['RI Attorney General (public records requests)','https://riag.ri.gov/'],['State spending: Transparency Portal','https://transparency.ri.gov/']]},
  help:{site:[['Grants & Free Money','grants'],['Senior help','seniors'],['Mental health','mh'],['Recovery meetings','recovery'],['Government jobs','jobs']],
   off:[['United Way of RI: call 2-1-1 for help finding programs','https://www.unitedwayri.org/'],['988: suicide and crisis line, call or text 988','https://988lifeline.org/'],['RI Dept. of Human Services','https://dhs.ri.gov/'],['HealthSource RI: health insurance','https://www.healthsourceri.com/'],['Medicaid and health and human services (EOHHS)','https://eohhs.ri.gov/'],['RI Dept. of Health','https://health.ri.gov/'],['Office of Healthy Aging','https://oha.ri.gov/'],['Rhode Island Community Food Bank','https://rifoodbank.org/'],['Crossroads Rhode Island: housing help','https://www.crossroadsri.org/'],['Rhode Island Legal Services','https://www.rils.org/']]}
 };
 const VIEW_GROUP={jobs:'jobs',majors:'jobs',seniorjobs:'jobs',techjobs:'jobs',aijobs:'jobs',remotejobs:'jobs',alljobs:'jobs',grants:'grants',gov:'gov',ccri:'gov',emails:'gov',help:'help'};
 const EXTRA={seniorjobs:[['Office of Healthy Aging','https://oha.ri.gov/']],ccri:[['CCRI','https://www.ccri.edu/']]};
 let rail=null,raf=0;
 function headings(){const v=document.getElementById('view');if(!v)return [];
  return [...v.querySelectorAll('h3,h2')].filter(h=>h.offsetParent&&h.textContent.trim().length>2&&!h.closest('#relRail,.jl-tabs,nav'))
   .slice(0,12).map((h,i)=>{if(!h.id)h.id='rr-h'+i;return [h.textContent.trim().replace(/\s+/g,' ').slice(0,60),h.id]})}
 function html(v){const g=GROUPS[VIEW_GROUP[v]];const hs=headings();
  const site=g.site.filter(([,k])=>k!==v);
  return '<h2>Related links</h2>'
   +(hs.length>1?'<h3>On this page</h3><ul>'+hs.map(([t,id])=>'<li><a href="#'+X(id)+'" data-rr-jump="'+X(id)+'">'+X(t)+'</a></li>').join('')+'</ul>':'')
   +'<h3>On Rhode Island Hurricane</h3><ul>'+site.map(([t,k])=>'<li><a href="?go='+X(k)+'" data-go="'+X(k)+'">'+X(t)+'</a></li>').join('')+'</ul>'
   +'<h3>Official resources</h3><ul>'+g.off.concat(EXTRA[v]||[]).map(([t,u])=>'<li><a href="'+X(u)+'" target="_blank" rel="noopener">'+X(t)+' ↗</a></li>').join('')+'</ul>'
   +'<p class="rr-s">Links to official sites open in a new tab.</p>'}
 function place(){raf=0;const v=typeof STATE!=='undefined'?STATE.view:'';const view=document.getElementById('view');
  const on=!!VIEW_GROUP[v]&&view&&innerWidth>=1280;
  if(!on){if(rail)rail.hidden=true;return}
  const vr=view.getBoundingClientRect(),room=innerWidth-vr.right-20;
  if(room<220){if(rail)rail.hidden=true;return}
  if(!rail){rail=document.createElement('aside');rail.id='relRail';rail.setAttribute('aria-label','Related links');document.body.appendChild(rail)}
  if(rail.dataset.v!==v||rail.dataset.n!==String(view.querySelectorAll('h2,h3').length)){rail.innerHTML=html(v);rail.dataset.v=v;rail.dataset.n=String(view.querySelectorAll('h2,h3').length)}
  const dir=document.getElementById('dirCol'),ds=dir&&getComputedStyle(dir);
  const top=ds&&ds.position==='fixed'?parseFloat(ds.top)||150:150;
  rail.style.top=top+'px';rail.style.width=Math.min(280,room-10)+'px';rail.hidden=false}
 const sched=()=>{if(!raf)raf=requestAnimationFrame(place)};
 if(typeof window.render==='function'){const r0=window.render;window.render=function(){const out=r0.apply(this,arguments);try{if(rail)rail.dataset.v='';sched();setTimeout(sched,800);setTimeout(sched,2500)}catch(_){}return out}}
 addEventListener('resize',sched);
 document.addEventListener('click',e=>{const a=e.target.closest&&e.target.closest('#relRail [data-rr-jump]');if(!a)return;e.preventDefault();const h=document.getElementById(a.dataset.rrJump);if(h)window.scrollTo(0,h.getBoundingClientRect().top+scrollY-90)});
 const css=document.createElement('style');css.textContent=`
#relRail{position:fixed;right:10px;bottom:12px;z-index:40;overflow:auto;box-sizing:border-box;padding:10px 12px;background:#0A1428;border:1px solid #0F1F36;border-radius:8px;font:400 13px/1.4 "Libre Franklin",system-ui,sans-serif;color:#D4ECF5}
#relRail[hidden]{display:none!important}
#relRail h2{margin:0 0 6px;font:700 14px/1.3 "Libre Franklin",system-ui,sans-serif;color:#fff}
#relRail h3{margin:10px 0 3px;font:700 11px/1.3 "Libre Franklin",system-ui,sans-serif;text-transform:uppercase;letter-spacing:.06em;color:#E9C46A}
#relRail ul{margin:0;padding:0;list-style:none}#relRail li{margin:0;padding:3px 0;border-top:1px solid #ffffff10}#relRail li:first-child{border-top:0}
#relRail a{color:#D4ECF5;text-decoration:none}#relRail a:hover,#relRail a:focus-visible{color:#fff;text-decoration:underline}
#relRail .rr-s{margin:10px 0 0;font-size:11px;color:#8A9DA1}
@media (max-width:1279px){#relRail{display:none!important}}`;document.head.appendChild(css);
 sched();setTimeout(sched,1500);
})();

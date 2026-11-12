/* Shared layout for every job page: the "Job lists" tab row (window.jobTabs) and the phone layout
   that turns job tables into stacked cards so no column is hidden off-screen.
   Loaded before jobs.js so the tab row exists even when a job page is opened by direct link. */
(function(){
 const LISTS=[['jobs','Government jobs','State, towns, schools'],['majors','Major RI Employers','Hospitals, utilities, retail'],['seniorjobs','Senior Jobs','Part-time, retirees'],['techjobs','Tech Jobs','Entry-level IT'],['aijobs','AI Jobs','RI, nearby, remote'],['remotejobs','Remote Jobs','Work from home']];
 // "All RI jobs" (Adzuna) shows only once its daily data file exists, so the tab never leads to an empty page.
 const AJ=['alljobs','All RI jobs','Every job posted, daily'];let ajOn=false,ajAsked=false;
 function ajCheck(){if(ajAsked)return;ajAsked=true;fetch('data/alljobs.json',{method:'HEAD',cache:'no-store'}).then(r=>{if(!r.ok)return;ajOn=true;
   document.querySelectorAll('nav.jl-tabs[data-cur]').forEach(n=>{n.outerHTML=window.jobTabs(n.dataset.cur)})}).catch(()=>{})}
 window.jobTabs=cur=>{ajCheck();const L=ajOn||cur==='alljobs'?[AJ,...LISTS]:LISTS;return '<nav class="jl-tabs" aria-label="Job lists" data-cur="'+cur+'"><span class="jl-lab">Job lists:</span>'+L.map(([k,l,d])=>k===cur
   ?'<button type="button" class="on" aria-current="page"><b>'+l+'</b><small>'+d+'</small></button>'
   :'<button type="button" data-go="'+k+'"><b>'+l+'</b><small>'+d+'</small></button>').join('')+'</nav>'};
 // Phone layout: label each cell with its column heading so the row can stack as a card.
 const SEL='table.jb-t,table.mj-t,table.sj-t,table.gr-t,table.em-t,table.aj-t';
 function label(root){(root.querySelectorAll?root:document).querySelectorAll(SEL).forEach(t=>{const h=[...t.querySelectorAll('thead th')].map(th=>th.textContent.trim());
   t.querySelectorAll('tbody tr').forEach(tr=>[...tr.children].forEach((td,i)=>{if(h[i]&&!td.hasAttribute('data-label'))td.setAttribute('data-label',h[i])}))})}
 new MutationObserver(ms=>{for(const m of ms)if(m.addedNodes.length){label(document);break}}).observe(document.documentElement,{childList:true,subtree:true});
 const css=document.createElement('style');css.textContent=`
.jl-tabs{display:flex;flex-wrap:wrap;gap:6px;align-items:stretch;margin:0 0 10px;padding:0 0 10px;border-bottom:1px solid #D4ECF533}
.jl-tabs .jl-lab{align-self:center;color:#B9CAD6;font-weight:700;margin-right:2px}
.jl-tabs button{all:unset;cursor:pointer;display:flex;flex-direction:column;padding:4px 10px;border:1px solid #D4ECF566;border-radius:5px;color:#D4ECF5;line-height:1.25}
.jl-tabs button small{font-size:.8em;color:#B9CAD6}
.jl-tabs button:hover,.jl-tabs button:focus-visible{border-color:#E9C46A;outline:none}
.jl-tabs button.on{background:#E9C46A;border-color:#E9C46A;color:#0A1428;cursor:default}
.jl-tabs button.on small{color:#0A1428}
@media (max-width:640px){
 .jl-tabs{display:grid;grid-template-columns:1fr 1fr;gap:5px}
 .jl-tabs .jl-lab{grid-column:1/-1}
 :is(${SEL}){display:block;width:100%!important;min-width:0!important}
 :is(${SEL}) thead{display:none}
 :is(${SEL}) tbody,:is(${SEL}) tr{display:block}
 :is(${SEL}) tr{border:1px solid #D4ECF533;border-radius:6px;padding:6px 8px;margin:0 0 8px}
 :is(${SEL}) td{display:block;border:0!important;padding:3px 0!important;white-space:normal!important;min-width:0!important}
 :is(${SEL}) td:empty{display:none!important}
 :is(${SEL}) td[data-label]:not(:first-child)::before{content:attr(data-label);display:block;font-size:.8em;font-weight:700;color:#B9CAD6;text-transform:uppercase;letter-spacing:.03em}
 :is(.jb-scroll,.mj-scroll,.sj-scroll,.gr-scroll,.aj-scroll){overflow:visible!important}
}`;document.head.appendChild(css);
})();

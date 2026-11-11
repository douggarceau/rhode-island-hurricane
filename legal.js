/* One short legal note at the top of every section where it matters. Same wording and look on every page.
   Site name comes from window.SITE_NAME (defaults to the page's own name). */
(function(){
 const NAME=window.SITE_NAME||'Rhode Island Hurricane';
 const PUB='<b>Public records.</b> Compiled from official government sources as published; figures and names can be out of date. Verify with the agency or office before relying on any of it. '+NAME+' is independent and not affiliated with any government.';
 const HELP='<b>Not medical, legal or financial advice.</b> Being listed does not mean you qualify or that help is still available. Rules change: confirm with the provider before you apply or go. Emergency: call 911. Mental health crisis: call or text 988.';
 const EVENTS='<b>Event and place details come from organizers’ public listings</b> and can change or be canceled. Verify with the organizer or venue before you go. '+NAME+' is not the organizer.';
 const NOTES={
  gov:PUB,ccri:PUB,
  help:HELP,mh:HELP,seniors:HELP,recovery:HELP,cancer:HELP,support:HELP,
  cal:EVENTS,holiday:EVENTS,visit:EVENTS,scene:EVENTS,venues:EVENTS,bands:EVENTS,
  crime:'<b>Public records.</b> Based on public police, court and agency records. An arrest or charge is an allegation, not a finding of guilt; everyone is presumed innocent unless proven guilty in court. Report corrections and we will review them.',
  realestate:'<b>Public records and listings.</b> Property details come from town records and public listings and may be out of date. This is not an appraisal, offer or legal advice; verify with the town and a licensed professional.',
  read:'<b>Independent publication.</b> Not affiliated with any government agency. Facts are taken from the sources linked in each article; verify with them before relying on details.'
 };
 function add(){if(typeof STATE==='undefined')return;const v=STATE.view;const html=NOTES[v];const view=document.getElementById('view');if(!view)return;
  const old=view.querySelector(':scope > .legal-note');if(!html){if(old)old.remove();return}
  if(old&&old.dataset.v===v)return;if(old)old.remove();
  const p=document.createElement('p');p.className='legal-note';p.dataset.v=v;p.setAttribute('role','note');p.innerHTML=html;
  const bar=view.querySelector(':scope > .ng-bar, :scope > .hp-tabs');if(bar)bar.after(p);else view.insertBefore(p,view.firstChild)}
 if(typeof window.render==='function'){const r0=window.render;window.render=function(){const out=r0.apply(this,arguments);try{add()}catch(_){}return out}}
 const css=document.createElement('style');css.textContent='#view>.legal-note{margin:0 0 8px;padding:2px 0 2px 8px;border-left:2px solid #E9C46A;color:#D4ECF5;font-size:13px!important;line-height:1.4!important}#view>.legal-note b{color:#fff}';
 document.head.appendChild(css);
 try{add()}catch(_){}setInterval(()=>{try{add()}catch(_){}},800);
})();

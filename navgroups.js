/* Shorter menu: a few main sections, with sub-tabs inside each section (same pattern as Help).
   The original section buttons stay in the page (hidden) so every existing link, ?go= deep link and script keeps working.
   Utility buttons (Advertise, Share, Sister Publications, Directory, Get the App) move into a "More" panel with their own handlers intact. */
(function(){
 const GROUPS=[
  {k:'news',label:'News',items:[['stories','Entertainment'],['bars','Rhode Island News'],['tech','Tech & AI'],['crime','Crime Watch']]},
  {k:'events',label:'Events',items:[['cal','Event Calendar'],['holiday','Holiday Guide'],['scene','Arts & Entertainment'],['venues','Venues'],['bands','Bands']]},
  {k:'govt',label:'Government',items:[['gov','RI Government'],['ccri','CCRI Guide']]}];
 const HELPV=['help','mh','seniors','recovery'];
 const UTIL=/^(Advertise|Share|Sister Publications|Directory)$/;
 const nav=document.getElementById('nav');if(!nav)return;
 // a section counts only if its own menu button is actually shown (the site hides some sections with CSS)
 const shown=v=>{const b=nav.querySelector('.nb[data-go="'+v+'"]');return !!b&&!b.hidden&&getComputedStyle(b).display!=='none'};
 const LIVE={};for(const g of GROUPS)LIVE[g.k]=g.items.filter(([v])=>shown(v));
 const ACTIVE=GROUPS.filter(g=>LIVE[g.k].length>1);
 const grpOf=v=>ACTIVE.find(g=>g.items.some(i=>i[0]===v));
 for(const g of ACTIVE){const items=LIVE[g.k],first=nav.querySelector('.nb[data-go="'+items[0][0]+'"]');
  const b=document.createElement('button');b.type='button';b.className='nb ng-main';b.dataset.go=items[0][0];b.dataset.ng=g.k;b.textContent=g.label;
  nav.insertBefore(b,first);
  for(const [v] of items){const o=nav.querySelector('.nb[data-go="'+v+'"]:not(.ng-main)');if(o){o.hidden=true;o.style.display='none'}}}
 const vb=nav.querySelector('.nb[data-go="visit"]');if(vb)vb.textContent='Visit RI';
 // "More" panel for utility buttons
 const more=document.createElement('button');more.type='button';more.className='nb ng-more';more.id='ngMore';more.setAttribute('aria-expanded','false');more.setAttribute('aria-controls','ngPanel');more.textContent='More ▾';
 const panel=document.createElement('div');panel.id='ngPanel';panel.hidden=true;panel.setAttribute('role','group');panel.setAttribute('aria-label','More');
 nav.appendChild(more);nav.appendChild(panel);
 const tidy=()=>{[...nav.querySelectorAll(':scope > .nb')].forEach(b=>{if(b!==more&&UTIL.test((b.textContent||'').trim()))panel.appendChild(b)});
  const s=nav.querySelector(':scope > #nbSub');if(s&&s.nextElementSibling!==more)nav.insertBefore(s,more)};
 tidy();new MutationObserver(tidy).observe(nav,{childList:true});
 more.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();panel.hidden=!panel.hidden;more.setAttribute('aria-expanded',String(!panel.hidden))});
 document.addEventListener('click',e=>{if(!panel.hidden&&!e.target.closest('#ngPanel,#ngMore')){panel.hidden=true;more.setAttribute('aria-expanded','false')}});
 // after every render: highlight the main section and add its sub-tabs
 function after(){if(typeof STATE==='undefined')return;const v=STATE.view==='read'?STATE.prev:STATE.view;const g=grpOf(v);
  nav.querySelectorAll('.ng-main').forEach(b=>{if(g&&b.dataset.ng===g.k)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current')});
  if(HELPV.includes(v)){const h=nav.querySelector('.nb[data-go="help"]');if(h)h.setAttribute('aria-current','page')}
  const view=document.getElementById('view');if(!view||!g||STATE.view==='read')return;
  const items=LIVE[g.k];
  if(view.querySelector('.ng-bar'))return;
  const bar=document.createElement('div');bar.className='hp-tabs ng-bar';bar.setAttribute('role','tablist');bar.setAttribute('aria-label',g.label+' sections');
  bar.innerHTML=items.map(([k,t])=>'<button type="button" role="tab" data-go="'+k+'" aria-selected="'+(k===v)+'" class="'+(k===v?'on':'')+'">'+t+'</button>').join('');
  view.insertBefore(bar,view.firstChild)}
 if(typeof window.render==='function'){const r0=window.render;window.render=function(){const out=r0.apply(this,arguments);try{after()}catch(_){}return out}}
 const css=document.createElement('style');css.textContent=`
#ngPanel{flex-basis:100%;display:flex;flex-wrap:wrap;justify-content:center;gap:6px;padding:6px 0 2px}#ngPanel[hidden]{display:none!important}
#nav>[data-go="front"]{order:1!important}#nav>.ng-main[data-ng="news"],#nav>[data-go="stories"]{order:2!important}#nav>.ng-main[data-ng="events"],#nav>[data-go="cal"]{order:3!important}#nav>[data-go="help"]{order:4!important}#nav>.ng-main[data-ng="govt"]{order:5!important}#nav>[data-go="visit"]{order:6!important}#nav>#nbSearch{order:7!important}#nav>#nbSub{order:8!important}#nav>#ngMore{order:9!important}#nav>#ngPanel{order:10!important}
.ng-bar{display:flex;flex-wrap:wrap;gap:6px;margin:0 0 10px}.ng-bar button{all:unset;cursor:pointer;padding:7px 11px;border-radius:5px;border:1px solid #D4ECF566;font:700 13px/1 "Libre Franklin",system-ui,sans-serif;color:#fff}
.ng-bar button.on{background:#D4ECF5;color:#0A1428;border-color:#D4ECF5}.ng-bar button:focus-visible{outline:3px solid #E9C46A;outline-offset:2px}`;document.head.appendChild(css);
 try{after()}catch(_){}
})();

/* Phones: Help, Seniors, Cancer help and Mental health button rows become one dropdown each,
   and after a choice the page scrolls to the results so the change is visible. */
(()=>{
const PH=()=>matchMedia('(max-width:699px)').matches;
const KINDS=[['cn-cats','Show'],['hp-tabs','Help section'],['mh-cats','Show']];
const kindOf=g=>KINDS.find(k=>g.classList.contains(k[0]));
const label=b=>{const c=b.cloneNode(true);const n=c.querySelector('small,span');const cnt=n?n.textContent.trim():'';if(n)n.remove();const t=c.textContent.replace(/\s+/g,' ').trim();return cnt?t+' ('+cnt+')':t};
function enhance(){
 document.querySelectorAll('#view .hp-tabs,#view .mh-cats').forEach(g=>{
  const k=kindOf(g);if(!k)return;const B=[...g.querySelectorAll('button')];if(!B.length)return;
  let s=g.previousElementSibling;
  if(!(s&&s.classList.contains('pf-sel'))){s=document.createElement('label');s.className='pf-sel';s.innerHTML='<span>'+k[1]+'</span><select></select>';g.parentNode.insertBefore(s,g)}
  if(!g.classList.contains('pf-hid')){const cs=getComputedStyle(g);s.style.marginLeft=cs.marginLeft;s.style.marginRight=cs.marginRight}
  const sel=s.querySelector('select');sel.dataset.pfk=k[0];
  const on=Math.max(0,B.findIndex(b=>b.classList.contains('on')||b.getAttribute('aria-selected')==='true'));
  const html=B.map((b,i)=>'<option value="'+i+'"'+(i===on?' selected':'')+'>'+label(b).replace(/&/g,'&amp;').replace(/</g,'&lt;')+'</option>').join('');
  if(sel.__h!==html){sel.innerHTML=html;sel.__h=html}
  g.classList.add('pf-hid');
 })}
const toResults=(f)=>{if(!PH())return;setTimeout(()=>{enhance();const el=f();if(!el)return;const y=el.getBoundingClientRect().top+scrollY-56;scrollTo({top:Math.max(0,y),behavior:'instant'})},150)};
document.addEventListener('change',e=>{const sel=e.target;if(!sel.closest||!sel.closest('.pf-sel'))return;
 const g=sel.parentNode.nextElementSibling;if(!g)return;const b=g.querySelectorAll('button')[+sel.value];if(!b)return;
 const k=sel.dataset.pfk;b.click();
 toResults(()=>document.querySelector('#view .pf-sel select[data-pfk="'+k+'"]')?.parentNode)});
document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('[data-snneed],[data-snben],[data-cnri],[data-cnfind]');if(!b)return;
 toResults(()=>document.getElementById('hpBody'))});
new MutationObserver(enhance).observe(document.documentElement,{childList:true,subtree:true});enhance();
const css=document.createElement('style');css.id='phoneFixCss';css.textContent=`
.pf-sel{display:none}
@media (max-width:699px){
#view .pf-hid{display:none!important}
#view .pf-sel{display:flex;flex-direction:column;gap:5px;margin:12px 0 6px;font:800 15px/1.2 "Libre Franklin",system-ui,sans-serif!important;letter-spacing:.02em;color:#D4ECF5}
#view .pf-sel select{padding:12px;border:1px solid #D4ECF588;border-radius:6px;background:#0A1428;color:#fff;font:600 17px/1.2 "Libre Franklin",system-ui,sans-serif;letter-spacing:0;text-transform:none;width:100%;max-width:100%}
}`;document.head.appendChild(css);
})();

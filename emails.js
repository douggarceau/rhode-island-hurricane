/* Government > Email directory: every published government work contact, searchable, with copy buttons.
   Data: data/emails.json, loaded the first time the tab opens. Compact rows, no boxes. */
(function(){
 let D=null,asked=false,err=false,lim=300;
 const X=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
 const uniq=a=>[...new Set(a.filter(Boolean))].sort((x,y)=>x.localeCompare(y));
 const st={q:'',w:'State workers',a:'',o:'',only:false};
 function load(){if(asked)return;asked=true;fetch('data/emails.json?'+Math.floor(Date.now()/6e5)).then(r=>{if(!r.ok)throw new Error(r.status);return r.json()}).then(j=>{D=j.rows;fill()}).catch(()=>{err=true;asked=false;fill()})}
 function opts(sel,list,all){const cur=sel.value;sel.innerHTML='<option value="">'+all+'</option>'+list.map(v=>'<option'+(v===cur?' selected':'')+'>'+X(v)+'</option>').join('');if(cur&&!list.includes(cur))sel.value=''}
 let shown=[];
 function fill(){const root=document.getElementById('emRoot');if(!root)return;
  const L=root.querySelector('#emList'),C=root.querySelector('#emCount');
  if(err){L.innerHTML='<p>Couldn’t load the directory. <button type="button" id="emRetry">Retry</button></p>';return}
  if(!D){L.innerHTML='<p>Loading the directory…</p>';return}
  const W=root.querySelector('#emWho'),A=root.querySelector('#emArea'),O=root.querySelector('#emOrg');
  if(W.options.length<2){const n={};D.forEach(r=>n[r[7]]=(n[r[7]]||0)+1);W.innerHTML='<option value="">Everyone ('+D.length.toLocaleString()+')</option>'+['State workers','City & town officials','State boards & commissions','State agency heads'].filter(k=>n[k]).map(k=>'<option'+(k===st.w?' selected':'')+' value="'+k+'">'+k+' ('+n[k].toLocaleString()+')</option>').join('')}
  W.value=st.w;const base=D.filter(r=>!st.w||r[7]===st.w);
  opts(A,uniq(base.map(r=>r[6])),'All areas');
  A.value=st.a;opts(O,uniq(base.filter(r=>!st.a||r[6]===st.a).map(r=>r[2])),st.a==='Cities & towns'?'All towns':'All offices, towns & boards');O.value=st.o;
  const q=st.q.trim().toLowerCase();
  shown=base.filter(r=>(!st.a||r[6]===st.a)&&(!st.o||r[2]===st.o)&&(!st.only||r[4])&&(!q||(r[0]+' '+r[1]+' '+r[2]+' '+r[3]+' '+r[4]).toLowerCase().includes(q)));
  const ne=shown.filter(r=>r[4]).length;
  C.textContent=shown.length.toLocaleString()+' people · '+ne.toLocaleString()+' with email';
  L.innerHTML=shown.length?'<table class="em-t"><thead><tr><th>Name / title</th><th>Office</th><th>Email</th><th>Phone</th></tr></thead><tbody>'+shown.slice(0,lim).map((r,i)=>'<tr><td><b>'+X(r[0])+'</b>'+(r[1]?'<br><span class="em-s">'+X(r[1])+'</span>':'')+'</td><td>'+X(r[2])+(r[3]?'<br><span class="em-s">'+X(r[3])+'</span>':'')+'</td><td class="em-e">'+(r[4]?'<a href="mailto:'+X(r[4])+'">'+X(r[4])+'</a> <button type="button" class="em-cp" data-i="'+i+'">Copy</button>':'<span class="em-s">Not published</span>')+'</td><td class="em-p">'+X(r[5])+'</td></tr>').join('')+'</tbody></table>'+(shown.length>lim?'<button type="button" id="emMore">Show more ('+(shown.length-lim).toLocaleString()+' left)</button>':''):'<p>No one matches. Try fewer words or clear the filters.</p>'}
 function copy(text,btn){const done=()=>{const o=btn.textContent;btn.textContent='Copied';setTimeout(()=>btn.textContent=o,1200)};
  if(navigator.clipboard)navigator.clipboard.writeText(text).then(done).catch(()=>{});else{const t=document.createElement('textarea');t.value=text;document.body.appendChild(t);t.select();try{document.execCommand('copy');done()}catch(_){}t.remove()}}
 window.vEmails=function(){setTimeout(()=>{load();const root=document.getElementById('emRoot');if(root){root.querySelector('#emQ').value=st.q;root.querySelector('#emOnly').checked=st.only}fill()},0);
  return '<section class="box em" id="emRoot"><h2>Government email directory</h2>'
   +'<p class="em-s">Published work emails and phones for state agencies, boards, cities and towns, and colleges, from official sources (checked Nov. 10, 2026). Not every employee is listed; “Not published” means no email was posted.</p>'
   +'<div class="em-f"><input type="search" id="emQ" placeholder="Search a name, title, office or email" aria-label="Search the directory">'
   +'<select id="emWho" aria-label="Who"><option value="">Everyone</option></select>'
   +'<select id="emArea" aria-label="Area"><option value="">All areas</option></select>'
   +'<select id="emOrg" aria-label="Office, town or board"><option value="">All offices, towns & boards</option></select>'
   +'<label><input type="checkbox" id="emOnly"> Has email</label>'
   +'<button type="button" id="emCopyAll">Copy shown emails</button> <button type="button" id="emClear">Clear</button> <span id="emCount" class="em-s"></span></div>'
   +'<div id="emList"></div></section>'};
 document.addEventListener('input',e=>{const t=e.target;if(!t.closest||!t.closest('#emRoot'))return;
  if(t.id==='emQ')st.q=t.value;else if(t.id==='emWho'){st.w=t.value;st.a='';st.o=''}else if(t.id==='emArea'){st.a=t.value;st.o=''}else if(t.id==='emOrg')st.o=t.value;else if(t.id==='emOnly')st.only=t.checked;else return;lim=300;fill()});
 document.addEventListener('click',e=>{const t=e.target;if(!t.closest||!t.closest('#emRoot'))return;
  if(t.id==='emMore'){lim+=500;fill()}
  else if(t.id==='emRetry'){err=false;load();fill()}
  else if(t.id==='emClear'){st.q='';st.w='';st.a='';st.o='';st.only=false;const r=document.getElementById('emRoot');r.querySelector('#emQ').value='';r.querySelector('#emOnly').checked=false;r.querySelector('#emArea').value='';r.querySelector('#emWho').value='';lim=300;fill()}
  else if(t.id==='emCopyAll'){copy([...new Set(shown.filter(r=>r[4]).map(r=>r[4]))].join(', '),t)}
  else if(t.classList.contains('em-cp')){copy(shown[+t.dataset.i][4],t)}});
 const css=document.createElement('style');css.textContent=`
#view #emRoot{display:block!important}
#emRoot>*{width:auto;max-width:100%}
#view #emRoot .em-f>input[type=search]{width:auto!important;flex:1 1 220px!important;margin:0!important}
#view #emRoot .em-f>select{width:auto!important;flex:0 1 210px!important;margin:0!important}
#view #emRoot .em-f>label{display:inline-flex!important;gap:4px;align-items:center;width:auto!important;margin:0!important}
#view #emRoot .em-f>label>input{width:auto!important;margin:0!important}
#emRoot .em-f{display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin:6px 0}
#emRoot .em-f input[type=search]{flex:1 1 220px;min-width:0;height:30px;padding:0 8px;border:1px solid #D4ECF544;border-radius:4px;background:#0A1428;color:#fff}
#emRoot .em-f select{height:30px;max-width:100%;padding:0 6px;border:1px solid #D4ECF544;border-radius:4px;background:#0A1428;color:#fff}
#emRoot .em-f button,#emRoot #emMore,#emRoot .em-cp{all:unset;cursor:pointer;padding:3px 8px;border:1px solid #D4ECF566;border-radius:4px;color:#D4ECF5}
#emRoot .em-cp{padding:0 5px;margin-left:4px}
#emRoot #emMore{display:block;margin:8px auto}
#emRoot .em-s{color:#B9CAD6}
#emRoot table.em-t{width:100%;border-collapse:collapse}
#emRoot .em-t th{text-align:left;color:#B9CAD6;border-bottom:1px solid #D4ECF544;padding:4px 6px}
#emRoot .em-t td{vertical-align:top;border-bottom:1px solid #D4ECF51f;padding:4px 6px}
#emRoot .em-e{white-space:nowrap}#emRoot .em-e a{color:#E9C46A}
#emRoot .em-p{white-space:nowrap;color:#B9CAD6}
#emRoot #emList{overflow-x:auto}
@media (max-width:700px){#emRoot .em-t th:nth-child(4),#emRoot .em-t td:nth-child(4){display:none}}`;
 document.head.appendChild(css);
 if(typeof STATE!=='undefined'&&STATE.view==='emails'&&typeof render==='function')render();
})();

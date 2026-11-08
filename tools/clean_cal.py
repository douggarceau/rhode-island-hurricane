"""Calendar clean-up for Jamestown Island News (safe to run every update).
- Merges the same event listed twice by two sources (same date, same start time,
  same or blank venue, very similar title). Keeps the organizer's own listing and
  fills any blank fields from the other copy.
- Turns placeholder times like "unknown" into "" (unknown stays unknown).
- Files rehearsals under "community" so they do not count as concerts.
Run: python3 tools/clean_cal.py   (prints what it merged)"""
import json,re,difflib,sys
P='data/cal.json'
d=json.load(open(P));E=d['events']
GENERIC={'Jamestown Public Calendar','jamestownri.gov',''}
VSTOP=r"\b(saint|st|the|church|catholic|episcopal|chapel|parish|of|at|hall|center|centre)\b"
def vnorm(v):
    v=(v or '').lower().replace('’',"'").replace("'s",'s');v=re.sub(r'\bsaint\b','st',v)
    return re.sub(r'[^a-z]','',re.sub(VSTOP,' ',v))
vk=lambda e:vnorm(e.get('venue'))[:8]
STOP={'at','the','a','an','of','and','for','in','on','with','sacrament','day','weekly','saturday','sunday','monday','tuesday','wednesday','thursday','friday'}
SYN={'reconciliation':'confession','confessions':'confession','thrift':'thrift'}
def toks(e):
    vt=set(re.findall(r'[a-z]+',(e.get('venue') or '').lower().replace("’s",'s').replace("'s",'s')))|{'st','saint','church','episcopal','catholic'}
    w=re.findall(r'[a-z]+',(e.get('artists') or '').lower().replace("’s",'s').replace("'s",'s'))
    return {SYN.get(x,x) for x in w if x not in STOP and x not in vt and len(x)>2}
def core(s):
    s=s.lower();s=re.sub(r"\b(20\d\d|day \d|opening reception|reception|gallery viewing|viewing|exhibition|afternoon|hours|gathering|with [a-z .'’]+)\b",'',s)
    return re.sub(r'[^a-z]','',s)
def same(a,b):
    if a['date']!=b['date'] or (a.get('time') or '')!=(b.get('time') or '') or not a.get('time'):return False
    va,vb=vk(a),vk(b)
    if va and vb and va!=vb and not (va in vnorm(b.get('venue')) or vb in vnorm(a.get('venue'))):return False
    A,B=toks(a),toks(b)
    if va and vb and A and B and len(A&B)/min(len(A),len(B))>=0.99 and len(A&B)>=1:return True
    ta,tb=a['artists'].lower(),b['artists'].lower()
    if difflib.SequenceMatcher(None,ta,tb).ratio()>=0.6:return True
    ca,cb=core(ta),core(tb)
    return len(ca)>=8 and len(cb)>=8 and (ca[:10]==cb[:10] or ca in cb or cb in ca)
for e in E:
    if str(e.get('time','')).strip().lower() in('unknown','tbd','tba','n/a'):e['time']=''
    if re.search(r'(?i)rehears',e.get('artists','')) and e.get('genre') in('live','classical','rock','jazz'):e['genre']='community'
out=[];merged=[]
for e in E:
    hit=next((k for k in out if same(k,e)),None)
    if not hit:out.append(e);continue
    keep,drop=(hit,e)
    if (hit.get('src') in GENERIC) and (e.get('src') not in GENERIC):
        out[out.index(hit)]=e;keep,drop=e,hit
    if drop.get('genre')=='worship' or keep.get('genre')=='worship':keep['genre']='worship'
    for f,v in drop.items():
        if v and not keep.get(f):keep[f]=v
    al=keep.setdefault('also_as',[])
    if drop['artists']!=keep['artists'] and drop['artists'] not in al:al.append(drop['artists'])
    merged.append((keep['date'],keep.get('time'),keep['artists'],'<=',drop['artists']))
d['events']=out
json.dump(d,open(P,'w'),ensure_ascii=False,separators=(',',':'))
print('merged',len(merged),'events',len(E),'->',len(out))
for m in merged[:int(sys.argv[1]) if len(sys.argv)>1 else 60]:print(' ',m)

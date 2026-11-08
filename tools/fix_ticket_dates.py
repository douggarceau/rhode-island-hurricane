#!/usr/bin/env python3
"""Replace performance-specific links whose encoded date doesn't match the listing's date.
Usage: python3 tools/fix_ticket_dates.py <repo>  (idempotent)"""
import json,re,sys
OFFICIAL={'disney on ice':'https://www.amicamutualpavilion.com/events/detail/disney-on-ice-presents-magic-in-the-stars'}
SPEC=re.compile(r'tickpick|ticketmaster|seatgeek|stubhub|vividseats|axs\.com|eventbrite|performance=|livenation|consequence\.net/events|/events/[^/]*\d{4}-\d{2}-\d{2}',re.I)
def dates(u):
    out=set()
    for m in re.finditer(r'(?<!\d)(20\d\d)-(\d{2})-(\d{2})(?!\d)',u):out.add('%s-%s-%s'%m.groups())
    for m in re.finditer(r'(?<![\d])(\d{1,2})-(\d{1,2})-(\d{2})(?!\d)',u):
        mm,dd,yy=m.groups()
        if 1<=int(mm)<=12 and 1<=int(dd)<=31:out.add('20%s-%02d-%02d'%(yy,int(mm),int(dd)))
    return out
repo=sys.argv[1];p=repo+'/data/cal.json';d=json.load(open(p));L=d['events'];n=0
for e in L:
    u=e.get('url') or ''
    if not u or not SPEC.search(u):continue
    ds=dates(u);t=(e.get('artists') or '').lower()
    forced=any(k in t for k in OFFICIAL) and u not in OFFICIAL.values()
    if not forced and (not ds or e.get('date') in ds):continue
    new=''
    for k,v in OFFICIAL.items():
        if k in t:new=v
    if not new:
        same=[x.get('url') for x in L if x is not e and (x.get('artists') or '').lower()==t and x.get('url') and not dates(x['url'])]
        new=same[0] if same else ''
    if not new and 'gracewayri.org/events/' in u:new='https://www.gracewayri.org/events'
    e.setdefault('url_was',u);e['url']=new;n+=1
    print(' ',e['date'],e.get('time'),e.get('artists')[:40],'->',new or '(calendar)')
json.dump(d,open(p,'w'),ensure_ascii=False,separators=(',',':')) if n else None
print(repo,'fixed',n)

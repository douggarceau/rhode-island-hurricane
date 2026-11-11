"""Refresh data/jobs.json: open public-sector jobs in Rhode Island from official job boards.
usage: python3 -I tools/jobs/refresh_jobs.py <repo_dir>
Reads tools/jobs/sources.json. Each source: {name,type,town,page,feed:{kind,url,...}|null}.
Feed kinds: workday_cxs, atom, teamtailor_json, ukg_ready, adp_wfn, neogov_rss, rss.
Polite: one host at a time, short pauses, browser User-Agent, no retries beyond one."""
import json, os, re, sys, time, html, datetime, urllib.request, urllib.error
import xml.etree.ElementTree as ET

REPO = sys.argv[1]
SRC = json.load(open(os.path.join(REPO, 'tools', 'jobs', 'sources.json'), encoding='utf-8'))
UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'
TOWNS = ['Barrington', 'Bristol', 'Burrillville', 'Central Falls', 'Charlestown', 'Coventry', 'Cranston', 'Cumberland', 'East Greenwich',
         'East Providence', 'Exeter', 'Foster', 'Glocester', 'Hopkinton', 'Jamestown', 'Johnston', 'Lincoln', 'Little Compton', 'Middletown',
         'Narragansett', 'New Shoreham', 'Newport', 'North Kingstown', 'North Providence', 'North Smithfield', 'Pawtucket', 'Portsmouth',
         'Providence', 'Richmond', 'Scituate', 'Smithfield', 'South Kingstown', 'Tiverton', 'Warren', 'Warwick', 'West Greenwich',
         'West Warwick', 'Westerly', 'Woonsocket']
PLACES = {'kingston': 'South Kingstown', 'wakefield': 'South Kingstown', 'peace dale': 'South Kingstown', 'cranston': 'Cranston',
          'kent county': 'Warwick', 'garrahy': 'Providence', 'licht': 'Providence', 'mcgrath': 'Wakefield', 'murray': 'Newport',
          'eleanor slater': 'Cranston', 'pastore': 'Cranston', 'zambarano': 'Burrillville', 'ladd': 'Exeter', 'lincoln': 'Lincoln',
          'knight campus': 'Warwick', 'flanagan': 'Lincoln', 'liston': 'Providence', 'newport campus': 'Newport', 'westerly': 'Westerly',
          'narragansett bay campus': 'Narragansett', 'green airport': 'Warwick', 't.f. green': 'Warwick', 'block island': 'New Shoreham'}

def town_of(*texts):
    t = ' '.join(x for x in texts if x).lower()
    for name in sorted(TOWNS, key=len, reverse=True):
        if name.lower() in t: return name
    for k, v in PLACES.items():
        if k in t: return 'South Kingstown' if v == 'Wakefield' else v
    return ''

def get(url, method='GET', body=None, accept='application/json', timeout=40):
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, data=data, method=method, headers={'User-Agent': UA, 'Accept': accept, **({'Content-Type': 'application/json'} if data else {})})
    for attempt in (1, 2):
        try:
            with urllib.request.urlopen(req, timeout=timeout) as r:
                return r.read()
        except (urllib.error.URLError, TimeoutError) as e:
            if attempt == 2: raise
            time.sleep(3)

def clean(s): return re.sub(r'\s+', ' ', html.unescape(re.sub(r'<[^>]+>', ' ', s or ''))).strip()
PAY = re.compile(r'\$\s?\d[\d,]*(?:\.\d\d)?(?:\s*(?:-|–|to)\s*\$?\s?\d[\d,]*(?:\.\d\d)?)?(?:\s*(?:per|/|an?)\s*(?:hour|hr|year|yr|annually|week|biweekly))?', re.I)
def pay_of(text):
    m = PAY.search(text or '')
    if not m: return '', 0
    s = re.sub(r'\.00\b', '', m.group(0)).strip()
    nums = [float(x.replace(',', '')) for x in re.findall(r'\d[\d,]*(?:\.\d\d)?', s)]
    return s, max(nums) if nums else 0
def iso(s):
    if not s: return ''
    s = s.strip()
    m = re.match(r'(\d{4}-\d\d-\d\d)', s)
    if m: return m.group(1)
    for f in ('%a, %d %b %Y %H:%M:%S %z', '%a, %d %b %Y %H:%M:%S %Z', '%m/%d/%Y', '%B %d, %Y'):
        try: return datetime.datetime.strptime(s, f).date().isoformat()
        except ValueError: pass
    return ''

def job(src, title, url, posted='', closes='', pay='', pay_max=0, dept='', town=''):
    return {'title': clean(title), 'employer': src['name'], 'type': src['type'], 'town': town or src.get('town') or '',
            'dept': clean(dept), 'posted': posted, 'closes': closes, 'pay': pay, 'pay_max': pay_max, 'url': url}

def f_workday(src, f):
    base = f['url'].rsplit('/jobs', 1)[0]; site = f.get('site_url', 'https://ri.wd5.myworkdayjobs.com/RI')
    out, off, total = [], 0, None
    while True:
        body = dict(f.get('body') or {}); body.update({'limit': 20, 'offset': off})
        d = json.loads(get(f['url'], 'POST', body))
        posts = d.get('jobPostings') or []
        if total is None: total = d.get('total') or 0
        for p in posts:
            info, org = {}, ''
            try:
                full = json.loads(get(base + p['externalPath'])); info = full.get('jobPostingInfo', {})
                org = (full.get('hiringOrganization') or {}).get('name', ''); time.sleep(0.4)
            except Exception: pass
            desc = clean(info.get('jobDescription', ''))
            m = re.search(r'Salary\s+(\$[\d,\.]+\s*-\s*\$[\d,\.]+)', desc)
            pay, pmax = (re.sub(r'\.00\b', '', m.group(1)), float(m.group(1).split('-')[-1].replace('$', '').replace(',', ''))) if m else pay_of(desc)
            dept = re.sub(r'^\d{3}\s+', '', org or '')
            loc = info.get('location') or (p.get('bulletFields') or [''])[0]
            out.append(job(src, p['title'], site + p['externalPath'], iso(info.get('startDate')), iso(info.get('endDate')), pay, pmax, dept, town_of(loc)))
        off += 20
        if off >= total or not posts: break
        time.sleep(0.5)
    return out

def f_atom(src, f):
    root = ET.fromstring(get(f['url'], accept='application/atom+xml'))
    ns = {'a': 'http://www.w3.org/2005/Atom'}; out = []
    for e in root.findall('a:entry', ns):
        link = e.find('a:link', ns); summ = (e.findtext('a:summary', '', ns) or '') + (e.findtext('a:content', '', ns) or '')
        pay, pmax = pay_of(clean(summ))
        out.append(job(src, e.findtext('a:title', '', ns), link.get('href') if link is not None else src['page'], iso(e.findtext('a:published', '', ns) or e.findtext('a:updated', '', ns)), '', pay, pmax))
    return out

def f_teamtailor(src, f):
    d = json.loads(get(f['url'])); items = d.get('items') or d.get('data') or d if isinstance(d, list) else d.get('items', [])
    out = []
    for it in items:
        jp = it.get('_jobposting') or it.get('_jobPosting') or it.get('jobPosting') or it
        sal = jp.get('baseSalary') or {}
        v = (sal.get('value') or {}) if isinstance(sal, dict) else {}
        pay = ''; pmax = 0
        if v.get('minValue') or v.get('maxValue'):
            pmax = float(v.get('maxValue') or v.get('minValue') or 0)
            pay = '$' + format(int(float(v.get('minValue') or pmax)), ',') + (' - $' + format(int(pmax), ',') if v.get('maxValue') else '') + (' ' + v.get('unitText', '').lower() if v.get('unitText') else '')
        loc = jp.get('jobLocation') or {}
        loc = loc[0] if isinstance(loc, list) and loc else loc
        addr = (loc.get('address') or {}) if isinstance(loc, dict) else {}
        out.append(job(src, it.get('title') or jp.get('title', ''), it.get('url') or it.get('id') or src['page'], iso(jp.get('datePosted', '')), iso(jp.get('validThrough', '')), pay, pmax, '', town_of(addr.get('addressLocality', ''))))
    return out

def f_ukg(src, f):
    d = json.loads(get(f['url'])); out = []
    for r in d.get('job_requisitions') or d.get('jobRequisitions') or []:
        loc = r.get('location') or {}
        loc = ' '.join(str(v) for v in loc.values()) if isinstance(loc, dict) else str(loc)
        a, b = r.get('base_pay_from'), r.get('base_pay_to'); pay = ''; pmax = 0
        if a or b:
            pmax = float(b or a); pay = '$' + format(int(float(a or b)), ',') + (' - $' + format(int(float(b)), ',') if b else '')
        out.append(job(src, r.get('job_title') or r.get('title', ''), f.get('job_url', src['page']).replace('{id}', str(r.get('id', ''))), iso(r.get('posted_date') or r.get('created_at') or ''), '', pay, pmax, '', town_of(loc)))
    return out

def f_adp(src, f):
    d = json.loads(get(f['url'])); out = []
    for r in d.get('jobRequisitions') or []:
        title = r.get('requisitionTitle') or ''
        locs = r.get('requisitionLocations') or []
        city = ((locs[0].get('address') or {}).get('cityName') if locs else '') or ''
        pr = r.get('payGradeRange') or {}
        pay = ''; pmax = 0
        mn, mx = (pr.get('minimumRate') or {}).get('amountValue'), (pr.get('maximumRate') or {}).get('amountValue')
        if mn or mx:
            pmax = float(mx or mn); pay = '$' + format(int(float(mn or mx)), ',') + (' - $' + format(int(float(mx)), ',') if mx else '')
        jid = r.get('itemID') or ''
        out.append(job(src, title, f.get('job_url', src['page']).replace('{id}', str(jid)), iso(r.get('postDate', '')), '', pay, pmax, '', town_of(city)))
    return out

def f_rss(src, f):
    root = ET.fromstring(get(f['url'], accept='application/rss+xml, application/xml'))
    out = []
    for it in root.iter('item'):
        t = it.findtext('title', ''); link = it.findtext('link', '') or src['page']; desc = clean(it.findtext('description', ''))
        closes = ''
        m = re.search(r'Clos(?:ing|es)\s*(?:Date)?[:\s]*([A-Z][a-z]+ \d{1,2}, \d{4}|\d{1,2}/\d{1,2}/\d{4})', desc)
        if m: closes = iso(m.group(1))
        m2 = re.search(r'Posting Dates?:\s*\d{1,2}/\d{1,2}/\d{4}\s*-\s*(\d{1,2}/\d{1,2}/\d{4})', desc)
        if m2 and not closes: closes = iso(m2.group(1))
        pay, pmax = pay_of(desc)
        dept = it.findtext('{http://www.governmentjobs.com/rss}department', '') or ''
        posted = iso(it.findtext('pubDate', ''))
        if f.get('max_age_days') and posted and posted < (datetime.date.today() - datetime.timedelta(days=f['max_age_days'])).isoformat(): continue
        out.append(job(src, t, link, posted, closes, pay, pmax, dept))
    return out


def f_schoolspring(src, f):
    out, page = [], 1
    while True:
        u = re.sub(r'page=\d+', 'page=%d' % page, f['url'])
        d = json.loads(get(u)).get('value') or {}
        items = d.get('jobsList') or []
        for it in items:
            loc = it.get('location', '')
            out.append(job(src, it.get('title', ''), 'https://www.schoolspring.com/jobdetail?jobId=%s' % it.get('jobId'), iso(it.get('displayDate', '')), '', '', 0, it.get('employer', ''), town_of(loc)))
        if len(items) < 100: break
        page += 1; time.sleep(0.5)
    return out

def f_civicplus(src, f):
    b = get(f['url'], accept='text/html').decode('utf-8', 'replace'); host = re.match(r'https?://[^/]+', f['url']).group(0)
    out, seen = [], set()
    D = r'([A-Z][a-z]+ \d{1,2}, \d{4})'
    for m in re.finditer(r'href="([^"]*JobID=([^"&]+))"[^>]*>(.*?)</a>', b, re.S):
        jid = m.group(2)
        if jid in seen: continue
        title = clean(m.group(3)).replace('\xa0', ' ')
        if not title or title.startswith('Full Description'): continue
        seen.add(jid)
        seg = clean(b[m.end():m.end() + 3000]).split('Full Description')[0]
        p = re.search(r'Posted:?\s+' + D, seg); c = re.search(r'Closes:?\s+' + D, seg, re.I)
        href = html.unescape(m.group(1)); href = host + href if href.startswith('/') else href
        if re.search(r'\b(bids?|rfp|rfq|request for (proposals?|qualifications))\b|no .*positions? (are )?available', title, re.I): continue
        out.append(job(src, title, href, iso(p.group(1)) if p else '', iso(c.group(1)) if c else ''))
    return out

def f_bamboo(src, f):
    d = json.loads(get(f['url'])); base = f['url'].rsplit('/careers', 1)[0]
    return [job(src, r.get('jobOpeningName', ''), base + '/careers/' + str(r.get('id')), '', '', '', 0, r.get('departmentLabel', ''), town_of((r.get('location') or {}).get('city', ''))) for r in d.get('result') or []]

FETCH = {'workday_cxs': f_workday, 'atom': f_atom, 'teamtailor_json': f_teamtailor, 'ukg_ready': f_ukg, 'adp_wfn': f_adp, 'neogov_rss': f_rss, 'rss': f_rss, 'schoolspring': f_schoolspring, 'civicplus': f_civicplus, 'bamboohr': f_bamboo}

def main():
    out_path = os.path.join(REPO, 'data', 'jobs.json')
    prev = json.load(open(out_path, encoding='utf-8')) if os.path.exists(out_path) else {'listings': []}
    listings, employers, report = [], [], []
    for s in SRC:
        f = s.get('feed')
        e = {'name': s['name'], 'type': s['type'], 'town': s.get('town', ''), 'page': s['page'], 'feed': bool(f)}
        if f and FETCH.get(f.get('kind')):
            try:
                got = FETCH[f['kind']](s, f)
                if s.get('filter_dept'):
                    got = [j for j in got if re.search(s['filter_dept'], j['dept'] or '', re.I)]
                listings += got; e['count'] = len(got); report.append((s['name'], len(got), 'ok'))
            except Exception as ex:
                old = [j for j in prev.get('listings', []) if j.get('employer') == s['name']]
                listings += old; e['count'] = len(old); report.append((s['name'], len(old), 'kept previous: ' + str(ex)[:80]))
            time.sleep(1)
        employers.append(e)
    seen, uniq = set(), []
    for j in listings:
        k = (j['url'] + '|' + j['title'] + '|' + j['employer']).lower()
        if k in seen: continue
        seen.add(k)
        pm = j.get('pay_max') or 0
        j['pay_max'] = round(pm * 2080) if 0 < pm < 300 else pm  # hourly -> yearly, for sorting only
        uniq.append(j)
    today = datetime.date.today().isoformat()
    uniq = [j for j in uniq if not j['closes'] or j['closes'] >= today]
    data = {'updated': datetime.datetime.now(datetime.timezone.utc).isoformat(timespec='minutes'), 'listings': uniq, 'employers': employers}
    json.dump(data, open(out_path, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
    for r in report: print('%-60s %4d  %s' % r)
    print('total', len(uniq), 'listings from', sum(1 for e in employers if e['feed']), 'feeds;', sum(1 for e in employers if not e['feed']), 'page-only employers')

main()

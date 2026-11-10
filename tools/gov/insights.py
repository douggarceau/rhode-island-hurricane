"""Cross-year payroll insights nobody publishes. usage: python3 -I insights.py <payroll.csv> <budgets.json> <out.json>"""
import csv, json, sys, re, collections, statistics as st
src, budf, outf = sys.argv[1:4]
rows = list(csv.reader(open(src, encoding='latin-1'), skipinitialspace=True)); h = [x.strip() for x in rows[0]]
def num(v):
    try: return float(v or 0)
    except ValueError: return None
R = []
for r in rows[1:]:
    r = [c.strip() for c in r]
    if len(r) > 13: n = len(r) - 13; r = r[:5] + [', '.join(r[5:6 + n])] + r[6 + n:]
    d = dict(zip(h, r))
    if len(r) >= 11 and re.fullmatch(r'\d{4}', d.get('fiscal_year', '')) and all(num(d.get(k)) is not None for k in ('regular', 'overtime', 'total', 'annual')): R.append(d)
f = lambda v: num(v) or 0
years = sorted({r['fiscal_year'] for r in R}); FULL = years[-2]; FIRST = years[0]
SEAS = re.compile(r'SEAS|SUMMER|INTERN|LIFEGUARD|TEMP|STUDENT|POLL')
# person key = name + middle initial; drop names that occur twice in the same year (can't tell people apart)
dup = set()
by = collections.defaultdict(dict)
for r in R:
    k = (r['last'], r['first'], r['m'])
    if r['fiscal_year'] in by[k]: dup.add(k)
    by[k][r['fiscal_year']] = r
P = {k: v for k, v in by.items() if k not in dup}
out = {'full_year': FULL, 'first_year': FIRST, 'people_tracked': len(P), 'ambiguous_names_dropped': len(dup)}
# --- turnover and hiring per department, last 3 full-year transitions
def dept_of(v, y): return v[y]['department'] if y in v else None
trans = []
for a, b in zip(years[-5:-2], years[-4:-1]):
    left = collections.Counter(); hired = collections.Counter(); base = collections.Counter()
    for k, v in P.items():
        if a in v and not SEAS.search(v[a]['title'].upper()):
            base[v[a]['department']] += 1
            if b not in v: left[v[a]['department']] += 1
        if b in v and a not in v and not SEAS.search(v[b]['title'].upper()): hired[v[b]['department']] += 1
    trans.append((a, b, left, hired, base))
dep = collections.defaultdict(dict)
for a, b, left, hired, base in trans:
    for d in base:
        if base[d] >= 20: dep[d].setdefault('turnover', []).append([b, round(left[d] / base[d] * 100, 1), left[d], hired[d]])
# --- raises for people in the same department and same title both years (pure raise) vs any (incl. promotions)
ra = collections.defaultdict(list); rp = collections.defaultdict(list)
y0, y1 = years[-4], FULL
for k, v in P.items():
    if y0 in v and y1 in v and v[y0]['department'] == v[y1]['department'] and f(v[y0]['annual']) > 20000:
        g = (f(v[y1]['annual']) / f(v[y0]['annual']) - 1) * 100
        (ra if v[y0]['title'] == v[y1]['title'] else rp)[v[y1]['department']].append(g)
for d in set(ra) | set(rp):
    if len(ra[d]) >= 20: dep[d]['raise_same_title'] = round(st.median(ra[d]), 1)
    if len(rp[d]) >= 10: dep[d]['raise_title_change'] = round(st.median(rp[d]), 1); dep[d]['title_changes'] = len(rp[d])
out['raise_window'] = [y0, y1]
allr = [x for L in ra.values() for x in L]; out['state_raise_same_title'] = round(st.median(allr), 1)
# --- tenure: on payroll every year since FIRST (long-serving) -> retirement wave
cur = years[-1]
for k, v in P.items():
    if cur in v and not v[cur]['termination']:
        d = v[cur]['department']; c = dep[d].setdefault('_ten', [0, 0, 0])
        c[0] += 1
        if FIRST in v: c[1] += 1; c[2] += f(v[cur]['annual'])
for d, x in dep.items():
    if '_ten' in x:
        n, lng, pay = x.pop('_ten')
        if n >= 20: x['since_first_year_pct'] = round(lng / n * 100, 1); x['since_first_year'] = lng; x['since_first_year_pay'] = round(pay)
# --- overtime concentration (last full year)
OT = sorted((f(r['overtime']) for r in R if r['fiscal_year'] == FULL and f(r['overtime']) > 0), reverse=True)
t10 = OT[:max(1, len(OT) // 10)]
out['ot_top10_share'] = round(sum(t10) / sum(OT) * 100, 1); out['ot_earners'] = len(OT)
# --- overtime vs hiring: for big-OT titles, how many full-time hires the OT dollars would fund at the title's median rate (+ benefits load)
LOAD = 1.6  # rough salary + benefits multiplier; stated on the page
tt = collections.defaultdict(lambda: [0.0, []])
for r in R:
    if r['fiscal_year'] == FULL:
        x = tt[(r['department'], r['title'])]; x[0] += f(r['overtime']); x[1].append(f(r['annual']))
out['ot_vs_hire'] = sorted(([d, t.title(), round(o), round(st.median(a)), round(o / (st.median(a) * LOAD), 1), len(a)] for (d, t), (o, a) in tt.items() if o > 1e6 and st.median(a) > 0), key=lambda x: -x[2])[:15]
out['load'] = LOAD
# --- manager titles over time
MGR = re.compile(r'\b(CHIEF|DIRECTOR|DEPUTY|ADMINISTRATOR|ADMR|MANAGER|MGR|SUPERVISOR|SUPV|SUPT|SUPERINTENDENT|ASSOC DIR|ASST DIR|COMMISSIONER)\b')
mt = {}
for y in years[:-1]:
    Y = [r for r in R if r['fiscal_year'] == y and not SEAS.search(r['title'].upper())]
    m = sum(1 for r in Y if MGR.search(r['title'].upper())); mt[y] = [len(Y), m]
out['managers_by_year'] = mt
# --- funded vs on payroll (budget FTE cap vs people paid now, excluding seasonal)
B = {a['match']: a for a in json.load(open(budf))['agencies']}
MAP = {'ADMINISTRATION': 'admin', 'CORRECTIONS': 'doc', 'BHDDH': 'bhddh', 'JUDICIAL': 'judiciary', 'HUMAN SERVICES': 'dhs', 'TRANSPORTATION': 'dot', 'PUBLIC SAFETY': 'dps', 'CHILDREN & FAMILIES': 'dcyf', 'HEALTH': 'health', 'DEM': 'dem', 'DEPT OF REVENUE': 'revenue', 'EDUCATION': 'ride', 'DLT': 'dlt', 'HEALTH AND HUMAN SERVICES': 'eohhs', 'ATTORNEY GENERAL': 'ag', 'BUSINESS REGULATIONS': 'dbr', 'PUBLIC DEFENDER': 'publicdefender', 'TREASURY': 'treasurer', 'PUBLIC UTILITIES': 'puc', 'SECRETARY OF STATE': 'sos', 'GOVERNORS OFFICE': 'governor', 'EMERGENCY MANAGEMENT': 'emergency', 'C.R.M.C.': 'crmc', 'HOUSING': 'housing', 'U R I': 'uri', 'R I COLLEGE': 'ric', 'COMMUNITY COLLEGE OF R I': 'ccri'}
for d, m in MAP.items():
    b = B.get(m)
    if not b or not b.get('fte'): continue
    now = [r for r in R if r['fiscal_year'] == cur and r['department'] == d and not r['termination'] and not SEAS.search(r['title'].upper())]
    dep[d]['fte_cap'] = b['fte']; dep[d]['on_payroll_now'] = len(now); dep[d]['budget'] = b['all_funds']
NAMES = json.load(open(sys.argv[3].replace('insights.json', 'index.json'))) if False else None
out['departments'] = {d: v for d, v in dep.items() if v}
json.dump(out, open(outf, 'w'), ensure_ascii=False, indent=0)
print('tracked', len(P), 'dup', len(dup), 'ot top10 share', out['ot_top10_share'], 'raise', out['state_raise_same_title'], 'mgr', mt[years[0]], mt[FULL])
for x in out['ot_vs_hire'][:6]: print(x)

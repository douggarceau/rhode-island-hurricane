"""Turn the RI Transparency Portal payroll CSV into per-agency roster files + an analysis index.
usage: python3 -I build_payroll.py <payroll.csv> <out_dir>"""
import csv, json, sys, os, re, collections, datetime
src, out = sys.argv[1], sys.argv[2]
os.makedirs(out, exist_ok=True)
rows = list(csv.reader(open(src, encoding='latin-1'), skipinitialspace=True))
h = [x.strip() for x in rows[0]]
def num(v):
    try: return float(v or 0)
    except ValueError: return None
R, bad = [], 0
for r in rows[1:]:
    r = [c.strip() for c in r]
    if len(r) > 13:  # a comma inside a name or title split the row: rejoin the extra text columns
        n = len(r) - 13
        r = r[:5] + [', '.join(r[5:6 + n])] + r[6 + n:]
    d = dict(zip(h, r))
    if len(r) < 11 or not re.fullmatch(r'\d{4}', d.get('fiscal_year', '')) or any(num(d.get(k)) is None for k in ('regular', 'overtime', 'other', 'total', 'annual')):
        bad += 1; continue
    R.append(d)
print('skipped rows', bad)
f = lambda v: round(num(v) or 0, 2)
years = sorted({r['fiscal_year'] for r in R})
CUR, FULL = years[-1], years[-2]
def key(d): return re.sub(r'[^a-z0-9]+', '-', d.lower()).strip('-')
NAMES = {'U R I': 'University of Rhode Island', 'R I COLLEGE': 'Rhode Island College', 'COMMUNITY COLLEGE OF R I': 'Community College of Rhode Island',
 'BHDDH': 'Behavioral Healthcare, Developmental Disabilities & Hospitals', 'DEM': 'Environmental Management', 'DLT': 'Labor and Training',
 'C.R.M.C.': 'Coastal Resources Management Council', 'DEPT OF REVENUE': 'Revenue', 'JUDICIAL': 'Judiciary (Courts)', 'LEGISLATIVE': 'General Assembly',
 'GOVERNORS OFFICE': "Governor's Office", 'R I ETHICS COMMISSION': 'Ethics Commission', 'EXECUTIVE OFF OF COMMERCE': 'Executive Office of Commerce',
 'HEALTH AND HUMAN SERVICES': 'Executive Office of Health & Human Services', 'CHILDREN & FAMILIES': 'Children, Youth & Families',
 'COMM.ON DISABILITIES': 'Governor\'s Commission on Disabilities', 'COMM ON DEAF/HEARING': 'Commission on the Deaf & Hard of Hearing',
 'RI COUNCIL ON THE ARTS': 'RI State Council on the Arts', 'OFFICE OF ENERGY': 'Office of Energy Resources', 'MILITARY STAFF': 'Military Staff (National Guard)',
 'ELDERLY AFFAIRS': 'Office of Healthy Aging', 'BUSINESS REGULATIONS': 'Business Regulation', 'PUBLIC UTILITIES': 'Public Utilities Commission'}
nice = lambda d: NAMES.get(d, d.title().replace(' Of ', ' of ').replace(' And ', ' and ').replace('R I ', 'RI '))
def tclean(t): return re.sub(r'\s+', ' ', t).strip() or 'Title not listed'
full = {}
for r in R:
    if r['fiscal_year'] == FULL:
        full[(r['last'], r['first'], r['m'], r['department'])] = r
cur = [r for r in R if r['fiscal_year'] == CUR]
active = [r for r in cur if not r['termination']]
depts = collections.defaultdict(list)
for r in active: depts[r['department']].append(r)
trend = collections.defaultdict(lambda: collections.Counter())
for r in R: trend[r['department']][r['fiscal_year']] += 1
fullD = collections.defaultdict(list)
for r in R:
    if r['fiscal_year'] == FULL: fullD[r['department']].append(r)
index = {'source': 'RI Transparency Portal, State Employee Payroll (transparency.ri.gov/payroll)', 'source_url': 'https://transparency.ri.gov/payroll/',
 'downloaded': datetime.date.today().isoformat(), 'cur_year': CUR, 'full_year': FULL,
 'note': f'Portal year {CUR} is the year in progress (pay so far). Portal year {FULL} is the last complete year. "Pay rate" is the annual salary rate the state lists.',
 'years': {y: {'people': sum(1 for r in R if r['fiscal_year'] == y), 'paid': round(sum(f(r['total']) for r in R if r['fiscal_year'] == y)), 'overtime': round(sum(f(r['overtime']) for r in R if r['fiscal_year'] == y))} for y in years},
 'active': len(active), 'active_rate_sum': round(sum(f(r['annual']) for r in active)), 'depts': []}
def person(r):
    p = full.get((r['last'], r['first'], r['m'], r['department']))
    name = (r['first'].title() + ' ' + (r['m'] + '. ' if r['m'] else '') + r['last'].title()).replace('  ', ' ')
    return [name, tclean(r['title']).title(), f(r['annual']), f(r['total']), f(r['overtime']), f(p['total']) if p else None, f(p['overtime']) if p else None, f(p['other']) if p else None]
for d, L in sorted(depts.items(), key=lambda x: -len(x[1])):
    k = key(d)
    people = sorted((person(r) for r in L), key=lambda p: -p[2])
    json.dump({'dept': nice(d), 'portal_name': d, 'cur_year': CUR, 'full_year': FULL, 'cols': ['name', 'title', 'pay_rate', 'ytd_pay', 'ytd_ot', 'full_year_pay', 'full_year_ot', 'full_year_other'], 'people': people},
              open(os.path.join(out, k + '.json'), 'w'), ensure_ascii=False, separators=(',', ':'))
    titles = collections.defaultdict(list)
    for p in people: titles[p[1]].append(p[2])
    FL = fullD.get(d, [])
    index['depts'].append({'key': k, 'name': nice(d), 'portal_name': d, 'people': len(L), 'rate_sum': round(sum(p[2] for p in people)),
        'median_rate': sorted(p[2] for p in people)[len(people) // 2] if people else 0,
        'over_100k': sum(1 for p in people if p[2] >= 100000), 'over_150k': sum(1 for p in people if p[2] >= 150000),
        'full_paid': round(sum(f(r['total']) for r in FL)), 'full_ot': round(sum(f(r['overtime']) for r in FL)), 'full_people': len(FL),
        'titles': sorted(([t, len(v), round(sum(v) / len(v))] for t, v in titles.items()), key=lambda x: -x[1]),
        'top': people[:5], 'trend': {y: trend[d][y] for y in years}})
allp = [(p, dd['name']) for dd in index['depts'] for p in json.load(open(os.path.join(out, dd['key'] + '.json')))['people']]
index['top_rate'] = [[p[0], p[1], dn, p[2]] for p, dn in sorted(allp, key=lambda x: -x[0][2])[:50]]
index['top_ot'] = [[p[0], p[1], dn, p[6], p[5]] for p, dn in sorted((x for x in allp if x[0][6]), key=lambda x: -x[0][6])[:50]]
index['top_total'] = [[p[0], p[1], dn, p[5], p[2]] for p, dn in sorted((x for x in allp if x[0][5]), key=lambda x: -x[0][5])[:50]]
index['ot_over_base'] = sum(1 for p, _ in allp if p[6] and p[2] and p[6] >= p[2])
index['bands'] = [[lab, sum(1 for p, _ in allp if lo <= p[2] < hi)] for lab, lo, hi in [['Under $50,000', 0, 5e4], ['$50,000–$74,999', 5e4, 75e3], ['$75,000–$99,999', 75e3, 1e5], ['$100,000–$149,999', 1e5, 15e4], ['$150,000–$199,999', 15e4, 2e5], ['$200,000 and up', 2e5, 1e12]]]
json.dump(index, open(os.path.join(out, 'index.json'), 'w'), ensure_ascii=False, separators=(',', ':'))
print('active', len(active), 'depts', len(index['depts']), 'ot>=base', index['ot_over_base'])
print('size', sum(os.path.getsize(os.path.join(out, x)) for x in os.listdir(out)))

# ---------- Overtime review ----------
ot = {'full_year': FULL}
ot['by_year'] = [[y, index['years'][y]['overtime'], index['years'][y]['paid']] for y in years]
FR = [r for r in R if r['fiscal_year'] == FULL]
byd = collections.defaultdict(lambda: [0, 0, 0, 0])  # ot, base(regular), people with ot, people
for r in FR:
    b = byd[r['department']]; o = f(r['overtime']); b[0] += o; b[1] += f(r['regular']); b[3] += 1
    if o > 0: b[2] += 1
ot['by_agency'] = sorted(([nice(d), round(v[0]), round(v[0] / v[1] * 100, 1) if v[1] else 0, v[2], v[3]] for d, v in byd.items() if v[0] > 0), key=lambda x: -x[1])
byt = collections.defaultdict(lambda: [0, 0, 0])
for r in FR:
    o = f(r['overtime'])
    if o > 0:
        b = byt[(tclean(r['title']).title(), nice(r['department']))]; b[0] += o; b[1] += 1; b[2] = max(b[2], o)
ot['by_title'] = sorted(([t, d, round(v[0]), v[1], round(v[0] / v[1]), round(v[2])] for (t, d), v in byt.items()), key=lambda x: -x[2])[:60]
over = [r for r in FR if f(r['overtime']) > 0 and f(r['regular']) > 0 and f(r['overtime']) >= f(r['regular'])]
nm = lambda r: (r['first'].title() + ' ' + (r['m'] + '. ' if r['m'] else '') + r['last'].title()).replace('  ', ' ')
ot['over_base'] = sorted(([nm(r), tclean(r['title']).title(), nice(r['department']), f(r['regular']), f(r['overtime']), f(r['total'])] for r in over), key=lambda x: -x[4])
ot['top'] = sorted(([nm(r), tclean(r['title']).title(), nice(r['department']), f(r['regular']), f(r['overtime']), f(r['total'])] for r in FR if f(r['overtime']) > 0), key=lambda x: -x[4])[:100]
ot['people_with_ot'] = sum(1 for r in FR if f(r['overtime']) > 0)
ot['over_50k'] = sum(1 for r in FR if f(r['overtime']) >= 50000)
ot['over_100k'] = sum(1 for r in FR if f(r['overtime']) >= 100000)
# repeat earners: top-100 OT in each of the last 3 full years
last3 = years[-4:-1]
rank = {}
for y in last3:
    Y = sorted((r for r in R if r['fiscal_year'] == y), key=lambda r: -f(r['overtime']))[:100]
    for r in Y: rank.setdefault((r['last'], r['first'], r['m'], r['department']), []).append([y, f(r['overtime'])])
ot['repeat_top100'] = [[nm({'first': k[1], 'm': k[2], 'last': k[0]}), nice(k[3]), v] for k, v in rank.items() if len(v) == len(last3)]
ot['repeat_years'] = last3
json.dump(ot, open(os.path.join(out, 'overtime.json'), 'w'), ensure_ascii=False, separators=(',', ':'))
print('OT', FULL, index['years'][FULL]['overtime'], 'people', ot['people_with_ot'], '>=base', len(over), '>=100k', ot['over_100k'], 'repeaters', len(ot['repeat_top100']))

# ---------- Efficiency signals (inputs to the downsizing assessment) ----------
BASEY = '2015' if '2015' in years else years[0]
MGR = re.compile(r'\b(CHIEF|DIRECTOR|DEPUTY|ADMINISTRATOR|ADMR|ADMIN OFFICER|MANAGER|MGR|SUPERVISOR|SUPV|SUPT|SUPERINTENDENT|ASSOC DIR|ASST DIR|COMMISSIONER|EXECUTIVE)\b')
def stats(y, d):
    L = [r for r in R if r['fiscal_year'] == y and r['department'] == d]
    return len(L), sum(f(r['total']) for r in L), sum(f(r['regular']) for r in L), sum(f(r['overtime']) for r in L)
sig = []
allp_b, allp_f = stats(BASEY, None)[0], 0
tot_b = sum(1 for r in R if r['fiscal_year'] == BASEY); tot_f = sum(1 for r in R if r['fiscal_year'] == FULL)
pay_b = sum(f(r['total']) for r in R if r['fiscal_year'] == BASEY); pay_f = sum(f(r['total']) for r in R if r['fiscal_year'] == FULL)
for d in depts:
    nb, pb, _, _ = stats(BASEY, d); nf, pf, rf, of = stats(FULL, d)
    if nf < 10: continue
    act = depts[d]
    mg = sum(1 for r in act if MGR.search(r['title'].upper()))
    sig.append({'name': nice(d), 'key': key(d), 'people_base': nb, 'people_full': nf, 'people_now': len(act),
        'headcount_change': round((nf - nb) / nb * 100, 1) if nb else None, 'pay_base': round(pb), 'pay_full': round(pf),
        'pay_change': round((pf - pb) / pb * 100, 1) if pb else None, 'ot_pct': round(of / rf * 100, 1) if rf else 0,
        'over_100k_pct': round(sum(1 for r in act if f(r['annual']) >= 1e5) / len(act) * 100, 1),
        'managers': mg, 'staff_per_manager': round((len(act) - mg) / mg, 1) if mg else None,
        'avg_rate': round(sum(f(r['annual']) for r in act) / len(act))})
json.dump({'base_year': BASEY, 'full_year': FULL, 'state': {'headcount_change': round((tot_f - tot_b) / tot_b * 100, 1), 'pay_change': round((pay_f - pay_b) / pay_b * 100, 1)},
           'agencies': sorted(sig, key=lambda s: -s['pay_full'])}, open(os.path.join(out, 'signals.json'), 'w'), ensure_ascii=False, indent=0)
print('signals', len(sig))

"""Assemble data/gov.json, data/ccri.json and data/payroll/* for RI Hurricane's Government and CCRI tabs.
usage: python3 -I assemble_gov.py <research_dir> <payroll_out_dir> <repo_dir>"""
import json, os, sys, shutil, re, datetime
RD, PD, REPO = sys.argv[1:4]
def L(n):
    p = os.path.join(RD, n)
    try: return json.load(open(p, encoding='utf-8'))
    except Exception as e:
        print('missing/invalid', n, e); return {}
today = datetime.date.today().isoformat()
ag, br, tw, bu, be, si, st, jb = (L(x) for x in ['agencies.json', 'branches.json', 'towns.json', 'budgets.json', 'benefits.json', 'sites.json', 'staff.json', 'jobs.json'])
P = json.load(open(os.path.join(PD, 'index.json')))
OT = json.load(open(os.path.join(PD, 'overtime.json')))
pkeys = {d['key'] for d in P['depts']}
# agency id -> payroll department key (payroll uses the portal's department names)
PAY = {'treasury': 'treasury', 'doa': 'administration', 'dor': 'dept-of-revenue', 'ridoh': 'health', 'oha': 'elderly-affairs', 'riema': 'emergency-management', 'ridot': 'transportation', 'oer': 'office-of-energy', 'eoh': 'housing', 'hrc': 'commission-human-rights', 'ethics': 'r-i-ethics-commission', 'governor': 'governors-office', 'ltgov': 'lieutenant-governor', 'sos': 'secretary-of-state', 'ag': 'attorney-general', 'treasurer': 'treasury',
 'boe': 'board-of-elections', 'admin': 'administration', 'revenue': 'dept-of-revenue', 'dmv': 'dept-of-revenue', 'taxation': 'dept-of-revenue', 'dbr': 'business-regulations',
 'dlt': 'dlt', 'eohhs': 'health-and-human-services', 'dhs': 'human-services', 'health': 'health', 'ridoh': 'health', 'bhddh': 'bhddh', 'dcyf': 'children-families',
 'elderly': 'elderly-affairs', 'healthyaging': 'elderly-affairs', 'veterans': 'human-services', 'dem': 'dem', 'crmc': 'c-r-m-c', 'dot': 'transportation', 'ridot': 'transportation',
 'dps': 'public-safety', 'statepolice': 'public-safety', 'doc': 'corrections', 'corrections': 'corrections', 'ride': 'education', 'commerce': 'executive-off-of-commerce',
 'energy': 'office-of-energy', 'humanrights': 'commission-human-rights', 'ethics': 'r-i-ethics-commission', 'puc': 'public-utilities', 'military': 'military-staff',
 'riema': 'emergency-management', 'emergency': 'emergency-management', 'housing': 'housing', 'childadvocate': 'child-advocate', 'publicdefender': 'public-defender',
 'arts': 'ri-council-on-the-arts', 'historic': 'historical-preservation', 'judiciary': 'judicial', 'legislature': 'legislative'}
agencies = ag.get('agencies', [])
BM = {'treasury': 'treasurer', 'doa': 'admin', 'dor': 'revenue', 'tax': 'taxation', 'ridoh': 'health', 'vets': 'veterans', 'oha': 'elderly', 'risp': 'statepolice', 'riema': 'emergency', 'ridot': 'dot', 'oer': 'energy', 'eoh': 'housing', 'hrc': 'humanrights'}
bmap = {}
for b in bu.get('agencies', []):
    bmap.setdefault(b.get('match'), b)
seen_budget = set()
for a in agencies:
    k = PAY.get(a.get('id'))
    if k in pkeys and not any(x.get('payroll') == k for x in agencies if x is not a and x.get('_primary')):
        a['payroll'] = k; a['_primary'] = 1
    b = bmap.get(BM.get(a.get('id'), a.get('id')))
    if b and b.get('all_funds'):
        a['budget'] = {'fy': bu.get('state', {}).get('fy', 'FY2027'), 'all_funds': b.get('all_funds'), 'general_revenue': b.get('general_revenue'), 'federal': b.get('federal'),
                       'fte': b.get('fte'), 'prior_all_funds': b.get('prior_all_funds')}
        seen_budget.add(b.get('match'))
for a in agencies: a.pop('_primary', None)
pn = {b.get('match'): b.get('agency') for b in bu.get('agencies', [])}
extra = [dict(b, agency=b['agency'] + (' (part of ' + pn.get(b.get('parent'), '') + ')' if b.get('sub_unit') else '')) for b in bu.get('agencies', []) if b.get('match') not in seen_budget and b.get('all_funds')]
budget_by_town = {t.get('town'): t for t in bu.get('towns', [])}
towns = tw.get('towns', [])
for t in towns:
    b = budget_by_town.get(t['name'])
    if b:
        t['tax_rate_res'] = b.get('tax_rate_res') or ''; t['tax_rate_comm'] = b.get('tax_rate_comm') or ''
        if b.get('total_budget'): t['budget'] = {'fy': b.get('fy', 'FY2027'), 'all_funds': b['total_budget']}
leg = br.get('legislative', {})
jud = br.get('judicial', {})
def side(name, pk, bk, extra):
    b = bmap.get(bk) or {}
    d = {'name': name, 'payroll': pk if pk in pkeys else None, **extra}
    if b.get('all_funds'): d['budget'] = {'fy': 'FY2027', 'all_funds': b['all_funds'], 'general_revenue': b.get('general_revenue'), 'federal': b.get('federal'), 'fte': b.get('fte'), 'prior_all_funds': b.get('prior_all_funds')}
    return d
ja = next((a for a in agencies if a.get('id') == 'judiciary'), None)
agencies = [a for a in agencies if a.get('id') != 'judiciary']
jud['admin'] = side('Rhode Island Judiciary: staff and budget', 'judicial', 'judiciary', {k: ja.get(k) for k in ('leader', 'phone', 'address', 'url', 'source', 'does', 'divisions')} if ja else {})
leg['admin'] = side('General Assembly: staff and budget', 'legislative', 'legislature', {'does': 'Legislators, legislative staff and the Joint Committee on Legislative Services.', 'url': leg.get('url')})
leg_members = st.get('legislators', [])
if leg_members:
    leg.setdefault('offices', [])
# ---- staff directories: point each block at an agency card; give small offices their own card
SM = {'dcamm': 'doa', 'hr': 'doa', 'omb': 'doa', 'purchasing': 'doa', 'municipal-finance': 'dor', 'housing': 'eoh', 'richr': 'hrc', 'rihphc': 'hphc'}
EXTRA = {'ripd': ('Office of the Public Defender', 'public-defender', 'publicdefender'), 'risca': ('RI State Council on the Arts', 'ri-council-on-the-arts', 'arts'),
 'hphc': ('Historical Preservation & Heritage Commission', 'historical-preservation', 'historic'), 'oca': ('Office of the Child Advocate', 'child-advocate', 'childadvocate'),
 'mha': ('Office of the Mental Health Advocate', 'mental-health-advocate', 'mhadvocate'), 'national-guard': ('Military Staff (RI National Guard)', 'military-staff', 'military'),
 'ohe': ('Office of the Postsecondary Commissioner', 'higher-education', 'ohhe'), 'ccc': ('Cannabis Control Commission', None, 'cannabis'), 'auditor-general': ('Office of the Auditor General', None, None)}
dirs = st.get('directories', [])
for d in dirs: d['agency_match'] = SM.get(d.get('agency_match'), d.get('agency_match'))
ids = {a['id'] for a in agencies}
for m, (nm, pk, bk) in EXTRA.items():
    if m in ids or not any(d['agency_match'] == m for d in dirs): continue
    x = side(nm, pk, bk, {'id': m, 'group': 'Other agencies', 'source': next(d['source'] for d in dirs if d['agency_match'] == m)})
    agencies.append(x)
for d in dirs:
    if d['agency_match'] == 'courts': d['agency_match'] = 'courts'
jud['admin']['id'] = 'courts'
gov = {
 'title': 'Rhode Island Government, Mapped',
 'intro': 'The whole system on one page: every branch, department, division, authority, court and town, with who runs it, how to reach them, what it costs and who works there, down to the last job title on the state payroll.',
 'checked': today,
 'agencies': agencies, 'statewide': [s for s in ag.get('statewide', []) if s.get('name')], 'legislative': leg, 'legislators': leg_members, 'judicial': jud,
 'quasi': br.get('quasi', []), 'federal': br.get('federal', []), 'towns': towns,
 'budget': bu.get('state', {}), 'functions': bu.get('functions', []), 'extra_budgets': extra,
 'benefits': be or None, 'sites': si.get('sites', []), 'staff': dirs,
 'jobs': {j['payroll_title']: j.get('summary', '') for j in jb.get('jobs', []) if j.get('summary')},
 'payroll': P, 'overtime': OT, 'boards': L('boards.json').get('boards', []), 'insights': json.load(open(os.path.join(PD, 'insights.json'))) if os.path.exists(os.path.join(PD, 'insights.json')) else None, 'assessment': L('assessment.json') or None,
}
os.makedirs(os.path.join(REPO, 'data', 'payroll'), exist_ok=True)
for f in os.listdir(PD):
    if f not in ('index.json', 'overtime.json'): shutil.copy(os.path.join(PD, f), os.path.join(REPO, 'data', 'payroll', f))
json.dump(gov, open(os.path.join(REPO, 'data', 'gov.json'), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
cc = L('ccri.json')
if cc:
    cc.update({'title': 'CCRI, Made Simple', 'intro': 'The Community College of Rhode Island in one clear view: key dates, who to call, every campus, upcoming events and the links students use most.', 'checked': today})
    json.dump(cc, open(os.path.join(REPO, 'data', 'ccri.json'), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
print('gov.json', os.path.getsize(os.path.join(REPO, 'data', 'gov.json')), 'agencies', len(agencies), 'with payroll', sum(1 for a in agencies if a.get('payroll')), 'with budget', sum(1 for a in agencies if a.get('budget')), 'towns', len(towns))

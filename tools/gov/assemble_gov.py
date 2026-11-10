"""Assemble data/gov.json, data/ccri.json and data/payroll/* for RI Hurricane's Government and CCRI tabs.
usage: python3 -I assemble_gov.py <research_dir> <payroll_out_dir> <repo_dir> [premium_out_dir]
Name-level payroll goes ONLY to premium_out_dir (uploaded to the members-only Supabase bucket), never into the public repo."""
import json, os, sys, shutil, re, datetime, copy
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
leg['admin'] = side('General Assembly: staff and budget', 'legislative', 'legislature', {'id': 'legislature', 'does': 'Legislators, legislative staff and the Joint Committee on Legislative Services.', 'url': leg.get('url')})
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
import csv
CSVP = os.path.join(RD, 'gpt_contacts.csv')
PA = {'COMMUNITY COLLEGE OF R I': 'ccri', 'R I COLLEGE': 'ric', 'U R I': 'uri', 'DEM': 'dem', 'ADMINISTRATION': 'doa', 'LEGISLATIVE': 'legislature', 'BHDDH': 'bhddh', 'JUDICIAL': 'courts',
 'PUBLIC UTILITIES': 'puc', 'EMERGENCY MANAGEMENT': 'riema', 'HIGHER EDUCATION': 'ohe', 'BUSINESS REGULATIONS': 'dbr', 'HUMAN SERVICES': 'dhs', 'CORRECTIONS': 'doc', 'C.R.M.C.': 'crmc',
 'OFFICE OF ENERGY': 'oer', 'HOUSING': 'eoh', 'TREASURY': 'treasury', 'HISTORICAL PRESERVATION': 'hphc', 'HEALTH': 'ridoh', 'COMMISSION HUMAN RIGHTS': 'hrc', 'DLT': 'dlt',
 'GOVERNORS OFFICE': 'governor', 'PUBLIC SAFETY': 'dps', 'BOARD OF ELECTIONS': 'boe', 'RI COUNCIL ON THE ARTS': 'risca', 'ATTORNEY GENERAL': 'ag', 'CHILD ADVOCATE': 'oca', 'EDUCATION': 'ride',
 'SECRETARY OF STATE': 'sos', 'R I ETHICS COMMISSION': 'ethics', 'LIEUTENANT GOVERNOR': 'ltgov', 'COMM.ON DISABILITIES': 'disabilities', 'DEPT OF REVENUE': 'dor', 'COMM ON DEAF/HEARING': 'deaf',
 'TRANSPORTATION': 'ridot', 'HEALTH AND HUMAN SERVICES': 'eohhs', 'ATOMIC ENERGY COMMISSION': 'atomic', 'EXECUTIVE OFF OF COMMERCE': 'commerce', 'MENTAL HEALTH ADVOCATE': 'mha', 'PUBLIC DEFENDER': 'ripd'}
if os.path.exists(CSVP):
    blocks = {}
    nz = lambda v: '' if (v or '').strip().lower() == 'not published' else (v or '').strip()
    for r in csv.DictReader(open(CSVP, encoding='utf-8-sig')):
        s = r['employment_status'].lower()
        if 'emeritus' in s or 'nonemployee' in s: continue
        m = PA.get(r['payroll_agency'])
        if not m: continue
        b = blocks.setdefault((m, r['source']), {'agency': r['agency'], 'agency_match': m, 'source': r['source'], 'checked': r['as_of'], 'people': []})
        b['people'].append({'name': nz(r['name']), 'title': nz(r['title']), 'division': nz(r['unit']), 'email': nz(r['work_email']), 'phone': nz(r['work_phone'])})
    dirs.extend(blocks.values())
    print('gpt contact blocks', len(blocks), sum(len(b['people']) for b in blocks.values()))
EXTRA.update({'uri': ('University of Rhode Island', 'u-r-i', 'uri', 'Education'), 'ric': ('Rhode Island College', 'r-i-college', 'ric', 'Education'), 'ccri': ('Community College of Rhode Island', 'community-college-of-r-i', 'ccri', 'Education'),
 'disabilities': ("Governor's Commission on Disabilities", 'comm-on-disabilities', 'disabilities'), 'deaf': ('Commission on the Deaf & Hard of Hearing', 'comm-on-deaf-hearing', 'deaf'), 'atomic': ('RI Atomic Energy Commission', 'atomic-energy-commission', 'atomic')})
ids = {a['id'] for a in agencies}
for m, v in EXTRA.items():
    nm, pk, bk = v[:3]; grp = v[3] if len(v) > 3 else 'Other agencies'
    if m in ids or not (any(d['agency_match'] == m for d in dirs) or grp == 'Education'): continue
    src = next((d['source'] for d in dirs if d['agency_match'] == m), '')
    x = side(nm, pk, bk, {'id': m, 'group': grp, 'source': src})
    agencies.append(x)
for d in dirs:
    if d['agency_match'] == 'courts': d['agency_match'] = 'courts'
jud['admin']['id'] = 'courts'
# ---- boards: slim copy loaded only when its drop-down opens
def flip(n):
    n = re.sub(r'\s+', ' ', n or '').strip()
    if ',' in n:
        last, rest = n.split(',', 1); return (rest.strip() + ' ' + last.strip()).strip()
    return n
BB = [b for b in L('boards.json').get('boards', []) if b.get('members')]
def expired(d):
    m = re.match(r'(\d{1,2})/(\d{1,2})/(\d{4})', d or '')
    return bool(m) and (m.group(3), m.group(1).zfill(2), m.group(2).zfill(2)) < tuple(today.split('-'))
slim = [[b['name'], b.get('url', ''), b.get('authority', ''), b.get('seats'), b.get('vacancies'),
         [[flip(m['name']), m.get('role', ''), m.get('appointed_by', ''), m.get('term_ends', ''), 1 if expired(m.get('term_ends')) else 0] for m in b['members']]] for b in BB]
slim.sort(key=lambda x: x[0].lower())
PREM = sys.argv[4] if len(sys.argv) > 4 else os.path.join(os.path.dirname(os.path.abspath(PD)), 'premium-out')
os.makedirs(PREM, exist_ok=True)
json.dump({'source': 'https://opengov.sos.ri.gov/boards', 'checked': today, 'boards': slim}, open(os.path.join(PREM, 'boards.json'), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
json.dump({'source': 'https://opengov.sos.ri.gov/boards', 'checked': today, 'boards': [[b[0], b[1], b[2], b[3], b[4], len(b[5]), sum(m[4] for m in b[5])] for b in slim]}, open(os.path.join(REPO, 'data', 'boards.json'), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
allb = L('boards.json').get('boards', [])
BS = {'boards': len(allb), 'with_members': len(BB), 'members': sum(len(b['members']) for b in BB), 'expired': sum(x[4] for b in slim for x in b[5]), 'vacancies': sum(b.get('vacancies') or 0 for b in allb)}
print('boards', BS, os.path.getsize(os.path.join(REPO, 'data', 'boards.json')))
gov = {
 'title': 'Rhode Island Government, Mapped',
 'intro': 'The whole system on one page: every branch, department, division, authority, court and town, with who runs it, how to reach them, what it costs and who works there, down to the last job title on the state payroll.',
 'checked': today,
 'agencies': agencies, 'statewide': [s for s in ag.get('statewide', []) if s.get('name')], 'legislative': leg, 'legislators': leg_members, 'judicial': jud,
 'quasi': br.get('quasi', []), 'federal': br.get('federal', []), 'towns': towns,
 'budget': bu.get('state', {}), 'functions': bu.get('functions', []), 'extra_budgets': extra,
 'benefits': be or None, 'sites': si.get('sites', []), 'staff': dirs,
 'jobs': {j['payroll_title']: j.get('summary', '') for j in jb.get('jobs', []) if j.get('summary')},
 'payroll': P, 'overtime': OT, 'boards_summary': BS, 'insights': json.load(open(os.path.join(PD, 'insights.json'))) if os.path.exists(os.path.join(PD, 'insights.json')) else None, 'assessment': L('assessment.json') or None,
}
PREM = sys.argv[4] if len(sys.argv) > 4 else os.path.join(os.path.dirname(os.path.abspath(PD)), 'premium-out')
os.makedirs(os.path.join(PREM, 'payroll'), exist_ok=True)
for f in os.listdir(PD):
    if f.endswith('.json') and f not in ('index.json', 'overtime.json', 'signals.json', 'insights.json'): shutil.copy(os.path.join(PD, f), os.path.join(PREM, 'payroll', f))
json.dump({'top_rate': P.pop('top_rate', []), 'top_ot': P.pop('top_ot', []), 'top_total': P.pop('top_total', []),
           'over_base': OT.get('over_base', []), 'ot_top': OT.get('top', []), 'repeat_top100': OT.get('repeat_top100', []), 'repeat_years': OT.get('repeat_years', [])},
          open(os.path.join(PREM, 'lists.json'), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
for d in P['depts']: d.pop('top', None)
OT['over_base_count'] = len(OT.pop('over_base', [])); OT['top_count'] = len(OT.pop('top', [])); OT['repeat_count'] = len(OT.pop('repeat_top100', []))
# staff work emails/phones are members-only: public copy keeps name, title, division and an id
cmap = {}; n = 0
for d in dirs:
    for pp in d.get('people', []):
        n += 1; pp['id'] = n
        if pp.get('email') or pp.get('phone'): cmap[n] = [pp.get('email', ''), pp.get('phone', '')]
        pp['h'] = (1 if pp.get('email') else 0) + (2 if pp.get('phone') else 0)
        pp.pop('email', None); pp.pop('phone', None)
json.dump(cmap, open(os.path.join(PREM, 'staff.json'), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
print('staff contacts moved to premium', len(cmap))
pub = os.path.join(REPO, 'data', 'payroll')
if os.path.isdir(pub): shutil.rmtree(pub)  # name-level rosters are members-only now
print('premium files', len(os.listdir(os.path.join(PREM, 'payroll'))), 'in', PREM)
# ---- members get the full copy (private bucket); the public file keeps only the free layer
import copy
json.dump(gov, open(os.path.join(PREM, 'gov.json'), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
pubg = copy.deepcopy(gov)
pubg['tier'] = 'free'
for a in pubg['agencies']:
    for d in a.get('divisions', []) or []:
        for k in ('head', 'phone', 'email'): d.pop(k, None)
    if a.get('budget'): a['budget'] = {'fy': a['budget'].get('fy'), 'all_funds': a['budget'].get('all_funds')}
for blk in (pubg['judicial'].get('admin') or {}, pubg['legislative'].get('admin') or {}):
    if blk.get('budget'): blk['budget'] = {'fy': blk['budget'].get('fy'), 'all_funds': blk['budget'].get('all_funds')}
pubg['extra_budgets'] = []
for a in pubg['agencies']:
    for k in ('deputy', 'email', 'other_phones', 'hours'): a.pop(k, None)
    a['locked'] = 'agency'
for blk in (pubg['judicial'].get('admin') or {},):
    for d in blk.get('divisions', []) or []:
        for k in ('head', 'phone', 'email'): d.pop(k, None)
for c in pubg['judicial'].get('courts', []):
    for l in c.get('locations', []): l.pop('clerk_phone', None)
for tw in pubg['towns']:
    for k in ('clerk_phone', 'tax_phone', 'police_nonemergency', 'tax_rate_res', 'tax_rate_comm', 'budget', 'hours'): tw.pop(k, None)
    tw['locked'] = 'town'
for s in pubg.get('sites', []):
    for k in ('address', 'phone', 'staff_note'): s.pop(k, None)
P2 = pubg['payroll']
pubg['payroll'] = {k: P2.get(k) for k in ('source', 'source_url', 'downloaded', 'source_updated', 'note', 'cur_year', 'full_year', 'active')}
pubg['payroll']['depts'] = [{'key': d['key'], 'name': d['name'], 'portal_name': d['portal_name'], 'people': d['people'], 'titles': [[x[0], x[1]] for x in d['titles']]} for d in P2['depts']]
pubg['overtime'] = None; pubg['insights'] = None
bn = pubg.get('benefits') or {}
pubg['benefits'] = {'statewide_costs': [c for c in bn.get('statewide_costs', []) if '% of salaries' in c.get('item', '') or 'example' in c.get('item', '').lower()]} if bn else None
if pubg.get('assessment'):
    pubg['assessment'] = {'intro': pubg['assessment'].get('intro'), 'items': [{'agency': i['agency'], 'call': i.get('call')} for i in pubg['assessment'].get('items', [])], 'caveats': pubg['assessment'].get('caveats')}
json.dump(pubg, open(os.path.join(REPO, 'data', 'gov.json'), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
# ---- free-account layer (any signed-in reader): findings, reasoning, benefits, budget detail; still no names or direct contacts
reg = copy.deepcopy(pubg); reg['tier'] = 'registered'
reg['insights'] = gov.get('insights'); reg['assessment'] = gov.get('assessment'); reg['benefits'] = gov.get('benefits')
reg['extra_budgets'] = gov.get('extra_budgets', [])
fullb = {a['id']: a.get('budget') for a in gov['agencies']}
for a in reg['agencies']:
    if fullb.get(a['id']): a['budget'] = fullb[a['id']]
os.makedirs(os.path.join(PREM, 'registered'), exist_ok=True)
json.dump(reg, open(os.path.join(PREM, 'registered', 'gov.json'), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
cc = L('ccri.json')
if cc:
    cc.update({'title': 'CCRI, Made Simple', 'intro': 'The Community College of Rhode Island in one clear view: key dates, who to call, every campus, upcoming events and the links students use most.', 'checked': today})
    PREM2 = sys.argv[4] if len(sys.argv) > 4 else os.path.join(os.path.dirname(os.path.abspath(PD)), 'premium-out')
    json.dump(cc, open(os.path.join(PREM2, 'ccri.json'), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
    os.makedirs(os.path.join(PREM2, 'registered'), exist_ok=True)
    rc = copy.deepcopy(cc); rc['tier'] = 'registered'
    json.dump(rc, open(os.path.join(PREM2, 'registered', 'ccri.json'), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
    pc = copy.deepcopy(cc); pc['tier'] = 'free'
    for cp in pc.get('campuses', []): cp.pop('phone', None)
    for o in pc.get('offices', []):
        for k in ('phone', 'email', 'hours'): o.pop(k, None)
    up = sorted((d for d in pc.get('dates', []) if (d.get('end') or d.get('date', '')) >= today), key=lambda d: d['date'])
    pc['dates'] = up[:3]
    json.dump(pc, open(os.path.join(REPO, 'data', 'ccri.json'), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
print('gov.json', os.path.getsize(os.path.join(REPO, 'data', 'gov.json')), 'agencies', len(agencies), 'with payroll', sum(1 for a in agencies if a.get('payroll')), 'with budget', sum(1 for a in agencies if a.get('budget')), 'towns', len(towns))

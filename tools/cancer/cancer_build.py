"""Build data/cancer.json (Cancer Help & Recovery) from the 72-entry research handoff.

Input:  cancer-src/Claude-Handoff-Nationwide-Cancer-Assistance-2026-11-10.txt (complete research, Part 3)
Output: data/cancer.json  and  tools/cancer/mapping.csv (all 72 research entries -> public record ids)

Text fields are copied from the research as written. The machine-readable fields below (post-treatment, status,
scope, route, cancer types, age groups, action label, application URL) are editorial classifications of that text;
each one follows the research wording and the Nov. 10, 2026 rechecks noted in REVERIFIED.
"""
import json, os, re, csv

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SRC = os.path.join(ROOT, 'cancer-src', 'Claude-Handoff-Nationwide-Cancer-Assistance-2026-11-10.txt')
OUT = os.path.join(ROOT, 'data', 'cancer.json')
MAP = os.path.join(ROOT, 'tools', 'cancer', 'mapping.csv')

SECTION_CAT = {
    'INCOME, DISABILITY AND WORK PROTECTIONS': ['disability'],
    'MEDICAL BILLS, MEDICINES AND INSURANCE': ['bills'],
    'LIVING-EXPENSE GRANTS': ['money'],
    'DIAGNOSIS-SPECIFIC AND PEDIATRIC ASSISTANCE': ['money', 'specific'],
    'FOOD, HOUSING, UTILITIES AND HOME HELP': ['basics'],
    'TRANSPORTATION AND LODGING': ['travel'],
    'RECOVERY, COUNSELING AND PRACTICAL HEALTH NEEDS': ['recovery'],
    'FREE ADVOCATES AND APPLICATION HELP': ['advocate'],
    'SPECIAL ELIGIBILITY AND EDUCATION': ['special'],
}
# extra categories beyond the section heading
EXTRA_CAT = {41: ['home'], 42: ['home'], 43: ['home'], 44: ['home'], 45: ['home', 'advocate'], 37: ['home'], 24: ['specific'],
             28: ['bills'], 29: ['travel'], 31: ['travel'], 34: ['travel'], 21: ['travel', 'home'], 26: ['basics', 'travel'],
             23: ['basics'], 25: ['basics'], 33: ['basics'], 52: [], 57: ['specific'], 61: ['specific', 'bills'], 66: ['specific'],
             67: ['specific'], 72: ['specific'], 6: ['bills'], 69: ['bills'], 70: ['money'], 71: ['money'], 62: ['bills'], 65: ['disability'],
             68: ['disability'], 54: ['specific'], 4: [], 59: ['bills'], 60: ['bills']}

POST = {**{i: 'conditional' for i in [1, 2, 3, 4, 5, 6, 10, 11, 12, 13, 14, 15, 22, 24, 26, 28, 29, 31, 41, 43, 44, 46, 47, 50, 56, 59, 61, 62, 69, 70, 71]},
        **{i: 'yes' for i in [7, 8, 9, 16, 17, 18, 19, 20, 25, 35, 36, 37, 38, 39, 40, 45, 48, 49, 51, 52, 53, 54, 55, 57, 60, 63, 64, 65, 67, 68, 72]},
        **{i: 'no' for i in [21, 23, 27, 33, 34, 42]},
        **{i: 'not_published' for i in [30, 32, 58, 66]}}

STATUS = {i: 'not_confirmed' for i in range(1, 73)}
STATUS.update({10: 'variable', 11: 'variable', 12: 'variable', 13: 'variable', 14: 'variable', 16: 'open', 22: 'closed', 23: 'variable',
               25: 'closed', 26: 'open', 56: 'open', 66: 'open', 68: 'variable', 72: 'closed'})
STATUS_NOTE = {
    11: 'Prostate Cancer Medicare Access fund: closed to new patients (rechecked Nov. 10, 2026: "temporarily closed to new patients due to lack of sufficient funding"). Other funds have their own status.',
    23: 'Rechecked Nov. 10, 2026: the only grant funds listed are for multiple myeloma (active treatment or specified clinical trials). No open all-cancer household grant.',
    22: 'Rechecked Nov. 10, 2026: portal closed. Next opening projected Feb. 1, 2027, 9 a.m. Pacific (projected, not guaranteed).',
    25: 'Rechecked Nov. 10, 2026: closed; spring cycle opens January 2027.',
    26: 'Rechecked Nov. 10, 2026: household, grocery, extraordinary-needs and MA/RI ride programs all listed, with no closure notice. Regional, New England only.',
    56: 'Rechecked Nov. 10, 2026: group started Oct. 1, 2026 and accepts new members after the start, subject to capacity.',
    66: 'Rechecked Nov. 10, 2026: Blue Hope Financial Assistance Award ended Feb. 23, 2026. One-on-one navigation continues at 877-422-2030.',
    68: 'Rechecked Nov. 10, 2026: resume review "temporarily paused and is not accepting new submissions"; reopening expected later this fall. Job-search resources remain available.',
    72: 'Rechecked Nov. 10, 2026: 2026-2027 application closed. Next window Jan. 1 to Mar. 31, 2027.',
    16: 'Applications accepted year-round per the official source.',
}
REVERIFIED = {11, 22, 23, 25, 26, 56, 66, 68, 72}

SCOPE = {i: 'national' for i in range(1, 73)}
SCOPE.update({i: 'state_administered' for i in [5, 16, 18, 35, 38, 39, 43, 51]})
SCOPE.update({i: 'local_network' for i in [20, 36, 37, 40, 41, 45, 46, 47, 52, 53, 59]})
SCOPE[26] = 'regional'

ROUTE = {i: 'self' for i in range(1, 73)}
ROUTE.update({i: 'professional' for i in [22, 23, 26, 29, 33, 34, 44, 53]})
ROUTE.update({i: 'either' for i in [15, 21, 32, 47]})

CANCERS = {24: ['blood'], 27: ['breast'], 28: ['pancreatic'], 29: ['blood'], 30: ['brain'], 31: ['sarcoma'], 32: ['ovarian'],
           33: ['childhood'], 34: ['childhood'], 57: ['prostate'], 61: ['prostate'], 66: ['colorectal'], 67: ['pancreatic'],
           72: ['childhood'], 23: ['blood']}
# restrictive age groups (empty = no published age restriction for the program as a whole)
AGES = {2: ['senior', 'any_disabled'], 25: ['young'], 33: ['child'], 34: ['child'], 72: ['child', 'young'], 37: ['senior'],
        52: ['adult'], 18: ['senior', 'medicare'], 19: ['senior', 'medicare'], 20: ['senior', 'medicare'], 44: ['senior', 'medicare'],
        59: ['senior', 'any_disabled']}
AGE_NOTE = {2: 'Age 65+, or qualifying disability/blindness at any age.', 25: 'Ages 21-39.', 33: 'Child 18 or younger.',
            34: 'Diagnosed by age 18 and treated before 21.', 37: 'Usually 60+; varies by provider.', 52: 'Adults 18+.',
            18: 'People with Medicare (65+, or younger with qualifying disability).', 19: 'People with Medicare.', 20: 'People with Medicare, families and caregivers.',
            44: 'People with Medicare.', 59: 'Age 65+, permanent disability, or medically necessary dental care.', 72: 'Childhood cancer survivors.',
            54: 'Men.', 16: 'Adults and children (CHIP).'}
MEN = {54}
INCOME = {2, 10, 11, 12, 13, 14, 16, 18, 19, 21, 23, 25, 26, 27, 28, 29, 34, 35, 38, 39, 40, 43, 48, 58, 59}
INSURED = {11, 12, 14, 18, 19, 20, 44}
LOCAL_MODE = {36, 37, 40, 41, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 59}

ACTION = {}
for i in [1, 2, 3, 5, 6, 16, 17, 18, 19, 35, 38, 39, 40, 43, 58, 69, 70, 71, 4, 7, 15, 44, 72, 22, 25, 23, 26, 29, 33, 34, 21, 42, 12, 13, 14]:
    ACTION[i] = 'Check eligibility'
for i in [20, 61, 62, 63, 64, 65, 66, 67, 9, 32]:
    ACTION[i] = 'Contact a navigator'
for i in [36, 37, 45, 46, 47, 52, 53, 59, 50, 60, 8, 51]:
    ACTION[i] = 'Find a local provider'
for i in [24, 27, 28, 30, 31, 41, 48, 49, 54, 55, 56, 57]:
    ACTION[i] = 'Apply'
for i in [10, 11]:
    ACTION[i] = 'Get reopening alerts'
ACTION[68] = 'Check eligibility'

APPLY_URL = {9: 'https://forms.dollarfor.org/external/web_contact_form.php', 10: 'https://totalassist.org/funds/',
             13: 'https://apply.tafcares.org/s/enrollment-info', 22: 'https://cancercartel.org/warriorgrantinfo',
             23: 'https://familyreach.org/get-help/financial-assistance/', 27: 'https://apply.pinkfund.org/qualification/intro',
             31: 'https://sarcomaalliance.org/second-opinion-grant-application-form/', 41: 'https://cleaningforareason.org/patients/learn-more-apply-now/',
             48: 'https://www.mercymedical.org/patients/eligibility', 68: 'https://www.cancerandcareers.org/en/jobsearch',
             20: 'https://www.shiphelp.org/what-we-do/about-ships/', 1: 'https://www.ssa.gov/benefits/disability/qualify.html'}

# existing Help & Benefits records reused instead of duplicated (Rhode Island implementations or the same program)
RI_LINK = {1: [('b', 'F005')], 2: [('b', 'F006')], 5: [('b', 'RI006')], 16: [('b', 'RI015'), ('b', 'RI012')], 17: [('b', 'RI016'), ('b', 'RI017')],
           18: [('b', 'RI010'), ('b', 'RI011')], 19: [('b', 'F009')], 20: [('s', 'ri-shn-ship-counseling')], 35: [('b', 'RI008')],
           36: [('s', 'ri-shn-211-navigation')], 37: [('b', 'RG001'), ('s', 'ri-shn-mow-grant-meals')], 38: [('b', 'EN001')],
           39: [('s', 'ri-shn-wap-statewide')], 40: [('b', 'F010'), ('b', 'F012')], 41: [('s', 'ri-shn-cancer-cleaning')],
           43: [('b', 'RI013')], 51: [('b', 'RI030'), ('s', 'ri-shn-mtm-medicaid')], 59: [('b', 'RI048')]}
CANONICAL = {41: 'ri-shn-cancer-cleaning'}   # same program already on the site: the cancer record points to it


def slug(s):
    return re.sub(r'[^a-z0-9]+', '-', s.lower()).strip('-')[:60]


def main():
    t = open(SRC, encoding='utf-8').read()
    body = t.split('RESOURCE DIRECTORY', 1)[1].split('CURRENT CHANGES AND QUALIFICATIONS', 1)[0]
    lines = body.split('\n')
    section, recs, cur = None, [], None
    for ln in lines:
        s = ln.strip()
        if s in SECTION_CAT:
            section = s; continue
        m = re.match(r'^(\d+)\. (.+)$', s)
        if m and int(m.group(1)) == len(recs) + 1:
            cur = {'n': int(m.group(1)), 'title': m.group(2), 'section': section, 'f': {}, 'sources': [], '_k': None}
            recs.append(cur); continue
        if cur is None or not s:
            continue
        if s == 'Official sources:':
            cur['_k'] = 'src'; continue
        if cur['_k'] == 'src' and s.startswith('http'):
            cur['sources'].append(s); continue
        m = re.match(r'^(Help|Eligibility|After treatment|Amount/cost|Apply/contact|Status|Reviewed): ?(.*)$', s)
        if m:
            cur['_k'] = m.group(1); cur['f'][m.group(1)] = m.group(2); continue
        if cur['_k'] and cur['_k'] != 'src':
            cur['f'][cur['_k']] += ' ' + s
    assert len(recs) == 72, len(recs)
    out, rows = [], []
    for r in recs:
        n, f = r['n'], r['f']
        for k in ['Help', 'Eligibility', 'After treatment', 'Amount/cost', 'Apply/contact', 'Status', 'Reviewed']:
            assert k in f, (n, k)
        assert r['sources'], n
        title = r['title']
        org, prog = title, title
        if ' — ' in title:
            org, prog = title.split(' — ', 1)
        if n == 26:
            org, prog = 'Joe Andruzzi Foundation', 'Joe Andruzzi Foundation (New England)'
        phones = re.findall(r'(?<![\d-])(\d{3}-\d{3}-\d{4})(?![\d-])', f['Apply/contact'])
        cats = list(dict.fromkeys(SECTION_CAT[r['section']] + EXTRA_CAT.get(n, [])))
        rid = 'ca-%02d-%s' % (n, slug(title))
        url = APPLY_URL.get(n) or r['sources'][0]
        rec = {
            'id': rid, 'research_entry_ids': [n], 'title': title, 'organization': org, 'program_name': prog,
            'categories': cats, 'summary': f['Help'], 'eligibility_text': f['Eligibility'],
            'post_treatment_eligibility': POST[n], 'post_treatment_notes': f['After treatment'],
            'amount_text': f['Amount/cost'], 'application_instructions': f['Apply/contact'],
            'application_route': ROUTE[n], 'application_url': url, 'phones': phones, 'action': ACTION.get(n, 'Check eligibility'),
            'application_status': STATUS[n], 'application_status_notes': STATUS_NOTE.get(n, f['Status']),
            'research_status_text': f['Status'], 'status_as_of': '2026-11-10',
            'cancer_types': CANCERS.get(n, ['all']), 'age_groups': AGES.get(n, []), 'age_notes': AGE_NOTE.get(n),
            'men_only': n in MEN, 'income_test': n in INCOME, 'insurance_required': n in INSURED,
            'geographic_scope': SCOPE[n], 'mode': 'local' if n in LOCAL_MODE or SCOPE[n] in ('local_network', 'regional') else 'remote',
            'source_reviewed_at': f['Reviewed'].strip(), 'last_reverified_at': '2026-11-10' if n in REVERIFIED else None,
            'sources': [{'url': u, 'checked_at': '2026-11-10'} for u in r['sources']],
            'ri_links': [{'kind': k, 'id': i} for k, i in RI_LINK.get(n, [])], 'canonical_record': CANONICAL.get(n),
        }
        if n in (22, 25, 72, 10, 11, 23, 68):
            assert rec['action'] != 'Apply'
        out.append(rec)
        rows.append([n, title, rid, 'imported as own record' + ('; reuses existing ' + CANONICAL[n] if n in CANONICAL else ''),
                     rec['application_status'], ';'.join(k + ':' + i for k, i in RI_LINK.get(n, []))])
    meta = {'title': 'Cancer Help & Recovery', 'research_date': '2026-11-10', 'entries': 72, 'records': len(out),
            'scope_note': 'Nationwide guide plus one New England resource. Not every local program in all 50 states. Navigation, grants, coverage, wage replacement and donated services are labeled separately. A maximum award is a ceiling, not a promise. Program pages do not prove applications are open.',
            'categories': [['money', 'Money & living-expense grants'], ['disability', 'Disability & income'], ['bills', 'Medical bills, insurance & prescriptions'],
                           ['basics', 'Food, housing & utilities'], ['travel', 'Rides, airfare & places to stay'], ['home', 'Help at home & caregivers'],
                           ['recovery', 'Recovery, rehab & emotional support'], ['specific', 'For a specific cancer or age'], ['advocate', 'Free advocate to help you apply'],
                           ['special', 'Veterans, 9/11 & nuclear workers, scholarships']]}
    json.dump({'meta': meta, 'records': out}, open(OUT, 'w'), ensure_ascii=False, separators=(',', ':'))
    with open(MAP, 'w', newline='') as fh:
        w = csv.writer(fh); w.writerow(['research_entry', 'title', 'public_record_id', 'disposition', 'status', 'reused_existing_records']); w.writerows(rows)
    print('records', len(out), 'bytes', os.path.getsize(OUT))


if __name__ == '__main__':
    main()

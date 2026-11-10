"""Bring the Nov 10 nine-section research into the site's full data (the tier split happens afterwards in assemble_gov.py).
Called as: import v2_import; v2_import.apply(gov, V2_DIR)"""
import json, os, re

def L(V, n):
    p = os.path.join(V, n)
    return json.load(open(p, encoding='utf-8')) if os.path.exists(p) else {}

def norm(s): return re.sub(r'[^a-z0-9 ]', '', str(s or '').lower().replace('&', 'and')).strip()
def val(x, *keys):
    if not isinstance(x, dict): return x
    for k in keys:
        if x.get(k) not in (None, '', 'not published'): return x[k]
    return None

def apply(gov, V):
    # ---- 1. election (unofficial) ----
    e = L(V, 's1_election.json')
    if e:
        def row(r):
            c = [[x.get('name'), x.get('party') or '', x.get('votes'), x.get('pct')] for x in r.get('candidates', [])]
            lead = [str(x).split(' —')[0] for x in (r.get('leading') or [])]
            return {'office': r.get('office'), 'district': r.get('district'), 'town': r.get('municipality'), 'seats': r.get('seats_up', 1),
                    'leading': lead, 'incumbent': r.get('incumbent') if isinstance(r.get('incumbent'), str) else '', 'incumbent_status': r.get('incumbent_status', ''),
                    'candidates': c, 'term_start': r.get('term_start', '')}
        note = next((n for n in e.get('source_notes', []) if 'isOfficialResults' in str(n) or 'lastUpdated' in str(n)), '')
        gov['election'] = {'status': 'unofficial', 'updated': '2026-11-09T19:29Z', 'source': 'https://electionresults.ri.gov/results/public/RhodeIsland/elections/2026StatewideGeneralElection',
                           'term_start_state': '2027-01-05', 'note': str(note)[:300],
                           'statewide': [row(r) for r in e.get('statewide', [])], 'house': [row(r) for r in e.get('house', [])],
                           'senate': [row(r) for r in e.get('senate', [])], 'municipal': [row(r) for r in e.get('municipal', [])]}
    # ---- 2. authorities ----
    a = L(V, 's2_authorities.json')
    if a:
        Q = {norm(q.get('name')).split(' ')[0]: q for q in gov.get('quasi', [])}
        for au in a.get('authorities', []):
            nm = norm(au.get('name'))
            q = next((v for k, v in Q.items() if k and (nm.startswith(k) or k in nm)), None)
            if q is None:
                q = {'name': au.get('name'), 'url': au.get('url')}; gov.setdefault('quasi', []).append(q)
            emp, pay, bud, sf = au.get('employees') or {}, au.get('payroll') or {}, au.get('operating_budget') or {}, au.get('state_funding') or {}
            ch = au.get('board_chair') or {}
            q['chair'] = {'name': ch.get('name'), 'status': ch.get('status', ''), 'source': str(ch.get('source', '')).split(' ')[0]}
            q['auth_money'] = {'budget': val(bud, 'value'), 'budget_status': str(bud.get('status', ''))[:80], 'budget_fy': bud.get('fiscal_year'),
                               'state_funding': val(sf, 'value'), 'state_pct': sf.get('pct_of_revenue'), 'state_fy': sf.get('fiscal_year'), 'source': str(bud.get('source', '')).split(' ')[0]}
            q['auth_people'] = {'employees': val(emp, 'value'), 'employees_basis': str(emp.get('basis', ''))[:120], 'employees_fy': emp.get('fiscal_year'),
                                'payroll': val(pay, 'value'), 'payroll_basis': str(pay.get('basis', ''))[:140], 'payroll_fy': pay.get('fiscal_year'),
                                'exec_pay': [{'title': x.get('title') or x.get('position'), 'name': x.get('name', ''), 'amount': x.get('amount') or x.get('value'), 'kind': x.get('amount_type') or x.get('type', ''), 'year': x.get('fiscal_year') or x.get('as_of_period', '')}
                                             for x in (au.get('top_paid') or au.get('exec_salary_rates') or []) if isinstance(x, dict)],
                                'top_paid_status': au.get('top_paid_status', '')}
            if not q.get('leader') and au.get('leader'): q['leader'] = {'name': au['leader'].get('name'), 'title': au['leader'].get('title')}
    # ---- 3. payees and contracts ----
    c = L(V, 's3_contracts.json')
    if c:
        rows = [x for x in c.get('payees_fy2025', []) if x.get('rank_excluding_payroll_and_redacted')]
        gov['payees'] = {'fy': 'FY2025', 'period': 'July 1, 2024 to June 30, 2025', 'source': 'https://www.ri.gov/opengovernment/payees?fiscal_year=2025',
                         'note': 'Actual cash payments from the state expenditure file. The portal covers specific agencies only, so this is not all state spending. FY2026 payments are not yet published.',
                         'rows': [[x['rank_excluding_payroll_and_redacted'], x['vendor'], round(x['total_paid']), len(x.get('paying_agencies', [])),
                                   (sorted(x.get('paying_agencies', []), key=lambda y: -y.get('paid', 0)) or [{}])[0].get('agency', ''), x.get('source')] for x in sorted(rows, key=lambda x: x['rank_excluding_payroll_and_redacted'])]}
        def meth(k):
            am = str(k.get('award_method') or ''); conf = str(k.get('award_method_confidence') or '').lower()
            if am in ('', 'not published'): return 'Not published', ''
            return am.split(' (')[0], ('inferred from bid number' if 'inferred' in conf else 'stated in contract')
        gov['contracts'] = {'note': 'The largest contracts found for the top FY2025 payees, not a ranking of every state contract. Contract values are not payments, and some awards appear twice in the new finance system, so do not add them up.',
                            'rows': [[k['vendor'], k.get('agency'), round(k['contract_value']) if k.get('contract_value') else None, k.get('purpose'), k.get('contract_start'), k.get('contract_end'), *meth(k), k.get('source')]
                                     for k in sorted(c.get('contracts', []), key=lambda k: -(k.get('contract_value') or 0))]}
    # ---- 4/5. division heads and org charts ----
    h = L(V, 's4_s5_heads_charts.json')
    if h:
        AM = {'ridoh': 'health', 'dem': 'environmental', 'ridot': 'transportation', 'ag': 'attorney general'}
        for ag in gov['agencies']:
            key = AM.get(ag.get('id'))
            if key:
                ag['heads'] = [{'division': x.get('division'), 'person': x.get('person'), 'title': x.get('title'), 'phone': x.get('phone') if x.get('phone') != 'not published' else '',
                                'email': x.get('email') if x.get('email') != 'not published' else '', 'source': str(x.get('source', '')).split(' ')[0]}
                               for x in h.get('division_heads', []) if key in norm(x.get('agency'))]
        CM = {'administration': 'doa', 'revenue': 'dor', 'labor': 'dlt', 'business regulation': 'dbr', 'executive office of health': 'eohhs', 'human services': 'dhs', 'health': 'ridoh',
              'behavioral': 'bhddh', 'children': 'dcyf', 'healthy aging': 'oha', 'veterans': 'vets', 'environmental': 'dem', 'coastal': 'crmc', 'transportation': 'ridot',
              'public safety': 'dps', 'corrections': 'doc', 'emergency': 'riema', 'education': 'ride', 'commerce': 'commerce', 'housing': 'eoh', 'energy': 'oer', 'governor': 'governor', 'attorney general': 'ag'}
        A = {x['id']: x for x in gov['agencies']}
        for oc in h.get('org_charts', []):
            an = norm(oc.get('agency'))
            aid = next((v for k, v in sorted(CM.items(), key=lambda kv: -len(kv[0])) if an.startswith(k) or ('department of ' + k) in an or k in an.split('(')[0]), None)
            if not aid or aid not in A or not oc.get('chart_url') or oc.get('chart_url') == 'not published': continue
            ag = A[aid]
            if ag.get('chart') and (ag['chart'].get('lines') or 0) >= len(oc.get('reporting_lines', [])): continue
            ag['chart'] = {'url': oc['chart_url'], 'date': str(oc.get('document_date', '')).split(' (')[0], 'lines': len(oc.get('reporting_lines', [])),
                           'reporting': [[r.get('unit'), r.get('reports_to')] for r in oc.get('reporting_lines', []) if r.get('relationship_basis') == 'shown on official chart'][:120]}
        gov['court_chiefs'] = [{'court': x.get('court'), 'person': x.get('person') or x.get('name'), 'title': x.get('title'), 'source': str(x.get('source', '')).split(' ')[0]} for x in h.get('court_chiefs', [])]
    # ---- 6. towns ----
    t = L(V, 's6_towns.json')
    if t:
        T = {norm(x['name']): x for x in gov['towns']}
        for tw in t.get('towns', []):
            x = T.get(norm(tw.get('town')))
            if not x: continue
            g = tw.get('government') or {}
            x['gov_form'] = g.get('form') if g.get('form') != 'not published' else ''
            b, sb, sd = tw.get('budget_fy2027') or {}, tw.get('school_budget_fy2027') or {}, tw.get('school_district') or {}
            x['budget27'] = {'total': b.get('total'), 'status': b.get('status'), 'includes_school': b.get('includes_school_appropriation'), 'source': b.get('source')} if isinstance(b.get('total'), (int, float)) else ({'status': b.get('status'), 'source': b.get('source')} if b else None)
            x['school27'] = {'total': sb.get('total'), 'status': sb.get('status'), 'source': sb.get('source'), 'regional': sb.get('regional_district_ref')} if isinstance(sb.get('total'), (int, float)) else None
            sp = sd.get('superintendent') or {}
            x['district'] = {'name': sd.get('name'), 'regional': sd.get('regional'), 'super': sp.get('name') if sp.get('name') != 'not published' else '',
                             'super_phone': sp.get('phone') if sp.get('phone') != 'not published' else '', 'super_email': sp.get('email') if sp.get('email') != 'not published' else '', 'source': sp.get('source')}
        gov['regional_districts'] = [{'district': r.get('district'), 'towns': r.get('member_towns'), 'total': (r.get('school_budget_fy2027') or {}).get('total'), 'status': (r.get('school_budget_fy2027') or {}).get('status')} for r in t.get('regional_school_districts', [])]
    # ---- 7. key boards ----
    k = L(V, 's7_boards.json')
    if k:
        def v(o, key='value'): return o.get(key) if isinstance(o, dict) else o
        kb = {}
        for b in k.get('boards', []):
            mt = b.get('meets') or {}; om = mt.get('open_meetings_notices_12mo') or {}
            sc = b.get('staff_contact') or {}; oc = sc.get('open_meetings_contact') or {}
            kb[norm(b.get('name'))] = {'name': b.get('name'), 'purpose': v(b.get('purpose')), 'statute': (b.get('statute') or {}).get('cite'), 'statute_url': (b.get('statute') or {}).get('url'),
                                      'seats': v(b.get('seats')), 'appointed_by': v(b.get('appointed_by')), 'senate': v(b.get('senate_confirmation')),
                                      'meetings_12mo': om.get('count'), 'parent': v(b.get('parent_agency')),
                                      'pay': (b.get('member_compensation') or {}).get('rule'), 'staff': {'name': oc.get('name'), 'phone': oc.get('phone'), 'email': oc.get('email')}}
        gov['keyboards'] = {'rule': k.get('selection_rule'), 'boards': kb}
    # ---- 8/9. unions and pensions -> benefits ----
    u = L(V, 's8_s9_unions_pensions.json')
    if u and gov.get('benefits') is not None:
        B = gov['benefits']
        def txt(o): return o if isinstance(o, str) else (o.get('rule') or o.get('summary') or o.get('rate') or json.dumps(o, ensure_ascii=False)[:300]) if isinstance(o, dict) else ''
        B['contracts_detail'] = [{'union': x.get('union'), 'url': x.get('contract_url'), 'term': '%s to %s' % ((x.get('term') or {}).get('start', ''), (x.get('term') or {}).get('end', '')),
                                  'renewal': txt(x.get('continuation_clause') or {}), 'raises': ['%s: %s%%' % (r.get('effective'), r.get('pct')) for r in (x.get('raises') or []) if r.get('pct') is not None],
                                  'overtime': txt(x.get('overtime') or {}), 'longevity': txt(x.get('longevity') or {}), 'staffing': txt(x.get('staffing') or {}),
                                  'differentials': [txt(d) for d in (x.get('differentials') or [])][:8], 'allowances': [txt(d) for d in (x.get('allowances') or [])][:8]} for x in u.get('contracts', [])]
        B['pension_cohorts'] = [{'group': p.get('group'), 'cohort': p.get('cohort'), 'formula': txt(p.get('formula') or {}), 'contribution': txt(p.get('employee_contribution') or {}),
                                 'eligibility': txt(p.get('eligibility') or {}), 'cola': txt(p.get('cola') or {})} for p in u.get('pensions', [])]
        ip = u.get('individual_payments_published') or {}
        B['individual_pensions'] = {'published': ip.get('published'), 'summary': ip.get('summary'), 'url': 'https://data.treasury.ri.gov/dataset/ersri-valuation-files-fy-2025'}
    return gov

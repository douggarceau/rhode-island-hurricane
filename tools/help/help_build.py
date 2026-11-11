"""Build data/help.json for the Help & Benefits tab from the Senior Help Network and the Benefits Intelligence Center packages.
usage: python3 -I help_build.py <senior_services.json> <coverage_gaps.txt> <master_benefits.json> <out.json>
Missing values stay the literal "not published"; nothing is converted to free, zero or no-limit."""
import json, re, sys
ISLAND = {"Jamestown": "Some county programs may not serve Jamestown. Confirm coverage for your address before applying; Newport County eligibility doesn’t automatically carry over.", "New Shoreham": "On Block Island, call ahead to confirm a provider can reach you. PACE does not serve New Shoreham.", "Portsmouth": "PACE does not serve Prudence Island. A program that serves Portsmouth may not reach the island; confirm before applying."}  # reader-facing rewrites of research cautions
LINKFIX = {"https://www.stayathomeinlittlecompton.org/senior-transportation": "https://www.stayathomeinlittlecompton.org/sah-services", "https://www.southkingstownri.gov/255/Transportation": "https://www.southkingstownri.gov/", "https://our.ric.edu/documents/senior-citizen-tuition-waiver": "https://our.ric.edu/department-directory/office-bursar/tuition-waivers"}  # replacements for dead links (audit L01)

svc_p, gaps_p, ben_p, out_p = sys.argv[1:5]
NP = 'not published'
sv = json.load(open(svc_p, encoding='utf-8'))
S = []
for s in sv['services']:
    S.append({'id': s['service_id'], 'org': s.get('organization_name'), 'name': s.get('service_name'), 'desc': s.get('exact_service_provided'),
              'cats': s.get('categories') or [], 'towns': s.get('municipalities_served') or [], 'zips': s.get('zip_codes_served') or [],
              'cov': s.get('coverage_status'), 'excluded': s.get('excluded_areas') or [], 'cov_notes': s.get('coverage_notes', NP),
              'min_age': s.get('minimum_age', NP), 'age_ex': s.get('age_exceptions', NP), 'elig': s.get('other_eligibility', NP),
              'income': s.get('income_restrictions', NP), 'income_test': s.get('income_test', NP), 'cost_type': s.get('cost_type', NP),
              'cost': s.get('exact_published_cost', NP), 'home': s.get('delivered_to_home', NP), 'home_scope': s.get('home_visit_scope', NP),
              'access': s.get('access_mode', NP), 'transport': s.get('transportation_available', NP), 'workforce': s.get('workforce', NP),
              'schedule': s.get('frequency_and_scheduling', NP), 'wait': s.get('waiting_list_status', NP), 'apply': s.get('application_or_referral_requirements', NP),
              'methods': s.get('application_method') or [], 'apply_link': s.get('application_link', NP), 'phone': s.get('business_phone', NP),
              'phone_role': s.get('phone_role', NP), 'email': s.get('business_email', NP), 'site': s.get('official_website', NP),
              'role': s.get('service_delivery_type', NP), 'status': s.get('review_status'), 'op': s.get('current_operating_status', NP),
              'limits': s.get('limitations', NP), 'verified': s.get('verification_date', NP), 'sources': s.get('source_urls') or []})
# per-town local contact and gaps from the coverage report
T = {}
txt = open(gaps_p, encoding='utf-8').read()
for block in re.split(r'\n(?=[A-Z][A-Z .]+\n)', txt):
    lines = block.strip().split('\n')
    if len(lines) < 3 or not lines[0].isupper() or not lines[1].startswith('Local:'): continue
    town = lines[0].title().replace('East ', 'East ')
    rec = {}
    for ln in lines[1:]:
        k, _, v = ln.partition(': ')
        rec[k.strip()] = v.strip()
    m = re.match(r'(.*?) — (.*?) \((\w+)\)$', rec.get('Local', ''))
    T[town] = {'local': m.group(1) if m else rec.get('Local', ''), 'local_phone': m.group(2) if m else NP, 'local_status': m.group(3) if m else NP,
               'local_source': rec.get('Local source', NP), 'cat_gaps': rec.get('Categories without a verified published direct/coordinated offer in this release', NP),
               'task_gaps': rec.get('Task gaps', NP), 'island': ISLAND.get(town, rec.get('Island caution', NP))}
bm = json.load(open(ben_p, encoding='utf-8'))
B = []
for p in bm['programs']:
    views = list(p.get('databases') or []) + (['energy'] if p.get('energy') else [])
    B.append({'id': p['id'], 'name': p.get('program_name'), 'admin': p.get('administrator'), 'class': p.get('classification'), 'cat': p.get('category'),
              'benefit': p.get('benefit'), 'value': p.get('financial_value', NP), 'min_age': p.get('minimum_age', NP), 'income': p.get('income_limits', NP),
              'income_year': p.get('income_measurement_year', NP), 'assets': p.get('asset_limits', NP), 'household': p.get('household_requirements', NP),
              'residency': p.get('residency_and_other_eligibility', NP), 'tenure': p.get('homeowner_renter_rules', NP), 'combine': p.get('combination_rules', NP),
              'apply': p.get('application_process', NP), 'docs': p.get('required_documents', NP), 'url': p.get('application_url', NP), 'phone': p.get('phone', NP),
              'email': p.get('email', NP), 'enroll': p.get('enrollment_period', NP), 'deadlines': p.get('deadlines', NP), 'renewal': p.get('renewal', NP),
              'status': p.get('current_status'), 'status_detail': p.get('status_detail', NP), 'effective': p.get('effective_period', NP),
              'caveats': p.get('uncertainties') or [], 'views': views, 'form': p.get('benefit_form', NP), 'kind': p.get('record_kind'), 'pub': p.get('publication_ready'),
              'verified': p.get('date_verified', NP), 'sources': p.get('official_source_urls') or []})
meta = {'services_date': sv['metadata'].get('research_date'), 'benefits_date': bm['metadata'].get('as_of') or '2026-11-10',
        'categories': sv['categories'], 'towns_list': sorted(T.keys()) if len(T) == 39 else sv['municipalities'],
        'note': 'Online research of published offers, Nov. 10, 2026. Not a guarantee that help or an appointment is available. Call the provider to confirm.'}
_s = json.dumps({'meta': meta, 'services': S, 'towns': T, 'benefits': B}, ensure_ascii=False, separators=(',', ':'))
for _a, _b in LINKFIX.items(): _s = _s.replace(_a, _b)
open(out_p, 'w', encoding='utf-8').write(_s)
print('services', len(S), 'towns', len(T), 'benefits', len(B))

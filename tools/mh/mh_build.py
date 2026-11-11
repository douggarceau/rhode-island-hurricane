"""Build data/mh.json for the Mental Health & Self-Help tab from the canonical research release.

Input:  mh-src/02-RI-Mental-Health-Database-2026-11-10.json (canonical, 182 records)
        mh-src/towns.json (39-town CCBHC / youth MRSS routing from the statewide report)
Output: data/mh.json

Rules kept from the handoff: every record stays public (paywall_allowed is false for all);
"not published" is copied through exactly; stable record ids are preserved; nothing is invented.
"""
import json, os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SRC = os.path.join(ROOT, 'mh-src', '02-RI-Mental-Health-Database-2026-11-10.json')
TOWNS = os.path.join(ROOT, 'mh-src', 'towns.json')
OUT = os.path.join(ROOT, 'data', 'mh.json')
NP = 'not published'
DEAD_LINKS = {
    'https://www.ricares.org/ripra': 'https://www.ricares.org/peer-recovery',
    'https://ribhopenbeds.org/recovery-housing/': 'https://ribhddh.my.site.com/ProviderPortal/s/',
    'https://www.unitedwayri.org/wp-content/uploads/2025/04/211-Generic.pdf': 'https://www.unitedwayri.org/get-help/',
}

CATS = ['Find Counseling', 'Free & Low-Cost Help', 'Support Groups', 'Addiction & Recovery', 'Meetings Calendar',
        'Crisis Assistance', 'Senior Mental Health', 'Family & Caregiver Support', 'Online & Telehealth',
        'Community & Faith-Based Help']


def L(v):
    return v if isinstance(v, list) else ([] if v in (None, NP) else [v])


def main():
    d = json.load(open(SRC))
    towns = json.load(open(TOWNS))
    recs = d['records']
    ids = [r['id'] for r in recs]
    assert len(ids) == len(set(ids)), 'duplicate ids'
    assert not any(r.get('paywall_allowed') for r in recs), 'a record allows a paywall'
    assert len(towns) == 39, 'need 39 towns'
    out = []
    for r in recs:
        locs = [{'town': l.get('town', NP), 'addr': l.get('address', NP), 'venue': l.get('venue', NP), 'acc': l.get('accessibility', NP)}
                for l in L(r['service_locations']) if isinstance(l, dict)]
        for c in r['categories']:
            assert c in CATS, c
        o = {
            'id': r['id'], 'type': r['record_type'], 'org': r['organization_name'], 'prog': r['program_name'],
            'cls': r['service_class'], 'desc': r['description'], 'pop': r['population_served'],
            'min': r['minimum_age'], 'max': r['maximum_age'], 'agetxt': r['age_eligibility_text'],
            'area': r['geographic_service_area'], 'towns': r['service_area_towns'], 'statewide': r['statewide_access'] is True,
            'locs': locs, 'modes': L(r['delivery_modes']), 'cost': L(r['cost_status']), 'costs': r['published_costs'],
            'ins': r['insurance_accepted'], 'elig': r['eligibility'], 'ref': r['referral_requirements'], 'intake': r['intake_status'],
            'phone': r['phone'], 'role': r['phone_role'], 'email': r['professional_email'], 'site': r['official_website'],
            'apply': r['application_url'], 'hours': r['office_hours'], 'acc': r['accessibility'], 'lang': r['languages'],
            'relig': r['religious_affiliation_required'], 'src': [s for s in L(r['source_urls'])],
            'checked': r['public_contact_verified_at'], 'srcchk': r['last_verification_date'], 'pvupd': r['provider_updated_at'],
            'vstat': r['verification_status'], 'pub': r['publication_status'], 'cal': r['calendar_eligible'] is True,
            'cats': r['categories'], 'notes': L(r['notes']), 'dir': r['official_directory_url'], 'cstat': r['contact_status'],
        }
        ms = r['meeting_schedule']
        if isinstance(ms, dict):
            o['sched'] = {k: ms.get(k, NP) for k in ['recurrence', 'days', 'start_time', 'end_time', 'explicit_dates', 'effective_start',
                                                      'effective_end', 'exceptions', 'source_updated_at', 'schedule_status',
                                                      'official_meeting_list_url', 'join_url', 'join_url_type', 'calendar_exclusion_reason']}
        else:
            o['sched'] = ms
        out.append(o)
    # town routing: attach the CCBHC and youth MRSS contact for each town
    def find(org, prog_kw):
        for r in out:
            if r['org'] == org and prog_kw in r['prog']:
                return r
        return None
    route = {}
    for t, v in towns.items():
        c = find(v['ccbhc'], 'CCBHC outpatient')
        m = find(v['mrss'], 'Mobile Response')
        assert c and m, t
        route[t] = {'ccbhc': v['ccbhc'], 'ccbhc_id': c['id'], 'ccbhc_phone': c['phone'], 'mrss': v['mrss'], 'mrss_id': m['id'],
                    'mrss_phone': m['phone'], 'local_clinical': v['local_clinical']}
    meta = {k: d['metadata'][k] for k in ['project', 'research_date', 'timezone', 'schema_version', 'record_count', 'counts_by_record_type',
                                          'source_count', 'unknown_value', 'verification_definition', 'coverage_limits', 'paywall_policy',
                                          'safety_policy']}
    meta['categories'] = CATS
    meta['towns_list'] = sorted(towns)
    # dead links found in the Nov. 10, 2026 audit, replaced with working official pages
    s = json.dumps({'meta': meta, 'records': out, 'routing': route}, ensure_ascii=False, separators=(',', ':'))
    for old, new in DEAD_LINKS.items():
        s = s.replace(json.dumps(old), json.dumps(new))
    open(OUT, 'w').write(s)
    print('records', len(out), 'towns', len(route), 'bytes', os.path.getsize(OUT))


if __name__ == '__main__':
    main()

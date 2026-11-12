#!/usr/bin/env python3
"""All Rhode Island jobs from the Adzuna API -> data/alljobs.json (the "All RI jobs" tab).

- Needs the ADZUNA_APP_ID and ADZUNA_APP_KEY secrets. Without them the script does nothing.
- Keeps only jobs whose Adzuna location is in Rhode Island, posted in the last 30 days.
- Drops jobs already listed on our other job tabs (same employer and title).
- Pay that Adzuna estimated (not published by the employer) is not shown as pay.
- If Adzuna can't be reached, the previous file stays as it is.
Terms: every listing links through Adzuna's own job link and the page credits "Jobs by Adzuna".

Usage: ADZUNA_APP_ID=... ADZUNA_APP_KEY=... python3 -I tools/jobs/adzuna.py [repo_dir]
"""
import datetime as dt, html, json, os, re, sys, time, urllib.error, urllib.parse, urllib.request

UA = 'RhodeIslandHurricane/1.0 (job listings; rhodeislandhurricane.com)'
MAX_PAGES = 40          # 50 jobs a page; well under the free plan's daily request allowance
TOWNS = ['Barrington', 'Bristol', 'Burrillville', 'Central Falls', 'Charlestown', 'Coventry', 'Cranston', 'Cumberland', 'East Greenwich',
         'East Providence', 'Exeter', 'Foster', 'Glocester', 'Hopkinton', 'Jamestown', 'Johnston', 'Lincoln', 'Little Compton', 'Middletown',
         'Narragansett', 'New Shoreham', 'Newport', 'North Kingstown', 'North Providence', 'North Smithfield', 'Pawtucket', 'Portsmouth',
         'Providence', 'Richmond', 'Scituate', 'Smithfield', 'South Kingstown', 'Tiverton', 'Warren', 'Warwick', 'West Greenwich',
         'West Warwick', 'Westerly', 'Woonsocket']
# Villages and places Adzuna uses that belong to a town
PLACE = {'Wakefield': 'South Kingstown', 'Kingston': 'South Kingstown', 'Peace Dale': 'South Kingstown', 'Wickford': 'North Kingstown',
         'Saunderstown': 'North Kingstown', 'Quonset': 'North Kingstown', 'Block Island': 'New Shoreham', 'Riverside': 'East Providence',
         'Rumford': 'East Providence', 'Greenville': 'Smithfield', 'Esmond': 'Smithfield', 'Pascoag': 'Burrillville', 'Harrisville': 'Burrillville',
         'Chepachet': 'Glocester', 'Slatersville': 'North Smithfield', 'Ashaway': 'Hopkinton', 'Hope Valley': 'Hopkinton', 'Wyoming': 'Richmond',
         'Carolina': 'Charlestown', 'Bradford': 'Westerly', 'Misquamicut': 'Westerly', 'Manville': 'Lincoln', 'Albion': 'Lincoln',
         'Valley Falls': 'Cumberland', 'Hope': 'Scituate', 'North Scituate': 'Scituate', 'Fiskeville': 'Cranston', 'Pawtuxet': 'Cranston'}


def norm(s): return re.sub(r'[^a-z0-9]', '', (s or '').lower())


def town_of(area, display):
    for x in list(reversed(area or [])) + [display or '']:
        for t in sorted(TOWNS, key=len, reverse=True):
            if t.lower() in x.lower(): return t
        for p, t in PLACE.items():
            if p.lower() in x.lower(): return t
    return ''


def get(app_id, key, page):
    q = urllib.parse.urlencode({'app_id': app_id, 'app_key': key, 'results_per_page': 50, 'where': 'Rhode Island',
                                'max_days_old': 30, 'sort_by': 'date', 'content-type': 'application/json'})
    url = f'https://api.adzuna.com/v1/api/jobs/us/search/{page}?{q}'
    for a in range(4):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': UA, 'Accept': 'application/json'}), timeout=40) as r:
                return json.load(r)
        except urllib.error.HTTPError as e:
            if e.code in (401, 403): raise SystemExit(f'Adzuna refused the key ({e.code}); nothing changed.')
            if e.code == 429: time.sleep(10 + 10 * a); continue
            if a == 3: raise
            time.sleep(3)
        except Exception:
            if a == 3: raise
            time.sleep(3)


def ours(repo):
    """employer|title keys of jobs already on our other job tabs"""
    keys = set()
    def add(emp, title):
        if emp and title: keys.add(norm(emp)[:14] + '|' + norm(title)[:30])
    def load(f):
        p = os.path.join(repo, 'data', f)
        return json.load(open(p)) if os.path.exists(p) else {}
    for j in load('jobs.json').get('listings', []): add(j.get('employer'), j.get('title'))
    for j in load('majors.json').get('jobs', []): add(j.get('employer') or j.get('employer_id'), j.get('title'))
    for j in load('seniorjobs.json').get('jobs', []): add(j.get('employer'), j.get('title'))
    for j in load('techjobs.json').get('jobs', []): add(j.get('employer') or j.get('company'), j.get('title'))
    return keys


def main():
    app_id, key = os.environ.get('ADZUNA_APP_ID', '').strip(), os.environ.get('ADZUNA_APP_KEY', '').strip()
    repo = sys.argv[1] if len(sys.argv) > 1 else '.'
    if not (app_id and key):
        print('No ADZUNA_APP_ID / ADZUNA_APP_KEY secrets yet: skipping (nothing changed).'); return
    raw, count = [], None
    for page in range(1, MAX_PAGES + 1):
        d = get(app_id, key, page)
        res = d.get('results') or []
        if count is None: count = d.get('count')
        raw += res
        if len(res) < 50: break
        time.sleep(1.2)
    print(f'Adzuna returned {len(raw)} of {count} jobs for "Rhode Island"')
    skip, seen, jobs = ours(repo), set(), []
    dup = out_of_state = 0
    for r in raw:
        loc = r.get('location') or {}
        area = loc.get('area') or []
        if 'Rhode Island' not in area and 'Rhode Island' not in (loc.get('display_name') or '') and ', RI' not in (loc.get('display_name') or ''):
            out_of_state += 1; continue
        title = html.unescape(re.sub(r'<[^>]+>', '', r.get('title') or '')).strip()
        emp = html.unescape(((r.get('company') or {}).get('display_name') or '').strip())
        url = r.get('redirect_url') or ''
        if not title or not url.startswith('https://'): continue
        k = norm(emp)[:14] + '|' + norm(title)[:30]
        if k in skip: dup += 1; continue
        town = town_of(area, loc.get('display_name'))
        if (k, town) in seen: continue
        seen.add((k, town))
        pay, pmax = '', 0
        if str(r.get('salary_is_predicted', '0')) != '1' and r.get('salary_min'):
            lo, hi = float(r['salary_min']), float(r.get('salary_max') or r['salary_min'])
            per = 'an hour' if hi < 300 else 'a year'
            f = (lambda v: f'${v:,.2f}') if hi < 300 else (lambda v: f'${v:,.0f}')
            pay = f(lo) + (f'–{f(hi)}' if hi != lo else '') + ' ' + per
            pmax = hi * 2080 if hi < 300 else hi
        snippet = html.unescape(re.sub(r'<[^>]+>', ' ', r.get('description') or ''))
        snippet = re.sub(r'\s+', ' ', snippet).strip()[:220]
        jobs.append({'title': title, 'employer': emp or 'Employer not named', 'town': town,
                     'where': loc.get('display_name') or '', 'cat': ((r.get('category') or {}).get('label') or '').replace(' Jobs', ''),
                     'hours': {'full_time': 'Full-time', 'part_time': 'Part-time'}.get(r.get('contract_time') or '', ''),
                     'kind': {'permanent': 'Permanent', 'contract': 'Contract'}.get(r.get('contract_type') or '', ''),
                     'pay': pay, 'pay_max': round(pmax), 'posted': (r.get('created') or '')[:10], 'url': url, 'snippet': snippet})
    jobs.sort(key=lambda j: j['posted'], reverse=True)
    out = {'updated': dt.datetime.now(dt.timezone.utc).isoformat(timespec='minutes'), 'source': 'Adzuna',
           'note': 'Jobs posted in Rhode Island in the last 30 days, collected by Adzuna from job sites and employers. '
                   'Jobs already on our other job lists are left out.', 'jobs': jobs}
    p = os.path.join(repo, 'data', 'alljobs.json')
    with open(p, 'w') as fh:
        json.dump(out, fh, ensure_ascii=False, separators=(',', ':')); fh.write('\n')
    print(f'{len(jobs)} jobs written; {dup} already on our lists, {out_of_state} outside Rhode Island left out')


if __name__ == '__main__':
    main()

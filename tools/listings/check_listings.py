#!/usr/bin/env python3
"""Daily dead-listing check for the snapshot job tabs.

Removes a listing only when there is clear evidence it is gone:
  - its application deadline has passed, or
  - the job board itself says the posting no longer exists
    (Greenhouse / Lever / Workday return 404; Ashby / Workable no longer list it;
     any other site returns 404 or 410, or redirects to a parent page).
Anything uncertain (403 bot blocks, timeouts, server errors) is kept and counted
as "unverified". Removed listings are archived in data/closed-listings.json so a
removal can be undone. If a check would remove more than a quarter of a file in
one day, nothing is removed from that file (that usually means a site outage).

Usage: python3 -I tools/listings/check_listings.py <repo-root> [--dry-run]
Standard library only. No AI.
"""
import json, os, re, sys, time, threading, datetime as dt
import urllib.request, urllib.error
from urllib.parse import urlparse, parse_qs, quote
from concurrent.futures import ThreadPoolExecutor

UA = {'User-Agent': 'Mozilla/5.0 (compatible; listing-check/1.0; checks whether job postings are still open)',
      'Accept': 'text/html,application/json;q=0.9,*/*;q=0.8'}
MAX_SHARE = 0.25
HOST_GAP = 1.0           # seconds between requests to the same host
TODAY = dt.datetime.now(dt.timezone(dt.timedelta(hours=-5))).date()

# file -> list of (section, how to read a row). Row readers return (url, deadline).
def obj(*url_keys, deadline=None):
    def f(r):
        u = next((r.get(k) for k in url_keys if r.get(k)), None)
        return u, (r.get(deadline) if deadline else None)
    return f
def rows(cols, url_col, deadline_col=None):
    def f(r, cols=cols):
        return r[cols.index(url_col)], (r[cols.index(deadline_col)] if deadline_col else None)
    return f

SPEC = {
    'majors.json':     [('jobs', obj('source_url', deadline='closing_date')),
                        ('pending_listings', obj('source_url'))],
    'seniorjobs.json': [('jobs', obj('apply_url', 'source_url')),
                        ('unverified_leads', obj('source_url'))],
    'techjobs.json':   [('jobs', obj('url'))],
    'aijobs.json':     [('jobs', ('cols', 'url', 'deadline'))],
    'remotejobs.json': [('jobs', ('cols', 'url', 'close'))],
    'gigs.json':       [('jobs', obj('application_url', 'source_url', deadline='deadline')),
                        ('leads', obj('source_url'))],
}

_locks, _last = {}, {}
_glock = threading.Lock()
def fetch(url, method='GET'):
    host = urlparse(url).netloc
    with _glock:
        lk = _locks.setdefault(host, threading.Lock())
    with lk:
        wait = _last.get(host, 0) + HOST_GAP - time.time()
        if wait > 0: time.sleep(wait)
        try:
            for attempt in range(2):
                try:
                    r = urllib.request.urlopen(urllib.request.Request(url, headers=UA, method=method), timeout=25)
                    return r.status, r.url, r.read(4_000_000)
                except urllib.error.HTTPError as e:
                    if e.code == 429 and attempt == 0:
                        time.sleep(20); continue
                    return e.code, url, b''
        except Exception:
            return None, url, b''
        finally:
            _last[host] = time.time()

_boards = {}
def board(key, url, extract):
    """Fetch a whole job board once; return set of open IDs, or None if unreadable."""
    if key not in _boards:
        st, _, body = fetch(url)
        ids = None
        if st == 200:
            try:
                ids = extract(json.loads(body))
            except Exception:
                ids = None
        _boards[key] = ids if ids else None
    return _boards[key]

def parse_deadline(v):
    if not v or not isinstance(v, str): return None
    m = re.match(r'(\d{4})-(\d{2})-(\d{2})', v)
    if not m: return None
    try: return dt.date(int(m[1]), int(m[2]), int(m[3]))
    except ValueError: return None

def check(url):
    """Return 'open', 'closed' or 'unverified', plus a short reason."""
    p = urlparse(url); host = p.netloc.lower(); q = parse_qs(p.query); path = p.path
    try:
        # Greenhouse (its own boards and employer sites using ?gh_jid=)
        gid = (q.get('gh_jid') or [None])[0]
        if not gid and 'greenhouse.io' in host:
            m = re.search(r'/jobs/(\d+)', path); gid = m and m[1]
        if gid and gid.isdigit():
            st, _, _ = fetch('https://boards.greenhouse.io/embed/job_app?token=' + gid)
            return ('closed', 'Greenhouse: posting removed') if st == 404 else \
                   ('open', 'Greenhouse') if st == 200 else ('unverified', f'Greenhouse {st}')
        if host == 'jobs.lever.co':
            parts = path.strip('/').split('/')
            if len(parts) >= 2:
                st, _, _ = fetch(f'https://api.lever.co/v0/postings/{parts[0]}/{parts[1]}')
                return ('closed', 'Lever: posting removed') if st == 404 else \
                       ('open', 'Lever') if st == 200 else ('unverified', f'Lever {st}')
        if host == 'jobs.ashbyhq.com':
            parts = path.strip('/').split('/')
            if len(parts) >= 2:
                ids = board('ashby:' + parts[0], f'https://api.ashbyhq.com/posting-api/job-board/{parts[0]}',
                            lambda d: {j['id'] for j in d.get('jobs', [])})
                if ids is None: return 'unverified', 'Ashby board unreadable'
                return ('open', 'Ashby') if parts[1] in ids else ('closed', 'Ashby: no longer on the board')
        if host == 'apply.workable.com':
            m = re.match(r'/([^/]+)/j/([A-Za-z0-9]+)', path)
            if m:
                ids = board('workable:' + m[1], f'https://apply.workable.com/api/v1/widget/accounts/{m[1]}',
                            lambda d: {j.get('shortcode') for j in d.get('jobs', [])})
                if ids is None: return 'unverified', 'Workable board unreadable'
                return ('open', 'Workable') if m[2] in ids else ('closed', 'Workable: no longer on the board')
        if host.endswith('.myworkdayjobs.com'):
            m = re.match(r'(?:/[a-z]{2}-[A-Z]{2})?/([^/]+)/(job/.+)', path)
            if m:
                tenant = host.split('.')[0]
                st, _, _ = fetch(f'https://{host}/wday/cxs/{tenant}/{m[1]}/{m[2]}')
                return ('closed', 'Workday: posting removed') if st == 404 else \
                       ('open', 'Workday') if st == 200 else ('unverified', f'Workday {st}')
        # Any other site
        st, final, _ = fetch(url)
        if st in (404, 410): return 'closed', f'page returns {st}'
        if st == 200:
            fp = urlparse(final)
            a, b = path.rstrip('/'), fp.path.rstrip('/')
            if fp.netloc.lower() == host and len(b) < len(a) and a.startswith(b + '/') and not fp.query:
                return 'closed', 'redirects to the listings page'
            return 'open', 'page loads'
        return 'unverified', f'HTTP {st}' if st else 'no response'
    except Exception as e:
        return 'unverified', 'check failed: ' + type(e).__name__

def main():
    root = sys.argv[1] if len(sys.argv) > 1 else '.'
    dry = '--dry-run' in sys.argv
    data_dir = os.path.join(root, 'data')
    files = {f: json.load(open(os.path.join(data_dir, f))) for f in SPEC if os.path.exists(os.path.join(data_dir, f))}
    work = []   # (file, section, index, url, deadline)
    for f, d in files.items():
        for sec, how in SPEC[f]:
            items = d.get(sec) or []
            reader = rows(d['cols'], how[1], how[2]) if isinstance(how, tuple) else how
            for i, r in enumerate(items):
                u, dl = reader(r)
                work.append((f, sec, i, u, dl))
    urls = sorted({w[3] for w in work if w[3] and w[3].startswith('http')})
    print(f'Checking {len(urls)} listing links across {len(files)} files')
    with ThreadPoolExecutor(12) as ex:
        res = dict(zip(urls, ex.map(check, urls)))

    archive_path = os.path.join(data_dir, 'closed-listings.json')
    archive = json.load(open(archive_path)) if os.path.exists(archive_path) else {'note': '', 'removed': []}
    archive['note'] = 'Listings removed by the daily check, kept 60 days so a removal can be undone.'
    summary, changed = [], False
    for f, d in files.items():
        drop = {}   # (sec, idx) -> reason, from the link check (subject to the safety hold)
        ddrop = {}  # (sec, idx) -> reason, past deadline (always removed: no site outage can cause this)
        total = unver = 0
        for (wf, sec, i, u, dl) in work:
            if wf != f: continue
            total += 1
            day = parse_deadline(dl)
            if day and day < TODAY:
                ddrop[(sec, i)] = f'deadline {day.isoformat()} passed'; continue
            st, why = res.get(u, ('unverified', 'no link'))
            if st == 'closed': drop[(sec, i)] = why
            elif st == 'unverified': unver += 1
        held = bool(drop) and len(drop) > MAX_SHARE * total
        line = f'{f}: {total} checked, {len(drop)} closed, {len(ddrop)} past deadline, {unver} unverified'
        if held:
            line += ' -> NOT removed (too many at once; probably a site problem)'
        summary.append(line); print(line)
        for (sec, i), why in sorted(drop.items()):
            print(f'   {"(held) " if held else ""}{sec}[{i}] {why}')
        for (sec, i), why in sorted(ddrop.items()):
            print(f'   {sec}[{i}] {why}')
        if held: drop = {}
        drop.update(ddrop)
        d['listing_check'] = {'date': TODAY.isoformat(), 'removed': len(drop),
                              'unverified': unver, 'held': held}
        if drop:
            for sec in {s for s, _ in drop}:
                keep, gone = [], []
                for i, r in enumerate(d[sec]):
                    (gone if (sec, i) in drop else keep).append(r)
                    if (sec, i) in drop:
                        archive['removed'].append({'date': TODAY.isoformat(), 'file': f, 'section': sec,
                                                   'reason': drop[(sec, i)], 'item': r})
                d[sec] = keep
        changed = True
    cutoff = (TODAY - dt.timedelta(days=60)).isoformat()
    archive['removed'] = [a for a in archive['removed'] if a['date'] >= cutoff]
    if dry:
        print('Dry run: nothing written'); return
    if changed:
        for f, d in files.items():
            with open(os.path.join(data_dir, f), 'w') as fh:
                json.dump(d, fh, ensure_ascii=False, separators=(',', ':') if 'cols' in d else (',', ': '),
                          indent=None if 'cols' in d else 1)
                fh.write('\n')
        with open(archive_path, 'w') as fh:
            json.dump(archive, fh, ensure_ascii=False, indent=1); fh.write('\n')

if __name__ == '__main__':
    main()

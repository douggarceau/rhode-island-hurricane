#!/usr/bin/env python3
"""Rhode Island shows from the Ticketmaster Discovery API -> data/tm.json.

The calendar page merges data/tm.json into the event calendar in the reader's browser
(index.html applyCalendarFeed), so the daily news update that rewrites data/cal.json can
never wipe these shows. The calendar's "On sale soon" box reads the `onsale` list.

- Needs the TICKETMASTER_KEY secret. Without it the script does nothing (exit 0).
- Cancelled and postponed-without-a-date shows are left out; rescheduled shows use the new date.
- A show already in data/cal.json from the organizer (same day, same venue, similar name) is
  skipped so it isn't listed twice.
- If Ticketmaster can't be reached, the previous data/tm.json stays as it is.
Terms: every listing links to Ticketmaster's own event page and credits Ticketmaster.

Usage: TICKETMASTER_KEY=... python3 -I tools/events/ticketmaster.py [repo_dir]
"""
import datetime as dt, json, os, re, sys, time, urllib.error, urllib.parse, urllib.request
from zoneinfo import ZoneInfo

NY = ZoneInfo('America/New_York')
API = 'https://app.ticketmaster.com/discovery/v2/events.json'
UA = 'RhodeIslandHurricane/1.0 (event calendar; rhodeislandhurricane.com)'
DAYS_AHEAD = 365

SEGMENT = {'Sports': 'sports', 'Film': 'film'}
GENRE = [  # (Ticketmaster genre/subgenre words, calendar genre)
    (r'comedy', 'comedy'), (r'classical|opera|symphon', 'classical'), (r'jazz|blues', 'jazz'),
    (r'hip-hop|rap', 'hip-hop'), (r'r&b|soul', 'r&b'), (r'country', 'country'), (r'folk', 'folk'),
    (r'metal', 'metal'), (r'punk', 'punk'), (r'latin', 'latin'), (r'electronic|dance/electronic|edm', 'electronic'),
    (r'\bpop\b', 'pop'), (r'rock|alternative', 'rock'), (r'world|reggae', 'world'), (r'dance|ballet', 'dance'),
    (r'theatre|theater|musical|broadway|play', 'theater'), (r'children|family|circus|magic|ice show', 'family'),
]


def get(params):
    url = API + '?' + urllib.parse.urlencode(params)
    for a in range(4):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': UA, 'Accept': 'application/json'}), timeout=40) as r:
                return json.load(r)
        except urllib.error.HTTPError as e:
            if e.code == 429: time.sleep(5 + 5 * a); continue
            if e.code in (401, 403): raise SystemExit(f'Ticketmaster refused the key ({e.code}); nothing changed.')
            if a == 3: raise
            time.sleep(3)
        except Exception:
            if a == 3: raise
            time.sleep(3)


def genre_of(ev):
    c = (ev.get('classifications') or [{}])[0]
    seg = (c.get('segment') or {}).get('name', '')
    words = ' '.join((c.get(k) or {}).get('name', '') for k in ('genre', 'subGenre', 'type', 'subType')).lower()
    if seg in SEGMENT: return SEGMENT[seg]
    for pat, g in GENRE:
        if re.search(pat, words): return g
    return {'Music': 'live', 'Arts & Theatre': 'theater'}.get(seg, 'other')


def price_of(ev):
    pr = [p for p in ev.get('priceRanges') or [] if p.get('min') is not None]
    if not pr: return ''
    lo, hi = min(p['min'] for p in pr), max(p.get('max') or p['min'] for p in pr)
    f = lambda v: '$' + (f'{v:,.0f}' if v == int(v) else f'{v:,.2f}')
    return f(lo) if hi == lo else f'{f(lo)}–{f(hi)}'


def norm(s): return re.sub(r'[^a-z0-9]', '', (s or '').lower().replace('the ', ''))
def toks(s): return {w for w in re.findall(r'[a-z0-9]+', (s or '').lower()) if len(w) > 2 and w not in {'the', 'and', 'with', 'tour', 'live', 'presents', 'tickets'}}


def main():
    key = os.environ.get('TICKETMASTER_KEY', '').strip()
    repo = sys.argv[1] if len(sys.argv) > 1 else '.'
    if not key:
        print('No TICKETMASTER_KEY secret yet: skipping (nothing changed).'); return
    out_path = os.path.join(repo, 'data', 'tm.json')
    now = dt.datetime.now(dt.timezone.utc)
    start = now.strftime('%Y-%m-%dT%H:%M:%SZ'); end = (now + dt.timedelta(days=DAYS_AHEAD)).strftime('%Y-%m-%dT%H:%M:%SZ')
    raw, page = [], 0
    while True:   # the API pages at most 1,000 results deep (size * page < 1000)
        d = get({'apikey': key, 'stateCode': 'RI', 'countryCode': 'US', 'size': 199, 'page': page,
                 'sort': 'date,asc', 'startDateTime': start, 'endDateTime': end, 'locale': '*'})
        raw += (d.get('_embedded') or {}).get('events', [])
        pg = d.get('page') or {}
        page += 1
        if page >= pg.get('totalPages', 0) or (page + 1) * 199 >= 1000: break
        time.sleep(0.4)
    print(f'Ticketmaster returned {len(raw)} Rhode Island events')

    cal = json.load(open(os.path.join(repo, 'data', 'cal.json'))).get('events', [])
    by_day = {}
    for e in cal:
        if e.get('src') != 'Ticketmaster': by_day.setdefault(e.get('date'), []).append(e)

    events, onsale, seen, dup, dropped = [], [], set(), 0, 0
    today = now.astimezone(NY).date().isoformat()
    for ev in raw:
        st = ((ev.get('dates') or {}).get('status') or {}).get('code', '')
        s = (ev.get('dates') or {}).get('start') or {}
        day = s.get('localDate', '')
        if st in ('cancelled', 'postponed') or not day or s.get('dateTBD') or s.get('dateTBA'):
            dropped += 1; continue
        v = ((ev.get('_embedded') or {}).get('venues') or [{}])[0]
        if (v.get('state') or {}).get('stateCode') not in (None, 'RI'): continue
        venue, town = v.get('name', ''), (v.get('city') or {}).get('name', '')
        name = re.sub(r'\s+', ' ', ev.get('name', '')).strip()
        url = ev.get('url', '')
        if not url.startswith('https://') or not name: continue
        k = (day, norm(venue)[:12], norm(name)[:20])
        if k in seen: continue   # same show listed twice (e.g. VIP package listings)
        seen.add(k)
        # Organizer already lists it: same day, same venue, overlapping title words -> skip
        if any((norm(venue)[:8] and norm(venue)[:8] in norm(o.get('venue'))) and len(toks(name) & toks(o.get('artists'))) >= 1
               for o in by_day.get(day, [])):
            dup += 1; continue
        t = s.get('localTime', '')[:5]
        addr = v.get('address') or {}
        events.append({
            'date': day, 'time': t, 'artists': name, 'venue': venue, 'hood': town, 'genre': genre_of(ev),
            'price': price_of(ev), 'ages': '', 'url': url, 'src': 'Ticketmaster',
            'address': ', '.join(x for x in [addr.get('line1', ''), town, 'RI'] if x),
            'blurb': ('Rescheduled. ' if st == 'rescheduled' else '') + 'Tickets on Ticketmaster.',
            'external_identity': 'ticketmaster:' + ev.get('id', '')})
        # On sale soon: public sale or a presale starting in the next 21 days
        sales = ev.get('sales') or {}
        starts = [(sales.get('public') or {}).get('startDateTime', '')] + [p.get('startDateTime', '') for p in sales.get('presales') or []]
        soon = sorted(x for x in starts if x and now.isoformat()[:19] < x[:19] <= (now + dt.timedelta(days=21)).isoformat()[:19])
        if soon:
            pub = (sales.get('public') or {}).get('startDateTime', '')
            onsale.append({'name': name, 'venue': venue, 'town': town, 'date': day, 'url': url,
                           'sale': soon[0], 'kind': 'public' if soon[0] == pub else 'presale'})
    onsale.sort(key=lambda x: x['sale'])
    data = {'asof': now.isoformat(timespec='minutes'), 'source': 'Ticketmaster Discovery API',
            'note': 'Rhode Island shows sold through Ticketmaster. Tickets link to Ticketmaster.',
            'events': [e for e in events if e['date'] >= today], 'onsale': onsale[:40]}
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    with open(out_path, 'w') as fh:
        json.dump(data, fh, ensure_ascii=False, indent=1); fh.write('\n')
    print(f"{len(data['events'])} shows written, {dup} already on the calendar, {dropped} cancelled/postponed left out, {len(onsale)} going on sale soon")


if __name__ == '__main__':
    main()

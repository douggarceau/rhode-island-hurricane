"""Put the payroll layer (workforce, overtime, insights, per-agency rosters, top lists) into the PUBLIC site data.
Everything here comes from the public RI Transparency Portal payroll export.
usage: python3 -I publish_payroll.py <payroll_out_dir from build_payroll.py> <repo_dir>"""
import json, os, sys, shutil
PD, REPO = sys.argv[1], sys.argv[2]
L = lambda f: json.load(open(os.path.join(PD, f), encoding='utf-8'))
P, OT = L('index.json'), L('overtime.json')
INS = L('insights.json') if os.path.exists(os.path.join(PD, 'insights.json')) else None
out = os.path.join(REPO, 'data', 'premium')
if os.path.isdir(os.path.join(out, 'payroll')): shutil.rmtree(os.path.join(out, 'payroll'))
os.makedirs(os.path.join(out, 'payroll'), exist_ok=True)
for f in os.listdir(PD):
    if f.endswith('.json') and f not in ('index.json', 'overtime.json', 'signals.json', 'insights.json'):
        shutil.copy(os.path.join(PD, f), os.path.join(out, 'payroll', f))
lists = {'top_rate': P.pop('top_rate', []), 'top_ot': P.pop('top_ot', []), 'top_total': P.pop('top_total', []),
         'over_base': OT.get('over_base', []), 'ot_top': OT.get('top', []), 'repeat_top100': OT.get('repeat_top100', []), 'repeat_years': OT.get('repeat_years', [])}
json.dump(lists, open(os.path.join(out, 'lists.json'), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
for d in P['depts']: d.pop('top', None)
OT['over_base_count'] = len(OT.pop('over_base', [])); OT['top_count'] = len(OT.pop('top', [])); OT['repeat_count'] = len(OT.pop('repeat_top100', []))
gp = os.path.join(REPO, 'data', 'gov.json')
g = json.load(open(gp, encoding='utf-8'))
old = g.get('payroll') or {}
for k in ('note', 'source', 'source_url'):
    if old.get(k) and not P.get(k): P[k] = old[k]
g['payroll'] = P; g['overtime'] = OT; g['insights'] = INS
json.dump(g, open(gp, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
print('rosters', len(os.listdir(os.path.join(out, 'payroll'))), 'lists', {k: len(v) for k, v in lists.items()}, 'gov.json', os.path.getsize(gp))

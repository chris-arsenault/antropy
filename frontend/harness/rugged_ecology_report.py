"""Reduce native ecology records without assigning roles or attributing shared-field provenance.

python harness/rugged_ecology_report.py ARTIFACT_ROOT
Generated reports remain in the ignored artifact root. Partial runs are labeled incomplete.
"""
import json
import math
import sys
from collections import Counter, defaultdict
from pathlib import Path


def rows(path):
    with path.open() as stream:
        for line in stream:
            if line.endswith('\n'):
                yield json.loads(line)
            else:
                break


def cosine(a, b):
    norm = math.sqrt(sum(q*q for q in a.values()) * sum(q*q for q in b.values()))
    return sum(q*b.get(s, 0) for s, q in a.items()) / norm if norm else None


def top(values, count=8):
    return sorted(values.items(), key=lambda row: row[1], reverse=True)[:count]


def distance(a, b, width=720, height=540):
    dx, dy = abs(a['x']-b['x']), abs(a['y']-b['y'])
    return math.hypot(min(dx, width-dx), min(dy, height-dy))


def report_arm(directory, until=float('inf')):
    totals = defaultdict(Counter)
    diets = defaultdict(Counter)
    windows = defaultdict(lambda: defaultdict(lambda: defaultdict(Counter)))
    life, genomes = [], {}
    for fact in rows(directory/'facts.jsonl'):
        end = next((f['end_tick'] for f in fact['flows']),
                   next((e['end_tick'] for e in fact['exposure']), 0))
        if end > until:
            break
        life.extend(fact['life'])
        for g in fact['genomes']:
            genomes[g['id']] = dict(id=g['id'], parent=g['parent'], born=g['born'],
                                    chemistry=g['chromosomes'][0]['chemistry'])
        for f in fact['flows']:
            totals[f['cell']][f['channel']] += f['amount']
            if f['species'] is not None:
                windows[f['end_tick']][f['cell']][f['channel']][f['species']] += f['amount']
                if f['channel'] == 'reacted':
                    diets[f['cell']][f['species']] += f['amount']
    events = defaultdict(Counter)
    for event in life:
        events[event['cell']][event['kind']] += 1
    series, history, pairs, renewals, previous_sources = [], defaultdict(list), [], 0, {}
    for sample in rows(directory/'samples.jsonl'):
        tick, cells, summary = sample['tick'], sample['cells'], sample['summary']
        if tick > until:
            break
        for source in sample['sources']:
            prior = previous_sources.get(source['site'])
            if prior and source['amount'] > prior['amount'] + 1:
                renewals += 1
            previous_sources[source['site']] = source
        series.append(dict(tick=tick, population=len(cells), generation=summary['generation'],
                           founders=sum(c['parent'] is None for c in cells),
                           divisions=summary['ledger']['divisions'],
                           deaths=summary['ledger']['deaths'], renewalJumps=renewals))
        recent = windows[tick]
        for c in cells:
            history[c['id']].append(dict(tick=tick, **c))
            others = [b for b in cells if b['id'] != c['id']]
            if not others or not recent[c['id']]['reacted']:
                continue
            b = min(others, key=lambda b: distance(c, b))
            if c['id'] > b['id']:
                continue
            shared = cosine(dict(c['local']), dict(b['local']))
            diet = cosine(recent[c['id']]['reacted'], recent[b['id']]['reacted'])
            if shared is None or diet is None:
                continue
            exports, imports = recent[c['id']]['exported'], recent[b['id']]['imported']
            overlap = {s: min(q, imports.get(s, 0)) for s, q in exports.items()}
            pairs.append(dict(tick=tick, cells=[c['id'], b['id']],
                              genomes=[c['genome'], b['genome']], distance=distance(c, b),
                              generations=[c['generation'], b['generation']],
                              inherited=[c['parent'] is not None, b['parent'] is not None],
                              localCosine=shared, recentDietCosine=diet,
                              sourceSites=[c['source'], b['source']],
                              exportsMatchingImports=top(overlap),
                              growth=[totals[c['id']]['grown'], totals[b['id']]['grown']],
                              divisions=[events[c['id']]['division'], events[b['id']]['division']]))
    candidates = []
    for cell, samples in history.items():
        last, first = samples[-1], samples[0]
        parent = last['parent']
        if parent is None or parent not in diets or not diets[cell]:
            continue
        parent_context = history.get(parent, [])
        before = parent_context[-1] if parent_context else None
        g = genomes.get(last['genome'])
        if not g:
            continue
        p = genomes.get(g['parent'])
        change = None
        if p and g['chemistry'].get('keys') and p['chemistry'].get('keys'):
            changes = []
            for family in ['receptors', 'transporters', 'enzymes', 'membrane']:
                ga, pa = g['chemistry']['keys'][family], p['chemistry']['keys'][family]
                if family == 'membrane':
                    ga, pa = [ga], [pa]
                for slot, (a, b) in enumerate(zip(ga, pa)):
                    for locus, (x, y) in enumerate(zip(a['weights']+[a['bias']], b['weights']+[b['bias']])):
                        changes.append(dict(family=family, slot=slot, locus=locus,
                                            before=y, after=x, absolute=abs(x-y)))
            change = max(changes, key=lambda x: x['absolute'])
        candidates.append(dict(cell=cell, parent=parent, genome=last['genome'],
                               parentGenome=g['parent'], born=last['born'],
                               firstSample=first['tick'], lastSample=last['tick'],
                               ended=next((e for e in life if e['cell']==cell and e['kind']!='birth'), None),
                               dietCosineToParent=cosine(diets[cell], diets[parent]),
                               parentLocalCosine=cosine(dict(first['local']), dict(before['local'])) if before else None,
                               source=last['source'], diet=top(diets[cell]), parentDiet=top(diets[parent]),
                               flows=dict(totals[cell]), keyChange=change,
                               divisions=events[cell]['division']))
    candidates.sort(key=lambda c: (c['divisions'] > 0, -(c['dietCosineToParent'] or 0),
                                    c['lastSample']-c['firstSample']), reverse=True)
    pairs.sort(key=lambda p: p['localCosine']-p['recentDietCosine'], reverse=True)
    inherited_pairs = [p for p in pairs if all(p['inherited']) and p['tick'] >= 9000]
    result_path = directory/'result.json'
    endpoint = json.loads(result_path.read_text()) if result_path.exists() else {'stop': 'running'}
    return dict(endpoint={k: v for k, v in endpoint.items() if k != 'trace'}, series=series,
                lifeCounts=dict(Counter(e['kind'] for e in life)), genomesRecorded=len(genomes),
                inheritedCandidates=candidates[:40], sharedSurroundingsPairs=pairs[:40],
                inheritedPairsAfterRenewal=inherited_pairs[:40],
                limitations=['Window transfers include ended cells; spatial neighbors are sampled every200 ticks.',
                             'Export/import overlap is an opportunity, not proof of donor provenance or recipient benefit.',
                             'Lifetime parent/descendant diets suggest cases; environment and age can also explain differences.',
                             'Renewal jumps count sampled stock increases, not an exact event count.'])


def context(root, focal):
    result = {}
    for arm in ['baseline', 'restored']:
        directory = root/arm
        facts = list(rows(directory/'facts.jsonl'))
        life = [e for f in facts for e in f['life']]
        group = {focal}
        for e in sorted(life, key=lambda e: e['tick']):
            if e['parent'] in group:
                group.add(e['cell'])
        totals, reactions = Counter(), Counter()
        for f in facts:
            for q in f['flows']:
                if q['cell'] in group:
                    totals[q['channel']] += q['amount']
                    if q['channel'] == 'reacted':
                        reactions[q['species']] += q['amount']
        samples = list(rows(directory/'samples.jsonl'))
        result[arm] = dict(group=sorted(group),
                           life=[e for e in life if e['cell'] in group], flows=dict(totals),
                           neighborLife=[e for e in life if e['cell']==11],
                           reactions=top(reactions),
                           trajectory=[dict(tick=s['tick'],
                                            living=sum(c['id'] in group for c in s['cells']),
                                            biomass=sum(c['mass'] for c in s['cells'] if c['id'] in group),
                                            focal=next((c for c in s['cells'] if c['id']==focal), None),
                                            neighbor11=next((c for c in s['cells'] if c['id']==11), None))
                                       for s in samples])
    (root/'context-report.json').write_text(json.dumps(result))
    print(json.dumps({a: {k: r[k] for k in ['group', 'life']} for a, r in result.items()}))


def main(root, until=float('inf')):
    root = Path(root)
    arms = [arm for arm in ['keyed', 'radial'] if (root/arm).exists()]
    result = {arm: report_arm(root/arm, until) for arm in arms}
    name = 'ecology-report.json' if math.isinf(until) else f'ecology-report-t{int(until)}.json'
    (root/name).write_text(json.dumps(result))
    for arm, report in result.items():
        print(json.dumps(dict(arm=arm, endpoint=report['series'][-1],
                              life=report['lifeCounts'],
                              candidates=[dict(cell=c['cell'], parent=c['parent'],
                                               born=c['born'], dietCosineToParent=c['dietCosineToParent'],
                                               divisions=c['divisions'], keyChange=c['keyChange'])
                                          for c in report['inheritedCandidates'][:3]],
                              inheritedPairs=report['inheritedPairsAfterRenewal'][:3])))


if __name__ == '__main__':
    if len(sys.argv)>2 and sys.argv[2]=='context':
        context(Path(sys.argv[1]), int(sys.argv[3]))
    else:
        main(sys.argv[1], int(sys.argv[2]) if len(sys.argv)>2 else float('inf'))

"""Local figures of birth-local function and neighbor consequences; no hosted rendering.

python harness/plot_rugged_ecology.py CONTEXT551_ROOT CONTEXT63_ROOT OUTPUT_PNG
"""
import json
import sys
from pathlib import Path
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt


def plot(birth_root, neighbor_root, output):
    birth = json.loads((Path(birth_root)/'context-report.json').read_text())
    neighborhood = json.loads((Path(neighbor_root)/'context-report.json').read_text())
    fig, axes = plt.subplots(2, 2, figsize=(12, 8), constrained_layout=True)
    colors = {'baseline': '#c45a28', 'restored': '#24788d'}
    labels = {'baseline': 'Inherited recognition change', 'restored': 'One gene restored to parent'}
    for arm in colors:
        b, n = birth[arm], neighborhood[arm]
        bt = [(s['tick']-12000)*0.2 for s in b['trajectory']]
        axes[0, 0].plot(bt, [s['biomass'] for s in b['trajectory']],
                        color=colors[arm], label=labels[arm], linewidth=2)
        events = [(0, 1)]
        living = 1
        for tick in sorted({e['tick'] for e in b['life']}):
            for e in b['life']:
                if e['tick']==tick:
                    living += 1 if e['kind']=='birth' else -1
            events.append(((tick-12000)*0.2, living))
        events.append((bt[-1], living))
        axes[0, 1].step([t for t, _ in events], [n for _, n in events],
                        color=colors[arm], where='post', linewidth=2)
        path = [s['neighbor11'] for s in n['trajectory'] if s['neighbor11']]
        times = [(s['tick']-4000)*0.2 for s in n['trajectory'] if s['neighbor11']]
        died = next((e for e in n['neighborLife'] if e['kind']=='starvation'), None)
        if died:
            path.append(dict(x=died['x'],y=died['y'],energy=0))
            times.append((died['tick']-4000)*0.2)
        axes[1, 0].plot([c['x'] for c in path], [c['y'] for c in path],
                        color=colors[arm], linewidth=2)
        axes[1, 0].scatter(path[-1]['x'], path[-1]['y'], color=colors[arm],
                           marker='x' if arm=='baseline' else 'o', s=75)
        axes[1, 1].plot(times, [c['energy'] for c in path], color=colors[arm], linewidth=2)
    axes[0, 0].set(title='Actual newborn551: changed chemical use funds division',
                   xlabel='Model seconds after birth', ylabel='Living clade biomass')
    axes[0, 0].legend(frameon=False, fontsize=9)
    axes[0, 1].set(title='Reproduction occurs; descendants subsequently die',
                   xlabel='Model seconds after birth', ylabel='Living cells in focal clade', yticks=[0, 1, 2])
    axes[1, 0].set(title='Neighbor11: changing another cell\'s gene changes its path',
                   xlabel='World X', ylabel='World Y')
    axes[1, 0].set_aspect('equal', adjustable='box')
    axes[1, 1].set(title='Neighbor starves only beside the changed recognizer',
                   xlabel='Model seconds after checkpoint', ylabel='Neighbor usable energy')
    for ax in axes.flat:
        ax.grid(alpha=0.18)
        ax.spines[['top', 'right']].set_visible(False)
    fig.suptitle('Inherited chemical differences change life histories and neighborhoods', fontsize=15)
    fig.supxlabel('Biomass and paths sampled every40 model seconds; birth/death steps recorded exactly.', fontsize=9)
    fig.savefig(output, dpi=160)
    plt.close(fig)
    print(output)


if __name__ == '__main__':
    plot(*sys.argv[1:])

"""Run explicitly registered live/frozen chemical-source epoch comparisons."""
from batch_support import parser, execute, seeds


def main():
    p = parser(__doc__)
    p.add_argument("--phase-ticks", type=int, required=True)
    args = p.parse_args()
    if args.phase_ticks < 1:
        p.error("Phase duration must be positive")
    jobs = [(f"{'frozen' if frozen else 'live'}-{seed}", "harness/epochRun.ts",
             ["--seed", str(seed), "--frozen", str(frozen).lower(),
              "--phase-ticks", str(args.phase_ticks)])
            for seed in seeds(args) for frozen in (False, True)]
    execute(args, jobs)


if __name__ == "__main__":
    main()

"""Run explicit pre/post checkpoint cohorts in both source mixtures and placements."""
from batch_support import parser, execute, seeds


def main():
    p = parser(__doc__)
    p.add_argument("--pre", required=True, help="Current checkpoint path; optional {seed} substitution")
    p.add_argument("--post", required=True, help="Current checkpoint path; optional {seed} substitution")
    p.add_argument("--ticks", type=int, required=True)
    args = p.parse_args()
    if args.ticks < 1:
        p.error("Positive tick horizon required")
    jobs = [(f"assay-{seed}-{share}-{str(swap).lower()}", "harness/epochAssay.ts",
             ["--seed", str(seed), "--share", str(share), "--swap", str(swap).lower(),
              "--ticks", str(args.ticks), "--pre", args.pre.format(seed=seed),
              "--post", args.post.format(seed=seed)])
            for seed in seeds(args) for share in (0.8, 0.2) for swap in (False, True)]
    execute(args, jobs)


if __name__ == "__main__":
    main()

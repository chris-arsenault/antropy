"""Registered chemical-injury or motor comparisons using explicit current organisms."""
from batch_support import parser, execute, seeds


def main():
    p = parser(__doc__)
    p.add_argument("panel", choices=["injury", "motor"])
    p.add_argument("--checkpoint", required=True)
    p.add_argument("--candidate", type=int, required=True)
    p.add_argument("--ancestor", type=int, default=1)
    p.add_argument("--ticks", type=int, required=True)
    p.add_argument("--lifetime", type=int, default=100)
    p.add_argument("--spacing", type=int, default=2)
    args = p.parse_args()
    if not 1 <= args.ticks <= 50000:
        p.error("Study horizon must be 1..50000")
    jobs = []
    for seed in seeds(args):
        for swap in (False, True):
            # Injury needs both ordinary exposure and its ablation, with matching placement.
            for knockout in (["none", "damage"] if args.panel == "injury" else ["none"]):
                label = f"{args.panel}-{knockout}-{seed}-{str(swap).lower()}"
                flags = ["--run", label, "--mode", "contest" if args.panel == "injury" else "motor",
                         "--checkpoint", args.checkpoint, "--candidate", str(args.candidate),
                         "--ancestor", str(args.ancestor), "--ticks", str(args.ticks),
                         "--seed", str(seed), "--swap", str(swap).lower(), "--knockout", knockout]
                if args.panel == "motor":
                    flags += ["--environment", "scheduled", "--lifetime", str(args.lifetime),
                              "--spacing", str(args.spacing)]
                jobs.append((label, "harness/lib/studyCli.ts", flags))
    execute(args, jobs)


if __name__ == "__main__":
    main()

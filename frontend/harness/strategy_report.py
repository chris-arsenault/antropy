"""Reproducible local SQL attribution for the registered strategy panel."""
import hashlib
import json
import sys
from pathlib import Path
import duckdb
from study_sql import load

QUERIES = {
    "endpoints": """
      WITH last AS (SELECT run, max(tick) tick FROM environment GROUP BY run),
      n AS (SELECT c.run, c.genome, count(*) n FROM census c JOIN last USING(run,tick)
            GROUP BY c.run,c.genome)
      SELECT e.run, e.tick, e.population, g.id genome, coalesce(n.n,0) living,
        100.0*coalesce(n.n,0)/nullif(e.population,0) population_percent
      FROM environment e JOIN last USING(run,tick)
      JOIN genomes g ON g.run=e.run AND g.id IN (1,2)
      LEFT JOIN n ON n.run=e.run AND n.genome=g.id ORDER BY e.run,g.id
    """,
    "budgets": """
      WITH totals AS (SELECT run,genome,
        sum(amount) FILTER (WHERE channel IN ('food_a','food_b')) food,
        sum(amount) FILTER (WHERE channel='toxin') toxin,
        sum(amount) FILTER (WHERE channel='motors') motors,
        sum(amount) FILTER (WHERE channel='maintenance') maintenance,
        sum(amount) FILTER (WHERE channel='repair') repair,
        sum(amount) FILTER (WHERE channel='constructed') built
        FROM flows GROUP BY run,genome)
      SELECT *,100.0*coalesce(toxin,0)/nullif(food,0) toxin_percent_absorbed,
        100.0*coalesce(motors,0)/nullif(4*food,0) motors_percent_absorbed_energy,
        100.0*coalesce(maintenance,0)/nullif(4*food,0) maintenance_percent_absorbed_energy,
        100.0*coalesce(repair,0)/nullif(4*food,0) repair_percent_absorbed_energy,
        100.0*coalesce(built,0)/nullif(food,0) construction_percent_absorbed
      FROM totals ORDER BY run,genome
    """,
    "exposure": """
      SELECT run,genome,sum(seconds) organism_seconds,
        100*sum(slowed_seconds)/nullif(sum(seconds),0) slowed_percent_time,
        100*sum(impaired_seconds)/nullif(sum(seconds),0) impaired_percent_time,
        100*sum(damage_seconds)/nullif(sum(seconds),0) mean_damage_percent,
        100*sum(swim_seconds)/nullif(sum(seconds),0) mean_swim_percent
      FROM exposure GROUP BY run,genome ORDER BY run,genome
    """,
    "developed_bodies": """
      SELECT run,genome,100*avg(motor/core) motor_percent_core,
        avg(speed_ceiling) mean_speed_ceiling
      FROM bodies WHERE tick>=10000 GROUP BY run,genome ORDER BY run,genome
    """,
    "early_bodies": """
      SELECT run,tick,genome,count(*) living,100*avg(motor/core) motor_percent_core,
        avg(speed_ceiling) mean_speed_ceiling
      FROM bodies WHERE tick IN (1000,5000,10000)
      GROUP BY run,tick,genome ORDER BY run,tick,genome
    """,
    "early_budgets": """
      SELECT run,genome,
        100*sum(amount) FILTER (WHERE channel='motors') /
          nullif(4*sum(amount) FILTER (WHERE channel IN ('food_a','food_b')),0)
          motors_percent_absorbed_energy,
        100*sum(amount) FILTER (WHERE channel='maintenance') /
          nullif(4*sum(amount) FILTER (WHERE channel IN ('food_a','food_b')),0)
          maintenance_percent_absorbed_energy
      FROM flows WHERE end_tick<=5000 GROUP BY run,genome ORDER BY run,genome
    """,
    "trajectories": """
      SELECT run,tick,genome,count(*) living,
        100.0*count(*)/sum(count(*)) OVER (PARTITION BY run,tick) population_percent
      FROM census WHERE tick%1000=0 GROUP BY run,tick,genome ORDER BY run,tick,genome
    """,
    "residuals": """
      SELECT run,max(abs(energy_residual)) max_energy_residual,
        max(abs(material_residual)) max_material_residual,
        100*avg(half_speed_area*1.0/grid_cells) mean_half_speed_world_percent
      FROM environment GROUP BY run ORDER BY run
    """,
}


def report(root):
    root = Path(root)
    database = root / "study.duckdb"
    with duckdb.connect(str(database)) as db:
        db.execute("CREATE TABLE IF NOT EXISTS runs(run VARCHAR PRIMARY KEY, manifest JSON)")
        loaded = {row[0] for row in db.execute("SELECT run FROM runs").fetchall()}
    for manifest in sorted(root.glob("*/manifest.json")):
        data = json.loads(manifest.read_text())
        if data["status"] == "complete" and data["run"] not in loaded:
            load(manifest.parent, str(database))
    with duckdb.connect(str(database), read_only=True) as db:
        results = {}
        for name, sql in QUERIES.items():
            cursor = db.execute(sql)
            names = [column[0] for column in cursor.description]
            results[name] = [dict(zip(names, row)) for row in cursor.fetchall()]
    payload = {"queries": QUERIES, "results": results,
               "analysis_sha256": hashlib.sha256(Path(__file__).read_bytes()).hexdigest()}
    (root / "report.json").write_text(json.dumps(payload, indent=2))
    print(json.dumps(results["endpoints"], indent=2))


if __name__ == "__main__":
    report(sys.argv[1])

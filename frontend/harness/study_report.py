"""Generate percentage-based evidence from completed DuckDB study runs.

python harness/study_report.py DATABASE OUTPUT_JSON
Queries are deliberately explicit and remain independent of simulation decisions.
"""
import hashlib
import json
import sys
from pathlib import Path
import duckdb


QUERIES = {
    "endpoints": """
        with endpoints as (select run, max(tick) tick from census group by run),
        counts as (select c.run, c.lineage, count(*) n from census c join endpoints e
          on c.run=e.run and c.tick=e.tick group by c.run, c.lineage)
        select run, sum(n) population, max(n)*100.0/sum(n) leading_family_percent,
          sum(case when lineage=18 then n else 0 end)*100.0/sum(n) lineage18_percent,
          count(*) families from counts group by run order by run
    """,
    "contest_endpoints": """
        with endpoints as (select run, max(tick) tick from census group by run)
        select c.run, c.genome, count(*) population,
          count(*)*100.0/sum(count(*)) over(partition by c.run) population_percent
        from census c join endpoints e on c.run=e.run and c.tick=e.tick
        where c.run like 'contest-%' or c.run like 'causal-%'
        group by c.run, c.genome order by c.run, c.genome
    """,
    "exposure": """
        select run, case when lineage=18 then '18' else 'others' end family_group,
          sum(seconds) organism_seconds,
          100*sum(slowed_seconds)/sum(seconds) slowed_organism_time_percent,
          100*sum(impaired_seconds)/sum(seconds) impaired_organism_time_percent,
          100*sum(damage_seconds)/sum(seconds) mean_damage_percent,
          100*sum(swim_seconds)/sum(seconds) mean_resolved_swim_percent,
          100*sum(turn_seconds)/sum(seconds) mean_resolved_turn_percent
        from exposure group by run, family_group order by run, family_group
    """,
    "area": """
        select run, avg(100.0*half_speed_area/grid_cells) mean_half_speed_world_percent,
          max(100.0*half_speed_area/grid_cells) peak_half_speed_world_percent,
          max(abs(energy_residual)) max_energy_residual,
          max(abs(material_residual)) max_material_residual
        from environment group by run order by run
    """,
    "family_budgets": """
        with totals as (
          select run, case when lineage=18 then '18' else 'others' end family_group,
            sum(amount) filter(where channel in ('food_a','food_b')) absorbed,
            sum(amount) filter(where channel='toxin') toxin,
            sum(amount) filter(where channel='matrix') matrix,
            sum(amount) filter(where channel='repair') repair,
            sum(amount) filter(where channel='synthesis') synthesis,
            sum(amount) filter(where channel='motors') motors,
            sum(amount) filter(where channel='constructed') constructed,
            sum(amount) filter(where channel in ('maintenance','learning','motors',
              'synthesis','construction','catabolic_loss','division','repair')) dissipated
          from flows group by run, family_group)
        select run, family_group, 100*toxin/absorbed toxin_per_absorbed_percent,
          100*matrix/absorbed matrix_per_absorbed_percent,
          100*constructed/absorbed construction_per_absorbed_percent,
          100*repair/dissipated repair_energy_percent,
          100*synthesis/dissipated synthesis_energy_percent,
          100*motors/dissipated motor_energy_percent
        from totals order by run, family_group
    """,
    "recent_family_budgets": """
        with ends as (select run, max(end_tick) tick from flows group by run),
        totals as (
          select f.run, case when lineage=18 then '18' else 'others' end family_group,
            sum(amount) filter(where channel in ('food_a','food_b')) absorbed,
            sum(amount) filter(where channel='toxin') toxin,
            sum(amount) filter(where channel='matrix') matrix,
            sum(amount) filter(where channel='repair') repair,
            sum(amount) filter(where channel='constructed') constructed,
            sum(amount) filter(where channel in ('maintenance','learning','motors',
              'synthesis','construction','catabolic_loss','division','repair')) dissipated
          from flows f join ends e on f.run=e.run where f.start_tick>=e.tick-5000
          group by f.run, family_group)
        select run, family_group, 100*toxin/absorbed toxin_per_absorbed_percent,
          100*matrix/absorbed matrix_per_absorbed_percent,
          100*constructed/absorbed construction_per_absorbed_percent,
          100*repair/dissipated repair_energy_percent
        from totals order by run, family_group
    """,
    "contest_budgets": """
        with totals as (
          select run, genome,
            sum(amount) filter(where channel in ('food_a','food_b')) absorbed,
            sum(amount) filter(where channel='toxin') toxin,
            sum(amount) filter(where channel='matrix') matrix,
            sum(amount) filter(where channel='repair') repair,
            sum(amount) filter(where channel='constructed') constructed,
            sum(amount) filter(where channel in ('maintenance','learning','motors',
              'synthesis','construction','catabolic_loss','division','repair')) dissipated
          from flows where run like 'contest-%' or run like 'causal-%'
          group by run, genome)
        select run, genome, 100*toxin/absorbed toxin_per_absorbed_percent,
          100*matrix/absorbed matrix_per_absorbed_percent,
          100*constructed/absorbed construction_per_absorbed_percent,
          100*repair/dissipated repair_energy_percent
        from totals order by run, genome
    """,
    "family_rates": """
        with times as (
          select run, case when lineage=18 then '18' else 'others' end family_group,
            sum(seconds) as organism_seconds from exposure group by run, family_group),
        counts as (
          select run, case when lineage=18 then '18' else 'others' end family_group,
            count(*) filter(where kind='division') divisions,
            count(*) filter(where kind in ('starvation','damage')) deaths
          from life group by run, family_group)
        select t.run, t.family_group, 1000*c.divisions/t.organism_seconds divisions_per_1000_cell_seconds,
          1000*c.deaths/t.organism_seconds deaths_per_1000_cell_seconds
        from times t left join counts c using(run, family_group) order by t.run, t.family_group
    """,
}


def report(database, output):
    result = {"query_source_sha256": hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
              "database": str(database), "queries": QUERIES}
    with duckdb.connect(database, read_only=True) as db:
        for name, query in QUERIES.items():
            cursor = db.execute(query)
            columns = [item[0] for item in cursor.description]
            result[name] = [dict(zip(columns, row)) for row in cursor.fetchall()]
    Path(output).write_text(json.dumps(result, indent=2))
    print(json.dumps({"report": output, "runs": len(result["endpoints"])}))


if __name__ == "__main__":
    report(*sys.argv[1:])

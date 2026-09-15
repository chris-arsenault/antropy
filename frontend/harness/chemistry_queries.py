"""Schema-v2/v3 study queries; no chemical potential is assumed constant."""
QUERIES = {
    "endpoints": """
      WITH last AS (SELECT run,max(tick) tick FROM environment GROUP BY run),
      groups AS (SELECT DISTINCT run,lineage,genome FROM census),
      living AS (SELECT c.run,c.lineage,c.genome,count(*) n FROM census c
        JOIN last USING(run,tick) GROUP BY c.run,c.lineage,c.genome)
      SELECT g.run,e.tick,g.lineage,g.genome,coalesce(l.n,0) living,e.population,
        100.0*coalesce(l.n,0)/nullif(e.population,0) population_percent
      FROM groups g JOIN last USING(run) JOIN environment e USING(run,tick)
      LEFT JOIN living l USING(run,lineage,genome) ORDER BY g.run,g.lineage,g.genome
    """,
    "typed_flows": """
      SELECT run,lineage,genome,channel,species,product,sum(amount) amount
      FROM flows GROUP BY run,lineage,genome,channel,species,product
      ORDER BY run,lineage,genome,channel,species,product
    """,
    "exposure": """
      SELECT run,lineage,genome,sum(seconds) organism_seconds,
        100*sum(slowed_seconds)/nullif(sum(seconds),0) slowed_time_percent,
        100*sum(impaired_seconds)/nullif(sum(seconds),0) impaired_time_percent,
        100*sum(damage_seconds)/nullif(sum(seconds),0) mean_damage_percent,
        100*sum(swim_seconds)/nullif(sum(seconds),0) mean_swim_percent
      FROM exposure GROUP BY run,lineage,genome ORDER BY run,lineage,genome
    """,
    "rates": """
      WITH time AS (SELECT run,lineage,sum(seconds) AS organism_seconds FROM exposure GROUP BY run,lineage),
      counts AS (SELECT run,lineage,count(*) FILTER(WHERE kind='division') divisions,
        count(*) FILTER(WHERE kind IN ('starvation','damage','disturbance')) deaths
        FROM life GROUP BY run,lineage)
      SELECT t.run,t.lineage,1000.0*coalesce(c.divisions,0)/nullif(t.organism_seconds,0) divisions_per_1000_cell_seconds,
        1000.0*coalesce(c.deaths,0)/nullif(t.organism_seconds,0) deaths_per_1000_cell_seconds
      FROM time t LEFT JOIN counts c USING(run,lineage) ORDER BY t.run,t.lineage
    """,
    "developed_bodies": """
      SELECT run,tick,genome,count(*) living,100*avg(motor/nullif(core,0)) motor_percent_core,
        avg(speed_ceiling) mean_speed_ceiling
      FROM bodies GROUP BY run,tick,genome ORDER BY run,tick,genome
    """,
    "trajectories": """
      SELECT run,tick,lineage,genome,count(*) living,
        100.0*count(*)/sum(count(*)) OVER(PARTITION BY run,tick) population_percent
      FROM census GROUP BY run,tick,lineage,genome ORDER BY run,tick,lineage,genome
    """,
    "residuals": """
      SELECT run,max(abs(energy_residual)) max_energy_residual,
        max(abs(material_residual)) max_material_residual,
        100*avg(half_speed_area*1.0/grid_cells) mean_half_speed_world_percent,
        max(chemical_blocks) peak_chemical_blocks
      FROM environment GROUP BY run ORDER BY run
    """,
}


def queries_for(db, historical):
    import json
    versions = {json.loads(row[0]).get("schemaVersion", 1)
                for row in db.execute("SELECT manifest FROM runs").fetchall()}
    if len(versions) > 1:
        raise ValueError("Study database mixes physical schemas")
    if not versions:
        raise ValueError("Study database has no completed runs")
    if versions == {3}:
        queries = dict(QUERIES)
        queries["residuals"] = """
          SELECT run,max(abs(energy_residual)) max_energy_residual,
            max(abs(material_residual)) max_material_residual,
            100*avg(half_speed_area/world_area) mean_half_speed_world_percent
          FROM environment GROUP BY run ORDER BY run
        """
        return queries, 3
    if versions == {2}:
        return QUERIES, 2
    if versions != {1}:
        raise ValueError("Unsupported study schema")
    return historical, 1

"""Load completed local study tables, or execute a read-only analytical query.

python harness/study_sql.py load RUN_DIRECTORY DATABASE
python harness/study_sql.py query DATABASE 'SELECT ...'
Requires duckdb (tested with 1.5.2); no service or credentials.
"""
import json
import sys
from pathlib import Path
import duckdb


def load(directory, database):
    directory = Path(directory)
    manifest = json.loads((directory / "manifest.json").read_text())
    if manifest["status"] != "complete":
        raise ValueError("Incomplete runs cannot enter completed evidence tables")
    schema = json.loads((directory / "schema.json").read_text())
    if schema["version"] != 1:
        raise ValueError("Unsupported study schema")
    with duckdb.connect(database) as db:
        db.execute("BEGIN TRANSACTION")
        db.execute("CREATE TABLE IF NOT EXISTS runs (run VARCHAR PRIMARY KEY, manifest JSON)")
        db.execute("INSERT INTO runs VALUES (?, ?)", [manifest["run"], json.dumps(manifest)])
        for table, columns in schema["tables"].items():
            definition = ", ".join(f'"{key}" {kind}' for key, kind in columns.items())
            db.execute(f'CREATE TABLE IF NOT EXISTS "{table}" (run VARCHAR, {definition})')
            path = directory / f"{table}.jsonl"
            if path.stat().st_size:
                types = ", ".join(f"'{key}': '{kind}'" for key, kind in columns.items())
                db.execute(f'INSERT INTO "{table}" SELECT ?, * FROM read_json(?, columns={{{types}}}, format=\'newline_delimited\', auto_detect=false)', [manifest["run"], str(path)])
        db.execute("COMMIT")
    print(json.dumps({"loaded": manifest["run"], "database": database}))


def query(database, sql):
    with duckdb.connect(database, read_only=True) as db:
        result = db.execute(sql)
        names = [column[0] for column in result.description]
        print(json.dumps([dict(zip(names, row)) for row in result.fetchall()], indent=2, default=str))


if __name__ == "__main__":
    command, *args = sys.argv[1:]
    if command == "load":
        load(*args)
    elif command == "query":
        query(args[0], " ".join(args[1:]))
    else:
        raise ValueError("Expected load or query")

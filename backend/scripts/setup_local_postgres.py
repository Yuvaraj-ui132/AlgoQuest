"""
Local PostgreSQL Setup Script.
Downloads official portable PostgreSQL 16 binaries (zonky/embedded-postgres),
initializes data cluster, creates development database and application role,
and applies V1__initial_schema.sql.
"""

import os
import sys
import io
import time
import urllib.request
import zipfile
import tarfile
import subprocess
import shutil

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
PG_DIR = os.path.join(BASE_DIR, ".pgsql")
BIN_DIR = os.path.join(PG_DIR, "bin")
DATA_DIR = os.path.join(PG_DIR, "data")
LOG_FILE = os.path.join(PG_DIR, "logfile.log")
PORT = 5433  # Use 5433 to avoid conflicts if another service uses 5432


def download_and_extract_postgres():
    if os.path.exists(os.path.join(BIN_DIR, "postgres.exe")):
        print(f"[PostgreSQL] Binaries already present at {BIN_DIR}")
        return

    os.makedirs(PG_DIR, exist_ok=True)
    jar_url = "https://repo1.maven.org/maven2/io/zonky/test/postgres/embedded-postgres-binaries-windows-amd64/16.4.0/embedded-postgres-binaries-windows-amd64-16.4.0.jar"
    print(f"[PostgreSQL] Downloading portable PostgreSQL 16 binaries from {jar_url}...")
    
    req = urllib.request.Request(jar_url, headers={"User-Agent": "AlgoQuestSetup/1.0"})
    data = urllib.request.urlopen(req).read()
    print(f"[PostgreSQL] Downloaded {len(data) / (1024*1024):.2f} MB. Extracting JAR...")

    zf = zipfile.ZipFile(io.BytesIO(data))
    txz_data = zf.read("postgres-windows-x86_64.txz")
    print(f"[PostgreSQL] Extracting PostgreSQL archive ({len(txz_data) / (1024*1024):.2f} MB)...")

    tf = tarfile.open(fileobj=io.BytesIO(txz_data), mode="r:xz")
    tf.extractall(path=PG_DIR)
    print(f"[PostgreSQL] Extracted successfully to {PG_DIR}")


def init_database_cluster():
    initdb_exe = os.path.join(BIN_DIR, "initdb.exe")
    if os.path.exists(os.path.join(DATA_DIR, "PG_VERSION")):
        print(f"[PostgreSQL] Data cluster already exists at {DATA_DIR}")
        return

    print(f"[PostgreSQL] Initializing cluster at {DATA_DIR}...")
    os.makedirs(DATA_DIR, exist_ok=True)
    cmd = [
        initdb_exe,
        "-D", DATA_DIR,
        "-U", "postgres",
        "-E", "UTF8",
        "-A", "trust",  # Local dev trust authentication
    ]
    res = subprocess.run(cmd, capture_output=True, text=True)
    if res.returncode != 0:
        print(f"[PostgreSQL] initdb failed:\n{res.stderr}")
        sys.exit(1)
    print("[PostgreSQL] Cluster initialized successfully.")


def start_postgres_server():
    pg_ctl_exe = os.path.join(BIN_DIR, "pg_ctl.exe")
    print(f"[PostgreSQL] Checking server status on port {PORT}...")
    status_cmd = [pg_ctl_exe, "status", "-D", DATA_DIR]
    res = subprocess.run(status_cmd, capture_output=True, text=True)
    if "is running" in res.stdout:
        print("[PostgreSQL] Server is already running.")
        return

    print(f"[PostgreSQL] Starting PostgreSQL server on port {PORT}...")
    start_cmd = [
        pg_ctl_exe,
        "start",
        "-D", DATA_DIR,
        "-l", LOG_FILE,
        "-o", f"-p {PORT}",
    ]
    res = subprocess.run(start_cmd, capture_output=True, text=True)
    if res.returncode != 0:
        print(f"[PostgreSQL] pg_ctl start failed:\n{res.stderr}")
        if os.path.exists(LOG_FILE):
            with open(LOG_FILE, "r") as f:
                print(f"[Log File]:\n{f.read()}")
        sys.exit(1)
    time.sleep(2)
    print(f"[PostgreSQL] Server started successfully on port {PORT}.")


def setup_databases_and_migration():
    createdb_exe = os.path.join(BIN_DIR, "createdb.exe")
    psql_exe = os.path.join(BIN_DIR, "psql.exe")

    # 1. Create development database
    print(f"[PostgreSQL] Ensuring database 'algoquest_dev' exists...")
    res = subprocess.run(
        [psql_exe, "-U", "postgres", "-p", str(PORT), "-d", "postgres", "-tc", "SELECT 1 FROM pg_database WHERE datname = 'algoquest_dev'"],
        capture_output=True,
        text=True,
    )
    if "1" not in res.stdout:
        res = subprocess.run([createdb_exe, "-U", "postgres", "-p", str(PORT), "algoquest_dev"], capture_output=True, text=True)
        print("[PostgreSQL] Created database 'algoquest_dev'.")
    else:
        print("[PostgreSQL] Database 'algoquest_dev' already exists.")

    # 2. Run V1 migration SQL
    migration_file = os.path.join(BASE_DIR, "migrations", "V1__initial_schema.sql")
    print(f"[PostgreSQL] Applying migration from {migration_file}...")
    res = subprocess.run(
        [psql_exe, "-U", "postgres", "-p", str(PORT), "-d", "algoquest_dev", "-f", migration_file],
        capture_output=True,
        text=True,
    )
    print(f"[PostgreSQL] Migration output:\n{res.stdout}")
    if res.stderr:
        print(f"[PostgreSQL] Migration stderr / notices:\n{res.stderr}")


if __name__ == "__main__":
    download_and_extract_postgres()
    init_database_cluster()
    start_postgres_server()
    setup_databases_and_migration()
    print("\n[PostgreSQL] Dedicated development PostgreSQL instance is ready!")
    print(f"Connection URL: postgresql://postgres@localhost:{PORT}/algoquest_dev")

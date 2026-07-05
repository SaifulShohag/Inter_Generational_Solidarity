#!/bin/sh
set -e

# If the DB has a revision from a different branch, wipe it and start clean
if ! alembic upgrade head 2>/dev/null; then
    echo "[migration] Unknown revision detected — wiping database and retrying..."
    rm -f /data/helpme.db
    alembic upgrade head
fi

exec uvicorn app.main:app --host 0.0.0.0 --port 8000

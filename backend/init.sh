#!/bin/sh
set -e

# Start PostgreSQL in the background
docker-entrypoint.sh postgres &
PG_PID=$!

# Wait until PostgreSQL is fully ready to accept connections
echo "Waiting for PostgreSQL to accept DDL..."
until PGPASSWORD="$POSTGRES_PASSWORD" psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c '\q' 2>/dev/null; do
  sleep 1
done

echo "PostgreSQL ready. Dropping old objects and applying dump.sql..."

# Drop all existing tables/sequences
PGPASSWORD="$POSTGRES_PASSWORD" psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" <<EOSQL
DO \$\$ DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname='public') LOOP
        EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE';
    END LOOP;
    FOR r IN (SELECT sequencename FROM pg_sequences WHERE schemaname='public') LOOP
        EXECUTE 'DROP SEQUENCE IF EXISTS ' || quote_ident(r.sequencename) || ' CASCADE';
    END LOOP;
END \$$;
EOSQL

# Apply the dump
PGPASSWORD="$POSTGRES_PASSWORD" psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -f /usr/local/bin/dump.sql

echo "Dump applied successfully."

# Wait for PostgreSQL to exit (keep container running)
wait $PG_PID

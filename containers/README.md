# Development Containers

## PSQL

A PSQL Docker Container that cna be started locally

A migration script is included in `psql/migrations_as_kysely` that use Kysely migrations

The docker includes persistent storage to reduce overhead on development

!! NOTICE !! Docker maps to port 5432, verify no local instance of Postgres is running or change the port mapping accordingly inside the docker-compose.yml file.

### Run

1. From the `containers/psql` directory run `docker compose up` - Add -d to run in background if desired

### Access

1. Login with `metaversal_db_user:metaversal_db_pw` and use database name: `metaversal_test_application` if using the default configuration.

### Run Kysely migrations

Run the migrations with `npx ts-node migrate.ts` from `containers/psql` or alternatively run `pnpm migrate`

-- This only needs done on initial setup or schema changes

### Clean database

The flag `--clean` can be passed to migration to run the migrations after dropping all DB's to give a fresh start

Alternatively run `pnpm migrate:clean`

### Migration Notes

Note that migrations use the `db_config.ts` file for determining the location of the database to run migrations against. 

If you need to run the migration against a different database than the default configured, please edit `db_config.ts` to your needs.
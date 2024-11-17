import { Kysely, PostgresDialect } from 'kysely';
import { Pool } from 'pg';

const db = new Kysely({
    dialect: new PostgresDialect({
        pool: new Pool({
            host: 'localhost',
            port: 5432,
            user: 'metaversal_db_user',
            password: 'metaversal_db_pw',
            database: 'metaversal_test_application',
        }),
    }),
});

export default db;

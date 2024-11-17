import db from './db_config/db';
import CreateInitialSchemaMigration from './migration_as_kysely/01_init_schema';

async function migrate() {
    const args = process.argv.slice(2);
    const migration = new CreateInitialSchemaMigration();

    try {
        if (args.includes('--clean')) {
            console.log('Running down migration...');
            await migration.down(db);
            console.log('Down migration completed. Databases dropped.');
        }
        console.log('Running up migration...');
        await migration.up(db);
        console.log('Up migration completed successfully.');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await db.destroy();
    }
}

migrate();

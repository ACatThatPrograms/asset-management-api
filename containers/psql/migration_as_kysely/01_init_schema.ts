import { Kysely, Migration, sql } from 'kysely';

export default class CreateImprovedSchemaMigration implements Migration {
    async up(db: Kysely<any>): Promise<void> {
        // 'users' - Stores user id & privy_did for reference
        await db.schema
            .createTable('users')
            .addColumn('id', 'serial', (col) => col.primaryKey())
            .addColumn('privy_did', 'varchar', (col) => col.notNull().unique())
            .addColumn('created_at', 'timestamptz', (col) => col.defaultTo(sql`now()`))
            .addColumn('updated_at', 'timestamptz', (col) => col.defaultTo(sql`now()`))
            .execute();

        // 'assets' - Catalog of assets, NOT user assets
        await db.schema
            .createTable('assets')
            .addColumn('id', 'serial', (col) => col.primaryKey())
            .addColumn('asset_type', 'varchar', (col) => col.notNull())
            .addColumn('smart_contract_address', 'varchar', (col) => col.notNull().unique())
            .addColumn('chain', 'varchar', (col) => col.notNull())
            .addColumn('token_name', 'varchar', (col) => col.notNull())
            .addColumn('token_description', 'text', (col) => col.notNull())
            .addColumn('created_at', 'timestamptz', (col) => col.defaultTo(sql`now()`))
            .addColumn('updated_at', 'timestamptz', (col) => col.defaultTo(sql`now()`))
            .execute();

        // 'user_assets' - Tracks owned assets by users in reference to 'assets' table
        await db.schema
            .createTable('user_assets')
            .addColumn('id', 'serial', (col) => col.primaryKey())
            .addColumn('user_id', 'integer', (col) => col.references('users.id').onDelete('cascade'))
            .addColumn('asset_id', 'integer', (col) => col.references('assets.id').onDelete('cascade'))
            .addColumn('quantity_owned', 'numeric')
            .addColumn('token_id', 'varchar')
            .addColumn('cost_basis', 'numeric', (col) => col.defaultTo(0))
            .addColumn('created_at', 'timestamptz', (col) => col.defaultTo(sql`now()`))
            .addColumn('updated_at', 'timestamptz', (col) => col.defaultTo(sql`now()`))
            .execute();

        // 'asset_daily_prices' - Upon price updates, put entries here for immediate reference
        await db.schema
            .createTable('asset_daily_prices')
            .addColumn('id', 'serial', (col) => col.primaryKey())
            .addColumn('asset_id', 'integer', (col) => col.references('assets.id').onDelete('cascade'))
            .addColumn('price', 'numeric', (col) => col.notNull().defaultTo(0))
            .addColumn('currency', 'varchar', (col) => col.defaultTo('USD'))
            .addColumn('updated_at', 'timestamptz', (col) => col.defaultTo(sql`now()`))
            .addUniqueConstraint('uq_asset_daily_prices_asset_id', ['asset_id'])
            .execute();

        // 'asset_price_history` - When updating prices, also add prices here for historical reference for graphing
        await db.schema
            .createTable('asset_price_history')
            .addColumn('id', 'serial', (col) => col.primaryKey())
            .addColumn('asset_id', 'integer', (col) => col.references('assets.id').onDelete('cascade'))
            .addColumn('price', 'numeric', (col) => col.notNull().defaultTo(0))
            .addColumn('currency', 'varchar', (col) => col.defaultTo('USD'))
            .addColumn('date', 'date', (col) => col.notNull())
            .addColumn('created_at', 'timestamptz', (col) => col.defaultTo(sql`now()`))
            .addUniqueConstraint('unique_asset_date', ['asset_id', 'date'])
            .execute();

        // 'portfolio_metrics' - Used to store generated portfolio status for quick pulls
        await db.schema
            .createTable('portfolio_metrics')
            .addColumn('user_id', 'integer', (col) => col.references('users.id').onDelete('cascade'))
            .addColumn('total_basis', 'numeric', (col) => col.defaultTo(0).notNull())
            .addColumn('total_value', 'numeric', (col) => col.defaultTo(0).notNull())
            .addColumn('pnl', 'numeric', (col) => col.defaultTo(0).notNull())
            .addColumn('last_updated', 'timestamptz', (col) => col.defaultTo(sql`now()`))
            .addPrimaryKeyConstraint('pk_portfolio_metrics', ['user_id'])
            .execute();
    }

    async down(db: Kysely<any>): Promise<void> {
        const tables = [
            'asset_daily_prices',
            'asset_price_history',
            'assets',
            'erc20_tokens',
            'erc721_tokens',
            'portfolio_metrics',
            'user_assets',
            'users',
        ];
        for (const table of tables) {
            await sql`DROP TABLE IF EXISTS ${sql.table(table)} CASCADE`.execute(db);
        }
    }
}

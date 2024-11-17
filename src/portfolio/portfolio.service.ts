import { Inject, Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { Kysely, sql } from 'kysely';

@Injectable()
export class PortfolioService {
    constructor(@Inject('Kysely') private readonly db: Kysely<any>) {}

    //////////////////////
    /** PORTFOLIO VALUE */
    /////////////////////

    // Get total portfolio value and PnL for a user
    async getPortfolioValue(userId: number) {
        const portfolioMetrics = await this.db
            .selectFrom('portfolio_metrics')
            .select(['total_basis', 'total_value', 'pnl', 'last_updated'])
            .where('user_id', '=', userId)
            .executeTakeFirst();
        if (!portfolioMetrics) {
            // Return default if none found
            return {
                total_basis: 0,
                total_value: 0,
                pnl: 0,
                last_updated: 'N/A',
            };
        }
        return {
            total_basis: parseFloat(portfolioMetrics.total_basis).toFixed(2),
            total_value: parseFloat(portfolioMetrics.total_value).toFixed(2),
            pnl: parseFloat(portfolioMetrics.pnl).toFixed(2),
            last_updated: portfolioMetrics.last_updated,
        };
    }

    //////////////////////
    /** PRICE UPDATES */
    /////////////////////

    @Cron('1 0 * * *') // Runs every day at 12:01 AM
    async updatePrices() {
        const assets = await this.db.selectFrom('assets').select(['id']).execute();

        // Get today as yyyy-mm-dd
        const today = new Date().toISOString().slice(0, 10);

        for (const asset of assets) {
            const mockPrice = Math.random() * 100;

            // Add price in 'asset_price_history'
            await this.db
                .insertInto('asset_price_history')
                .values({
                    asset_id: asset.id,
                    price: mockPrice,
                    currency: 'USD',
                    date: today,
                    created_at: sql`now()`,
                })
                .onConflict((oc) =>
                    oc.columns(['asset_id', 'date']).doUpdateSet({
                        price: mockPrice,
                        created_at: sql`now()`,
                    }),
                )
                .execute();

            // Fetch the most recent price via 'asset_price_history'
            const latestPrice = await this.db
                .selectFrom('asset_price_history')
                .select(['price'])
                .where('asset_id', '=', asset.id)
                .orderBy('date', 'desc') // Need latest
                .limit(1)
                .executeTakeFirst();

            // Update 'asset_daily_prices' with the latest value
            if (latestPrice) {
                await this.db
                    .insertInto('asset_daily_prices')
                    .values({
                        asset_id: asset.id,
                        price: latestPrice.price,
                        currency: 'USD',
                        updated_at: sql`now()`,
                    })
                    .onConflict((oc) =>
                        oc.columns(['asset_id']).doUpdateSet({
                            price: latestPrice.price,
                            updated_at: sql`now()`,
                        }),
                    )
                    .execute();
            }
        }

        console.log('Prices updated successfully');
    }

    ////////////////////////////
    /** PORTFOLIO RECALCULATION */
    ////////////////////////////

    async recalculatePortfolioMetrics(userId: number) {
        const metrics = await this.db
            .selectFrom('user_assets')
            .innerJoin('assets', 'user_assets.asset_id', 'assets.id')
            .leftJoin('asset_daily_prices', 'asset_daily_prices.asset_id', 'user_assets.asset_id')
            .select([
                sql`SUM(
              CASE
                WHEN assets.asset_type = 'ERC-20' THEN 
                  COALESCE(user_assets.cost_basis, 0) * COALESCE(user_assets.quantity_owned, 0)
                ELSE 
                  COALESCE(user_assets.cost_basis, 0)
              END
            )`.as('total_basis'),
                sql`SUM(
              CASE
                WHEN assets.asset_type = 'ERC-20' THEN 
                  COALESCE(asset_daily_prices.price, 0) * COALESCE(user_assets.quantity_owned, 0)
                ELSE 
                  COALESCE(asset_daily_prices.price, 0)
              END
            )`.as('total_value'),
            ])
            .where('user_assets.user_id', '=', userId)
            .executeTakeFirst();

        // Default values if none exist
        const totalBasis = metrics?.total_basis || 0;
        const totalValue = metrics?.total_value || 0;
        const pnl = Number(totalValue) - Number(totalBasis);

        // Insert/update 'portfolio_metrics' for user
        await this.db
            .insertInto('portfolio_metrics')
            .values({
                user_id: userId,
                total_basis: totalBasis,
                total_value: totalValue,
                pnl: pnl,
                last_updated: sql`now()`,
            })
            .onConflict((oc) =>
                oc.columns(['user_id']).doUpdateSet({
                    total_basis: totalBasis,
                    total_value: totalValue,
                    pnl: pnl,
                    last_updated: sql`now()`,
                }),
            )
            .execute();
    }

    ////////////////////////////
    /** BACKFILL PRICE DATA */
    ////////////////////////////

    async backfillPriceData(userId: string) {
        const assets = await this.db.selectFrom('user_assets').select(['asset_id']).where('user_id', '=', userId).execute();

        const today = new Date();
        const sixMonthsAgo = new Date(today);
        sixMonthsAgo.setMonth(today.getMonth() - 6);

        for (const asset of assets) {
            for (let date = new Date(sixMonthsAgo); date <= today; date.setDate(date.getDate() + 1)) {
                const targetDate = new Date(date).toISOString().slice(0, 10);

                const randomPrice = Math.random() * 50;

                // Insert into 'asset_price_history'
                await this.db
                    .insertInto('asset_price_history')
                    .values({
                        asset_id: asset.asset_id,
                        price: randomPrice,
                        currency: 'USD',
                        date: targetDate,
                        created_at: targetDate, // Use the historical date, not now for mocking
                    })
                    .onConflict((oc) =>
                        oc.columns(['asset_id', 'date']).doUpdateSet({
                            price: randomPrice,
                            created_at: targetDate, // Same here
                        }),
                    )
                    .execute();
            }

            // Fetch the most recent backfilled price
            const latestBackfilledPrice = await this.db
                .selectFrom('asset_price_history')
                .select(['price'])
                .where('asset_id', '=', asset.asset_id)
                .orderBy('date', 'desc') // Fetch the latest date
                .limit(1)
                .executeTakeFirst();

            // Update `asset_daily_prices` to reflect the most recent backfilled price
            if (latestBackfilledPrice) {
                await this.db
                    .insertInto('asset_daily_prices')
                    .values({
                        asset_id: asset.asset_id,
                        price: latestBackfilledPrice.price,
                        currency: 'USD',
                        updated_at: sql`now()`,
                    })
                    .onConflict((oc) =>
                        oc.columns(['asset_id']).doUpdateSet({
                            price: latestBackfilledPrice.price,
                            updated_at: sql`now()`,
                        }),
                    )
                    .execute();
            }
        }

        console.log('Historical price data backfilled successfully');
    }
}

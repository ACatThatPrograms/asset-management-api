import { Inject, Injectable } from '@nestjs/common';
import { Kysely, sql } from 'kysely';
import { AddAssetDto } from './dto/add-asset.dto';

@Injectable()
export class AssetsService {
    constructor(@Inject('Kysely') private readonly db: Kysely<any>) {}

    ///////////////////////////
    /** ADD / REMOVE ASSETS */
    /////////////////////////

    async addAsset(addAssetDto: AddAssetDto, userId: string) {
        const { assetType, smartContractAddress, quantity, tokenId, costBasis, tokenDescription } = addAssetDto;

        const tokenName = (() => {
            const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
            return Array.from({ length: 3 }, () => letters.charAt(Math.floor(Math.random() * letters.length))).join('');
        })(); // TODO: Would normally pull this from the contract

        // TODO: Validate smart contract address
        const validatedContractAddress = smartContractAddress;

        // Check if the asset exists in the catalog..
        let asset = await this.db
            .selectFrom('assets')
            .select(['id'])
            .where('smart_contract_address', '=', validatedContractAddress)
            .executeTakeFirst();

        // If not => insert the asset into the catalog
        if (!asset) {
            const [newAsset] = await this.db
                .insertInto('assets')
                .values({
                    asset_type: assetType,
                    smart_contract_address: validatedContractAddress,
                    chain: 'Ethereum', // TODO: Adjust for multi-chain support
                    token_name: tokenName,
                    token_description: tokenDescription,
                    created_at: sql`now()`,
                    updated_at: sql`now()`,
                })
                .returning('id')
                .execute();
            asset = newAsset;
        }

        // ERC-20 Handling //
        /////////////////////

        // Insert or update user's ownership in 'user_assets'
        if (assetType === 'ERC-20' && quantity !== undefined) {
            // Check if the user already owns this ERC-20 asset
            const userAsset = await this.db
                .selectFrom('user_assets')
                .select(['id', 'quantity_owned', 'cost_basis'])
                .where('user_id', '=', userId)
                .where('asset_id', '=', asset.id)
                .executeTakeFirst();

            if (userAsset) {
                // Update quantity and calculate the new average cost basis
                const totalQuantity = userAsset.quantity_owned + quantity;
                const newCostBasis = (userAsset.cost_basis * userAsset.quantity_owned + costBasis * quantity) / totalQuantity;

                await this.db
                    .updateTable('user_assets')
                    .set({
                        quantity_owned: totalQuantity,
                        cost_basis: newCostBasis,
                        updated_at: sql`now()`,
                    })
                    .where('id', '=', userAsset.id)
                    .execute();
            } else {
                // Insert new ERC-20 ownership record
                await this.db
                    .insertInto('user_assets')
                    .values({
                        user_id: userId,
                        asset_id: asset.id,
                        quantity_owned: quantity,
                        cost_basis: costBasis,
                        created_at: sql`now()`,
                        updated_at: sql`now()`,
                    })
                    .execute();
            }
        }

        // ERC-721 Handling //
        /////////////////////

        if (assetType === 'ERC-721' && tokenId) {
            // Check if the user already owns this specific token ID
            const userAsset = await this.db
                .selectFrom('user_assets')
                .select(['id'])
                .where('user_id', '=', userId)
                .where('asset_id', '=', asset.id)
                .where('token_id', '=', tokenId)
                .executeTakeFirst();

            if (!userAsset) {
                // Insert new ERC-721 token ownership record
                await this.db
                    .insertInto('user_assets')
                    .values({
                        user_id: userId,
                        asset_id: asset.id,
                        token_id: tokenId,
                        cost_basis: costBasis,
                        created_at: sql`now()`,
                        updated_at: sql`now()`,
                    })
                    .execute();
            }
        }
    }

    // Removes an asset from a user's holdings
    async removeAsset(userAssetId: number) {
        await this.db.deleteFrom('user_assets').where('id', '=', userAssetId).execute();
    }

    // Remove all assets owned by a user
    async removeAllAssetsByUserId(userId: string) {
        await this.db.deleteFrom('user_assets').where('user_id', '=', userId).execute();
    }

    //////////////////////
    /** ASSET HISTORY  */
    /////////////////////

    // Retrieves historical price data and PnL for a specific asset
    async getAssetHistory(assetId: number) {
        return this.db
            .selectFrom('asset_price_history')
            .select(['created_at', 'price'])
            .where('asset_id', '=', assetId)
            .orderBy('created_at', 'asc')
            .execute();
    }

    /////////////////////
    /** LISTING ASSETS */
    /////////////////////

    // List assets owned by a user, including quantities or token IDs, and the latest price
    async listAssets(userId: string) {
        const latestPricesSubquery = this.db
            .selectFrom('asset_daily_prices')
            .select(['asset_id', sql`price`.as('latest_price')])
            .groupBy(['asset_id', 'price']); // Ensure valid grouping for latest price per asset

        return this.db
            .selectFrom('user_assets')
            .innerJoin('assets', 'user_assets.asset_id', 'assets.id')
            .leftJoin(latestPricesSubquery.as('latest_prices'), 'latest_prices.asset_id', 'user_assets.asset_id')
            .select([
                'user_assets.id',
                'assets.token_name',
                'assets.token_description',
                'assets.asset_type',
                'assets.smart_contract_address',
                'assets.chain',
                sql`COALESCE(user_assets.quantity_owned, NULL)`.as('quantity_owned'),
                sql`COALESCE(user_assets.token_id, NULL)`.as('token_id'),
                sql`user_assets.cost_basis`.as('cost_basis'),
                sql`COALESCE(user_assets.updated_at, NULL)`.as('updated_at'),
                sql`COALESCE(latest_prices.latest_price, NULL)`.as('latest_price'),
            ])
            .where('user_assets.user_id', '=', userId)
            .execute();
    }
}

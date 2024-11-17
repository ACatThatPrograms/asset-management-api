import { Controller, Post, Delete, Get, Body, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { AddAssetDto } from './dto/add-asset.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PortfolioService } from 'src/portfolio/portfolio.service';
import { AssetsService } from './assets.service';
import { GetUserId } from 'src/decorators/getUserId.decorator';
import { ApiOperation, ApiResponse, ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Assets')
@ApiBearerAuth()
@Controller('assets')
@UseGuards(JwtAuthGuard)
export class AssetsController {
    constructor(
        private readonly assetsService: AssetsService,
        private readonly portfolioService: PortfolioService,
    ) {}

    @Post()
    @ApiOperation({ summary: 'Create a new asset' })
    @ApiResponse({
        status: 201,
        description: 'The asset has been successfully created.',
        type: AddAssetDto,
    })
    @ApiResponse({ status: 400, description: 'Invalid input.' })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    async addAsset(@Body() addAssetDto: AddAssetDto, @GetUserId() userId: string) {
        await this.assetsService.addAsset(addAssetDto, userId);
        return { message: 'Asset added successfully' };
    }

    @Delete()
    @ApiOperation({ summary: 'Remove all assets for the authenticated user' })
    @ApiResponse({
        status: 200,
        description: 'All assets have been successfully removed.',
    })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    async removeAllAssets(@GetUserId() userId: string) {
        await this.assetsService.removeAllAssetsByUserId(userId);
        return { message: 'All assets removed successfully' };
    }

    @Delete(':assetId')
    @ApiOperation({ summary: 'Remove a specific asset by its ID' })
    @ApiResponse({
        status: 200,
        description: 'The asset has been successfully removed.',
    })
    @ApiResponse({ status: 404, description: 'Asset not found.' })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    async removeAsset(@Param('assetId', ParseIntPipe) assetId: number) {
        await this.assetsService.removeAsset(assetId);
        return { message: 'Asset removed successfully' };
    }

    @Get()
    @ApiOperation({ summary: 'List all assets for the authenticated user' })
    @ApiResponse({
        status: 200,
        description: 'Returns a list of all assets for the authenticated user.',
        schema: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    id: { type: 'number' },
                    token_name: { type: 'string' },
                    asset_type: { type: 'string' },
                    latest_price: { type: 'number' },
                    quantity_owned: { type: 'number', nullable: true },
                    token_id: { type: 'string', nullable: true },
                    cost_basis: { type: 'number' },
                },
            },
        },
    })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    async listAssets(@GetUserId() userId: string) {
        const assets = await this.assetsService.listAssets(userId);
        return assets;
    }

    @Get('/:assetId/history')
    @ApiOperation({ summary: 'Retrieve historical price data for a specific asset' })
    @ApiResponse({
        status: 200,
        description: 'Returns the historical price data for the specified asset.',
        schema: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    created_at: { type: 'string', format: 'date-time' },
                    price: { type: 'number' },
                },
            },
        },
    })
    @ApiResponse({ status: 404, description: 'Asset not found.' })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    async getAssetHistory(@Param('assetId', ParseIntPipe) assetId: number) {
        return this.assetsService.getAssetHistory(assetId);
    }

    @Post('/update-prices')
    @ApiOperation({ summary: 'Update daily prices for all assets' })
    @ApiResponse({
        status: 200,
        description: 'Daily prices updated successfully.',
    })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    async updateDailyPrices() {
        return this.portfolioService.updatePrices();
    }
}

import { Controller, Get, Post, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PortfolioService } from './portfolio.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Portfolio') // Groups all endpoints in this controller under "Portfolio"
@Controller('portfolio')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class PortfolioController {
    constructor(private readonly portfolioService: PortfolioService) {}

    @Get()
    @ApiOperation({
        summary: 'Get current portfolio value and metrics',
        description:
            'Retrieves the total portfolio value and associated metrics, such as Profit and Loss (PnL), for the authenticated user.',
    })
    @ApiResponse({
        status: 200,
        description: 'Portfolio value and metrics retrieved successfully.',
        schema: {
            type: 'object',
            properties: {
                total_value: { type: 'number', example: 10000 },
                pnl: { type: 'number', example: 500 },
                last_updated: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
            },
        },
    })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    async getPortfolioValue(@Request() req) {
        const userId = req.user.user_id;
        return this.portfolioService.getPortfolioValue(userId);
    }

    @Post('recalculate')
    @ApiOperation({
        summary: 'Recalculate portfolio metrics',
        description: 'Triggers a recalculation of portfolio metrics, such as current value and PnL, for the authenticated user.',
    })
    @ApiResponse({
        status: 201,
        description: 'Portfolio metrics recalculated successfully.',
    })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    async recalculatePortfolio(@Request() req) {
        const userId = req.user.user_id;
        return this.portfolioService.recalculatePortfolioMetrics(userId);
    }

    @Post('backfill-price-data')
    @ApiOperation({
        summary: 'Backfill historical price data',
        description: 'Generates or updates historical price data for the user’s assets to fill in gaps.',
    })
    @ApiResponse({
        status: 201,
        description: 'Price data backfilled successfully.',
    })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    async backfillPriceData(@Request() req) {
        const userId = req.user.user_id;
        return this.portfolioService.backfillPriceData(userId);
    }
}

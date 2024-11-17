import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('App')
@Controller()
export class AppController {
    constructor(private readonly appService: AppService) {}

    @Get()
    @ApiOperation({
        summary: 'Get API Welcome Message',
        description: 'Returns a welcome message to the Asset Explorer API.',
    })
    @ApiResponse({
        status: 200,
        description: 'API welcome message returned successfully.',
        schema: {
            type: 'string',
            example: 'Welcome to the Asset Explorer API',
        },
    })
    getHello(): string {
        return this.appService.helloWorld();
    }
}

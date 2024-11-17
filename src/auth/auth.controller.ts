import { Controller, Post, Body, UnauthorizedException, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { Response } from 'express';

@ApiTags('Authentication') // Groups all endpoints in this controller under "Authentication"
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    /**
     * Exchange a Privy token for a JWT.
     * Additionally, registers/logs in a user and registers non-existent Privy token DID.
     */
    @Post()
    @ApiOperation({
        summary: 'Exchange Privy token for JWT',
        description:
            'This endpoint validates a Privy token and returns a signed JWT. If the user does not exist, it will register the user in the database.',
    })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                privy_token: {
                    type: 'string',
                    description: 'The Privy token provided by the Privy authentication service.',
                },
            },
            required: ['privy_token'],
        },
    })
    @ApiResponse({
        status: 200,
        description: 'Login successful, returns a JWT in a cookie and payload.',
        schema: {
            type: 'object',
            properties: {
                message: { type: 'string', example: 'Login successful' },
                developmentJwt: {
                    type: 'string',
                    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.s3cr3t',
                    description: 'JWT token (only provided in non-production environments).',
                },
            },
        },
    })
    @ApiResponse({
        status: 401,
        description: 'Unauthorized - Privy token is required or invalid.',
    })
    async login(@Body('privy_token') privyToken: string, @Res({ passthrough: true }) res: Response) {
        if (!privyToken) {
            throw new UnauthorizedException('Privy token is required');
        }

        const jwt = await this.authService.validateUser(privyToken); // Will throw if invalid...

        const isProduction = process.env.NODE_ENV === 'production';
        res.cookie('jwt', jwt, {
            httpOnly: true,
            secure: isProduction, // Secure only in production
            sameSite: isProduction ? 'strict' : 'none', // Enforce on production only
            maxAge: 1000 * 60 * 60, // Expires in 1 hour
        });

        // Include copy of JWT in payload in non-production environments
        return {
            message: 'Login successful',
            developmentJwt: isProduction ? false : jwt,
        };
    }
}

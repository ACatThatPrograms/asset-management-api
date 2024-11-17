import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: '.env',
            validationSchema: Joi.object({
                JWT_SECRET: Joi.string().required(),
                PRIVY_APP_ID: Joi.string().required(),
                PRIVY_APP_SECRET: Joi.string().required(),
            }),
        }),
    ],
})
export class GlobalConfigModule {}

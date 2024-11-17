import { Module } from '@nestjs/common';
import { Kysely, PostgresDialect } from 'kysely';
import { Pool } from 'pg';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
    imports: [ConfigModule],
    providers: [
        {
            provide: 'Kysely',
            inject: [ConfigService],
            useFactory: async (configService: ConfigService) => {
                const db = new Kysely({
                    dialect: new PostgresDialect({
                        pool: new Pool({
                            host: configService.get('DB_HOST'),
                            database: configService.get('DB_NAME'),
                            user: configService.get('DB_USER'),
                            password: configService.get('DB_PASSWORD'),
                            port: parseInt(configService.get('DB_PORT'), 10),
                        }),
                    }),
                });
                return db;
            },
        },
    ],
    exports: ['Kysely'],
})
export class DbModule {}

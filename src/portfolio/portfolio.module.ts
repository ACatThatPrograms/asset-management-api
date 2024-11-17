import { Module } from '@nestjs/common';
import { PortfolioService } from './portfolio.service';
import { PortfolioController } from './portfolio.controller';
import { DbModule } from 'src/db/db.module';
import { AuthModule } from 'src/auth/auth.module';

@Module({
    imports: [DbModule, AuthModule],
    providers: [PortfolioService],
    controllers: [PortfolioController],
    exports: [PortfolioService],
})
export class PortfolioModule {}

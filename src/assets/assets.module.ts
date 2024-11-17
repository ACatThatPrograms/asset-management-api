import { Module } from '@nestjs/common';
import { AssetsController } from './assets.controller';
import { DbService } from 'src/db/db.service';
import { DbModule } from 'src/db/db.module';
import { AuthModule } from 'src/auth/auth.module';
import { PortfolioModule } from 'src/portfolio/portfolio.module';
import { AssetsService } from './assets.service';

@Module({
    controllers: [AssetsController],
    providers: [DbService, AssetsService],
    exports: [DbService],
    imports: [DbModule, AuthModule, PortfolioModule],
})
export class AssetsModule {}

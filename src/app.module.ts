import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { GlobalConfigModule } from './config.module';
import { DbService } from './db/db.service';
import { DbModule } from './db/db.module';
import { AssetsModule } from './assets/assets.module';
import { PortfolioController } from './portfolio/portfolio.controller';
import { PortfolioModule } from './portfolio/portfolio.module';
import { ScheduleModule } from '@nestjs/schedule';
@Module({
    imports: [GlobalConfigModule, AuthModule, DbModule, AssetsModule, PortfolioModule, PortfolioModule, ScheduleModule.forRoot()],
    controllers: [AppController, PortfolioController],
    providers: [AppService, DbService],
})
export class AppModule {}

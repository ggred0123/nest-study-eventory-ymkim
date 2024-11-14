import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { configModule } from './modules/config.module';
import { LoggerMiddleware } from '../common/middlewares/logger.middleware';
import { RegionModule } from '../region/region.module';
import { CommonModule } from '../common/common.module';
import { ReviewModule } from '../review/review.module';
import { EventModule } from 'src/event/event.module';
import { UserModule } from '../user/user.module';
import { AuthModule } from '../auth/auth.module';
import { ClubModule } from '../club/club.module';

@Module({
  imports: [
    AuthModule,
    EventModule,
    configModule,
    ClubModule,
    RegionModule,
    CommonModule,
    ReviewModule,
    UserModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}

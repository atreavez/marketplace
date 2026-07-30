import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { LoggerModule } from 'nestjs-pino';
import configuration from './config/configuration';
import { validateEnv } from './config/env.validation';
import { buildPinoOptions } from './config/logger.config';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware';
import { RedisModule } from './redis/redis.module';
import { RedisService } from './redis/redis.service';
import { HealthModule } from './health/health.module';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ProfilesModule } from './profiles/profiles.module';
import { ListingsModule } from './listings/listings.module';
import { DealsModule } from './deals/deals.module';
import { PaymentsModule } from './payments/payments.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validate: validateEnv, // fails fast at boot on missing/invalid env vars
    }),
    LoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: buildPinoOptions,
    }),
    RedisModule,
    ThrottlerModule.forRootAsync({
      imports: [RedisModule],
      inject: [ConfigService, RedisService],
      useFactory: (config: ConfigService, redis: RedisService) => ({
        throttlers: [
          { ttl: config.get<number>('throttle.ttlMs')!, limit: config.get<number>('throttle.limit')! },
        ],
        // Redis-backed storage means rate limits are enforced correctly across
        // multiple app instances behind a load balancer — an in-memory store
        // (the default) would let each instance grant its own separate quota.
        storage: new ThrottlerStorageRedisService(redis.client),
      }),
    }),
    PrismaModule,
    HealthModule,
    AuthModule,
    UsersModule,
    ProfilesModule,
    ListingsModule,
    DealsModule,
    PaymentsModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}

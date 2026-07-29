import { INestApplication, Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor(config: ConfigService) {
    // Query-level logging only in non-production — full SQL logs are useful
    // in dev and noisy/expensive at production volume. Warnings and errors
    // always log, in every environment, since those indicate real problems.
    const isProd = config.get<string>('app.env') === 'production';
    super({
      log: isProd
        ? [{ level: 'warn', emit: 'event' }, { level: 'error', emit: 'event' }]
        : [
            { level: 'query', emit: 'event' },
            { level: 'warn', emit: 'event' },
            { level: 'error', emit: 'event' },
          ],
    });

    (this as any).$on('warn', (e: any) => this.logger.warn(e.message));
    (this as any).$on('error', (e: any) => this.logger.error(e.message));
    if (!isProd) {
      (this as any).$on('query', (e: any) =>
        this.logger.debug(`${e.query} — ${e.duration}ms`),
      );
    }
  }

  async onModuleInit() {
    await this.$connect();
  }
  async onModuleDestroy() {
    await this.$disconnect();
  }

  // Prisma's own process signal handlers can beat Nest's shutdown lifecycle
  // to the punch and close the DB connection before in-flight requests
  // finish. This wires Prisma's beforeExit into Nest's app.close() instead,
  // called once from main.ts, so shutdown order is deterministic.
  async enableShutdownHooks(app: INestApplication) {
    (this as any).$on('beforeExit', async () => {
      await app.close();
    });
  }
}

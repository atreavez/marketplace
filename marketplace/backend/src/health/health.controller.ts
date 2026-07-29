import { Controller, Get, VERSION_NEUTRAL } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import {
  HealthCheck,
  HealthCheckService,
  MemoryHealthIndicator,
} from '@nestjs/terminus';
import { PrismaHealthIndicator } from './prisma.health';
import { RedisHealthIndicator } from './redis.health';

// Excluded from Swagger — health endpoints are for infra probes, not API consumers.
// version: VERSION_NEUTRAL + excluded from the global prefix in main.ts means
// these always resolve to bare /health and /health/live, never /api/v1/health —
// load balancers and orchestrators shouldn't need to know the API version to
// check if the process is alive.
@ApiExcludeController()
@Controller({ path: 'health', version: VERSION_NEUTRAL })
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private prismaHealth: PrismaHealthIndicator,
    private redisHealth: RedisHealthIndicator,
    private memory: MemoryHealthIndicator,
  ) {}

  // Liveness: "is the process still running and not deadlocked." Should only
  // fail if the process itself is broken — never because a dependency is
  // down, or an orchestrator will kill and restart a perfectly fine pod
  // during a brief DB blip.
  @Get('live')
  @HealthCheck()
  liveness() {
    return this.health.check([
      () => this.memory.checkHeap('memory_heap', 300 * 1024 * 1024),
    ]);
  }

  // Readiness: "can this instance actually serve traffic right now." Checked
  // by load balancers/orchestrators before routing requests to this instance.
  @Get()
  @HealthCheck()
  readiness() {
    return this.health.check([
      () => this.prismaHealth.isHealthy('database'),
      () => this.redisHealth.isHealthy('redis'),
    ]);
  }
}

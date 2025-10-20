import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  HealthCheckService,
  HealthCheck,
  HealthCheckResult,
} from '@nestjs/terminus';
import { RedisHealthIndicator } from './indicators/redis.health';
import { NsqHealthIndicator } from './indicators/nsq.health';

@Controller('health')
@ApiTags('Health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private redisHealth: RedisHealthIndicator,
    private nsqHealth: NsqHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  @ApiOperation({ summary: 'Health check geral da API' })
  @ApiResponse({ status: 200, description: 'API está saudável' })
  @ApiResponse({ status: 503, description: 'API não está saudável' })
  check(): Promise<HealthCheckResult> {
    return this.health.check([
      () => this.redisHealth.isHealthy('redis'),
      () => this.nsqHealth.isHealthy('nsq'),
    ]);
  }

  @Get('nsq')
  @HealthCheck()
  @ApiOperation({ summary: 'Health check do NSQ (Writer e Reader)' })
  @ApiResponse({ status: 200, description: 'NSQ está conectado' })
  @ApiResponse({ status: 503, description: 'NSQ não está conectado' })
  checkNsq(): Promise<HealthCheckResult> {
    return this.health.check([() => this.nsqHealth.isHealthy('nsq')]);
  }

  @Get('redis')
  @HealthCheck()
  @ApiOperation({ summary: 'Health check do Redis' })
  @ApiResponse({ status: 200, description: 'Redis está conectado' })
  @ApiResponse({ status: 503, description: 'Redis não está conectado' })
  checkRedis(): Promise<HealthCheckResult> {
    return this.health.check([() => this.redisHealth.isHealthy('redis')]);
  }
}


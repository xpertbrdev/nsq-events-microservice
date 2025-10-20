import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller';
import { RedisHealthIndicator } from './indicators/redis.health';
import { NsqHealthIndicator } from './indicators/nsq.health';
import { NsqModule } from '../nsq/nsq.module';

@Module({
  imports: [TerminusModule, NsqModule],
  controllers: [HealthController],
  providers: [RedisHealthIndicator, NsqHealthIndicator],
})
export class HealthModule {}


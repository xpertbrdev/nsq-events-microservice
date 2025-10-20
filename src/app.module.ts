import { Module } from '@nestjs/common';
import { EventsModule } from './events/events.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [EventsModule, HealthModule],
})
export class AppModule {}


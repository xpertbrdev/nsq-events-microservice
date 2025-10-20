import { Module, Logger } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CqrsModule } from '@nestjs/cqrs';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { RedisModule } from '@songkeys/nestjs-redis';
import { ClientsModule, Transport } from '@nestjs/microservices';

// Controllers
import { EventsController } from './controllers/events.controller';
import { MetricsController } from './controllers/metrics.controller';

// Services
import { ContingencyService } from './services/contingency.service';
import { NsqPublisherService } from './services/nsq-publisher.service';
import { MetricsService } from './services/metrics.service';
import { EventProcessorService } from './services/event-processor.service';
import { EventSessionService } from './services/event-session.service';

// Repositories
import { EventSessionRepository } from './repositories/event-session.repository';

// Command Handlers
import { StartSessionHandler } from './commands/handlers/start-session.handler';
import { AddEventHandler } from './commands/handlers/add-event.handler';
import { CommitSessionHandler } from './commands/handlers/commit-session.handler';
import { RollbackSessionHandler } from './commands/handlers/rollback-session.handler';

// Query Handlers
import { GetMetricsHandler } from './queries/handlers/get-metrics.handler';
import { GetSessionStatusHandler } from './queries/handlers/get-session-status.handler';
import { GetSessionEventsHandler } from './queries/handlers/get-session-events.handler';

const CommandHandlers = [
  StartSessionHandler,
  AddEventHandler,
  CommitSessionHandler,
  RollbackSessionHandler,
];

const QueryHandlers = [
  GetMetricsHandler,
  GetSessionStatusHandler,
  GetSessionEventsHandler,
];

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: './config/.env',
    }),
    CqrsModule,
    EventEmitterModule.forRoot(),
    RedisModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        config: {
          host: configService.get<string>('REDIS_HOST', 'localhost'),
          port: configService.get<number>('REDIS_PORT', 6379),
          password: configService.get<string>('REDIS_PASSWORD'),
          db: configService.get<number>('REDIS_DB', 0),
        },
      }),
      inject: [ConfigService],
    }),
    ClientsModule.registerAsync([
      {
        name: 'NSQ_CLIENT',
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: configService
              .get<string>('NSQD_TCP_ADDR', 'localhost:4150')
              .split(':')[0],
            port: parseInt(
              configService
                .get<string>('NSQD_TCP_ADDR', 'localhost:4150')
                .split(':')[1],
            ),
          },
        }),
        inject: [ConfigService],
      },
    ]),
  ],
  controllers: [EventsController, MetricsController],
  providers: [
    Logger,
    // Services
    ContingencyService,
    NsqPublisherService,
    MetricsService,
    EventProcessorService,
    EventSessionService,
    // Repositories
    EventSessionRepository,
    // Handlers
    ...CommandHandlers,
    ...QueryHandlers,
  ],
  exports: [
    ContingencyService,
    NsqPublisherService,
    MetricsService,
    EventProcessorService,
    EventSessionService,
    EventSessionRepository,
  ],
})
export class EventsModule {}


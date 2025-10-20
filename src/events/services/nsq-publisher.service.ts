import { Injectable, Inject, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { ContingencyService } from './contingency.service';
import { IEvent } from '../interfaces/event.interface';

@Injectable()
export class NsqPublisherService {
  private readonly logger = new Logger(NsqPublisherService.name);
  private readonly topic: string;

  constructor(
    @Inject('NSQ_CLIENT') private readonly client: ClientProxy,
    private readonly configService: ConfigService,
    private readonly contingencyService: ContingencyService,
  ) {
    this.topic = this.configService.get<string>('NSQ_TOPIC') || 'events';
  }

  async publishBatch(events: IEvent[]): Promise<void> {
    try {
      // NSQ não suporta batch nativo via emit, então publicamos individualmente
      for (const event of events) {
        this.client.emit(this.topic, event);
      }

      this.logger.log(
        `Successfully published ${events.length} messages to NSQ topic ${this.topic}`,
      );
    } catch (error) {
      this.logger.error(`Failed to publish batch to NSQ`, error);
      await this.contingencyService.saveToFile(
        events.map((e) => ({ type: 'event', data: e })),
      );
      throw error;
    }
  }

  async publish(event: IEvent): Promise<void> {
    try {
      this.client.emit(this.topic, event);
      this.logger.debug(
        `Published event to NSQ topic ${this.topic}`,
      );
    } catch (error) {
      this.logger.error(`Failed to publish event to NSQ`, error);
      await this.contingencyService.saveToFile([
        { type: 'event', data: event },
      ]);
      throw error;
    }
  }
}


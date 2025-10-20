import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NsqService } from '../../nsq/nsq.service';
import { ContingencyService } from './contingency.service';
import { IEvent } from '../interfaces/event.interface';

@Injectable()
export class NsqPublisherService {
  private readonly logger = new Logger(NsqPublisherService.name);
  private readonly defaultTopic: string;

  constructor(
    private readonly nsqService: NsqService,
    private readonly configService: ConfigService,
    private readonly contingencyService: ContingencyService,
  ) {
    this.defaultTopic = this.configService.get<string>('NSQ_TOPIC') || 'events';
  }

  async publishBatch(events: IEvent[], topic?: string): Promise<void> {
    const targetTopic = topic || this.defaultTopic;

    try {
      await this.nsqService.publishBatch(targetTopic, events);

      this.logger.log(
        `Successfully published ${events.length} messages to NSQ topic ${targetTopic}`,
      );
    } catch (error) {
      this.logger.error(`Failed to publish batch to NSQ topic ${targetTopic}`, error);
      await this.contingencyService.saveToFile(
        events.map((e) => ({ type: 'event', topic: targetTopic, data: e })),
      );
      throw error;
    }
  }

  async publish(event: IEvent, topic?: string): Promise<void> {
    const targetTopic = topic || this.defaultTopic;

    try {
      await this.nsqService.publish(targetTopic, event);
      this.logger.debug(`Published event to NSQ topic ${targetTopic}`);
    } catch (error) {
      this.logger.error(`Failed to publish event to NSQ topic ${targetTopic}`, error);
      await this.contingencyService.saveToFile([
        { type: 'event', topic: targetTopic, data: event },
      ]);
      throw error;
    }
  }
}


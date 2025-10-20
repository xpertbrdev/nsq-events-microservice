import { Injectable, Logger } from '@nestjs/common';
import { NsqPublisherService } from './nsq-publisher.service';
import { MetricsService } from './metrics.service';
import { IEvent } from '../interfaces/event.interface';

@Injectable()
export class EventProcessorService {
  private readonly logger = new Logger(EventProcessorService.name);

  constructor(
    private readonly nsqPublisher: NsqPublisherService,
    private readonly metricsService: MetricsService,
  ) {}

  async processSession(
    sessionId: string,
    events: IEvent[],
    topic?: string,
  ): Promise<void> {
    const startTime = Date.now();

    try {
      // Processar em batches
      const batches = this.createBatches(events, 10);

      for (const batch of batches) {
        await this.nsqPublisher.publishBatch(batch, topic);
      }

      const duration = Date.now() - startTime;
      await this.metricsService.recordSuccess(events.length, duration);

      this.logger.log(
        `Session ${sessionId} processed successfully: ${events.length} events in ${duration}ms to topic ${topic || 'default'}`,
      );
    } catch (error) {
      await this.metricsService.recordFailure(error, sessionId);
      this.logger.error(`Failed to process session ${sessionId}`, error);
      throw error;
    }
  }

  private createBatches<T>(items: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  }
}


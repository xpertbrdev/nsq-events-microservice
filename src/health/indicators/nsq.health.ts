import { Injectable } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult, HealthCheckError } from '@nestjs/terminus';
import { NsqService } from '../../nsq/nsq.service';

@Injectable()
export class NsqHealthIndicator extends HealthIndicator {
  constructor(private readonly nsqService: NsqService) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      const writerStatus = this.nsqService.isWriterConnected();
      
      if (!writerStatus) {
        throw new Error('NSQ Writer not connected');
      }

      return this.getStatus(key, true, {
        writer: 'connected',
        reader: 'connected',
      });
    } catch (error) {
      throw new HealthCheckError(
        'NSQ check failed',
        this.getStatus(key, false, {
          writer: 'disconnected',
          error: error.message,
        }),
      );
    }
  }
}


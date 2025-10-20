import { Injectable, Logger } from '@nestjs/common';
import { InjectRedis } from '@songkeys/nestjs-redis';
import Redis from 'ioredis';
import {
  IMetrics,
  IFailureRecord,
  IProcessingRecord,
} from '../interfaces/metrics.interface';

@Injectable()
export class MetricsService {
  private readonly logger = new Logger(MetricsService.name);
  private readonly METRICS_PREFIX = 'metrics:';
  private readonly FAILURES_PREFIX = 'failures:';
  private readonly ACTIVE_SESSIONS_KEY = 'metrics:active_sessions';
  private readonly RETENTION_DAYS = 7;

  constructor(@InjectRedis() private readonly redis: Redis) {}

  async incrementActiveSessions(): Promise<void> {
    await this.redis.incr(this.ACTIVE_SESSIONS_KEY);
  }

  async decrementActiveSessions(): Promise<void> {
    await this.redis.decr(this.ACTIVE_SESSIONS_KEY);
  }

  async getActiveSessions(): Promise<number> {
    const count = await this.redis.get(this.ACTIVE_SESSIONS_KEY);
    return parseInt(count || '0', 10);
  }

  async recordSuccess(eventCount: number, duration: number, sessionId: string): Promise<void> {
    const record: IProcessingRecord = {
      timestamp: new Date(),
      sessionId,
      eventCount,
      duration,
      success: true,
    };

    await this.recordProcessing(record);
  }

  async recordFailure(error: any, sessionId?: string): Promise<void> {
    const failureRecord: IFailureRecord = {
      timestamp: new Date(),
      sessionId: sessionId || 'unknown',
      error: error?.message || String(error),
      eventCount: 0,
    };

    const key = `${this.FAILURES_PREFIX}recent`;
    const timestamp = Date.now();

    await this.redis.zadd(key, timestamp, JSON.stringify(failureRecord));

    // Manter apenas as últimas 100 falhas
    await this.redis.zremrangebyrank(key, 0, -101);

    this.logger.error(`Failure recorded for session ${sessionId}`, error);
  }

  async recordProcessing(data: IProcessingRecord): Promise<void> {
    const key = `${this.METRICS_PREFIX}processing`;
    const timestamp = Date.now();

    await this.redis.zadd(key, timestamp, JSON.stringify(data));

    // Limpar registros antigos
    const cutoff = timestamp - this.RETENTION_DAYS * 24 * 60 * 60 * 1000;
    await this.redis.zremrangebyscore(key, 0, cutoff);
  }

  async getMetrics(): Promise<IMetrics> {
    const processingKey = `${this.METRICS_PREFIX}processing`;
    const now = Date.now();
    const oneHourAgo = now - 60 * 60 * 1000;

    // Buscar registros da última hora
    const records = await this.redis.zrangebyscore(
      processingKey,
      oneHourAgo,
      now,
    );

    const parsedRecords: IProcessingRecord[] = records.map((r) =>
      JSON.parse(r),
    );

    const totalEvents = parsedRecords.reduce(
      (sum, r) => sum + r.eventCount,
      0,
    );
    const successfulEvents = parsedRecords
      .filter((r) => r.success)
      .reduce((sum, r) => sum + r.eventCount, 0);
    const totalDuration = parsedRecords.reduce((sum, r) => sum + r.duration, 0);

    const recentFailures = await this.getRecentFailures();

    return {
      totalEvents,
      successRate:
        totalEvents > 0 ? (successfulEvents / totalEvents) * 100 : 0,
      averageDuration:
        parsedRecords.length > 0 ? totalDuration / parsedRecords.length : 0,
      eventsPerMinute: totalEvents / 60,
      deadLetterCount: recentFailures.length,
      recentFailures,
    };
  }

  async getRecentFailures(): Promise<IFailureRecord[]> {
    const key = `${this.FAILURES_PREFIX}recent`;
    const failures = await this.redis.zrevrange(key, 0, 9); // Últimas 10

    return failures.map((f) => JSON.parse(f));
  }
}


import { Injectable, Logger } from '@nestjs/common';
import { InjectRedis } from '@songkeys/nestjs-redis';
import Redis from 'ioredis';
import { EventSession } from '../entities/event-session.entity';
import { Event } from '../entities/event.entity';
import { SessionStatus } from '../enums/session-status.enum';
import { ContingencyService } from '../services/contingency.service';

@Injectable()
export class EventSessionRepository {
  private readonly logger = new Logger(EventSessionRepository.name);
  private readonly SESSION_PREFIX = 'session:';
  private readonly EVENTS_PREFIX = 'events:';
  private readonly SESSION_TTL = 60 * 60 * 24; // 24 hours

  constructor(
    @InjectRedis() private readonly redis: Redis,
    private readonly contingencyService: ContingencyService,
  ) {}

  async save(session: EventSession): Promise<void> {
    try {
      const key = `${this.SESSION_PREFIX}${session.id}`;

      await this.redis.hset(key, {
        id: session.id,
        userId: session.userId,
        status: session.status,
        createdAt: session.createdAt.toISOString(),
        eventCount: session.eventCount.toString(),
      });

      await this.redis.expire(key, this.SESSION_TTL);

      this.logger.debug(`Session ${session.id} saved to Redis`);
    } catch (error) {
      this.logger.error(`Failed to save session ${session.id} to Redis`, error);
      // Salvar na contingência sem abortar
      await this.contingencyService.saveToFile([
        { type: 'session', data: session },
      ]);
    }
  }

  async findById(sessionId: string): Promise<EventSession | null> {
    try {
      const key = `${this.SESSION_PREFIX}${sessionId}`;
      const data = await this.redis.hgetall(key);

      if (!data || Object.keys(data).length === 0) {
        return null;
      }

      return {
        id: data.id,
        userId: data.userId,
        status: data.status as SessionStatus,
        createdAt: new Date(data.createdAt),
        eventCount: parseInt(data.eventCount, 10),
      };
    } catch (error) {
      this.logger.error(`Failed to find session ${sessionId}`, error);
      return null;
    }
  }

  async addEvent(sessionId: string, event: Event): Promise<void> {
    try {
      const eventsKey = `${this.EVENTS_PREFIX}${sessionId}`;
      const sessionKey = `${this.SESSION_PREFIX}${sessionId}`;

      const pipeline = this.redis.pipeline();

      // Adicionar evento à lista
      pipeline.rpush(eventsKey, JSON.stringify(event));

      // Incrementar contador
      pipeline.hincrby(sessionKey, 'eventCount', 1);

      // Renovar TTL
      pipeline.expire(eventsKey, this.SESSION_TTL);
      pipeline.expire(sessionKey, this.SESSION_TTL);

      await pipeline.exec();

      this.logger.debug(`Event added to session ${sessionId}`);
    } catch (error) {
      this.logger.error(
        `Failed to add event to session ${sessionId}`,
        error,
      );
      // Salvar na contingência sem abortar
      await this.contingencyService.saveToFile([
        { type: 'event', sessionId, data: event },
      ]);
    }
  }

  async getEvents(sessionId: string): Promise<Event[]> {
    try {
      const key = `${this.EVENTS_PREFIX}${sessionId}`;
      const events = await this.redis.lrange(key, 0, -1);

      return events.map((e) => JSON.parse(e));
    } catch (error) {
      this.logger.error(
        `Failed to get events for session ${sessionId}`,
        error,
      );
      return [];
    }
  }

  async updateStatus(sessionId: string, status: SessionStatus): Promise<void> {
    try {
      const key = `${this.SESSION_PREFIX}${sessionId}`;
      await this.redis.hset(key, 'status', status);

      this.logger.debug(`Session ${sessionId} status updated to ${status}`);
    } catch (error) {
      this.logger.error(
        `Failed to update status for session ${sessionId}`,
        error,
      );
      // Salvar na contingência sem abortar
      await this.contingencyService.saveToFile([
        { type: 'status_update', sessionId, status },
      ]);
    }
  }

  async deleteSession(sessionId: string): Promise<void> {
    try {
      const sessionKey = `${this.SESSION_PREFIX}${sessionId}`;
      const eventsKey = `${this.EVENTS_PREFIX}${sessionId}`;

      await this.redis.del(sessionKey, eventsKey);

      this.logger.debug(`Session ${sessionId} deleted`);
    } catch (error) {
      this.logger.error(`Failed to delete session ${sessionId}`, error);
    }
  }
}


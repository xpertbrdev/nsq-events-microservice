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
  private readonly SESSION_CURRENT_PREFIX = 'session:current:';
  private readonly SESSION_COMMITTED_PREFIX = 'session:committed:';
  private readonly EVENTS_PREFIX = 'events:';
  private readonly SESSION_TTL = 60 * 60 * 24; // 24 hours
  private readonly COMMITTED_TTL = 60 * 60 * 24 * 7; // 7 days

  constructor(
    @InjectRedis() private readonly redis: Redis,
    private readonly contingencyService: ContingencyService,
  ) {}

  async save(session: EventSession): Promise<void> {
    try {
      // Sessões novas sempre vão para CURRENT
      const key = `${this.SESSION_CURRENT_PREFIX}${session.id}`;

      await this.redis.hset(key, {
        id: session.id,
        status: session.status,
        createdAt: session.createdAt.toISOString(),
        eventCount: session.eventCount.toString(),
        ambiente: session.ambiente,
        matrizId: session.matrizId,
        matrizCNPJ: session.matrizCNPJ,
        sender: session.sender,
        topic: session.topic || '',
      });

      await this.redis.expire(key, this.SESSION_TTL);

      this.logger.debug(`Session ${session.id} saved to CURRENT`);
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
      // Buscar primeiro em CURRENT
      let key = `${this.SESSION_CURRENT_PREFIX}${sessionId}`;
      let data = await this.redis.hgetall(key);

      // Se não encontrar, buscar em COMMITTED
      if (!data || Object.keys(data).length === 0) {
        key = `${this.SESSION_COMMITTED_PREFIX}${sessionId}`;
        data = await this.redis.hgetall(key);
      }

      if (!data || Object.keys(data).length === 0) {
        return null;
      }

      return {
        id: data.id,
        status: data.status as SessionStatus,
        createdAt: new Date(data.createdAt),
        eventCount: parseInt(data.eventCount, 10),
        ambiente: data.ambiente,
        matrizId: data.matrizId,
        matrizCNPJ: data.matrizCNPJ,
        sender: data.sender,
        topic: data.topic,
      };
    } catch (error) {
      this.logger.error(`Failed to find session ${sessionId}`, error);
      return null;
    }
  }

  async addEvent(sessionId: string, event: Event): Promise<void> {
    try {
      const eventsKey = `${this.EVENTS_PREFIX}${sessionId}`;
      const sessionKey = `${this.SESSION_CURRENT_PREFIX}${sessionId}`;

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
      const currentKey = `${this.SESSION_CURRENT_PREFIX}${sessionId}`;
      await this.redis.hset(currentKey, 'status', status);

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

  async moveToCommitted(sessionId: string): Promise<void> {
    try {
      const currentKey = `${this.SESSION_CURRENT_PREFIX}${sessionId}`;
      const committedKey = `${this.SESSION_COMMITTED_PREFIX}${sessionId}`;

      // Buscar dados da sessão em CURRENT
      const sessionData = await this.redis.hgetall(currentKey);

      if (!sessionData || Object.keys(sessionData).length === 0) {
        this.logger.warn(`Session ${sessionId} not found in CURRENT`);
        return;
      }

      // Adicionar timestamp de commit
      sessionData.committedAt = new Date().toISOString();

      const pipeline = this.redis.pipeline();

      // Copiar para COMMITTED
      pipeline.hset(committedKey, sessionData);
      pipeline.expire(committedKey, this.COMMITTED_TTL);

      // Remover de CURRENT
      pipeline.del(currentKey);

      await pipeline.exec();

      this.logger.log(`Session ${sessionId} moved from CURRENT to COMMITTED`);
    } catch (error) {
      this.logger.error(
        `Failed to move session ${sessionId} to COMMITTED`,
        error,
      );
      // Salvar na contingência sem abortar
      await this.contingencyService.saveToFile([
        { type: 'move_to_committed', sessionId },
      ]);
    }
  }

  async deleteEvents(sessionId: string): Promise<void> {
    try {
      const eventsKey = `${this.EVENTS_PREFIX}${sessionId}`;
      await this.redis.del(eventsKey);

      this.logger.debug(`Events deleted for session ${sessionId}`);
    } catch (error) {
      this.logger.error(`Failed to delete events for session ${sessionId}`, error);
    }
  }

  async deleteSession(sessionId: string): Promise<void> {
    try {
      const currentKey = `${this.SESSION_CURRENT_PREFIX}${sessionId}`;
      const committedKey = `${this.SESSION_COMMITTED_PREFIX}${sessionId}`;
      const eventsKey = `${this.EVENTS_PREFIX}${sessionId}`;

      await this.redis.del(currentKey, committedKey, eventsKey);

      this.logger.debug(`Session ${sessionId} deleted from both CURRENT and COMMITTED`);
    } catch (error) {
      this.logger.error(`Failed to delete session ${sessionId}`, error);
    }
  }
}


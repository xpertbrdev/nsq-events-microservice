import { Injectable, Logger } from '@nestjs/common';
import { InjectRedis } from '@songkeys/nestjs-redis';
import Redis from 'ioredis';

export interface StoredMessage {
  id: string;
  topic: string;
  channel: string;
  data: any;
  receivedAt: string;
  attempts: number;
}

@Injectable()
export class NsqMessageStorageService {
  private readonly logger = new Logger(NsqMessageStorageService.name);
  private readonly MESSAGES_PREFIX = 'nsq:messages:';
  private readonly MESSAGES_LIST_KEY = 'nsq:messages:list';
  private readonly MESSAGE_TTL = 60 * 60 * 24 * 7; // 7 days

  constructor(@InjectRedis() private readonly redis: Redis) {}

  async storeMessage(message: StoredMessage): Promise<void> {
    try {
      const messageKey = `${this.MESSAGES_PREFIX}${message.id}`;

      // Salvar mensagem como hash
      await this.redis.hset(messageKey, {
        id: message.id,
        topic: message.topic,
        channel: message.channel,
        data: JSON.stringify(message.data),
        receivedAt: message.receivedAt,
        attempts: message.attempts.toString(),
      });

      // Definir TTL
      await this.redis.expire(messageKey, this.MESSAGE_TTL);

      // Adicionar à lista ordenada por timestamp
      const timestamp = new Date(message.receivedAt).getTime();
      await this.redis.zadd(this.MESSAGES_LIST_KEY, timestamp, message.id);

      // Limpar mensagens antigas (manter últimas 1000)
      await this.redis.zremrangebyrank(this.MESSAGES_LIST_KEY, 0, -1001);

      this.logger.debug(`Message ${message.id} stored in Redis`);
    } catch (error) {
      this.logger.error(`Failed to store message ${message.id}`, error);
    }
  }

  async getAllMessages(limit: number = 100, offset: number = 0): Promise<StoredMessage[]> {
    try {
      // Buscar IDs das mensagens (mais recentes primeiro)
      const messageIds = await this.redis.zrevrange(
        this.MESSAGES_LIST_KEY,
        offset,
        offset + limit - 1,
      );

      if (messageIds.length === 0) {
        return [];
      }

      // Buscar dados de cada mensagem
      const messages: StoredMessage[] = [];

      for (const id of messageIds) {
        const messageKey = `${this.MESSAGES_PREFIX}${id}`;
        const data = await this.redis.hgetall(messageKey);

        if (data && Object.keys(data).length > 0) {
          messages.push({
            id: data.id,
            topic: data.topic,
            channel: data.channel,
            data: JSON.parse(data.data),
            receivedAt: data.receivedAt,
            attempts: parseInt(data.attempts, 10),
          });
        }
      }

      return messages;
    } catch (error) {
      this.logger.error('Failed to get messages from Redis', error);
      return [];
    }
  }

  async getMessageById(messageId: string): Promise<StoredMessage | null> {
    try {
      const messageKey = `${this.MESSAGES_PREFIX}${messageId}`;
      const data = await this.redis.hgetall(messageKey);

      if (!data || Object.keys(data).length === 0) {
        return null;
      }

      return {
        id: data.id,
        topic: data.topic,
        channel: data.channel,
        data: JSON.parse(data.data),
        receivedAt: data.receivedAt,
        attempts: parseInt(data.attempts, 10),
      };
    } catch (error) {
      this.logger.error(`Failed to get message ${messageId}`, error);
      return null;
    }
  }

  async getMessageCount(): Promise<number> {
    try {
      return await this.redis.zcard(this.MESSAGES_LIST_KEY);
    } catch (error) {
      this.logger.error('Failed to get message count', error);
      return 0;
    }
  }

  async deleteMessage(messageId: string): Promise<void> {
    try {
      const messageKey = `${this.MESSAGES_PREFIX}${messageId}`;
      
      await this.redis.del(messageKey);
      await this.redis.zrem(this.MESSAGES_LIST_KEY, messageId);

      this.logger.debug(`Message ${messageId} deleted`);
    } catch (error) {
      this.logger.error(`Failed to delete message ${messageId}`, error);
    }
  }

  async clearAllMessages(): Promise<void> {
    try {
      // Buscar todos os IDs
      const messageIds = await this.redis.zrange(this.MESSAGES_LIST_KEY, 0, -1);

      // Deletar todas as mensagens
      const pipeline = this.redis.pipeline();
      
      for (const id of messageIds) {
        pipeline.del(`${this.MESSAGES_PREFIX}${id}`);
      }
      
      pipeline.del(this.MESSAGES_LIST_KEY);
      
      await pipeline.exec();

      this.logger.log('All messages cleared from Redis');
    } catch (error) {
      this.logger.error('Failed to clear messages', error);
    }
  }
}


// src/nsq/nsq.service.ts
import { Injectable, OnModuleDestroy, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Writer } from 'nsqjs';

@Injectable()
export class NsqService implements OnModuleInit, OnModuleDestroy {
  private writer: Writer;
  private readonly logger = new Logger(NsqService.name);

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    const url: string = this.configService.get('NSQD_TCP_ADDR') || '127.0.0.1:4150';

    this.writer = new Writer(url.split(':')[0], Number.parseInt(url.split(':')[1]));
    this.writer.connect();

    this.writer.on('ready', () => {
      this.logger.log('NSQ Writer conectado');
    });

    this.writer.on('error', (err) => {
      this.logger.error('Erro no Writer:', err);
    });
  }

  async publish(topic: string, message: Record<string, any>): Promise<void> {
    if (!this.writer) {
      throw new Error('NSQ Writer não inicializado');
    }
    
    return new Promise((resolve, reject) => {
      this.writer.publish(topic, JSON.stringify(message), (err) => {
        if (err) {
          this.logger.error(`Erro ao publicar no tópico ${topic}:`, err);
          reject(err);
        } else {
          this.logger.debug(`Mensagem publicada no tópico ${topic}`);
          resolve();
        }
      });
    });
  }

  async publishBatch(topic: string, messages: Record<string, any>[]): Promise<void> {
    const promises = messages.map((msg) => this.publish(topic, msg));
    await Promise.all(promises);
  }

  onModuleDestroy() {
    if (this.writer) {
      this.writer.close();
      this.logger.log('NSQ Writer desconectado');
    }
  }
}


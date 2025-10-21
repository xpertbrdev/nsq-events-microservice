// src/nsq/nsq.consumer.ts
import { Injectable, OnModuleDestroy, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Message, Reader } from 'nsqjs';
import { NsqMessageStorageService } from './nsq-message-storage.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class NsqConsumer implements OnModuleInit, OnModuleDestroy {
  private reader: Reader;
  private readonly logger = new Logger(NsqConsumer.name);
  private topic: string;
  private channel: string;

  constructor(
    private configService: ConfigService,
    private messageStorage: NsqMessageStorageService,
  ) {}

  onModuleInit() {
    const url: string = this.configService.get('NSQLOOKUPD_HTTP_ADDR') || '127.0.0.1:4161';
    this.topic = this.configService.get('NSQ_TOPIC') || 'events';
    this.channel = this.configService.get('NSQ_CHANNEL') || 'events_channel';

    this.reader = new Reader(this.topic, this.channel, {
      lookupdHTTPAddresses: url,
    });

    this.reader.connect();

    this.reader.on('message', async (msg: Message) => {
      try {
        const data = JSON.parse(msg.body.toString());
        this.logger.log('Mensagem recebida do NSQ:', data);

        // Armazenar mensagem no Redis
        await this.messageStorage.storeMessage({
          id: uuidv4(),
          topic: this.topic,
          channel: this.channel,
          data,
          receivedAt: new Date().toISOString(),
          attempts: msg.attempts,
        });

        // Confirma o processamento
        msg.finish();
      } catch (error) {
        this.logger.error('Erro ao processar mensagem:', error);
        msg.requeue(1000);
      }
    });

    this.reader.on('error', (err) => {
      this.logger.error('Erro no Reader:', err);
    });

    this.logger.log(`NSQ Consumer conectado - Topic: ${this.topic}, Channel: ${this.channel}`);
  }

  onModuleDestroy() {
    if (this.reader) {
      this.reader.close();
      this.logger.log('NSQ Reader desconectado');
    }
  }
}


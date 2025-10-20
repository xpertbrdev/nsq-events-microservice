// src/nsq/nsq.consumer.ts
import { Injectable, OnModuleDestroy, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Message, Reader } from 'nsqjs';

@Injectable()
export class NsqConsumer implements OnModuleInit, OnModuleDestroy {
  private reader: Reader;
  private readonly logger = new Logger(NsqConsumer.name);

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    const url: string = this.configService.get('NSQLOOKUPD_HTTP_ADDR') || '127.0.0.1:4161';
    const topic: string = this.configService.get('NSQ_TOPIC') || 'events';
    const channel: string = this.configService.get('NSQ_CHANNEL') || 'events_channel';

    this.reader = new Reader(topic, channel, {
      lookupdHTTPAddresses: url,
    });

    this.reader.connect();

    this.reader.on('message', (msg: Message) => {
      try {
        const data = JSON.parse(msg.body.toString());
        this.logger.log('Mensagem recebida:', data);

        // Aqui você pode processar a mensagem conforme necessário
        // Por exemplo, emitir um evento ou chamar um serviço

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

    this.logger.log(`NSQ Consumer conectado - Topic: ${topic}, Channel: ${channel}`);
  }

  onModuleDestroy() {
    if (this.reader) {
      this.reader.close();
      this.logger.log('NSQ Reader desconectado');
    }
  }
}


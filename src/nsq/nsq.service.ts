// src/nsq/nsq.service.ts
import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Writer } from 'nsqjs';

@Injectable()
export class NsqService implements OnModuleDestroy {
  private writer: Writer;
  private ready = false
  private readonly logger = new Logger(NsqService.name);

  constructor(private configService: ConfigService) { }

  protected init() {
    const url: string = this.configService.get('NSQD_TCP_ADDR') || '127.0.0.1:4150';
    if (this.writer) {
      return
    }

    return new Promise((resolve) => {
      // Configure NSQ writer with options including a connection timeout
      const nsqOptions = {
        connectTimeout: 10000, // 10 seconds timeout for the connection
        messageTimeout: 10000, // 10 seconds timeout for publishing messages
      };

      const hostname = url.split(':')[0]
      const port = Number.parseInt(url.split(':')[1])

      this.writer = new Writer(hostname, port, nsqOptions);

      this.writer.on('ready', () => {
        this.logger.log('NSQ Writer Ready');
        this.ready = true
        resolve(true);
      });

      this.writer.on('error', (err) => {
        this.logger.error('NSQ Writer Error:', {}, err);
        this.writer = undefined
        this.ready = false
        resolve(false);
      });

      this.writer.on('closed', () => {
        this.logger.error('Writer closed');
        this.writer = undefined
        this.ready = false
        resolve(false);
      });

      // No need for try/catch here; errors are handled by the 'error' event
      this.writer.connect();

      console.log(`NSQ Writer iniciado com sucesso!`);
    });
  }

  async publish(topic: string, message: Record<string, any>): Promise<void> {
    await this.init()

    if (!this.ready) {
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

  isWriterConnected(): boolean {
    return this.writer && this.writer.ready;
  }

  onModuleDestroy() {
    if (this.writer) {
      this.writer.close();
      this.logger.log('NSQ Writer desconectado');
    }
  }
}


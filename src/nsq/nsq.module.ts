// src/nsq/nsq.module.ts
import { Module } from '@nestjs/common';
import { NsqConsumer } from './nsq.consumer';
import { NsqService } from './nsq.service';
import { NsqMessageStorageService } from './nsq-message-storage.service';
import { NsqMessagesController } from './nsq-messages.controller';

@Module({
  controllers: [NsqMessagesController],
  providers: [NsqService, NsqConsumer, NsqMessageStorageService],
  exports: [NsqService, NsqMessageStorageService],
})
export class NsqModule {}


// src/nsq/nsq.module.ts
import { Module } from '@nestjs/common';
import { NsqConsumer } from './nsq.consumer';
import { NsqService } from './nsq.service';

@Module({
  providers: [NsqService, NsqConsumer],
  exports: [NsqService],
})
export class NsqModule {}


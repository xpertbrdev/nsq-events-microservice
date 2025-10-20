import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { v4 as uuidv4 } from 'uuid';
import { SessionStatus } from '../enums/session-status.enum';
import { IEvent } from '../interfaces/event.interface';
import { ISession } from '../interfaces/session.interface';

@Injectable()
export class EventSessionService {
  private readonly logger = new Logger(EventSessionService.name);

  constructor(private readonly eventEmitter: EventEmitter2) { }

  createSession(
    filialId: string,
    filialCNPJ: string,
    ambiente: string,
    sender: string,
  ): ISession {
    const sessionId = uuidv4();

    // Criar tópico no formato: ambiente-matrizId-matrizCNPJ-sender
    const topic = `${ambiente}-${filialId}-${filialCNPJ}-${sender}`;

    const session: ISession = {
      id: sessionId,
      status: SessionStatus.ACTIVE,
      createdAt: new Date(),
      eventCount: 0,
      ambiente,
      matrizId: filialId,
      matrizCNPJ: filialCNPJ,
      sender,
      topic,
    };

    this.logger.log(
      `Session created: ${sessionId} with topic ${topic}`,
    );

    this.eventEmitter.emit('session.started', {
      sessionId,
      topic,
      timestamp: new Date(),
    });

    return session;
  }

  emitEventAdded(sessionId: string, event: IEvent): void {
    this.eventEmitter.emit('event.added', {
      sessionId,
      event,
      timestamp: new Date(),
    });
  }

  emitSessionCommitted(sessionId: string, eventCount: number): void {
    this.eventEmitter.emit('session.committed', {
      sessionId,
      eventCount,
      timestamp: new Date(),
    });
  }

  emitSessionRolledBack(sessionId: string): void {
    this.eventEmitter.emit('session.rolledback', {
      sessionId,
      timestamp: new Date(),
    });
  }
}


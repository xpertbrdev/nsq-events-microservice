import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { GetSessionEventsQuery } from '../impl/get-session-events.query';
import { EventSessionRepository } from '../../repositories/event-session.repository';
import { Event } from '../../entities/event.entity';

@QueryHandler(GetSessionEventsQuery)
export class GetSessionEventsHandler
  implements IQueryHandler<GetSessionEventsQuery, Event[]>
{
  constructor(
    private readonly sessionRepository: EventSessionRepository,
  ) {}

  async execute(query: GetSessionEventsQuery): Promise<Event[]> {
    const { sessionId } = query;

    const session = await this.sessionRepository.findById(sessionId);

    if (!session) {
      throw new NotFoundException(`Session ${sessionId} not found`);
    }

    return this.sessionRepository.getEvents(sessionId);
  }
}


import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { GetSessionStatusQuery } from '../impl/get-session-status.query';
import { EventSessionRepository } from '../../repositories/event-session.repository';
import { SessionStatusDto } from '../../dto/session-status.dto';

@QueryHandler(GetSessionStatusQuery)
export class GetSessionStatusHandler
  implements IQueryHandler<GetSessionStatusQuery, SessionStatusDto>
{
  constructor(
    private readonly sessionRepository: EventSessionRepository,
  ) {}

  async execute(query: GetSessionStatusQuery): Promise<SessionStatusDto> {
    const { sessionId } = query;

    const session = await this.sessionRepository.findById(sessionId);

    if (!session) {
      throw new NotFoundException(`Session ${sessionId} not found`);
    }

    return {
      sessionId: session.id,
      status: session.status,
      eventCount: session.eventCount,
      createdAt: session.createdAt,
    };
  }
}


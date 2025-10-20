import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { StartSessionCommand } from '../impl/start-session.command';
import { EventSessionRepository } from '../../repositories/event-session.repository';
import { EventSessionService } from '../../services/event-session.service';
import { MetricsService } from '../../services/metrics.service';
import { SessionResponseDto } from '../../dto/session-response.dto';

@CommandHandler(StartSessionCommand)
export class StartSessionHandler
  implements ICommandHandler<StartSessionCommand, SessionResponseDto>
{
  private readonly logger = new Logger(StartSessionHandler.name);

  constructor(
    private readonly sessionRepository: EventSessionRepository,
    private readonly sessionService: EventSessionService,
    private readonly metricsService: MetricsService,
  ) {}

  async execute(command: StartSessionCommand): Promise<SessionResponseDto> {
    const { userId } = command;

    // Criar sessão
    const session = this.sessionService.createSession(userId);

    // Salvar no Redis
    await this.sessionRepository.save(session);

    // Atualizar métricas
    await this.metricsService.incrementActiveSessions();

    this.logger.log(`Session ${session.id} started for user ${userId}`);

    return {
      sessionId: session.id,
      message: 'Session started successfully',
    };
  }
}


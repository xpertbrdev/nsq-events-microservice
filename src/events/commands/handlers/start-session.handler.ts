import { Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { SessionResponseDto } from '../../dto/session-response.dto';
import { EventSessionRepository } from '../../repositories/event-session.repository';
import { EventSessionService } from '../../services/event-session.service';
import { MetricsService } from '../../services/metrics.service';
import { StartSessionCommand } from '../impl/start-session.command';

@CommandHandler(StartSessionCommand)
export class StartSessionHandler
  implements ICommandHandler<StartSessionCommand, SessionResponseDto> {
  private readonly logger = new Logger(StartSessionHandler.name);

  constructor(
    private readonly sessionRepository: EventSessionRepository,
    private readonly sessionService: EventSessionService,
    private readonly metricsService: MetricsService,
  ) { }

  async execute(command: StartSessionCommand): Promise<SessionResponseDto> {
    const { filialId, filialCNPJ, ambiente, sender } = command;

    // Criar sessão com informações do tópico
    const session = this.sessionService.createSession(
      filialId,
      filialCNPJ,
      ambiente,
      sender,
    );

    // Salvar no Redis
    await this.sessionRepository.save(session);

    // Atualizar métricas
    await this.metricsService.incrementActiveSessions();

    this.logger.log(
      `Session ${session.id} started with topic ${session.topic}`,
    );

    return {
      sessionId: session.id,
      message: `Session started successfully with topic: ${session.topic}`,
    };
  }
}


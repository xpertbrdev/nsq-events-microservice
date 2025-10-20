import { BadRequestException, Logger, NotFoundException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { SessionStatus } from '../../enums/session-status.enum';
import { EventSessionRepository } from '../../repositories/event-session.repository';
import { EventProcessorService } from '../../services/event-processor.service';
import { EventSessionService } from '../../services/event-session.service';
import { MetricsService } from '../../services/metrics.service';
import { CommitSessionCommand } from '../impl/commit-session.command';

@CommandHandler(CommitSessionCommand)
export class CommitSessionHandler
  implements ICommandHandler<CommitSessionCommand, void> {
  private readonly logger = new Logger(CommitSessionHandler.name);

  constructor(
    private readonly sessionRepository: EventSessionRepository,
    private readonly sessionService: EventSessionService,
    private readonly eventProcessor: EventProcessorService,
    private readonly metricsService: MetricsService,
  ) { }

  async execute(command: CommitSessionCommand): Promise<void> {
    const { sessionId } = command;

    // Buscar sessão
    const session = await this.sessionRepository.findById(sessionId);

    if (!session) {
      throw new NotFoundException(`Session ${sessionId} not found`);
    }

    if (![SessionStatus.ACTIVE, SessionStatus.FAILED].includes(session.status)) {
      throw new BadRequestException(
        `Session ${sessionId} is not active (status: ${session.status})`,
      );
    }

    // Buscar eventos
    const events = await this.sessionRepository.getEvents(sessionId);

    if (events.length === 0) {
      this.logger.warn(`Session ${sessionId} has no events to process`);
      await this.sessionRepository.updateStatus(
        sessionId,
        SessionStatus.COMMITTED,
      );
      return;
    }

    try {
      // Atualizar status para PROCESSING
      await this.sessionRepository.updateStatus(
        sessionId,
        SessionStatus.PROCESSING,
      );

      // Processar eventos com o tópico da sessão
      await this.eventProcessor.processSession(sessionId, events, session.topic);

      // Atualizar status para COMMITTED
      await this.sessionRepository.updateStatus(
        sessionId,
        SessionStatus.COMMITTED,
      );

      // Emitir evento
      this.sessionService.emitSessionCommitted(sessionId, events.length);

      // Atualizar métricas
      await this.metricsService.decrementActiveSessions();

      this.logger.log(`Session ${sessionId} committed successfully`);
    } catch (error) {
      // Atualizar status para FAILED
      await this.sessionRepository.updateStatus(sessionId, SessionStatus.FAILED);

      this.logger.error(`Failed to commit session ${sessionId}`, error);
      throw error;
    }
  }
}


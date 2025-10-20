import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Logger, NotFoundException } from '@nestjs/common';
import { RollbackSessionCommand } from '../impl/rollback-session.command';
import { EventSessionRepository } from '../../repositories/event-session.repository';
import { EventSessionService } from '../../services/event-session.service';
import { MetricsService } from '../../services/metrics.service';
import { SessionStatus } from '../../enums/session-status.enum';

@CommandHandler(RollbackSessionCommand)
export class RollbackSessionHandler
  implements ICommandHandler<RollbackSessionCommand, void>
{
  private readonly logger = new Logger(RollbackSessionHandler.name);

  constructor(
    private readonly sessionRepository: EventSessionRepository,
    private readonly sessionService: EventSessionService,
    private readonly metricsService: MetricsService,
  ) {}

  async execute(command: RollbackSessionCommand): Promise<void> {
    const { sessionId } = command;

    // Buscar sessão
    const session = await this.sessionRepository.findById(sessionId);

    if (!session) {
      throw new NotFoundException(`Session ${sessionId} not found`);
    }

    // Atualizar status para ROLLED_BACK
    await this.sessionRepository.updateStatus(
      sessionId,
      SessionStatus.ROLLED_BACK,
    );

    // Mover sessão para COMMITTED (histórico)
    await this.sessionRepository.moveToCommitted(sessionId);

    // Deletar apenas os eventos (mantém sessão no COMMITTED para histórico)
    await this.sessionRepository.deleteEvents(sessionId);

    // Emitir evento
    this.sessionService.emitSessionRolledBack(sessionId);

    // Atualizar métricas
    await this.metricsService.decrementActiveSessions();

    this.logger.log(`Session ${sessionId} rolled back successfully`);
  }
}


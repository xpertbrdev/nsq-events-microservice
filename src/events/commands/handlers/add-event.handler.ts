import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { AddEventCommand } from '../impl/add-event.command';
import { EventSessionRepository } from '../../repositories/event-session.repository';
import { EventSessionService } from '../../services/event-session.service';
import { Event, EventData } from '../../entities/event.entity';
import { SessionStatus } from '../../enums/session-status.enum';

@CommandHandler(AddEventCommand)
export class AddEventHandler implements ICommandHandler<AddEventCommand, void> {
  private readonly logger = new Logger(AddEventHandler.name);

  constructor(
    private readonly sessionRepository: EventSessionRepository,
    private readonly sessionService: EventSessionService,
  ) {}

  async execute(command: AddEventCommand): Promise<void> {
    const { sessionId, eventDto } = command;

    // Buscar sessão
    const session = await this.sessionRepository.findById(sessionId);

    if (!session) {
      throw new NotFoundException(`Session ${sessionId} not found`);
    }

    if (session.status !== SessionStatus.ACTIVE) {
      throw new BadRequestException(
        `Session ${sessionId} is not active (status: ${session.status})`,
      );
    }

    // Criar EventData
    const eventData: EventData = {
      data: eventDto.data,
      method: eventDto.method,
      className: eventDto.className,
      unico: eventDto.unico,
      filialId: eventDto.filialId,
      filialCnpj: eventDto.filialCnpj,
    };

    // Criar evento com messageId
    const event: Event = {
      timestamp: new Date(),
      messageId: uuidv4(),
      data: eventData,
    };

    // Adicionar evento à sessão
    await this.sessionRepository.addEvent(sessionId, event);

    // Emitir evento
    this.sessionService.emitEventAdded(sessionId, event);

    this.logger.debug(
      `Event ${event.messageId} added to session ${sessionId}`,
    );
  }
}


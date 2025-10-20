import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { StartSessionDto } from '../dto/start-session.dto';
import { CreateEventDto } from '../dto/create-event.dto';
import { SessionResponseDto } from '../dto/session-response.dto';
import { SessionStatusDto } from '../dto/session-status.dto';
import { StartSessionCommand } from '../commands/impl/start-session.command';
import { AddEventCommand } from '../commands/impl/add-event.command';
import { CommitSessionCommand } from '../commands/impl/commit-session.command';
import { RollbackSessionCommand } from '../commands/impl/rollback-session.command';
import { GetSessionStatusQuery } from '../queries/impl/get-session-status.query';
import { GetSessionEventsQuery } from '../queries/impl/get-session-events.query';
import { Event } from '../entities/event.entity';

@Controller('events')
@ApiTags('Events')
export class EventsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post('sessions/start')
  @ApiOperation({ summary: 'Iniciar nova sessão de eventos' })
  @ApiResponse({
    status: 201,
    description: 'Sessão criada com sucesso',
    type: SessionResponseDto,
  })
  async startSession(
    @Body() dto: StartSessionDto,
  ): Promise<SessionResponseDto> {
    return this.commandBus.execute(
      new StartSessionCommand(
        dto.userId,
        dto.filialId,
        dto.filialCNPJ,
        dto.ambiente,
        dto.sender,
      ),
    );
  }

  @Post('sessions/:sessionId/events')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Adicionar evento à sessão' })
  @ApiResponse({ status: 204, description: 'Evento adicionado com sucesso' })
  @ApiResponse({ status: 404, description: 'Sessão não encontrada' })
  @ApiResponse({ status: 400, description: 'Sessão não está ativa' })
  async addEvent(
    @Param('sessionId') sessionId: string,
    @Body() dto: CreateEventDto,
  ): Promise<void> {
    return this.commandBus.execute(new AddEventCommand(sessionId, dto));
  }

  @Post('sessions/:sessionId/commit')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Finalizar e processar sessão' })
  @ApiResponse({ status: 204, description: 'Sessão processada com sucesso' })
  @ApiResponse({ status: 404, description: 'Sessão não encontrada' })
  @ApiResponse({ status: 400, description: 'Sessão não está ativa' })
  async commitSession(@Param('sessionId') sessionId: string): Promise<void> {
    return this.commandBus.execute(new CommitSessionCommand(sessionId));
  }

  @Post('sessions/:sessionId/rollback')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Cancelar sessão' })
  @ApiResponse({ status: 204, description: 'Sessão cancelada com sucesso' })
  @ApiResponse({ status: 404, description: 'Sessão não encontrada' })
  async rollbackSession(@Param('sessionId') sessionId: string): Promise<void> {
    return this.commandBus.execute(new RollbackSessionCommand(sessionId));
  }

  @Get('sessions/:sessionId/status')
  @ApiOperation({ summary: 'Obter status da sessão' })
  @ApiResponse({
    status: 200,
    description: 'Status da sessão',
    type: SessionStatusDto,
  })
  @ApiResponse({ status: 404, description: 'Sessão não encontrada' })
  async getSessionStatus(
    @Param('sessionId') sessionId: string,
  ): Promise<SessionStatusDto> {
    return this.queryBus.execute(new GetSessionStatusQuery(sessionId));
  }

  @Get('sessions/:sessionId/events')
  @ApiOperation({ summary: 'Listar eventos da sessão' })
  @ApiResponse({
    status: 200,
    description: 'Lista de eventos',
    type: [Event],
  })
  @ApiResponse({ status: 404, description: 'Sessão não encontrada' })
  async getSessionEvents(
    @Param('sessionId') sessionId: string,
  ): Promise<Event[]> {
    return this.queryBus.execute(new GetSessionEventsQuery(sessionId));
  }
}


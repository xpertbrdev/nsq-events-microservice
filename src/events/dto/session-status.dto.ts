import { ApiProperty } from '@nestjs/swagger';
import { SessionStatus } from '../enums/session-status.enum';

export class SessionStatusDto {
  @ApiProperty({ description: 'ID da sessão' })
  sessionId: string;

  @ApiProperty({ description: 'Status da sessão', enum: SessionStatus })
  status: SessionStatus;

  @ApiProperty({ description: 'Quantidade de eventos' })
  eventCount: number;

  @ApiProperty({ description: 'Data de criação' })
  createdAt: Date;
}


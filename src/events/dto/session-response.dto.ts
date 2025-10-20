import { ApiProperty } from '@nestjs/swagger';

export class SessionResponseDto {
  @ApiProperty({ description: 'ID da sessão' })
  sessionId: string;

  @ApiProperty({ description: 'Mensagem de status' })
  message?: string;
}


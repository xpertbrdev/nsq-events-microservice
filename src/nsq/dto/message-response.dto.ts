import { ApiProperty } from '@nestjs/swagger';

export class MessageResponseDto {
  @ApiProperty({ description: 'ID único da mensagem' })
  id: string;

  @ApiProperty({ description: 'Tópico NSQ de origem' })
  topic: string;

  @ApiProperty({ description: 'Canal NSQ' })
  channel: string;

  @ApiProperty({ description: 'Dados da mensagem' })
  data: any;

  @ApiProperty({ description: 'Data/hora de recebimento' })
  receivedAt: string;

  @ApiProperty({ description: 'Número de tentativas de processamento' })
  attempts: number;
}

export class MessagesListResponseDto {
  @ApiProperty({ type: [MessageResponseDto] })
  messages: MessageResponseDto[];

  @ApiProperty({ description: 'Total de mensagens armazenadas' })
  total: number;

  @ApiProperty({ description: 'Limite aplicado' })
  limit: number;

  @ApiProperty({ description: 'Offset aplicado' })
  offset: number;
}


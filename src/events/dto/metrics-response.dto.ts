import { ApiProperty } from '@nestjs/swagger';
import { IFailureRecord } from '../interfaces/metrics.interface';

export class MetricsResponseDto {
  @ApiProperty({ description: 'Total de eventos processados' })
  totalEvents: number;

  @ApiProperty({ description: 'Taxa de sucesso (%)' })
  successRate: number;

  @ApiProperty({ description: 'Duração média de processamento (ms)' })
  averageDuration: number;

  @ApiProperty({ description: 'Eventos por minuto' })
  eventsPerMinute: number;

  @ApiProperty({ description: 'Quantidade de mensagens na DLQ' })
  deadLetterCount: number;

  @ApiProperty({ description: 'Falhas recentes', type: [Object] })
  recentFailures: IFailureRecord[];
}


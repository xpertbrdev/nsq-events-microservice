import { Controller, Get } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { MetricsResponseDto } from '../dto/metrics-response.dto';
import { GetMetricsQuery } from '../queries/impl/get-metrics.query';

@Controller('metrics')
@ApiTags('Metrics')
export class MetricsController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get()
  @ApiOperation({ summary: 'Obter métricas do sistema' })
  @ApiResponse({
    status: 200,
    description: 'Métricas do sistema',
    type: MetricsResponseDto,
  })
  async getMetrics(): Promise<MetricsResponseDto> {
    return this.queryBus.execute(new GetMetricsQuery());
  }
}


import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetMetricsQuery } from '../impl/get-metrics.query';
import { MetricsService } from '../../services/metrics.service';
import { MetricsResponseDto } from '../../dto/metrics-response.dto';

@QueryHandler(GetMetricsQuery)
export class GetMetricsHandler
  implements IQueryHandler<GetMetricsQuery, MetricsResponseDto>
{
  constructor(private readonly metricsService: MetricsService) {}

  async execute(): Promise<MetricsResponseDto> {
    return this.metricsService.getMetrics();
  }
}


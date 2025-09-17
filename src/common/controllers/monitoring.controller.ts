import {
  Controller,
  Get,
  UseGuards
} from '@nestjs/common';
import {
  CacheMonitoringService,
  CacheMetrics
} from '../../cache/cache-monitoring.service';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth
} from '@nestjs/swagger';
import { AdminGuard } from '../guards/admin.guard';

/**
 * Інтерфейс для відповіді API
 */
interface CacheStatsResponse {
  metrics: CacheMetrics & { hitRate: number };
  topKeys: {
    key: string;
    hits: number;
    misses: number;
    hitRate: number;
  }[];
}

@ApiTags('Моніторинг')
@Controller('monitoring')
export class MonitoringController {
  constructor(
    private readonly cacheMonitoringService: CacheMonitoringService
  ) {}

  @Get('cache')
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Отримати статистику кешування'
  })
  getCacheStats(): CacheStatsResponse {
    return {
      metrics:
        this.cacheMonitoringService.getMetrics(),
      topKeys:
        this.cacheMonitoringService.getTopCacheKeys(
          10
        )
    };
  }
}

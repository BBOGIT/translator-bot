import { Module } from '@nestjs/common';
import {
  makeCounterProvider,
  makeGaugeProvider,
  makeHistogramProvider,
  PrometheusModule
} from '@willsoto/nestjs-prometheus';
import { MetricsService } from './metrics.service';

@Module({
  imports: [
    PrometheusModule.register({
      defaultMetrics: {
        enabled: true,
        config: {}
      }
    })
  ],
  providers: [
    MetricsService,
    // HTTP метрики
    makeCounterProvider({
      name: 'http_request_total',
      help: 'Total number of HTTP requests',
      labelNames: [
        'method',
        'path',
        'status_code'
      ]
    }),
    makeHistogramProvider({
      name: 'api_call_duration_seconds',
      help: 'API call duration in seconds',
      labelNames: ['method', 'path'],
      buckets: [0.01, 0.05, 0.1, 0.5, 1, 5, 10]
    }),
    makeGaugeProvider({
      name: 'http_request_in_progress',
      help: 'Number of HTTP requests in progress',
      labelNames: ['method', 'path']
    }),

    // Телеграм метрики
    makeCounterProvider({
      name: 'telegram_messages_total',
      help: 'Total number of Telegram messages',
      labelNames: ['type']
    }),
    makeGaugeProvider({
      name: 'active_users_total',
      help: 'Total number of active users'
    }),

    // Метрики перекладів
    makeCounterProvider({
      name: 'translations_total',
      help: 'Total number of translations',
      labelNames: ['type', 'language']
    }),

    // AI метрики
    makeHistogramProvider({
      name: 'ai_response_time_seconds',
      help: 'AI response time in seconds',
      labelNames: ['provider', 'operation_type'],
      buckets: [0.1, 0.5, 1, 2, 5, 10, 30]
    }),

    // Метрики помилок
    makeCounterProvider({
      name: 'errors_total',
      help: 'Total number of errors',
      labelNames: ['source', 'error_type']
    })
  ],
  exports: [MetricsService]
})
export class MetricsModule {}

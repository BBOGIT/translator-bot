import { Injectable } from '@nestjs/common';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import {
  Counter,
  Gauge,
  Histogram
} from 'prom-client';

@Injectable()
export class MetricsService {
  constructor(
    @InjectMetric('http_request_total')
    private readonly httpRequestCounter: Counter<string>,

    @InjectMetric('api_call_duration_seconds')
    private readonly apiCallDuration: Histogram<string>,

    @InjectMetric('http_request_in_progress')
    private readonly httpRequestInProgress: Gauge<string>,

    @InjectMetric('telegram_messages_total')
    private readonly telegramMessagesCounter: Counter<string>,

    @InjectMetric('active_users_total')
    private readonly activeUsersGauge: Gauge<string>,

    @InjectMetric('translations_total')
    private readonly translationsCounter: Counter<string>,

    @InjectMetric('ai_response_time_seconds')
    private readonly aiResponseTimeHistogram: Histogram<string>,

    @InjectMetric('errors_total')
    private readonly errorsCounter: Counter<string>
  ) {}

  // HTTP метрики
  incrementHttpRequest(
    method: string,
    path: string,
    statusCode: number
  ): void {
    this.httpRequestCounter.inc({
      method,
      path,
      status_code: statusCode.toString()
    });
  }

  trackApiCallDuration(
    method: string,
    path: string,
    durationMs: number
  ): void {
    this.apiCallDuration.observe(
      { method, path },
      durationMs / 1000
    );
  }

  incrementHttpRequestInProgress(
    method: string,
    path: string
  ): void {
    this.httpRequestInProgress.inc({
      method,
      path
    });
  }

  decrementHttpRequestInProgress(
    method: string,
    path: string
  ): void {
    this.httpRequestInProgress.dec({
      method,
      path
    });
  }

  // Телеграм метрики
  incrementTelegramMessages(
    messageType: string
  ): void {
    this.telegramMessagesCounter.inc({
      type: messageType
    });
  }

  setActiveUsers(count: number): void {
    this.activeUsersGauge.set(count);
  }

  // Метрики перекладів
  incrementTranslations(
    type: string,
    language: string
  ): void {
    this.translationsCounter.inc({
      type,
      language
    });
  }

  // AI метрики
  observeAiResponseTime(
    provider: string,
    operationType: string,
    durationMs: number
  ): void {
    this.aiResponseTimeHistogram.observe(
      { provider, operation_type: operationType },
      durationMs / 1000
    );
  }

  // Метрики помилок
  incrementErrors(
    source: string,
    errorType: string
  ): void {
    this.errorsCounter.inc({
      source,
      error_type: errorType
    });
  }
}

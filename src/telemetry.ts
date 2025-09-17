// import * as process from 'process';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { ConsoleSpanExporter } from '@opentelemetry/sdk-trace-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-proto';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import {
  diag,
  DiagConsoleLogger,
  DiagLogLevel
} from '@opentelemetry/api';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';

// Для детального логування під час налаштування
diag.setLogger(
  new DiagConsoleLogger(),
  DiagLogLevel.INFO
);

export const initializeOpenTelemetry = () => {
  try {
    // Пропускаємо ініціалізацію OpenTelemetry в режимі розробки,
    // якщо явно не включено змінною ENABLE_TELEMETRY
    if (
      process.env.NODE_ENV === 'development' &&
      !process.env.ENABLE_TELEMETRY
    ) {
      console.log(
        'OpenTelemetry initialization skipped in development. Set ENABLE_TELEMETRY=true to enable.'
      );
      return null;
    }

    // Використовуємо консольний експортер за замовчуванням, якщо OTEL_EXPORTER_OTLP_ENDPOINT не налаштовано
    const shouldUseOtlpExporter =
      !!process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
    if (!shouldUseOtlpExporter) {
      console.log(
        'OpenTelemetry OTLP exporter disabled. Using console exporter instead.'
      );
    }

    // Підготовка базової конфігурації SDK
    const resourceConfig = {
      [SemanticResourceAttributes.SERVICE_NAME]:
        'translator-bot',
      [SemanticResourceAttributes.SERVICE_VERSION]:
        process.env.npm_package_version ||
        '1.0.0',
      [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]:
        process.env.NODE_ENV || 'development'
    };

    const instrumentationsConfig =
      getNodeAutoInstrumentations({
        '@opentelemetry/instrumentation-express':
          { enabled: true },
        '@opentelemetry/instrumentation-http': {
          enabled: true
        },
        '@opentelemetry/instrumentation-pg': {
          enabled: true
        },
        '@opentelemetry/instrumentation-redis': {
          enabled: true
        },
        '@opentelemetry/instrumentation-nestjs-core':
          { enabled: true }
      });

    // Різна конфігурація залежно від наявності ендпоїнту OTLP
    let sdk;

    if (shouldUseOtlpExporter) {
      // Версія з повною телеметрією для OTLP
      sdk = new NodeSDK({
        resource: new Resource(resourceConfig),
        traceExporter: new OTLPTraceExporter({
          url: process.env
            .OTEL_EXPORTER_OTLP_ENDPOINT
        }),
        metricReader:
          new PeriodicExportingMetricReader({
            exporter: new OTLPMetricExporter({
              url: process.env
                .OTEL_EXPORTER_OTLP_ENDPOINT
            }),
            exportIntervalMillis: 60000
          }),
        instrumentations: [instrumentationsConfig]
      });
    } else {
      // Версія з консольним експортером і без відправки метрик
      sdk = new NodeSDK({
        resource: new Resource(resourceConfig),
        traceExporter: new ConsoleSpanExporter(),
        instrumentations: [instrumentationsConfig]
      });
    }

    // Запускаємо SDK
    sdk.start();
    console.log('OpenTelemetry initialized');

    // Обробка завершення роботи для закриття експортерів
    global.process.on('SIGTERM', async () => {
      try {
        await sdk.shutdown();
        console.log(
          'OpenTelemetry SDK shut down successfully'
        );
      } catch (error) {
        console.error(
          'Error shutting down OpenTelemetry SDK',
          error
        );
      } finally {
        process.exit(0);
      }
    });

    return sdk;
  } catch (error) {
    console.error(
      'Failed to initialize OpenTelemetry',
      error
    );
    return null;
  }
};

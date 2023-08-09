import * as winston from 'winston';
import { Logger } from 'winston';
import { LoggerLevelsEnum } from '../enums';
const DEFAULT_LOG_LEVEL = LoggerLevelsEnum.INFO;

export class LoggerWinstonService {
  private readonly _logger: Logger;
  constructor() {
    const configSettings = {
      ...process.env,
    };

    this._logger = winston.createLogger({
      exitOnError: false,
      format: winston.format.combine(
        winston.format.timestamp({ alias: '@timestamp' }),
        winston.format.errors({ stack: true }),
      ),
      defaultMeta: { logger: { service: configSettings['APP_NAME'] } },

      levels: {
        [LoggerLevelsEnum.ERROR]: 0,
        [LoggerLevelsEnum.WARN]: 1,
        [LoggerLevelsEnum.INFO]: 2,
        [LoggerLevelsEnum.VERBOSE]: 3,
        [LoggerLevelsEnum.DEBUG]: 4,
      },
    });

    if (configSettings['NODE_ENV'] !== 'production') {
      this._logger.add(
        new winston.transports.Console({
          level: configSettings['LOG_LEVEL'] || DEFAULT_LOG_LEVEL,
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.colorize(),
            winston.format.simple(),
          ),
        }),
      );
    } else {
      this._logger.add(
        new winston.transports.Console({
          level: configSettings['LOG_LEVEL'] || DEFAULT_LOG_LEVEL,
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json(),
          ),
        }),
      );
    }
  }

  get logger(): Logger {
    return this._logger;
  }
}

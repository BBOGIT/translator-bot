import { Logger } from 'winston';

import { LoggerLevelsEnum } from '../enums';
import { LoggerWinstonService } from './logger-winston';

function isObject(obj: any) {
    return obj !== null && typeof obj === 'object';
  }

export class LoggerService {
    private context: string = '';
    private readonly logger: Logger;
  
    constructor() {
      this.logger = new LoggerWinstonService().logger;
    }
  
    private static getFullLogMessage(
      method: string,
      message?: string | Record<string, any> | [],
    ): string {
      method = method.length === 0 ? method : `${method}()`;
      return `${method}  ${
        typeof message === 'object' ? JSON.stringify(message) : message
      }`;
    }
  
    public setContext(context = 'System'): void {
      this.context = context;
    }
  
    public info(
      method: string,
      message?: string | Record<string, any> | [],
      meta?: string | Record<string, any> | unknown,
    ): void {
      this.callMethod(LoggerLevelsEnum.INFO, method, message, meta);
    }
  
    public error(
      method: string,
      error: string | Error,
      meta?: string | Record<string, any> | Error,
      context?: string,
    ): void {
      if (error instanceof Error) {
        if (isObject(error.message)) {
          error.message = JSON.stringify(error.message);
        }
        this.logger.error(
          LoggerService.getFullLogMessage(
            method,
            `Error: ${JSON.stringify(error.message)}`,
          ),
          {
            context: context || this.context,
            stack: error.stack,
            meta,
          },
        );
  
        return;
      }
  
      const errorMeta: any = {};
      if (meta) {
        if (typeof meta === 'string') {
          errorMeta.stack = meta;
        } else if (meta instanceof Error) {
          if (isObject(meta.message)) {
            meta.message = JSON.stringify(meta.message);
          }
          errorMeta.stack = meta.stack;
        } else {
          errorMeta.meta = meta;
        }
      }
      this.logger.error(
        LoggerService.getFullLogMessage(method, `Error: ${error}`),
        {
          context: this.context
        },
      );
    }
  
    public warn(
      method: string,
      message: string | Record<string, any> | [],
      meta?: string | Record<string, any>,
    ): void {
      this.callMethod(LoggerLevelsEnum.WARN, method, message, meta);
    }
  
    public debug(
      method: string,
      message: string | Record<string, any> | [],
      meta?: string | Record<string, any>,
    ): void {
      this.callMethod(LoggerLevelsEnum.DEBUG, method, message, meta);
    }
  
    public verbose(
      method: string,
      message: string | Record<string, any> | [],
      meta?: string | Record<string, any>,
    ): void {
      this.callMethod(LoggerLevelsEnum.VERBOSE, method, message, meta);
    }
  
    public log(
      method: string,
      message: string | Record<string, any> | [],
      meta?: string | Record<string, any>,
    ): void {
      this.callMethod(LoggerLevelsEnum.INFO, method, message, meta);
    }
  
    private callMethod(
      logLevel: string,
      method: string,
      message?: string | Record<string, any> | [],
      meta?: string | Record<string, any> | unknown,
    ): void {
      const fullLogMessage = LoggerService.getFullLogMessage(method, message);
  
      if (typeof meta === 'string') {
        (this.logger as any)[logLevel](fullLogMessage, {
          context: this.context,
          meta,
        });
        return;
      }
  
      if (meta !== null && typeof meta === 'object') {
        (this.logger as any)[logLevel](fullLogMessage, {
          context: this.context,
          meta: meta,
        });
        return;
      }
      (this.logger as any)[logLevel](fullLogMessage, { context: this.context });
    }
  }
  
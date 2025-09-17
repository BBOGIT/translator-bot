/**
 * Base error class for all application errors
 */
export class AppError extends Error {
  /**
   * HTTP status code associated with this error
   */
  public readonly statusCode: number;

  /**
   * Error code for client-side error handling
   */
  public readonly errorCode: string;

  /**
   * Whether this error should be reported to monitoring systems
   */
  public readonly reportable: boolean;

  /**
   * Original error that caused this error (for wrapping)
   */
  public readonly cause?: Error;

  /**
   * Additional context data for error reporting
   */
  public readonly context: Record<
    string,
    unknown
  >;

  constructor(
    message: string,
    options: {
      statusCode?: number;
      errorCode?: string;
      reportable?: boolean;
      cause?: Error;
      context?: Record<string, unknown>;
    } = {}
  ) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = options.statusCode || 500;
    this.errorCode =
      options.errorCode || this.constructor.name;
    this.reportable =
      options.reportable !== false;
    this.cause = options.cause;
    this.context = options.context || {};

    // Capture stack trace correctly in Node.js
    if (Error.captureStackTrace) {
      Error.captureStackTrace(
        this,
        this.constructor
      );
    }
  }

  /**
   * Get error details for logging or serialization
   */
  public getDetails(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      statusCode: this.statusCode,
      errorCode: this.errorCode,
      stack: this.stack,
      cause: this.cause
        ? {
            name: this.cause.name,
            message: this.cause.message,
            stack: this.cause.stack
          }
        : undefined,
      context: this.context
    };
  }
}

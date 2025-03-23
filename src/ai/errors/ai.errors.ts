export class AIServiceError extends Error {
    constructor(
      message: string,
      public readonly originalError?: Error
    ) {
      super(message);
      this.name = 'AIServiceError';
    }
  }
  
  export class AIValidationError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'AIValidationError';
    }
  }
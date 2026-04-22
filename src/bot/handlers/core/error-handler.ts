import { Logger } from '@nestjs/common';
import { MessageService } from '../../../message/message.service';

// Create a logger for error handling
const logger = new Logger('BotErrorHandler');

/**
 * Send a standardized error message to the user
 *
 * @param chatId - The chat ID to send the message to
 * @param lang - The language code
 * @param messageService - The message service to use
 * @param customMessage - Optional custom error message
 */
export async function sendErrorMessage(
  chatId: string,
  lang: string,
  messageService: MessageService,
  customMessage?: string
): Promise<void> {
  try {
    await messageService.TelegramSendMessage({
      chatId,
      templateName: 'errorMessage',
      lang,
      dynamicVariables: {
        errorMessage:
          customMessage ||
          'Щось пішло не так. Спробуйте пізніше.'
      }
    });
  } catch (error) {
    logger.error(
      `Failed to send error message to chat ${chatId}: ${(error as Error).message}`,
      (error as Error).stack
    );
  }
}

/**
 * Log an error with standardized format
 *
 * @param message - Error message
 * @param error - Error object
 * @param context - Optional context data
 */
export function logError(
  message: string,
  error: unknown,
  context: Record<string, unknown> = {}
): void {
  const errorMessage =
    typeof error === 'object' &&
    error !== null &&
    'message' in error
      ? String(error.message)
      : 'Unknown error';
  const errorStack =
    typeof error === 'object' &&
    error !== null &&
    'stack' in error
      ? String(error.stack)
      : undefined;

  const errorDetails = {
    message: errorMessage,
    stack: errorStack,
    ...context
  };

  logger.error(
    `${message}: ${errorDetails.message}`,
    JSON.stringify(errorDetails)
  );
}

/**
 * Wraps a command execution in try/catch with standardized error handling
 *
 * @param callback - The async function to execute
 * @param errorMessage - Message to log on error
 * @param chatId - The chat ID to send error message to
 * @param lang - The language code
 * @param messageService - The message service
 * @param context - Additional context for logging
 */
export async function withErrorHandling<T>(
  callback: () => Promise<T>,
  errorMessage: string,
  chatId: string,
  lang: string,
  messageService: MessageService,
  context: Record<string, unknown> = {}
): Promise<T | void> {
  try {
    return await callback();
  } catch (error) {
    logError(errorMessage, error, context);
    await sendErrorMessage(
      chatId,
      lang,
      messageService
    );
    return;
  }
}

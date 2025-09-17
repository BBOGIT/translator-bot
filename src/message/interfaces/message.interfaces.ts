export interface MessageTemplate {
  name: string;
  channel: string;
  description: string;
  body: string;
}

export type ValueType =
  | string
  | unknown[]
  | Record<string, unknown>;

export type AttributesData = Record<
  string,
  ValueType
>;

export interface TelegramSuccessResponse {
  ok: true;
  result?: unknown;
}

export interface ErrorResponse {
  ok: false;
  error: string;
  error_code?: number;
  description?: string;
}

export interface TelegramErrorResponse
  extends ErrorResponse {
  // Extends the basic error response with specific fields if needed
}

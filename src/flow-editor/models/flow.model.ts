/**
 * Represents a message template
 */
export interface MessageTemplate {
  id: string;
  name: string;
  description: string;
  channel: string;
  body: string;
}

/**
 * Represents a message attribute
 */
export interface MessageAttribute {
  id: string;
  name: string;
  description: string;
  value: Record<string, string>;
}

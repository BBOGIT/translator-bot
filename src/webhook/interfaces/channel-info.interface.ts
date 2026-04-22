/**
 * Інтерфейс для інформації про канал з пересланого повідомлення
 */
export interface ChannelInfo {
  /** ID каналу */
  id: string;

  /** Назва каналу */
  title?: string;

  /** Username каналу (@channel_name) */
  username?: string;

  /** Тип чату (завжди 'channel' для каналів) */
  type: 'channel';

  /** Додаткові властивості каналу */
  description?: string;
  invite_link?: string;
  pinned_message?: boolean;
}

/**
 * Розширена інформація про пересланий канал з повним контекстом
 */
export interface ForwardedChannelInfo extends ChannelInfo {
  /** Дата створення каналу */
  date?: number;

  /** ID повідомлення в оригінальному каналі */
  message_id?: number;

  /** Підпис автора повідомлення */
  author_signature?: string;

  /** Чи є канал супергрупою */
  is_supergroup?: boolean;
}
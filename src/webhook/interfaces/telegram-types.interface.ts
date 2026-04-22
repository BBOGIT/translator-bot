/**
 * Типи для Telegram API об'єктів
 * Використовуються замість Record<string, any> для кращої типобезпеки
 */

/**
 * Базовий інтерфейс для Telegram Chat
 */
export interface TelegramChat {
  /** Unique identifier for this chat */
  id: number;

  /** Type of chat: 'private', 'group', 'supergroup', 'channel' */
  type: 'private' | 'group' | 'supergroup' | 'channel';

  /** Title for supergroups, channels and group chats */
  title?: string;

  /** Username for private chats, supergroups and channels */
  username?: string;

  /** First name of the other party in a private chat */
  first_name?: string;

  /** Last name of the other party in a private chat */
  last_name?: string;

  /** Description for groups, supergroups and channel chats */
  description?: string;

  /** Primary invite link for groups, supergroups and channel chats */
  invite_link?: string;

  /** Pinned message for groups, supergroups and channel chats */
  pinned_message?: unknown; // Рекурсивний тип Message

  /** Chat permissions for groups and supergroups */
  permissions?: TelegramChatPermissions;
}

/**
 * Права доступу в чаті
 */
export interface TelegramChatPermissions {
  can_send_messages?: boolean;
  can_send_media_messages?: boolean;
  can_send_polls?: boolean;
  can_send_other_messages?: boolean;
  can_add_web_page_previews?: boolean;
  can_change_info?: boolean;
  can_invite_users?: boolean;
  can_pin_messages?: boolean;
}

/**
 * Telegram File об'єкт
 */
export interface TelegramFile {
  /** Identifier for this file */
  file_id: string;

  /** Unique identifier for this file */
  file_unique_id: string;

  /** File size in bytes */
  file_size?: number;

  /** File path for downloading */
  file_path?: string;
}

/**
 * Розширений File з метаданими
 */
export interface TelegramMediaFile extends TelegramFile {
  /** Original filename as defined by sender */
  file_name?: string;

  /** MIME type of the file */
  mime_type?: string;

  /** Document thumbnail */
  thumbnail?: TelegramPhotoSize;
}

/**
 * Photo size інформація
 */
export interface TelegramPhotoSize {
  /** Identifier for this file */
  file_id: string;

  /** Unique identifier for this file */
  file_unique_id: string;

  /** Photo width */
  width: number;

  /** Photo height */
  height: number;

  /** File size in bytes */
  file_size?: number;
}

/**
 * Animation інформація (GIF, H.264/MPEG-4 AVC)
 */
export interface TelegramAnimation extends TelegramFile {
  /** Video width */
  width: number;

  /** Video height */
  height: number;

  /** Duration of the video in seconds */
  duration: number;

  /** Animation thumbnail */
  thumbnail?: TelegramPhotoSize;

  /** Original animation filename */
  file_name?: string;

  /** MIME type of the file */
  mime_type?: string;
}

/**
 * Premium animation sticker
 */
export interface TelegramPremiumAnimation extends TelegramAnimation {
  /** Premium sticker type */
  premium_type?: string;

  /** Additional premium features */
  premium_features?: string[];
}
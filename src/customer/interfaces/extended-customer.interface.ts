import { Customer } from '@prisma/client';

/**
 * Розширений інтерфейс Customer з додатковими полями
 * Використовується замість (customer as any) для типобезпеки
 */
export interface ExtendedCustomer extends Omit<Customer, 'repetitionTime'> {
  /** Час повторення слів у форматі HH:mm */
  repetitionTime?: string;

  /** Додаткові налаштування користувача */
  settings?: {
    /** Мова інтерфейсу */
    language?: string;

    /** Часовий пояс */
    timezone?: string;

    /** Кількість слів для повторення за раз */
    wordsPerSession?: number;

    /** Увімкнені сповіщення */
    notificationsEnabled?: boolean;
  };

  /** Статистика користувача */
  stats?: {
    /** Загальна кількість вивчених слів */
    totalWordsLearned?: number;

    /** Кількість днів поспіль навчання */
    streakDays?: number;

    /** Остання дата активності */
    lastActiveDate?: Date;
  };

  /** Додаткові дані профілю */
  profile?: {
    /** Рівень володіння мовою */
    languageLevel?: 'beginner' | 'intermediate' | 'advanced';

    /** Цільова мова для вивчення */
    targetLanguage?: string;

    /** Рідна мова */
    nativeLanguage?: string;
  };
}

/**
 * Тип для часткового оновлення Customer
 */
export type CustomerUpdate = Partial<Pick<ExtendedCustomer,
  | 'repetitionTime'
  | 'settings'
  | 'stats'
  | 'profile'
  | 'state'
  | 'firstName'
  | 'lastName'
  | 'channel'
>>;

/**
 * Type guard для перевірки чи є об'єкт ExtendedCustomer
 */
export function isExtendedCustomer(
  customer: unknown
): customer is ExtendedCustomer {
  return (
    typeof customer === 'object' &&
    customer !== null &&
    'id' in customer &&
    'chatId' in customer &&
    'createdAt' in customer
  );
}

/**
 * Utility функція для безпечного отримання repetitionTime
 */
export function getRepetitionTime(
  customer: Customer | ExtendedCustomer,
  defaultTime: string = '20:00'
): string {
  if (isExtendedCustomer(customer) && customer.repetitionTime) {
    return customer.repetitionTime;
  }
  return defaultTime;
}

/**
 * Utility функція для безпечного отримання налаштувань
 */
export function getCustomerSettings(
  customer: Customer | ExtendedCustomer
): ExtendedCustomer['settings'] {
  if (isExtendedCustomer(customer)) {
    return customer.settings;
  }
  return undefined;
}
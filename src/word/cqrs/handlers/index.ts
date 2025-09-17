// Експорт обробників запитів
export * from './queries/get-word.handler';
export * from './queries/get-learned-words.handler';
export * from './queries/get-words-for-repetition.handler';

// Експорт обробників команд
export * from './commands/create-word.handler';
export * from './commands/update-word-repetition.handler';
export * from './commands/update-word-notification.handler';

// Масиви обробників для реєстрації в модулі
import { GetWordHandler } from './queries/get-word.handler';
import { GetLearnedWordsHandler } from './queries/get-learned-words.handler';
import { GetWordsForRepetitionHandler } from './queries/get-words-for-repetition.handler';
import { CreateWordHandler } from './commands/create-word.handler';
import { UpdateWordRepetitionHandler } from './commands/update-word-repetition.handler';
import { UpdateWordNotificationHandler } from './commands/update-word-notification.handler';

export const QueryHandlers = [
  GetWordHandler,
  GetLearnedWordsHandler,
  GetWordsForRepetitionHandler
];

export const CommandHandlers = [
  CreateWordHandler,
  UpdateWordRepetitionHandler,
  UpdateWordNotificationHandler
];

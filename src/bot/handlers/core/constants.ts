/**
 * Bot command constants to avoid string literals throughout the codebase
 */
export const COMMANDS = {
  // Basic navigation commands
  START: '/start',
  MAIN_MENU: '/mainMenu',

  // Learning commands
  LEARN_WORDS: '/learnWords',
  I_KNOW_WORD: '/iKnowWord_',
  LEARN_WORD: '/learnWord_',
  CHECK_TRANSLATION: '/checkTranslation',

  // Progress tracking commands
  MY_PROGRESS: '/myProgress',

  // Repetition commands
  REPEAT_WORDS: '/repeatWords',
  REPEAT_WORDS_NOW: '/repeatWordsNow',
  REPEAT_WORDS_SCHEDULE: '/repeatWordsSchedule',
  REPEAT_WORDS_SCHEDULE_WEEK:
    '/repeatWordsScheduleWeek',
  REPEAT_WORDS_SCHEDULE_MONTH:
    '/repeatWordsScheduleMonth',
  VIEW_SETTINGS: '/viewSettings',

  // Word navigation during repetition
  PREVIOUS_WORD: '/previousWord_',
  NEXT_WORD: '/nextWord_',
  I_HAVE_LEARNED_BUTTON: '/iHaveLearnedButton_',
  I_NEED_TO_LEARN: '/iNeedToLearn_',

  // Pagination
  PREVIOUS_PAGE: '/previousPage_',
  NEXT_PAGE: '/nextPage_',
  CURRENT_PAGE: 'currentPage'
};

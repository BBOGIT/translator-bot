export enum CustomerState {
  WelcomeMessage = 'welcomeMessage',
  MainMenu = 'mainMenu',
  WaitingForWord = 'waitingForWord',
  WaitingForTranslation = 'waitingForTranslation',
  RepeatWordsMain = 'repeatWordsMain',
  RepeatWordsNow = 'repeatWordsNow'
}

export interface Customer {
  id: number;
  createdAt: Date;
  updatedAt: Date;
  chatId: string;
  state: string;
  firstName: string;
  lastName: string;
  channel: string;
}

export interface Word {
  word: string;
  translation: string;
  videoExample?: string;
  customerId: string;
  needToLearn: boolean;
}

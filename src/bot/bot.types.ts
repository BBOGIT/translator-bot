export enum CustomerState {
  WelcomeMessage = 'welcomeMessage',
  MainMenu = 'mainMenu',
  WaitingForWord = 'waitingForWord',
  WaitingForTranslation = 'waitingForTranslation',
  RepeatWordsMain = 'repeatWordsMain',
  RepeatWordsNow = 'repeatWordsNow',
  WaitingForWordInput = 'waitingForWordInput'
}

export interface Customer {
  id: number;
  createdAt: Date;
  updatedAt: Date;
  chatId: string;
  state: CustomerState;
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

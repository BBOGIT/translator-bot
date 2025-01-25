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

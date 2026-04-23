export interface Word {
  id: number;
  word: string;
  translation: string;
  examples: string[];
  needToLearn: boolean;
  createdAt: string;
  customerId?: number;
  intervalNumber?: number;
  nextRepetitionDate?: string;
}

export interface WordStats {
  total: number;
  learned: number;
  dueToday: number;
  streak: number;
  weeklyActivity: number[];
}

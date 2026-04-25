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
  imageExample?: string | null;
  videoExample?: string | null;
}

export interface WordStats {
  total: number;
  learned: number;
  dueToday: number;
  streak: number;
  weeklyActivity: number[];
}

import {
  ChannelEnum,
  CustomerState
} from '../enum';
import { Word } from '@prisma/client';

export type Customer = {
  id: number;
  chatId: string;
  state: CustomerState;
  firstName: string | null;
  lastName: string | null;
  channel: ChannelEnum | null;
  repetitionTime: string | null;
  notificationsEnabled: boolean;
  streak: number;
  lastActiveDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
  words?: Word[];
};

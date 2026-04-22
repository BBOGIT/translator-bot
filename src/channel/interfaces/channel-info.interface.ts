export interface ChannelInfo {
  id: string;
  title?: string;
  username?: string;
}

export interface ForwardOrigin {
  type: string;
  date: number;
  chat?: {
    id: number;
    title?: string;
    username?: string;
    type: string;
  };
  message_id?: number;
}

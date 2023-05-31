export interface ITelegramWebhook {
chat: {
    id: number;
    first_name: string;
    last_name: string;
    username: string;
    type: string;
};
from: {
    id: number;
    first_name: string;
    last_name: string;
    username: string;
    language_code: string;
};
message_id: number;
text: string;
}
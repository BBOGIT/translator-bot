interface Message {
  from: {
    id: number;
    first_name?: string | null;
    last_name?: string | null;
    language_code: string;
  };
  location?: {
    latitude: number;
    longitude: number;
  };
  document?: {
    file_name: string;
  };
  sticker?: {
    emoji: string;
  };
  photo?: Array<any>;
  audio?: {
    title: string;
    performer?: string;
  };
  voice?: any;
  animation?: {
    file_name: string;
  };
  video?: any;
  contact?: {
    phone_number: string;
  };
  text?: string;
  caption?: string;
}

interface CallbackQuery {
  from: {
    id: number;
    first_name?: string | null;
    last_name?: string | null;
    language_code: string;
  };
  data: string;
}

interface EditedMessage {
  from: {
    id: number;
    first_name?: string | null;
    last_name?: string | null;
    language_code: string;
  };
  caption?: string;
  text?: string;
  animation?: {
    file_name: string;
  };
}

interface WebhookBody {
  body: {
    message?: Message;
    callback_query?: CallbackQuery;
    edited_message?: EditedMessage;
  };
}

interface TelegramWebhookResponse {
  chatId: string;
  lang: string;
  webhookType: string;
  text: string | null;
  firstName: string | null;
  lastName: string | null;
  channel: string;
}

async function telegramWebhook({ body }: WebhookBody): Promise<TelegramWebhookResponse> {
  let chatId: string, lang: string, text: string | null, webhookType: string, firstName: string | null, lastName: string | null, channel: string = 'telegram'; 

  if (body.message) {
    const {
      from,
      location,
      document,
      sticker,
      photo,
      audio,
      voice,
      animation,
      video,
      contact
    } = body.message;
    chatId = String(from.id);
    firstName = from.first_name || null;
    lastName = from.last_name || null;
    lang = from.language_code;

    if (location) {
      text = `${location.latitude},${location.longitude}`;
      webhookType = "location";
    } else if (document) {
      text = document.file_name;
      if (body.message.caption) {
        text += ` ${body.message.caption}`;
      }
      webhookType = "document";
    } else if (sticker) {
      text = sticker.emoji;
      webhookType = "sticker";
    } else if (photo) {
      text = body.message.caption || null;
      webhookType = "photo";
    } else if (audio) {
      text = audio.title;
      if (audio.performer) {
        text += ` ${audio.performer}`;
      }
      if (body.message.caption) {
        text += ` ${body.message.caption}`;
      }
      webhookType = "audio";
    } else if (voice) {
      text = null;
      webhookType = "voice";
    } else if (animation) {
      text = animation.file_name;
      webhookType = "animation";
    } else if (video) {
      text = body.message.caption || null;
      webhookType = "video";
    } else if (contact) {
      text = contact.phone_number;
      webhookType = "contact";
    } else {
      text = body.message.text;
      webhookType = "text";
    }
  } else if (body.callback_query) {
    const {
      from
    } = body.callback_query;
    chatId = String(from.id);
    firstName = from.first_name || null;
    lastName = from.last_name || null;
    lang = from.language_code;
    text = body.callback_query.data;
    webhookType = "callback_query";
  } else if (body.edited_message) {
    const {
      from,
      animation
    } = body.edited_message;
    chatId = String(from.id);
    firstName = from.first_name || null;
    lastName = from.last_name || null;
    lang = from.language_code;

    if (animation) {
      text = body.edited_message.caption;
      webhookType = "animation";
    } else {
      text = body.edited_message.text;
      webhookType = "text";
    }
  } else {
    console.log('Unknown hook type. Need to be added to processing types');
    throw new Error('Unknown hook type');
  }

  return {
    chatId,
    lang,
    webhookType,
    text,
    firstName,
    lastName,
    channel
  };
}

export = telegramWebhook;
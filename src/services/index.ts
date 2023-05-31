async function TelegramWebhook({ body }) {
    let chatId: string;
    let lang: string;
    let text: string;
    let webhookType: string;
    let firstName: string;
    let lastName: string;
  
    switch (true) {
      case !!body.message: {
        chatId = String(body.message.from.id);
        firstName = body.message.from.first_name ?? null;
        lastName = body.message.from.last_name ?? null;
        lang = body.message.from.language_code;
        switch (true) {
          case !!body.message.location: {
            text = `${body.message.location.latitude},${body.message.location.longitude}`;
            webhookType = "location";
            break;
          }
          // check for document hook
          case !!body.message.document: {
            text = body.message.document.file_name;
            // check for file caption
            if (body.message.caption) {
              text += ` ${body.message.caption}`;
            }
            webhookType = "document";
            break;
          }
          case !!body.message.sticker: {
            text = body.message.sticker.emoji;
            webhookType = "sticker";
            break;
          }
          case !!body.message.photo: {
            text = body.message.caption || null;
            webhookType = "photo";
            break;
          }
          case !!body.message.audio: {
            text = body.message.audio.title;
  
            if (body.message.audio.performer) {
              text += ` ${body.message.audio.performer}`;
            }
            if (body.message.caption) {
              text += ` ${body.message.caption}`;
            }
  
            webhookType = "audio";
            break;
          }
          case !!body.message.voice: {
            text = null;
            webhookType = "voice";
            break;
          }
          case !!body.message.animation: {
            text = body.message.document.file_name;
            webhookType = "animation";
            break;
          }
          case !!body.message.video: {
            text = body.message.caption || null;
            webhookType = "video";
            break;
          }
          case !!body.message.contact: {
            text = body.message.contact.phone_number;
            webhookType = "contact";
            break;
          }
          default:
            text = body.message.text;
            webhookType = "text";
            break;
        }
        break;
      }
      case !!body.callback_query: {
        chatId = String(body.callback_query.from.id);
        firstName = body.callback_query.from.first_name ?? null;
        lastName = body.callback_query.from.last_name ?? null;
        lang = body.callback_query.from.language_code;
        text = body.callback_query.data;
        webhookType = "callback_query";
        break;
      }
      case !!body.edited_message: {
        chatId = String(body.edited_message.from.id);
        firstName = body.edited_message.from.first_name ?? null;
        lastName = body.edited_message.from.last_name ?? null;
        lang = body.edited_message.from.language_code;
  
        switch (true) {
          case !!body.edited_message.animation: {
            text = body.edited_message.caption;
            webhookType = "animation";
            break;
          }
  
          default:
            text = body.edited_message.text;
            webhookType = "text";
            break;
        }
        break;
      }
      default:
        console.log('Unknown hook type. Need to be added to processing types');
    }
  
    return { chatId, lang, webhookType, text, firstName, lastName };
  }


  module.exports = TelegramWebhook;
// const CronJob = require('cron').CronJob;
// import { User, Word, Notification } from "../routes";

// const job = new CronJob('50 22 * * 0', () => {
//     console.log('Це повідомлення у консолі о 22:50 в неділю!');

//     sendMessage(templateName: string, templateAttributes = {}) {
//         const message = new Message({ chatId: this.chatId, channel: this.channel, templateName: templateName, lang: this.lang, templateAttributes: templateAttributes });
//         message.sendMessage();
//     }
    
//     const notificationInstance = new Notification({});
//     notificationInstance.getNotifications().then(async (data) => {
//         const userInstance = new User({});
//         data.forEach(element => {
//         userInstance.id = element.userId;
//         userInstance.getUserById().then(async (data) => {
//             const limit = 1;
//             const offset = 0;

//             const getAllwords = new Word({ limit, offset });

//             const words = await getAllwords.getWords();
            
//             if (words.length > 0) {

//             const word = words[0].word;
//             const wordId = words[0].id;

//             this.sendMessage('checkTranslation', {word});
//             userInstance.state = `repeatWords_${offset}_${wordId}`;
//             await userInstance.updateUser();
//             } else {
//                 this.sendMessage('notFoundWords');
//                 userInstance.state = `main_menu`;
//                 await userInstance.updateUser();
//                 this.sendMessage('mainMenu');
//             }
//         });
//         });
//     });

// }, null, true, 'UTC');

// job.start();
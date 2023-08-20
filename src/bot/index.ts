import axios from "axios";
import { User, Word, Notification } from "../routes";
import { Message } from "../services/send-message";
import { GetAnswer } from "../services/openai";

const mainMenuCommands = ['/start', '/mainMenu', '/learnWords', '/repeatWords', '/repeatWordsNow', '/repeatWordsSchedule', '/repeatWordsScheduleMonth', '/repeatWordsScheduleWeek']

export class Bot {
    chatId: string;
    text: string;
    firstName: string;
    lastName: string;
    channel: string;
    lang: string;

    constructor(options) {
        this.chatId = options.chatId;
        this.text = options.text;
        this.firstName = options.firstName || " ";
        this.lastName = options.lastName || " ";
        this.channel = options.channel;
        this.lang = options.lang;
    }

    sendMessage(templateName: string, templateAttributes = {}) {
        const message = new Message({ chatId: this.chatId, channel: this.channel, templateName: templateName, lang: this.lang, templateAttributes: templateAttributes });
        message.sendMessage();
    }

    detectAlphabet = (text) => {
        const cyrillicPattern = /[а-яА-ЯЁё]/;
        const latinPattern = /[a-zA-Z]/;
      
        const hasCyrillic = cyrillicPattern.test(text);
        const hasLatin = latinPattern.test(text);
      
        if (hasCyrillic && !hasLatin) {
          return "uk";
        } else if (!hasCyrillic && hasLatin) {
          return "en";
        } else if (hasCyrillic && hasLatin) {
          return "uk + en";
        } else {
          return "unknown";
        }
      };

    checkState() {
        const userInstance = new User({});
        userInstance.firstName = this.firstName ?? "";
        userInstance.lastName = this.lastName ?? " ";
        userInstance.chatId = this.chatId;

        const notificationInstance = new Notification({});

        userInstance.getUser().then(async (data) => {
            if (!data) {

                this.sendMessage('welcomeMessage', {firstName: this.firstName, lastName: this.lastName});
                this.sendMessage('mainMenu');

                userInstance.state = 'main_menu';
                await userInstance.createUser(); 

            } else {
                console.log("STATE: ", data.state);

                if (mainMenuCommands.includes(this.text)){
                switch (this.text) {
                    case '/start':
                    case '/mainMenu':
                        this.sendMessage('mainMenu');
                        userInstance.state = 'main_menu';
                        await userInstance.updateUser();
                        break;
                    case '/learnWords':
                        this.sendMessage('waitingForWord');
                        userInstance.state = 'waiting_for_word';
                        await userInstance.updateUser();
                        break;
                    case '/repeatWords':
                        this.sendMessage('repeatWords');
                        userInstance.state = 'repeat_word_main_menu';
                        await userInstance.updateUser();
                        break;

                    case '/repeatWordsNow':
                        const limit = 1;
                        const offset = 0;

                        const getAllwords = new Word({ limit, offset });

                        const words = await getAllwords.getWords();
                        
                        if (words.length > 0) {

                        const word = words[0].word;
                        const wordId = words[0].id;

                        this.sendMessage('checkTranslation', {word});
                        userInstance.state = `repeatWords_${offset}_${wordId}`;
                        await userInstance.updateUser();
                        } else {
                            this.sendMessage('notFoundWords');
                            userInstance.state = `main_menu`;
                            await userInstance.updateUser();
                            this.sendMessage('mainMenu');
                        }
                        break;

                    case '/repeatWordsSchedule':
                        notificationInstance.userId = data.id;
                        notificationInstance.getNotification().then(async (notificationData) => {
                            let remindInMonthParam = "❌";
                            let remindInWeekParam = "❌";

                            if (notificationData) {
                                if (notificationData.remindInMonth) remindInMonthParam = "✅"
                                if (notificationData.remindInWeek) remindInWeekParam = "✅"
                            }

                            this.sendMessage('repeatWordsSchedule', {remindInMonthParam, remindInWeekParam});
                        });
                        
                        userInstance.state = 'repeat_word_main_menu';
                        await userInstance.updateUser();
                        break;
                    
                    case '/repeatWordsScheduleWeek':
                        notificationInstance.userId = data.id;
                        notificationInstance.getNotification().then(async (notificationData) => {
                            let remindInMonthParam = "❌";
                            let remindInWeekParam = "❌";
                            if (!notificationData) {
                                notificationInstance.remindInMonth = false;
                                notificationInstance.remindInWeek = true;
                                await notificationInstance.createNotification();
                                remindInWeekParam = "✅";
                            } else {

                                if (!notificationData.remindInWeek) {
                                    remindInWeekParam = "✅";
                                    notificationInstance.remindInWeek = true;
                                } else {
                                    notificationInstance.remindInWeek = false;
                                }
                                await notificationInstance.updateNotification();

                                if (notificationData.remindInMonth) remindInMonthParam = "✅"
                            }
                            this.sendMessage('repeatWordsSchedule', {remindInMonthParam, remindInWeekParam});
                        });
                        break;

                    case '/repeatWordsScheduleMonth':
                        notificationInstance.userId = data.id;
                        notificationInstance.getNotification().then(async (notificationData) => {
                            let remindInMonthParam = "❌";
                            let remindInWeekParam = "❌";
                            if (!notificationData) {

                                notificationInstance.remindInMonth = true;
                                notificationInstance.remindInWeek = false;
                                await notificationInstance.createNotification();
                                 remindInMonthParam = "✅";
                            } else {
                                 
                                 if (!notificationData.remindInMonth) {
                                    remindInMonthParam = "✅";
                                    notificationInstance.remindInMonth = true;
                                 } else {
                                        notificationInstance.remindInMonth = false;
                                    }
                                    await notificationInstance.updateNotification();
                                    
                                if (notificationData.remindInWeek) remindInWeekParam = "✅"
                            }
                            this.sendMessage('repeatWordsSchedule', {remindInMonthParam, remindInWeekParam});
                        });

                        break;
                }
            } else {
                function categorize(state) {
                    if (state.includes('repeatWords_')) {
                      return 'repeatWords';
                    } else if (state.includes('checkAnswer_')) {
                      return 'checkAnswer';
                    } else {
                    return state;
                    }
                  }

                  let state = categorize(data.state);
                  
                    switch (state) {
                        case 'waiting_for_word':
                            let translation = "";
                            let wordId = "";
                         //шукаємо слово в бд
                           const word = new Word({ word: this.text });
                            try {
                            await word.getWordByText().then(async (data) => {
                                if (!data) {
                                    //якщо слова немає в бд, то отримуємо переклад з openai
                                    const lang = this.detectAlphabet(this.text);
     
                                    if (lang == "uk" || lang == "en") {
                                    const gpt = new GetAnswer({ question: this.text, lang: lang });
                                    
                                    await gpt.gptResponse().then((data) => {
                                         translation = data
                                    });

                                    const regex = /[!"#$%&'()*+,-./:;<=>?@[\]^_`{|}~]/g;
                                    translation = translation.replace(regex, '');

                                    const word = new Word({ word: this.text, translation: translation, language: lang });
                                    // const wordCreatedData = word.createWord().then(async (data) => {
                                    //     wordId = data.id;
                                    // });
                                    const wordCreatedData = await word.createWord();
                                    wordId = wordCreatedData.id;
                                } else {
                                    this.sendMessage('unknownLanguage');
                                    this.sendMessage('mainMenu');
                                    userInstance.state = 'main_menu';
                                    await userInstance.updateUser();
                                }
                                } else {
                                    //якщо слово є в бд, то отримуємо переклад з бд
                                    translation = data.translation;
                                }
                            });
                        } catch (e) {
                            console.log("чек помилки ", e)
                            translation = "Переклад не знайдений або сталася помилка"
                        }

                        this.sendMessage('translation', {"translation": translation, "wordId": wordId});
                        userInstance.state = 'translation';
                        await userInstance.updateUser();
                        break;


                        case ('repeatWords'):
                            const offsetForRepeat = data.state.split("_")[1] ?? 0;
                            const wordIdForRepeat = data.state.split("_")[2];
                            const wordById = new Word({ id: wordIdForRepeat });

                            await wordById.getWord().then(async (data) => {
                                if (!data) {
                                    this.sendMessage('unknownWord');
                                    this.sendMessage('mainMenu');
                                    userInstance.state = 'main_menu';
                                    await userInstance.updateUser();
                                } else {
                                    if (data.id == wordIdForRepeat) {

                                        if (this.text.includes(data.translation.toLowerCase())) { 
                                            this.sendMessage('correctAnswer', {word: data.word, translation: data.translation, yourVariant: this.text});
                                        } else {
                                            this.sendMessage('incorrectAnswer', {word: data.word, translation: data.translation, yourVariant: this.text});
                                        }

                                        userInstance.state = `checkAnswer_${offsetForRepeat}_${wordIdForRepeat}`;
                                        await userInstance.updateUser();
                                    } else {
                                        this.sendMessage('unknownWord');
                                        this.sendMessage('mainMenu');
                                        userInstance.state = 'main_menu';
                                        await userInstance.updateUser();
                                    }
                                }
                            });
                            break;
                            case ('checkAnswer'):
                                const wordIdForAnswer = data.state.split("_")[2];
                                if (this.text.includes('/willLearn')) {
                                    const wordToUpdate = new Word({ id: wordIdForAnswer, needToLearn: true });
                                    await wordToUpdate.updateWord();  
                                } else if (this.text.includes('/learnedWord')) {
                                const wordToUpdate = new Word({ id: wordIdForAnswer, needToLearn: false });
                                await wordToUpdate.updateWord();
                                }

                                    const limit = 1;
                                    const answerOffset = ++data.state.split("_")[1] ?? 0;
            
                                    const getAllWords = new Word({ limit, offset: answerOffset });

                                    const words = await getAllWords.getWords();

                                    if (words.length > 0) {
                                    const wordForAnswer = words[0].word;
                                    const newWordId = words[0].id;
                                    console.log("answerOffset", answerOffset, "wordForAnswer", wordForAnswer, "getAllWords", getAllWords )
                                    this.sendMessage('checkTranslation', {word: wordForAnswer});
                                    userInstance.state = `repeatWords_${answerOffset}_${newWordId}`;
                                    await userInstance.updateUser();
                                } else {
                                    this.sendMessage('notFoundWords');
                                    userInstance.state = `main_menu`;
                                    await userInstance.updateUser();
                                    this.sendMessage('mainMenu');
                                }
                            break;


                        case 'translation':

                            if (this.text.includes('/learnWord')) {
                            this.sendMessage('savedWord');
                            const wordToUpdate = new Word({ id: this.text.split("_")[1], needToLearn: true });
                            await wordToUpdate.updateWord();
                            
                            } else if (this.text.includes('/iKnowWord')) {
                            this.sendMessage('iknowWord');
                            const wordToUpdate = new Word({ id: this.text.split("_")[1], needToLearn: false });
                            await wordToUpdate.updateWord();

                            }

                            userInstance.state = 'main_menu';
                            await userInstance.updateUser();
                            this.sendMessage('mainMenu');
                            break;
                        default:
                            this.sendMessage('mainMenu');
                            userInstance.state = 'main_menu';
                            await userInstance.updateUser();
                            break;
                    }
                }
            }
            });
    }
}



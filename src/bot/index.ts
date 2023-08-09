import axios from "axios";
import { User, Word } from "../routes";
import { Message } from "../services/send-message";
import { GetAnswer } from "../services/openai";

const mainMenuCommands = ['/learnWords']
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

        userInstance.getUser().then(async (data) => {
            if (!data) {
                this.sendMessage('welcomeMessage', {firstName: this.firstName, lastName: this.lastName});
                this.sendMessage('mainMenu');
                console.log("welcomeMessage ", this.firstName, this.lastName);
                userInstance.state = 'mainMenu';
                await userInstance.createUser(); 
            } else {
                console.log("state", data.state);
                if (mainMenuCommands.includes(this.text)){
                switch (this.text) {
                    case '/learnWords':
                        this.sendMessage('waitingForWord');
                        userInstance.state = 'waiting_for_word';
                        await userInstance.updateUser();
                        break;
                }
            } else {
                    switch (data.state) {
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
                                    console.log("detectAlphabet lang: ", lang);
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
                        console.log(`wordIdwordIdwordIdwordIdwordIdwordIdwordId ${wordId}`);

                        this.sendMessage('translation', {"translation": translation, "wordId": wordId});
                        userInstance.state = 'translation';
                        await userInstance.updateUser();
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



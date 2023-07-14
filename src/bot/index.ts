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

    checkState() {
        const userInstance = new User({});
        userInstance.firstName = this.firstName;
        userInstance.lastName = this.lastName;
        userInstance.chatId = this.chatId;

        userInstance.getUser().then(async (data) => {
            if (!data) {
                this.sendMessage('welcomeMessage');
                userInstance.state = 'welcome';
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
                         //шукаємо слово в бд
                            const word = new Word({ text: this.text });
                            await word.getWordByText().then(async (data) => {
                                if (!data) {
                                    //якщо слова немає в бд, то отримуємо переклад з openai
                                    const gpt = new GetAnswer({ question: this.text });
                                    await gpt.gptResponse().then((data) => {
                                         translation = data;
                                    });
                                    const word = new Word({ word: this.text, translation: translation, language: 'uk' });
                                    word.createWord().then(async (data) => {
                                        console.log("word created", data);
                                    });
                                } else {
                                    //якщо слово є в бд, то отримуємо переклад з бд
                                    translation = data.translation;
                                }
                            });
                                        
                                this.sendMessage('translation', {"translation": translation});
                                userInstance.state = 'main_menu';
                                await userInstance.updateUser();
                                break;
                        case 'waiting_for_translation':
                            this.sendMessage('translation');
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



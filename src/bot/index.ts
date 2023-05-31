import axios from "axios";
import { IConfigService } from "../config/config.interface";
import { User } from "../routes";
require('dotenv').config()
const { TOKEN } = process.env
const TELEGRAM_API = `https://api.telegram.org/bot${TOKEN}`


export class Bot {
    chatId: string;
    text: string;
    firstName: string;
    lastName: string;

    constructor(options) {
        this.chatId = options.chatId;
        this.text = options.text;
        this.firstName = options.firstName;
        this.lastName = options.lastName;
        }

    checkState() {
        const userInstance = new User({});
        userInstance.firstName = this.firstName ?? " ";
        userInstance.lastName = this.lastName ?? " ";
        userInstance.chatId = this.chatId;

        userInstance.getUser().then((data) => {
            if (!data) {
                    axios.post(`${TELEGRAM_API}/sendMessage`, {
                        chat_id: this.chatId,
                        text: `Hello, ${userInstance.firstName} ${userInstance.lastName}!`
                    });
                    userInstance.state = 'welcome';
                    userInstance.createUser();
            } else {
                if (this.text === '/start') {
                    axios.post(`${TELEGRAM_API}/sendMessage`, {
                        chat_id: this.chatId,
                        text: `I'm a bot, please talk to me!`
                    });
                } else
                if (data.state === 'welcome') {
                    axios.post(`${TELEGRAM_API}/sendMessage`, {
                        chat_id: this.chatId,
                        text: `${userInstance.firstName}, please, enter your word`
                    });
                    userInstance.state = 'waiting_for_word';
                    userInstance.updateUser();
                } else 
                if (data.state === 'waiting_for_word') {
                    axios.post(`${TELEGRAM_API}/sendMessage`, {
                        chat_id: this.chatId,
                        text: `Your word is ${this.text}`
                    });
                    userInstance.state = 'waiting_for_translation';
                    userInstance.updateUser();
                } else 
                if (data.state === 'waiting_for_translation') {
                    axios.post(`${TELEGRAM_API}/sendMessage`, {
                        chat_id: this.chatId,
                        text: `Your translation is ${this.text}`
                    });
                    userInstance.state = 'waiting_for_word';
                    userInstance.updateUser();
                }
            } 
            })
        }
    }



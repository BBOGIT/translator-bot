import axios from "axios";
import { IConfigService } from "../config/config.interface";
require('dotenv').config()
const { OPENAI_API_KEY } = process.env
const { Configuration, OpenAIApi } = require('openai');

const configuration = new Configuration({
    apiKey: OPENAI_API_KEY
})
const openai = new OpenAIApi(configuration);


export class GetAnswer {
    question: string;
    lang: string;

    constructor(options: { question: string, lang: string }) {
        this.question = options.question;
        this.lang = options.lang;
    }

    async gptResponse() {
        try {
            let prompt = `Translate this from Ukrainian into English (and please return just a translation text):\n${this.question}`;
             if (this.lang === 'en') {
                prompt = `Translate this from English into Ukrainian (and please return just a translation text):\n${this.question}`;
            }
        const gptResponse = await openai.createCompletion({
            model: "text-davinci-003",
            //prompt: `Якщо слово відправлене нижче написане кирилицею - переклади його на англійську, якщо латиницею то переклади його на українську. Відправ мені виключно переклад без зайвих слів. Слово для перекладу: \n\n${this.question}`,
            prompt: prompt,
            temperature: 0.3,
            max_tokens: 100,
            top_p: 1.0,
            frequency_penalty: 0.0,
            presence_penalty: 0.0,
          });
        
        const gptResponseText = gptResponse.data.choices[0].text
        console.log(gptResponseText)
        return gptResponseText;
    } catch (error) {
        console.log(error);
        return error;
    }
    } 
}
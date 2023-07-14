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

    constructor(options: { question: string }) {
        this.question = options.question;
    }

    async gptResponse() {
        try {
        const gptResponse = await openai.createCompletion({
            model: "text-davinci-003",
            prompt: `Якщо слово відправлене нижче написане кирилицею - переклади його на англійську, якщо латиницей переклади його на українську. Відправ мені виключно переклад (слово або речення): \n\n${this.question}`,
            //Translate this from Ukrainian into English:
            temperature: 0.3,
            max_tokens: 100,
            top_p: 1.0,
            frequency_penalty: 0.0,
            presence_penalty: 0.0,
          });

        const gptResponseText = gptResponse.data.choices[0].text;
        return gptResponseText;
    } catch (error) {
        console.log(error);
        return error;
    }
    } 
}
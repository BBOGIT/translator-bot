import axios from "axios";
import { IConfigService } from "../config/config.interface";
import attribute from './attributes.json'
import templates from './message-templates.json'
require('dotenv').config()
const { TOKEN } = process.env
const TELEGRAM_API = `https://api.telegram.org/bot${TOKEN}`
import { LoggerService } from '../helper/util/logger-service';

import { readFile } from 'fs';
import { response } from "express";

//const logger = new LoggerService();

interface MessageTemplate {
  name: string;
  channel: string;
  description: string;
  body: string;
}

function findTemplateByNameAndChannel(
  templates: MessageTemplate[],
  name: string,
  channel: string
): MessageTemplate | undefined {
  return templates.find((template) => template.name === name && template.channel === channel);
}

async function readFileAsync(filePath: string): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    readFile(filePath, 'utf8', (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
}

async function parseMessageTemplates(fileName): Promise<MessageTemplate[]> {
  try {
    const data = await readFileAsync(fileName);
    return JSON.parse(data);
  } catch (err) {
    throw new Error('Помилка при зчитуванні або розпарсингу файлу JSON: ' + err);
  }
}

async function parseAttributes(fileName) {
    try {
      const data = await readFileAsync(fileName);
      return JSON.parse(data);
    } catch (err) {
      throw new Error('Помилка при зчитуванні або розпарсингу файлу JSON: ' + err);
    }
  }

function fillTemplateAttributes(templateBody, attributesData, lang, templateAttributes) {
    function getVariableListFromTemplate(template) {
        const variableExchangeRegex = /(?<=\{\{).*?(?=\}\})/gm;
        const variableList = template.match(variableExchangeRegex);
        return variableList;
    }
    let templateString = templateBody;
    // let attributes = {};
    const variableList = getVariableListFromTemplate(templateString);

    variableList.forEach((variable) => {
        let variableFromRequest = templateAttributes[variable] ? templateAttributes[variable].toString().replace(/\n/g, "\\n") : null;
        let correctVariable = attributesData[variable] && attributesData[variable][lang] ? attributesData[variable][lang].toString() : variableFromRequest;
        templateString = templateString.replace(
            `{{${variable}}}`,
            correctVariable || '',
        );
    });
    return templateString;
}

function isObjectEmpty(obj) {
  return obj && Object.keys(obj).length === 0 && obj.constructor === Object;
}

function fillTextAttributes(templateText, attributesData) {
  let templateString = templateText;

  const variableList = attributesData;

  for (const variable in variableList) {
    if (variableList.hasOwnProperty(variable)) {
      let correctVariable = variableList[variable] ? variableList[variable].toString() : ''; 
      templateString = templateString.replace(
        new RegExp(`{{${variable}}}`, 'g'),
        correctVariable
      );
    }
  }
  return templateString;
}


export class Message {
    chatId: string;
    templateName: string;
    channel: string;
    lang: string;
    templateAttributes: object;

    constructor(options) {
        this.chatId = options.chatId;
        this.templateName = options.templateName;
        this.channel = options.channel;
        this.lang = options.lang;
        this.templateAttributes = options.templateAttributes;
    }

    async sendMessage() {

        try {
        const templates = await parseMessageTemplates('/Users/bohdanbuhriienko/Documents/GitHub/translator-bot/src/services/message-templates.json');
        const template = findTemplateByNameAndChannel(templates, this.templateName, this.channel);
        const attributes = await parseAttributes('/Users/bohdanbuhriienko/Documents/GitHub/translator-bot/src/services/attributes.json');
        
        attributes.chatId = {};
        attributes.chatId[this.lang] = this.chatId;
        let templateAttributes = {};
        if (!isObjectEmpty(this.templateAttributes)) { templateAttributes = this.templateAttributes; }
        console.log('templateAttributes)))))))))))))))', templateAttributes)
        let filledTemplate = fillTemplateAttributes(template.body.toString(), attributes, this.lang, templateAttributes);

        console.log('filledTemplate!!!!!!!!!!222222222!!!', filledTemplate)

        if (!isObjectEmpty(this.templateAttributes)) {
          //заповнення динамічних атрибутів в тексті шаблону та в кнопках шаблону
          filledTemplate = fillTextAttributes(filledTemplate, this.templateAttributes).replace(/\n/g, "\\n");
        }

        console.log('filledTemplate!!!!!!!!!!!!!', filledTemplate)

    //   logger.log('[sendMessageAPI][input]', filledTemplate);

        if (filledTemplate) {
            const response = await axios.post(`${TELEGRAM_API}/sendMessage`, JSON.parse(filledTemplate));
        // logger.log('[sendMessageAPI][output]', JSON.stringify(response));
            return response;
          } else {
            console.log('Об\'єкт не знайдено');
          }

        } catch (err) {
          console.error("Message: ", err);
        }
    }
    
}
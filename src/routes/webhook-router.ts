import axios from "axios";
import { Router, Request, Response } from "express";
import { Bot } from "../bot";

export const webhookRouter = Router({});


// Роутер === Контроллер
// Контроллер повинен мати декілька роутів

const telegramWebhook = require('../services/webhook-handler');

webhookRouter.post("/", async (req: Request, res: Response) => {

  res.status(200).json('ok');

  await telegramWebhook(req).then((data) => {
    console.log(data);

    // Створення екземпляру класу Bot
    const bot = new Bot({ chatId: data.chatId, text: data.text, firstName: data.firstName, lastName: data.lastName, lang: data.lang, channel: data.channel });
    // Виклик методу checkState()
    bot.checkState();

  })
    .catch((err) => {
      console.log(err);
    });

});

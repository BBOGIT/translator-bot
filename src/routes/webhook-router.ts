import axios from "axios";
import { Router, Request, Response } from "express";
import { Bot } from "../bot";

export const webhookRouter = Router({});


// Роутер === Контроллер
// Контроллер повинен мати декілька роутів

const TelegramWebhook = require('../services');

webhookRouter.post("/", async (req: Request, res: Response) => {

  res.status(200).json('ok');

  await TelegramWebhook(req).then((data) => {
    console.log(data);

    // Створення екземпляру класу Bot
    const bot = new Bot({ chatId: data.chatId, text: data.text, firstName: data.firstName, lastName: data.lastName });
    // Виклик методу checkState()
    bot.checkState();

  })
    .catch((err) => {
      console.log(err);
    });

});

import { Router, Request, Response } from "express";
import server from "../server";

export const webhookRouter = Router({});

// Роутер === Контроллер
// Контроллер повинен мати декілька роутів

webhookRouter.post("/", (req: Request, res: Response) => {
  console.log(req.body);
  res.status(200);
});

import { Router, Request, Response } from "express";

import Validator from "../validator/index";
import Middleware from "../middleware/index";
import UserInstance from "../model/user";
import { v4 as uuidv4 } from "uuid";

export const usersRouter = Router({});

export class User {
  firstName: string;
  lastName: string;
  chatId: string;
  state: string;

  constructor(options) {
    this.firstName = options.firstName;
    this.lastName = options.lastName;
    this.chatId = options.chatId;
    this.state = options.state;
  }

  async createUser() {
    try {
      const id = uuidv4();
      const data = await UserInstance.create({
        id,
        firstName: this.firstName,
        lastName: this.lastName,
        chatId: this.chatId,
        state: this.state,
      });
      return data;
    } catch (error) {
      return error;
    }
  }

  async getUser() {
    try {
      const data = await UserInstance.findOne({ where: { chatId: this.chatId } });
      return data;
    } catch (error) {
      return error;
    }
  }

  async updateUser() {
    try {
      const data = await UserInstance.findOne({ where: { chatId: this.chatId } });

      if (!data) {
        return false;
      }

      const updatedRecord = await data.update({
        ...this,
      });
      return updatedRecord;
    } catch (error) {
      return error;
    }
  }
}

usersRouter.get(
  "/",
  Validator.checkReadWord(),

  Middleware.checkValidationResult,
  async (
    // Типизировать параметры реквеста нужно тут
    req: Request & { query: { limit?: number; offset?: number } },
    res: Response
  ) => {
    console.log(req.body);
    try {
      // А тут нужно указать параметры по умолчанию, если вдруг параметры не прилетели,
      // если они выше валидируються то типы можно указать соответственно без ?
      const limit = req.query?.limit || 10;
      const offset = req.query?.limit || 0;

      const data = await UserInstance.findAll({ where: {}, limit, offset });
      return res.status(200).json({ data });
    } catch (error) {
      return res.status(500).json({ message: "Error while getting records" });
    }
  }
);

usersRouter.get(
  "/:id",
  Validator.checkIdParam(),
  Middleware.checkValidationResult,
  async (req: Request, res: Response) => {
    console.log(req.body);
    try {
      const data = await UserInstance.findOne({ where: { id: req.params.id } });
      return res.status(200).json({ data });
    } catch (error) {
      return res.status(500).json({ message: "Error while getting record" });
    }
  }
);

usersRouter.post(
  "/",
  Validator.checkCreateWord(),
  Middleware.checkValidationResult,
  async (req: Request, res: Response) => {
    const id = uuidv4();
    try {
      const data = await UserInstance.create({ ...req.body, id });
      return res.status(201).json({ data, message: "Successfully created" });
    } catch (error) {
      return res.status(500).json({ message: "Error while creating record" });
    }
  }
);

usersRouter.put(
  "/:id",
  Validator.checkIdParam(),
  Middleware.checkValidationResult,
  async (req: Request, res: Response) => {
    console.log(req.body);
    try {
      const data = await UserInstance.findOne({ where: { id: req.params.id } });

      if (!data) {
        return res.status(404).json({ message: "Record not found" });
      }

      const updatedRecord = await data.update({
        ...req.body,
      });
      return res.status(200).json({ data: updatedRecord });
    } catch (error) {
      return res.status(500).json({ message: "Error while updating record" });
    }
  }
);

usersRouter.delete(
  "/:id",
  Validator.checkIdParam(),
  Middleware.checkValidationResult,
  async (req: Request, res: Response) => {
    console.log(req.body);
    try {
      const data = await UserInstance.findOne({ where: { id: req.params.id } });

      if (!data) {
        return res.status(404).json({ message: "Record not found" });
      }

      await data.destroy();
      return res.status(204);
    } catch (error) {
      return res.status(500).json({ message: "Error while updating record" });
    }
  }
);

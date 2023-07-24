import { Router, Request, Response } from "express";

import Validator from "../validator/index";
import Middleware from "../middleware/index";
import WordInstance from "../model/word";
import { v4 as uuidv4 } from "uuid";

export const wordsRouter = Router({});

export class Word {
  id: string;
  word: string;
  translation: string;
  language: string;

  constructor(options) {
    this.id = options.id;
    this.word = options.word;
    this.translation = options.translation;
    this.language = options.language;
  }

  async getWord() {
    const word = await WordInstance.findOne({ where: { id: this.id } });
    return word;
  }

  async getWordByText() {
    const word = await WordInstance.findOne({ where: { word: this.word } });
    return word;
  }

  async createWord() {
    const id = uuidv4();
    const word = await WordInstance.create({
      id: id,
      word: this.word,
      translation: this.translation,
      language: this.language,
    });
    return word;
  }

  async updateWord() {
    const word = await WordInstance.findOne({ where: { id: this.id } });
    if (!word) {
      return null;
    }
    const updatedWord = await word.update({
      word: this.word,
      translation: this.translation,
      language: this.language,
    });
    return updatedWord;

  }
}

wordsRouter.get(
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

      const data = await WordInstance.findAll({ where: {}, limit, offset });
      return res.status(200).json({ data });
    } catch (error) {
      return res.status(500).json({ message: "Error while getting records" });
    }
  }
);

wordsRouter.get(
  "/:id",
  Validator.checkIdParam(),
  Middleware.checkValidationResult,
  async (req: Request, res: Response) => {
    console.log(req.body);
    try {
      const data = await WordInstance.findOne({ where: { id: req.params.id } });
      return res.status(200).json({ data });
    } catch (error) {
      return res.status(500).json({ message: "Error while getting record" });
    }
  }
);

wordsRouter.post(
  "/",
  Validator.checkCreateWord(),
  Middleware.checkValidationResult,
  async (req: Request, res: Response) => {
    const id = uuidv4();
    try {
      const data = await WordInstance.create({ ...req.body, id });
      return res.status(201).json({ data, message: "Successfully created" });
    } catch (error) {
      return res.status(500).json({ message: "Error while creating record" });
    }
  }
);

wordsRouter.put(
  "/:id",
  Validator.checkIdParam(),
  Middleware.checkValidationResult,
  async (req: Request, res: Response) => {
    console.log(req.body);
    try {
      const data = await WordInstance.findOne({ where: { id: req.params.id } });

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

wordsRouter.delete(
  "/:id",
  Validator.checkIdParam(),
  Middleware.checkValidationResult,
  async (req: Request, res: Response) => {
    console.log(req.body);
    try {
      const data = await WordInstance.findOne({ where: { id: req.params.id } });

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

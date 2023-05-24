import { Request, Response, NextFunction } from "express";
import { validationResult } from "express-validator";

class Middleware {
  checkValidationResult(req: Request, res: Response, next: NextFunction) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(400)
        .json({ errors: errors.array({ onlyFirstError: true }) });
    }
    next();
  }
}

export default new Middleware();

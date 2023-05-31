import { body, param, query } from "express-validator";

class Validator {
  checkCreateWord() {
    return [body("word").notEmpty().isString().isLength({ min: 1 })];
  }

  checkReadWord() {
    return [
      query("limit")
        .notEmpty()
        .withMessage("limit is required")
        .isInt({ min: 1, max: 10 })
        .withMessage("limit must be between 1 and 10"),
      query("offset")
        .optional()
        .isNumeric()
        .withMessage("offset must be a number"),
    ];
  }

  checkIdParam() {
    return [
      param("id")
        .notEmpty()
        .withMessage("id is required")
        .isUUID()
        .withMessage("id must be a uuid"),
    ];
  }
}

export default new Validator();

const { body, param, validationResult } = require('express-validator');
const { validateRequest } = require("../middlewares/validatorRequest")

exports.validateSimilaritySearch = [
  body('query')
    .notEmpty().withMessage('notEmpty')
    .isString().withMessage('isString'),
  validateRequest
];

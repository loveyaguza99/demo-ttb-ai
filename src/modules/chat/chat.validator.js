const { body, param, validationResult } = require('express-validator');
const { validateRequest } = require("../middlewares/validatorRequest")

exports.validateChat = [
  body('prompt')
    .notEmpty().withMessage('notEmpty')
    .isString().withMessage('isString'),
  body('userId')
    .notEmpty().withMessage('notEmpty')
    .isString().withMessage('isString'),
  body('sessionId')
    .notEmpty().withMessage('notEmpty')
    .custom((value) => {
      if (typeof value === 'string') return true;
      if (value === false) return true;
      return false;
    }).withMessage('isString or false'),

  validateRequest
];

exports.validateGetChatSessionByUserId = [
  body('userId')
    .notEmpty().withMessage('notEmpty'),
  validateRequest
];

exports.validateGetChatByUserId = [
  body('sessionId')
    .notEmpty().withMessage('notEmpty')
    .isString().withMessage('isString'),
  validateRequest
];

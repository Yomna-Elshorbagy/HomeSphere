import { z } from 'zod';
import { MESSAGES, sendError } from '@homeflow/common';

export const validate = (schema) => (req, res, next) => {
  try {
    schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    next();
  } catch (err) {
    if (err instanceof z.ZodError) {
      const errors = err.errors.map(e => ({ path: e.path.join('.'), message: e.message }));
      return sendError(res, 400, MESSAGES.VALIDATION_FAILED, errors);
    }
    next(err);
  }
};

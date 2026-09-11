import { z } from 'zod';

export const validate = (schema) => (req, res, next) => {
  try {
    schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    next();
  } catch (err) {
    if (err.name === 'ZodError' || err.issues) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: err.issues || err.errors });
    }
    next(err);
  }
};

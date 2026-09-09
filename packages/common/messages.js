export const MESSAGES = {
  // Success Messages
  CREATED: (entity) => `${entity} created successfully`,
  UPDATED: (entity) => `${entity} updated successfully`,
  DELETED: (entity) => `${entity} deleted successfully`,
  FETCHED: (entity) => `${entity} retrieved successfully`,

  // Auth Errors
  INVALID_CREDENTIALS: 'Invalid email or password',
  UNAUTHORIZED_NO_TOKEN: 'Unauthorized: No token provided',
  UNAUTHORIZED_INVALID_TOKEN: 'Unauthorized: Invalid token',
  FORBIDDEN: 'Forbidden: You do not have permission',
  
  // General Errors
  VALIDATION_FAILED: 'Validation failed',
  INTERNAL_SERVER_ERROR: 'Internal Server Error',

  // Dynamic Errors
  NOT_FOUND: (entity) => `${entity} not found`,
  ALREADY_IN_USE: (field) => `${field} already in use`,
};

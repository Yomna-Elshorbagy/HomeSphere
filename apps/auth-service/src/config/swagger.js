import swaggerJsdoc from 'swagger-jsdoc';
import env from './env.js';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'HomeSphere Auth Service API',
      version: '1.0.0',
      description: 'API documentation for the HomeSphere Auth Microservice',
    },
    servers: [
      {
        url: `http://localhost:${env.PORT}`,
        description: 'Development Server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT access token here',
        },
      },
    },
    paths: {
      '/auth/register': {
        post: {
          summary: 'Register a new user',
          tags: ['Auth'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['name', 'email', 'password'],
                  properties: {
                    name: { type: 'string' },
                    email: { type: 'string', format: 'email' },
                    password: { type: 'string', format: 'password' },
                  },
                },
              },
            },
          },
          responses: {
            201: { description: 'User successfully registered' },
            400: { description: 'Validation error' },
            409: { description: 'Email already in use' },
          },
        },
      },
      '/auth/login': {
        post: {
          summary: 'Log in with email and password',
          tags: ['Auth'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email', 'password'],
                  properties: {
                    email: { type: 'string', format: 'email' },
                    password: { type: 'string', format: 'password' },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: 'Login successful, tokens returned' },
            401: { description: 'Invalid email or password' },
          },
        },
      },
      '/auth/refresh': {
        post: {
          summary: 'Refresh the access token',
          tags: ['Auth'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['refreshToken'],
                  properties: {
                    refreshToken: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: 'New access token generated' },
            401: { description: 'Invalid or expired refresh token' },
          },
        },
      },
      '/auth/logout': {
        post: {
          summary: 'Logout and revoke the refresh token',
          tags: ['Auth'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['refreshToken'],
                  properties: {
                    refreshToken: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: 'Logged out successfully' },
          },
        },
      },
      '/auth/me': {
        get: {
          summary: 'Get current logged-in user profile',
          tags: ['Auth'],
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: 'Returns the user profile' },
            401: { description: 'Unauthorized' },
          },
        },
      },
      '/users/email/{email}': {
        get: {
          summary: 'Get user details by email (Internal Cross-Service)',
          tags: ['Users'],
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'email', in: 'path', required: true, schema: { type: 'string', format: 'email' } }
          ],
          responses: {
            200: { description: 'User details returned successfully' },
            401: { description: 'Unauthorized' },
            404: { description: 'User not found' },
          },
        },
      },
    },
  },
  apis: [], // No longer scanning files, paths are explicitly defined above
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;

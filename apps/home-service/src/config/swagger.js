import swaggerJsdoc from 'swagger-jsdoc';
import { env } from './env.js';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'HomeSphere Home Service API',
      version: '1.0.0',
      description: 'API documentation for the HomeSphere Home Microservice',
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 3002}`,
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
      '/homes': {
        get: {
          summary: 'Get all homes for the logged-in user',
          tags: ['Homes'],
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'page', in: 'query', schema: { type: 'integer', default: 1 }, description: 'Page number' },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 10, maximum: 100 }, description: 'Number of items per page' },
            { name: 'sortBy', in: 'query', schema: { type: 'string', default: 'createdAt' }, description: 'Field to sort by' },
            { name: 'sortOrder', in: 'query', schema: { type: 'string', enum: ['asc', 'desc'], default: 'desc' }, description: 'Sort direction' },
            { name: 'search', in: 'query', schema: { type: 'string' }, description: 'Search term for name and address' }
          ],
          responses: {
            200: { description: 'List of homes returned successfully' },
            401: { description: 'Unauthorized' },
          },
        },
        post: {
          summary: 'Create a new home',
          tags: ['Homes'],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['name'],
                  properties: {
                    name: { type: 'string', minLength: 2, maxLength: 100 },
                    address: { type: 'string', maxLength: 255 },
                  },
                },
              },
            },
          },
          responses: {
            201: { description: 'Home successfully created' },
            400: { description: 'Validation error' },
            401: { description: 'Unauthorized' },
          },
        },
      },
      '/homes/{id}': {
        get: {
          summary: 'Get details of a specific home',
          tags: ['Homes'],
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
          ],
          responses: {
            200: { description: 'Home details returned successfully' },
            401: { description: 'Unauthorized' },
            404: { description: 'Home not found' },
          },
        },
        patch: {
          summary: 'Update a specific home',
          tags: ['Homes'],
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    name: { type: 'string', minLength: 2, maxLength: 100 },
                    address: { type: 'string', maxLength: 255 },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: 'Home successfully updated' },
            400: { description: 'Validation error' },
            401: { description: 'Unauthorized' },
            404: { description: 'Home not found' },
          },
        },
        delete: {
          summary: 'Delete a specific home',
          tags: ['Homes'],
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
          ],
          responses: {
            200: { description: 'Home successfully deleted' },
            401: { description: 'Unauthorized' },
            404: { description: 'Home not found' },
          },
        }
      },
      '/homes/{homeId}/rooms': {
        get: {
          summary: 'Get all rooms for a home',
          tags: ['Rooms'],
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'homeId', in: 'path', required: true, schema: { type: 'string' } },
            { name: 'page', in: 'query', schema: { type: 'integer', default: 1 }, description: 'Page number' },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 10, maximum: 100 }, description: 'Number of items per page' },
            { name: 'sortBy', in: 'query', schema: { type: 'string', default: 'createdAt' }, description: 'Field to sort by' },
            { name: 'sortOrder', in: 'query', schema: { type: 'string', enum: ['asc', 'desc'], default: 'desc' }, description: 'Sort direction' },
            { name: 'search', in: 'query', schema: { type: 'string' }, description: 'Search term for name' }
          ],
          responses: {
            200: { description: 'List of rooms returned successfully' },
            401: { description: 'Unauthorized' },
            404: { description: 'Home not found' },
          },
        },
        post: {
          summary: 'Create a new room in a home',
          tags: ['Rooms'],
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'homeId', in: 'path', required: true, schema: { type: 'string' } }
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['name'],
                  properties: {
                    name: { type: 'string', minLength: 2, maxLength: 50 },
                  },
                },
              },
            },
          },
          responses: {
            201: { description: 'Room successfully created' },
            400: { description: 'Validation error' },
            401: { description: 'Unauthorized' },
            404: { description: 'Home not found' },
          },
        },
      },
      '/homes/{homeId}/members': {
        post: {
          summary: 'Add a new member to a home',
          tags: ['Members'],
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'homeId', in: 'path', required: true, schema: { type: 'string' } }
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email'],
                  properties: {
                    email: { type: 'string', format: 'email' },
                    role: { type: 'string', enum: ['ADMIN', 'MEMBER'], default: 'MEMBER' },
                    permissions: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            201: { description: 'Member successfully added' },
            400: { description: 'Validation error' },
            401: { description: 'Unauthorized' },
            404: { description: 'Home or User not found' },
          },
        },
      },
      '/homes/{homeId}/members/{userId}': {
        delete: {
          summary: 'Remove a member from a home',
          tags: ['Members'],
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'homeId', in: 'path', required: true, schema: { type: 'string' } },
            { name: 'userId', in: 'path', required: true, schema: { type: 'string' } }
          ],
          responses: {
            200: { description: 'Member successfully removed' },
            401: { description: 'Unauthorized' },
            404: { description: 'Home or Member not found' },
          },
        }
      }
    },
  },
  apis: [],
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;

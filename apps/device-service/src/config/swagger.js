import swaggerJsdoc from 'swagger-jsdoc';
import { env } from './env.js';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'HomeSphere Device Service API',
      version: '1.0.0',
      description: 'API documentation for the HomeSphere Device Microservice',
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
      '/devices': {
        get: {
          summary: 'Get all devices for a home',
          tags: ['Devices'],
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'homeId', in: 'query', required: true, schema: { type: 'string' } },
            { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
            { name: 'sortBy', in: 'query', schema: { type: 'string', default: 'createdAt' } },
            { name: 'sortOrder', in: 'query', schema: { type: 'string', enum: ['asc', 'desc'], default: 'desc' } },
            { name: 'search', in: 'query', schema: { type: 'string' } }
          ],
          responses: {
            200: { description: 'List of devices returned successfully' },
            401: { description: 'Unauthorized' },
            403: { description: 'Forbidden' },
          },
        },
        post: {
          summary: 'Register a new device',
          tags: ['Devices'],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['name', 'type', 'homeId', 'macAddress'],
                  properties: {
                    name: { type: 'string' },
                    type: { type: 'string', enum: ['LIGHT', 'THERMOSTAT', 'SENSOR', 'LOCK', 'SWITCH'] },
                    homeId: { type: 'string' },
                    roomId: { type: 'string' },
                    macAddress: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            201: { description: 'Device successfully created' },
            400: { description: 'Validation error' },
            401: { description: 'Unauthorized' },
            403: { description: 'Forbidden' },
          },
        },
      },
      '/devices/{id}': {
        get: {
          summary: 'Get details of a specific device',
          tags: ['Devices'],
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
          ],
          responses: {
            200: { description: 'Device details returned successfully' },
            401: { description: 'Unauthorized' },
            404: { description: 'Device not found' },
          },
        },
        patch: {
          summary: 'Update a specific device',
          tags: ['Devices'],
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
                    name: { type: 'string' },
                    roomId: { type: 'string' },
                    metadata: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: 'Device successfully updated' },
            401: { description: 'Unauthorized' },
            403: { description: 'Forbidden' },
            404: { description: 'Device not found' },
          },
        },
        delete: {
          summary: 'Delete a specific device',
          tags: ['Devices'],
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
          ],
          responses: {
            200: { description: 'Device successfully deleted' },
            401: { description: 'Unauthorized' },
            403: { description: 'Forbidden' },
            404: { description: 'Device not found' },
          },
        }
      },
      '/devices/{id}/command': {
        post: {
          summary: 'Send a command to a device',
          tags: ['Devices (IoT)'],
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
                  required: ['command'],
                  properties: {
                    command: { type: 'string', example: 'TURN_ON' },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: 'Command queued successfully' },
            401: { description: 'Unauthorized' },
            403: { description: 'Forbidden' },
            404: { description: 'Device not found' },
          },
        }
      },
      '/devices/{id}/state': {
        get: {
          summary: 'Get current real-time state of a device',
          tags: ['Devices (IoT)'],
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
          ],
          responses: {
            200: { description: 'Device state returned successfully' },
            401: { description: 'Unauthorized' },
            404: { description: 'Device not found' },
          },
        }
      },
      '/devices/{id}/telemetry': {
        get: {
          summary: 'Get latest telemetry data for a device',
          tags: ['Devices (IoT)'],
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
          ],
          responses: {
            200: { description: 'Telemetry returned successfully' },
            401: { description: 'Unauthorized' },
            404: { description: 'Device not found' },
          },
        }
      }
    },
  },
  apis: [],
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;

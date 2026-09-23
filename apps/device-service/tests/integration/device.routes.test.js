import request from 'supertest';
import app from '../../src/app.js';
import prisma from '../../src/prisma/client.js';
import { signAccessToken } from '@homesphere/auth';
import { connectRedis, getRedisClient } from '@homesphere/redis';
import { env } from '../../src/config/env.js';
import axios from 'axios';
import { jest } from '@jest/globals';

const mockUserId = '123e4567-e89b-12d3-a456-426614174000';
const token = signAccessToken({ id: mockUserId, email: 'test@example.com' });
const mockHomeId = 'ae6606dc-a421-4d52-a985-ec5b66abef3e';
let createdDeviceId;

describe('Device Routes Integration Tests', () => {
  let axiosGetSpy;

  beforeAll(async () => {
    await prisma.$connect();
    connectRedis(env.REDIS_URL);
    
    // Mock Home Service access check
    axiosGetSpy = jest.spyOn(axios, 'get').mockImplementation((url) => {
      if (url.includes(`/homes/${mockHomeId}`)) {
        return Promise.resolve({ data: { data: { id: mockHomeId } } });
      }
      return Promise.reject({ response: { status: 404 } });
    });
  });

  afterAll(async () => {
    await prisma.device.deleteMany();
    await prisma.$disconnect();
    
    axiosGetSpy.mockRestore();
    const redis = getRedisClient();
    if (redis) {
      await redis.quit();
    }
  });

  afterEach(async () => {
    await prisma.device.deleteMany();
  });

  describe('POST /devices', () => {
    it('should register a new device if user has access to the home', async () => {
      const res = await request(app)
        .post('/devices')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Smart Thermostat',
          type: 'TEMPERATURE_SENSOR',
          homeId: mockHomeId,
          macAddress: '00:1B:44:11:3A:B7',
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.data.name).toBe('Smart Thermostat');
      expect(res.body.data.type).toBe('TEMPERATURE_SENSOR');
      
      createdDeviceId = res.body.data.id;
    });

    it('should return 403 if user does not have access to the home', async () => {
      const res = await request(app)
        .post('/devices')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Invalid Device',
          type: 'SMART_PLUG',
          homeId: '00000000-0000-0000-0000-000000000000',
          macAddress: '00:1B:44:11:3A:B8',
        });

      expect(res.statusCode).toBe(403);
      expect(res.body.message).toMatch(/do not have access/i);
    });

    it('should return 400 for invalid data (e.g., bad MAC address)', async () => {
      const res = await request(app)
        .post('/devices')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Bad MAC',
          type: 'SMART_PLUG',
          homeId: mockHomeId,
          macAddress: 'invalid-mac-address',
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/Validation failed/i);
    });
  });

  describe('GET /devices', () => {
    beforeEach(async () => {
      await prisma.device.createMany({
        data: [
          { name: 'Device 1', type: 'LIGHT', homeId: mockHomeId, macAddress: 'AA:BB:CC:DD:EE:01' },
          { name: 'Device 2', type: 'SMART_PLUG', homeId: mockHomeId, macAddress: 'AA:BB:CC:DD:EE:02' },
        ],
      });
    });

    it('should fetch devices for a specific home', async () => {
      const res = await request(app)
        .get(`/devices?homeId=${mockHomeId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.length).toBe(2);
      expect(res.body.meta.total).toBe(2);
    });

    it('should filter devices by type', async () => {
      const res = await request(app)
        .get(`/devices?homeId=${mockHomeId}&type=LIGHT`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].type).toBe('LIGHT');
    });

    it('should require homeId parameter', async () => {
      const res = await request(app)
        .get('/devices')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/homeId is required/i);
    });
  });

  describe('GET /devices/:id', () => {
    let deviceId;

    beforeEach(async () => {
      const device = await prisma.device.create({
        data: { name: 'Fetch Me', type: 'AC', homeId: mockHomeId, macAddress: 'AA:BB:CC:DD:EE:03' },
      });
      deviceId = device.id;
    });

    it('should fetch a specific device and hit cache on subsequent requests', async () => {
      // First request (DB hit + Set cache)
      const res1 = await request(app)
        .get(`/devices/${deviceId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res1.statusCode).toBe(200);
      expect(res1.body.data.name).toBe('Fetch Me');

      // Second request (Cache hit)
      const res2 = await request(app)
        .get(`/devices/${deviceId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res2.statusCode).toBe(200);
      expect(res2.body.data.name).toBe('Fetch Me');
    });

    it('should return 404 for non-existent device', async () => {
      const res = await request(app)
        .get('/devices/11111111-1111-1111-1111-111111111111')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(404);
    });
  });

  describe('PATCH /devices/:id', () => {
    let deviceId;

    beforeEach(async () => {
      const device = await prisma.device.create({
        data: { name: 'Update Me', type: 'LIGHT', homeId: mockHomeId, macAddress: 'AA:BB:CC:DD:EE:04' },
      });
      deviceId = device.id;
    });

    it('should update a device and invalidate cache', async () => {
      // Seed cache
      await request(app).get(`/devices/${deviceId}`).set('Authorization', `Bearer ${token}`);

      const res = await request(app)
        .patch(`/devices/${deviceId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Updated Light' });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.name).toBe('Updated Light');

      // Verify cache is invalidated by fetching directly from redis (or just verify next get request reflects changes)
      const fetchRes = await request(app)
        .get(`/devices/${deviceId}`)
        .set('Authorization', `Bearer ${token}`);
        
      expect(fetchRes.body.data.name).toBe('Updated Light');
    });
  });

  describe('DELETE /devices/:id', () => {
    let deviceId;

    beforeEach(async () => {
      const device = await prisma.device.create({
        data: { name: 'Delete Me', type: 'LIGHT', homeId: mockHomeId, macAddress: 'AA:BB:CC:DD:EE:05' },
      });
      deviceId = device.id;
    });

    it('should delete a device and invalidate cache', async () => {
      const res = await request(app)
        .delete(`/devices/${deviceId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toMatch(/deleted successfully/i);

      // Verify it's gone
      const fetchRes = await request(app)
        .get(`/devices/${deviceId}`)
        .set('Authorization', `Bearer ${token}`);
        
      expect(fetchRes.statusCode).toBe(404);
    });
  });
  
  describe('GET /devices/:id/telemetry', () => {
    let deviceId;

    beforeEach(async () => {
      const device = await prisma.device.create({
        data: { name: 'Temp Sensor', type: 'TEMPERATURE_SENSOR', homeId: mockHomeId, macAddress: 'AA:BB:CC:DD:EE:06' },
      });
      deviceId = device.id;
    });

    it('should return mock telemetry for the device', async () => {
      const res = await request(app)
        .get(`/devices/${deviceId}/telemetry`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data).toHaveProperty('temperature');
      expect(res.body.data).toHaveProperty('deviceId', deviceId);
    });
  });

  describe('GET /devices/:id/state', () => {
    let deviceId;

    beforeEach(async () => {
      const device = await prisma.device.create({
        data: { name: 'State Sensor', type: 'LIGHT', homeId: mockHomeId, macAddress: 'AA:BB:CC:DD:EE:07' },
      });
      deviceId = device.id;
    });

    it('should return mock state for the device', async () => {
      const res = await request(app)
        .get(`/devices/${deviceId}/state`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data).toHaveProperty('status');
      expect(res.body.data).toHaveProperty('deviceId', deviceId);
    });
  });

  describe('POST /devices/:id/command', () => {
    let deviceId;

    beforeEach(async () => {
      const device = await prisma.device.create({
        data: { name: 'Command Sensor', type: 'SMART_PLUG', homeId: mockHomeId, macAddress: 'AA:BB:CC:DD:EE:08' },
      });
      deviceId = device.id;
    });

    it('should send a command to the device successfully', async () => {
      const res = await request(app)
        .post(`/devices/${deviceId}/command`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          command: 'turn_on',
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.data).toHaveProperty('success', true);
      expect(res.body.data.message).toMatch(/published to MQTT broker/);
    });
  });
});


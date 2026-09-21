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
const authHeader = `Bearer ${token}`;

describe('Home Routes Integration Tests', () => {
  let axiosGetSpy;

  beforeAll(async () => {
    await prisma.$connect();
    connectRedis(env.REDIS_URL);
    axiosGetSpy = jest.spyOn(axios, 'get').mockImplementation((url) => {
      if (url.includes('/users/email/')) {
        return Promise.resolve({ data: { data: { id: 'mocked-user-id' } } });
      }
      return Promise.resolve({ data: {} });
    });
  });

  afterAll(async () => {
    await prisma.homeMember.deleteMany();
    await prisma.room.deleteMany();
    await prisma.home.deleteMany();
    await prisma.$disconnect();
    
    axiosGetSpy.mockRestore();
    const redis = getRedisClient();
    if (redis) {
      await redis.quit();
    }
  });

  afterEach(async () => {
    await prisma.homeMember.deleteMany();
    await prisma.room.deleteMany();
    await prisma.home.deleteMany();
  });

  describe('POST /homes', () => {
    it('should create a new home and assign the user as owner', async () => {
      const res = await request(app)
        .post('/homes')
        .set('Authorization', authHeader)
        .send({
          name: 'My Smart Home',
          address: '123 Test St',
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('My Smart Home');
      
      // Verify in DB
      const dbHome = await prisma.home.findUnique({
        where: { id: res.body.data.id },
        include: { members: true },
      });
      expect(dbHome).toBeDefined();
      expect(dbHome.members.length).toBe(1);
      expect(dbHome.members[0].role).toBe('ADMIN');
    });

    it('should block unauthenticated requests', async () => {
      const res = await request(app)
        .post('/homes')
        .send({ name: 'Hacker Home' });

      expect(res.statusCode).toBe(401);
    });
  });

  describe('GET /homes', () => {
    it('should return all homes for the authenticated user', async () => {
      const home = await prisma.home.create({
        data: {
          name: 'Test Home 1',
          ownerId: mockUserId,
          members: {
            create: { userId: mockUserId, role: 'ADMIN' },
          },
        },
      });

      const res = await request(app).get('/homes').set('Authorization', authHeader);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].id).toBe(home.id);
      expect(res.body.meta).toBeDefined();
      expect(res.body.meta.page).toBe(1);
    });

    it('should paginate and filter homes correctly', async () => {
      // create a couple homes
      await prisma.home.create({
        data: {
          name: 'Alpha Home',
          ownerId: mockUserId,
          members: { create: { userId: mockUserId, role: 'ADMIN' } },
        },
      });
      await prisma.home.create({
        data: {
          name: 'Beta Home',
          ownerId: mockUserId,
          members: { create: { userId: mockUserId, role: 'ADMIN' } },
        },
      });

      const res = await request(app).get('/homes?page=1&limit=1&search=Alpha').set('Authorization', authHeader);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].name).toBe('Alpha Home');
      expect(res.body.meta.total).toBe(1);
      expect(res.body.meta.totalPages).toBe(1);
    });
  });

  describe('GET /homes/:id', () => {
    it('should return a specific home if user is a member', async () => {
      const home = await prisma.home.create({
        data: {
          name: 'Test Home 2',
          ownerId: mockUserId,
          members: { create: { userId: mockUserId, role: 'ADMIN' } },
        },
      });

      const res = await request(app).get(`/homes/${home.id}`).set('Authorization', authHeader);
      expect(res.statusCode).toBe(200);
      expect(res.body.data.name).toBe('Test Home 2');
    });

    it('should return 404 if home does not exist or user not a member', async () => {
      const res = await request(app).get('/homes/invalid-id').set('Authorization', authHeader);
      expect(res.statusCode).toBe(404);
    });
  });

  describe('PATCH /homes/:id', () => {
    it('should update a home', async () => {
      const home = await prisma.home.create({
        data: {
          name: 'Test Home 3',
          ownerId: mockUserId,
          members: { create: { userId: mockUserId, role: 'ADMIN' } },
        },
      });

      const res = await request(app)
        .patch(`/homes/${home.id}`)
        .set('Authorization', authHeader)
        .send({ name: 'Updated Home' });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.name).toBe('Updated Home');
    });
  });

  describe('DELETE /homes/:id', () => {
    it('should delete a home if user is owner', async () => {
      const home = await prisma.home.create({
        data: {
          name: 'Test Home 4',
          ownerId: mockUserId,
          members: { create: { userId: mockUserId, role: 'ADMIN' } },
        },
      });

      const res = await request(app).delete(`/homes/${home.id}`).set('Authorization', authHeader);
      expect(res.statusCode).toBe(200);

      const dbHome = await prisma.home.findUnique({ where: { id: home.id } });
      expect(dbHome).toBeNull();
    });
  });

  describe('POST /homes/:homeId/rooms', () => {
    it('should create a room in a home', async () => {
      const home = await prisma.home.create({
        data: {
          name: 'Test Home 5',
          ownerId: mockUserId,
          members: { create: { userId: mockUserId, role: 'ADMIN' } },
        },
      });

      const res = await request(app)
        .post(`/homes/${home.id}/rooms`)
        .set('Authorization', authHeader)
        .send({ name: 'Living Room' });

      expect(res.statusCode).toBe(201);
      expect(res.body.data.name).toBe('Living Room');
    });
  });

  describe('GET /homes/:homeId/rooms', () => {
    it('should return all rooms in a home', async () => {
      const home = await prisma.home.create({
        data: {
          name: 'Test Home 6',
          ownerId: mockUserId,
          members: { create: { userId: mockUserId, role: 'ADMIN' } },
          rooms: { create: [{ name: 'Kitchen' }, { name: 'Bedroom' }] },
        },
      });

      const res = await request(app).get(`/homes/${home.id}/rooms`).set('Authorization', authHeader);
      expect(res.statusCode).toBe(200);
      expect(res.body.data.length).toBe(2);
      expect(res.body.meta).toBeDefined();
      expect(res.body.meta.total).toBe(2);
    });

    it('should paginate rooms in a home', async () => {
      const home = await prisma.home.create({
        data: {
          name: 'Test Home 6b',
          ownerId: mockUserId,
          members: { create: { userId: mockUserId, role: 'ADMIN' } },
          rooms: { create: [{ name: 'Kitchen' }, { name: 'Bedroom' }, { name: 'Bathroom' }] },
        },
      });

      const res = await request(app).get(`/homes/${home.id}/rooms?limit=2`).set('Authorization', authHeader);
      expect(res.statusCode).toBe(200);
      expect(res.body.data.length).toBe(2);
      expect(res.body.meta.total).toBe(3);
      expect(res.body.meta.totalPages).toBe(2);
    });
  });

  describe('POST /homes/:homeId/members', () => {
    it('should add a member to the home', async () => {
      const home = await prisma.home.create({
        data: {
          name: 'Test Home 7',
          ownerId: mockUserId,
          members: { create: { userId: mockUserId, role: 'ADMIN' } },
        },
      });

      const res = await request(app)
        .post(`/homes/${home.id}/members`)
        .set('Authorization', authHeader)
        .send({ email: 'newmember@example.com', role: 'MEMBER' });

      expect(res.statusCode).toBe(201);
      expect(res.body.data.userId).toBe('mocked-user-id'); // Mocked target userId
    });
  });

  describe('DELETE /homes/:homeId/members/:userId', () => {
    it('should remove a member from the home', async () => {
      const home = await prisma.home.create({
        data: {
          name: 'Test Home 8',
          ownerId: mockUserId,
          members: { 
            create: [
              { userId: mockUserId, role: 'ADMIN' },
              { userId: 'member@example.com', role: 'MEMBER' }
            ] 
          },
        },
      });

      const res = await request(app)
        .delete(`/homes/${home.id}/members/member@example.com`)
        .set('Authorization', authHeader);

      expect(res.statusCode).toBe(200);

      const dbMembers = await prisma.homeMember.findMany({ where: { homeId: home.id } });
      expect(dbMembers.length).toBe(1);
    });
  });
});

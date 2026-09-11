import request from 'supertest';
import app from '../../src/app.js';
import prisma from '../../src/prisma/client.js';

describe('Auth Routes Integration Tests', () => {
  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  afterEach(async () => {
    await prisma.user.deleteMany();
  });

  describe('POST /auth/register', () => {
    it('should register a new user successfully', async () => {
      const res = await request(app)
        .post('/auth/register')
        .send({
          email: 'test@example.com',
          password: 'Password123!',
          name: 'Test User',
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe('test@example.com');
      expect(res.body.data).toHaveProperty('accessToken');
    });

    it('should return validation error for weak password', async () => {
      const res = await request(app)
        .post('/auth/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'weak',
        });
      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should fail if email is already taken', async () => {
      // Register first
      await request(app).post('/auth/register').send({
        email: 'test@example.com',
        password: 'Password123!',
        name: 'Test User',
      });

      // Register again
      const res = await request(app).post('/auth/register').send({
        email: 'test@example.com',
        password: 'Password123!',
        name: 'Another User',
      });

      expect(res.statusCode).toBe(409); // Conflict
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /auth/login', () => {
    beforeEach(async () => {
      await request(app).post('/auth/register').send({
        email: 'login@example.com',
        password: 'Password123!',
        name: 'Login User',
      });
    });

    it('should login successfully with correct credentials', async () => {
      const res = await request(app).post('/auth/login').send({
        email: 'login@example.com',
        password: 'Password123!',
      });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('accessToken');
    });

    it('should fail with incorrect password', async () => {
      const res = await request(app).post('/auth/login').send({
        email: 'login@example.com',
        password: 'WrongPassword!',
      });

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });
});

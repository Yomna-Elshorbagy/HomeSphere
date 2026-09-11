import { createHomeSchema, updateHomeSchema, createRoomSchema, addMemberSchema } from '../../src/validators/home.validator.js';

describe('Home Validator Unit Tests', () => {
  describe('createHomeSchema', () => {
    it('should pass for valid home data', () => {
      const validData = { body: { name: 'Smart Home', address: '123 Main St' }, query: {}, params: {} };
      expect(createHomeSchema.safeParse(validData).success).toBe(true);
    });

    it('should fail if name is missing or too short', () => {
      expect(createHomeSchema.safeParse({ body: { address: '123 Main St' } }).success).toBe(false);
      expect(createHomeSchema.safeParse({ body: { name: 'A' } }).success).toBe(false);
    });
  });

  describe('updateHomeSchema', () => {
    it('should allow optional fields', () => {
      expect(updateHomeSchema.safeParse({ body: { name: 'New Name' } }).success).toBe(true);
      expect(updateHomeSchema.safeParse({ body: { address: 'New Address' } }).success).toBe(true);
      expect(updateHomeSchema.safeParse({ body: {} }).success).toBe(true);
    });
  });

  describe('createRoomSchema', () => {
    it('should require a valid room name', () => {
      expect(createRoomSchema.safeParse({ body: { name: 'Living Room' } }).success).toBe(true);
      expect(createRoomSchema.safeParse({ body: { name: 'A' } }).success).toBe(false);
    });
  });

  describe('addMemberSchema', () => {
    it('should pass with valid email and optional role', () => {
      expect(addMemberSchema.safeParse({ body: { email: 'test@example.com', role: 'ADMIN' } }).success).toBe(true);
      expect(addMemberSchema.safeParse({ body: { email: 'test@example.com' } }).success).toBe(true);
    });

    it('should fail on invalid email or role', () => {
      expect(addMemberSchema.safeParse({ body: { email: 'notanemail' } }).success).toBe(false);
      expect(addMemberSchema.safeParse({ body: { email: 'test@example.com', role: 'SUPERADMIN' } }).success).toBe(false);
    });
  });
});

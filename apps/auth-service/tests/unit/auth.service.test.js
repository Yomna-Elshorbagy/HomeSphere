import { hashToken } from '../../src/services/auth.service.js';
import { hashPassword, comparePassword } from '../../src/utils/password.util.js';

describe('Auth Service Unit Tests', () => {
  describe('hashToken', () => {
    it('should hash a string using sha256', () => {
      const token = 'my-secret-token';
      const hashed = hashToken(token);
      expect(hashed).toBeDefined();
      expect(hashed).not.toBe(token);
      expect(hashed.length).toBe(64); // sha256 hex length
    });
  });

  describe('Password Utilities', () => {
    it('should correctly hash and verify a password', async () => {
      const password = 'Password123!';
      const hashed = await hashPassword(password);
      
      expect(hashed).toBeDefined();
      expect(hashed).not.toBe(password);
      
      const isMatch = await comparePassword(password, hashed);
      expect(isMatch).toBe(true);
      
      const isWrongMatch = await comparePassword('wrong-password', hashed);
      expect(isWrongMatch).toBe(false);
    });
  });
});

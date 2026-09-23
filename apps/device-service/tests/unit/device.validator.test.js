import { registerDeviceSchema, updateDeviceSchema } from '../../src/validators/device.validator.js';

describe('Device Validator Unit Tests', () => {
  describe('registerDeviceSchema', () => {
    it('should pass for valid device data', () => {
      const validData = {
        body: {
          name: 'Smart Light',
          type: 'LIGHT',
          homeId: '123e4567-e89b-12d3-a456-426614174000',
          macAddress: '00:1B:44:11:3A:B7',
        },
      };
      expect(registerDeviceSchema.safeParse(validData).success).toBe(true);
    });

    it('should pass with optional roomId', () => {
      const validData = {
        body: {
          name: 'Smart Light',
          type: 'LIGHT',
          homeId: '123e4567-e89b-12d3-a456-426614174000',
          roomId: '111e4567-e89b-12d3-a456-426614174111',
          macAddress: '00:1B:44:11:3A:B7',
        },
      };
      expect(registerDeviceSchema.safeParse(validData).success).toBe(true);
    });

    it('should fail if name is missing or too short', () => {
      const invalidData1 = {
        body: {
          type: 'LIGHT',
          homeId: '123e4567-e89b-12d3-a456-426614174000',
          macAddress: '00:1B:44:11:3A:B7',
        },
      };
      const invalidData2 = {
        body: {
          name: 'A',
          type: 'LIGHT',
          homeId: '123e4567-e89b-12d3-a456-426614174000',
          macAddress: '00:1B:44:11:3A:B7',
        },
      };
      expect(registerDeviceSchema.safeParse(invalidData1).success).toBe(false);
      expect(registerDeviceSchema.safeParse(invalidData2).success).toBe(false);
    });

    it('should fail on invalid MAC address format', () => {
      const invalidData = {
        body: {
          name: 'Smart Light',
          type: 'LIGHT',
          homeId: '123e4567-e89b-12d3-a456-426614174000',
          macAddress: 'invalid-mac',
        },
      };
      expect(registerDeviceSchema.safeParse(invalidData).success).toBe(false);
    });

    it('should fail on invalid device type', () => {
      const invalidData = {
        body: {
          name: 'Smart Light',
          type: 'INVALID_TYPE',
          homeId: '123e4567-e89b-12d3-a456-426614174000',
          macAddress: '00:1B:44:11:3A:B7',
        },
      };
      expect(registerDeviceSchema.safeParse(invalidData).success).toBe(false);
    });
  });

  describe('updateDeviceSchema', () => {
    it('should pass for valid partial updates', () => {
      expect(updateDeviceSchema.safeParse({ body: { name: 'New Name' } }).success).toBe(true);
      expect(updateDeviceSchema.safeParse({ body: { roomId: '123e4567-e89b-12d3-a456-426614174000' } }).success).toBe(true);
      expect(updateDeviceSchema.safeParse({ body: { metadata: 'some metadata' } }).success).toBe(true);
      expect(updateDeviceSchema.safeParse({ body: {} }).success).toBe(true);
    });

    it('should fail if name is too short', () => {
      expect(updateDeviceSchema.safeParse({ body: { name: 'A' } }).success).toBe(false);
    });

    it('should fail on invalid UUID for roomId', () => {
      expect(updateDeviceSchema.safeParse({ body: { roomId: 'invalid-uuid' } }).success).toBe(false);
    });
  });
});

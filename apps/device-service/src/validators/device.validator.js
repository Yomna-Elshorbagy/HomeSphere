import { z } from 'zod';
import { DeviceType } from '@homesphere/common';

export const registerDeviceSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    type: z.enum(Object.values(DeviceType)),
    homeId: z.string().uuid('Invalid home ID'),
    roomId: z.string().uuid('Invalid room ID').optional(),
    macAddress: z.string().regex(/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/, 'Invalid MAC address format'),
  }),
});

export const updateDeviceSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(100).optional(),
    roomId: z.string().uuid().optional(),
    metadata: z.string().optional(),
  }),
});

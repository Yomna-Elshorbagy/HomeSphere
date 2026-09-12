import { z } from 'zod';

export const registerDeviceSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(100),
    type: z.enum(['LIGHT', 'THERMOSTAT', 'SENSOR', 'LOCK', 'SWITCH']),
    homeId: z.string().uuid(),
    roomId: z.string().uuid().optional(),
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

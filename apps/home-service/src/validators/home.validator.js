import { z } from 'zod';

export const createHomeSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(100),
    address: z.string().max(255).optional(),
  }),
});

export const updateHomeSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(100).optional(),
    address: z.string().max(255).optional(),
  }),
});

export const createRoomSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(50),
  }),
});

export const addMemberSchema = z.object({
  body: z.object({
    email: z.string().email(),
    role: z.enum(['ADMIN', 'MEMBER']).default('MEMBER'),
    permissions: z.string().optional(),
  }),
});

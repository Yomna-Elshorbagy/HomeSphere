import createError from 'http-errors';
import axios from 'axios';
import { env } from '../config/env.js';
import prisma from '../prisma/client.js';
import { MESSAGES, buildPrismaQuery } from '@homesphere/common';

export const createHome = async (ownerId, data) => {
  return prisma.home.create({
    data: {
      ...data,
      ownerId,
      members: {
        create: {
          userId: ownerId,
          role: 'ADMIN',
        },
      },
    },
    include: {
      members: true,
    },
  });
};

export const getHomes = async (userId, query = {}) => {
  const { prismaQuery, meta } = buildPrismaQuery(query, ['name', 'address']);
  
  const where = {
    ...prismaQuery.where,
    members: {
      some: { userId },
    },
  };

  const [total, homes] = await prisma.$transaction([
    prisma.home.count({ where }),
    prisma.home.findMany({
      where,
      skip: prismaQuery.skip,
      take: prismaQuery.take,
      orderBy: prismaQuery.orderBy,
      include: { rooms: true },
    }),
  ]);

  return {
    homes,
    meta: { ...meta, total, totalPages: Math.ceil(total / meta.limit) },
  };
};

export const getHomeById = async (homeId, userId) => {
  const home = await prisma.home.findFirst({
    where: {
      id: homeId,
      members: {
        some: { userId },
      },
    },
    include: {
      rooms: true,
      members: true,
    },
  });

  if (!home) throw createError(404, MESSAGES.NOT_FOUND('Home'));
  return home;
};

export const updateHome = async (homeId, userId, data) => {
  await getHomeById(homeId, userId); // verify access
  return prisma.home.update({
    where: { id: homeId },
    data,
  });
};

export const deleteHome = async (homeId, userId) => {
  const home = await getHomeById(homeId, userId);
  if (home.ownerId !== userId) {
    throw createError(403, MESSAGES.FORBIDDEN);
  }
  await prisma.home.delete({ where: { id: homeId } });
};

export const createRoom = async (homeId, userId, data) => {
  await getHomeById(homeId, userId); // verify access
  return prisma.room.create({
    data: {
      ...data,
      homeId,
    },
  });
};

export const getRooms = async (homeId, userId, query = {}) => {
  await getHomeById(homeId, userId); // verify access
  
  const { prismaQuery, meta } = buildPrismaQuery(query, ['name']);
  
  const where = {
    ...prismaQuery.where,
    homeId,
  };

  const [total, rooms] = await prisma.$transaction([
    prisma.room.count({ where }),
    prisma.room.findMany({
      where,
      skip: prismaQuery.skip,
      take: prismaQuery.take,
      orderBy: prismaQuery.orderBy,
    }),
  ]);

  return {
    rooms,
    meta: { ...meta, total, totalPages: Math.ceil(total / meta.limit) },
  };
};

export const addMember = async (homeId, adminUserId, memberEmail, role, permissions, userToken) => {
  const home = await getHomeById(homeId, adminUserId);
  if (home.ownerId !== adminUserId) {
    throw createError(403, MESSAGES.FORBIDDEN);
  }

  let targetUserId;
  try {
    const response = await axios.get(`${env.AUTH_SERVICE_URL}/users/email/${memberEmail}`, {
      headers: { Authorization: userToken }
    });
    targetUserId = response.data.data.id;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      throw createError(404, MESSAGES.NOT_FOUND('User with this email'));
    }
    throw createError(500, 'Error communicating with auth-service');
  }

  return prisma.homeMember.create({
    data: {
      homeId,
      userId: targetUserId,
      role,
      permissions,
    },
  });
};

export const removeMember = async (homeId, adminUserId, targetUserId) => {
  const home = await getHomeById(homeId, adminUserId);
  if (home.ownerId !== adminUserId) {
    throw createError(403, MESSAGES.FORBIDDEN);
  }
  
  if (home.ownerId === targetUserId) {
    throw createError(400, 'Cannot remove the owner of the home');
  }

  await prisma.homeMember.delete({
    where: {
      homeId_userId: {
        homeId,
        userId: targetUserId,
      },
    },
  });
};

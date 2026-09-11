import createError from 'http-errors';
import prisma from '../prisma/client.js';
import { MESSAGES } from '@homesphere/common';

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

export const getHomes = async (userId) => {
  return prisma.home.findMany({
    where: {
      members: {
        some: { userId },
      },
    },
    include: {
      rooms: true,
    },
  });
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

export const getRooms = async (homeId, userId) => {
  await getHomeById(homeId, userId); // verify access
  return prisma.room.findMany({
    where: { homeId },
  });
};

export const addMember = async (homeId, adminUserId, memberEmail, role, permissions) => {
  const home = await getHomeById(homeId, adminUserId);
  if (home.ownerId !== adminUserId) {
    throw createError(403, MESSAGES.FORBIDDEN);
  }

  // NOTE: In a real microservice, we would call auth-service here via API/RabbitMQ 
  // to convert memberEmail to an actual userId. For now we will just assume memberEmail is the userId.
  const targetUserId = memberEmail; 

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

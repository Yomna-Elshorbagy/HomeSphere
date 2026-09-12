import createError from 'http-errors';
import prisma from '../prisma/client.js';
import axios from 'axios';
import { env } from '../config/env.js';
import { MESSAGES, buildPrismaQuery } from '@homesphere/common';

/**
 * Validates that the user has access to the specified home.
 * This is Option A: Synchronous HTTP Call to the Home Service.
 */
const verifyHomeAccess = async (homeId, userToken) => {
  try {
    // Request the home details from home-service.
    // If the user is not a member, home-service returns 404 or 403.
    await axios.get(`${env.HOME_SERVICE_URL}/homes/${homeId}`, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
  } catch (error) {
    if (error.response && error.response.status === 404) {
      throw createError(403, 'You do not have access to this home or it does not exist.');
    }
    throw createError(500, 'Error communicating with Home Service');
  }
};

export const registerDevice = async (data, userToken) => {
  // Option A: Verify access before creating device
  await verifyHomeAccess(data.homeId, userToken);
  
  return prisma.device.create({
    data,
  });
};

export const getDevices = async (homeId, userToken, query = {}) => {
  if (homeId) {
    await verifyHomeAccess(homeId, userToken);
  } else {
    throw createError(400, 'homeId is required to fetch devices');
  }

  const { prismaQuery, meta } = buildPrismaQuery(query, ['name', 'type', 'macAddress']);
  const where = { ...prismaQuery.where, homeId };

  const [total, devices] = await prisma.$transaction([
    prisma.device.count({ where }),
    prisma.device.findMany({
      where,
      skip: prismaQuery.skip,
      take: prismaQuery.take,
      orderBy: prismaQuery.orderBy,
    }),
  ]);

  return {
    devices,
    meta: { ...meta, total, totalPages: Math.ceil(total / meta.limit) },
  };
};

export const getDeviceById = async (id) => {
  const device = await prisma.device.findUnique({
    where: { id },
  });
  if (!device) throw createError(404, MESSAGES.NOT_FOUND('Device'));
  return device;
};

export const updateDevice = async (id, data, userToken) => {
  const device = await getDeviceById(id);
  await verifyHomeAccess(device.homeId, userToken);

  return prisma.device.update({
    where: { id },
    data,
  });
};

export const deleteDevice = async (id, userToken) => {
  const device = await getDeviceById(id);
  await verifyHomeAccess(device.homeId, userToken);

  await prisma.device.delete({
    where: { id },
  });
};

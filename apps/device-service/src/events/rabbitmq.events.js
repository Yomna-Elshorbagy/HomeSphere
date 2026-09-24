import logger from '@homesphere/logger';
import prisma from '../prisma/client.js';
import { consumeEvent } from '@homesphere/messaging';
import { getRedisClient } from '@homesphere/redis';

export const handleHomeDeleted = async (routingKey, payload) => {
  const { homeId } = payload;
  if (!homeId) return;

  logger.info(`Received ${routingKey} event. Deleting all devices for home ${homeId}...`);

  try {
    const devices = await prisma.device.findMany({
      where: { homeId },
      select: { id: true }
    });

    if (devices.length > 0) {
      // 1. Delete devices from DB
      await prisma.device.deleteMany({
        where: { homeId }
      });
      
      // 2. Clear devices from Redis Cache
      const redis = getRedisClient();
      devices.forEach((device) => {
        redis.del(`device:${device.id}`).catch(() => {});
        redis.del(`device_state:${device.id}`).catch(() => {});
      });

      logger.info(`Successfully deleted ${devices.length} devices for home ${homeId}`);
    } else {
      logger.info(`No devices found for home ${homeId}`);
    }
  } catch (error) {
    logger.error({ error, homeId }, 'Error deleting devices for home deleted event');
  }
};

export const initializeRabbitMQEvents = () => {
  consumeEvent(
    'home_events', 
    'device_service_home_deleted_queue', 
    'home.deleted', 
    handleHomeDeleted
  );
};

import logger from '@homesphere/logger';
import prisma from '../prisma/client.js';
import { publishEvent } from '@homesphere/messaging';
import { setCache } from '@homesphere/redis';

/**
 * Handles all incoming MQTT messages, processes them, and syncs them to PostgreSQL.
 * It also broadcasts these updates as AMQP events via RabbitMQ for other services to react.
 * @param {string} topic - e.g. home/{homeId}/device/{deviceId}/state
 * @param {object} payload - e.g. { status: "ON" }
 */
export const handleMqttMessage = async (topic, payload) => {
  try {
    const topicParts = topic.split('/');
    if (topicParts.length !== 5) return;

    const homeId = topicParts[1];
    const deviceTypeStr = topicParts[2]; // 'device'
    const deviceId = topicParts[3];
    const messageType = topicParts[4]; // 'state' or 'telemetry'

    if (deviceTypeStr !== 'device') return;

    if (messageType === 'state') {
      logger.info(`🏠 Syncing state for device ${deviceId} to DB...`);
      
      const newState = {
        deviceId,
        status: payload.status,
        isOnline: payload.isOnline ?? true,
        lastSeenAt: new Date(),
      };

      await prisma.device.update({
        where: { id: deviceId },
        data: {
          status: newState.status,
          isOnline: newState.isOnline,
          lastSeenAt: newState.lastSeenAt
        }
      });

      // Cache real-time state for ultra-fast UI reads
      await setCache(`device_state:${deviceId}`, newState, 3600);
      // Broadcast AMQP Event
      await publishEvent('device_events', 'device.state.changed', {
        homeId,
        deviceId,
        status: payload.status,
        timestamp: new Date().toISOString()
      });
      logger.debug(`✅ Synced state and broadcasted AMQP event for ${deviceId}`);
    } else if (messageType === 'telemetry') {
      logger.info(`📈 Syncing telemetry for device ${deviceId} to DB...`);
      const { timestamp, ...telemetryData } = payload;
      
      await prisma.telemetry.create({
        data: {
          deviceId,
          data: telemetryData,
          timestamp: timestamp ? new Date(timestamp) : new Date()
        }
      });
      
      // Update device lastSeenAt
      await prisma.device.update({
        where: { id: deviceId },
        data: { lastSeenAt: new Date() }
      });

      // Broadcast AMQP Event
      await publishEvent('device_events', 'device.telemetry.updated', {
        homeId,
        deviceId,
        telemetry: telemetryData,
        timestamp: timestamp || new Date().toISOString()
      });
      
      logger.debug(`✅ Synced telemetry and broadcasted AMQP event for ${deviceId}`);
    }
  } catch (error) {
    logger.error({ error, topic, payload }, '❌ Failed to process MQTT message in event handler');
  }
};

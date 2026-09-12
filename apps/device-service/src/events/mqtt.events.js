import logger from '@homesphere/logger';
import prisma from '../prisma/client.js';

export const handleMqttMessage = async (topic, payload) => {
  try {
    // Topic formats:
    // home/{homeId}/device/{deviceId}/state
    // home/{homeId}/device/{deviceId}/telemetry
    
    const parts = topic.split('/');
    if (parts.length < 5) return;

    const homeId = parts[1];
    const deviceId = parts[3];
    const eventType = parts[4];

    if (eventType === 'state') {
      await handleStateUpdate(deviceId, payload);
    } else if (eventType === 'telemetry') {
      await handleTelemetryUpdate(deviceId, payload);
    }
  } catch (error) {
    logger.error({ error, topic, payload }, 'Error processing MQTT event');
  }
};

const handleStateUpdate = async (deviceId, payload) => {
  const { status, isOnline, ...metadataUpdates } = payload;
  
  // Find device first to make sure it exists
  const device = await prisma.device.findUnique({ where: { id: deviceId } });
  if (!device) {
    logger.warn(`Received state update for unknown device: ${deviceId}`);
    return;
  }

  // Merge metadata
  let newMetadata = {};
  try {
    if (device.metadata) newMetadata = JSON.parse(device.metadata);
  } catch (e) {}
  
  newMetadata = { ...newMetadata, ...metadataUpdates };

  await prisma.device.update({
    where: { id: deviceId },
    data: {
      status: status !== undefined ? status : device.status,
      isOnline: isOnline !== undefined ? Boolean(isOnline) : device.isOnline,
      metadata: JSON.stringify(newMetadata)
    }
  });

  logger.info({ deviceId, status, isOnline }, 'Updated device state from MQTT');
};

const handleTelemetryUpdate = async (deviceId, payload) => {
  // In Phase 12, this will go to Analytics Service or TimescaleDB.
  // For now, just log it.
  logger.info({ deviceId, telemetry: payload }, 'Received device telemetry from MQTT');
};

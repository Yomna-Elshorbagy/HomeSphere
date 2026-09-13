import dotenv from 'dotenv';
import logger from '@homesphere/logger';
import { connectMqtt, subscribeTopic, publishMessage } from '@homesphere/messaging';

// Load root .env
dotenv.config({ path: '../../.env' });

const MQTT_URL = process.env.MQTT_URL || 'mqtt://localhost:1883';

/**
 * The Device Simulator acts as a physical hardware device connected to Mosquitto.
 * It listens to all command topics across all homes and devices.
 * When a command is received, it simulates a physical action delay,
 * then publishes a state update confirming the action.
 * It also maintains a loop to publish telemetry data.
 */

// Keep track of devices we've interacted with to send telemetry for them
const activeDevices = new Set();

const startSimulator = async () => {
  logger.info('🤖 Starting HomeSphere Device Simulator...');
  
  try {
    await connectMqtt(MQTT_URL, process.env.MQTT_USERNAME, process.env.MQTT_PASSWORD);
    logger.info('🔌 Simulator connected to Mosquitto MQTT Broker!');

    // Subscribe to ALL commands for ANY home and ANY device
    const commandWildcard = 'home/+/device/+/command';
    await subscribeTopic(commandWildcard, handleIncomingCommand);
    logger.info(`📡 Simulator actively listening to topic: ${commandWildcard}`);
    
    // Start the telemetry loop
    startTelemetryLoop();
  } catch (error) {
    logger.error('❌ Failed to start Simulator:', error);
    process.exit(1);
  }
};

const handleIncomingCommand = async (topic, payload) => {
  // Topic format: home/{homeId}/device/{deviceId}/command
  const topicParts = topic.split('/');
  if (topicParts.length !== 5) return;

  const homeId = topicParts[1];
  const deviceId = topicParts[3];
  
  // Register device for telemetry if not already active
  const deviceKey = `${homeId}/${deviceId}`;
  if (!activeDevices.has(deviceKey)) {
    activeDevices.add(deviceKey);
    logger.info(`🆕 New device registered in simulator: ${deviceId} (Home: ${homeId})`);
  }

  const { command } = payload;
  logger.info(`📥 [${deviceId}] Received Command: ${command}`);

  // Simulate physical hardware latency (e.g. 500ms to physically turn on a relay)
  logger.info(`⚙️ [${deviceId}] Simulating physical hardware action...`);
  await new Promise(resolve => setTimeout(resolve, 500));

  // Determine new state based on command
  let newStatus = 'UNKNOWN';
  if (command === 'TURN_ON' || command === 'START') newStatus = 'ON';
  if (command === 'TURN_OFF' || command === 'STOP') newStatus = 'OFF';
  
  const stateUpdate = {
    status: newStatus,
    isOnline: true,
  };

  // Publish the state update back to the broker
  const stateTopic = `home/${homeId}/device/${deviceId}/state`;
  await publishMessage(stateTopic, stateUpdate);
  logger.info(`📤 [${deviceId}] Action complete. Published state update: ${JSON.stringify(stateUpdate)}`);
};

const startTelemetryLoop = () => {
  // Every 10 seconds, send telemetry for all active devices
  setInterval(async () => {
    if (activeDevices.size === 0) return;

    logger.debug(`📊 Simulating telemetry for ${activeDevices.size} devices...`);
    
    for (const deviceKey of activeDevices) {
      const [homeId, deviceId] = deviceKey.split('/');
      
      // Generate some mock telemetry data
      const telemetryData = {
        temperature: (22 + Math.random() * 3).toFixed(1), // 22.0 to 25.0
        humidity: (40 + Math.random() * 10).toFixed(1),   // 40.0 to 50.0
        powerUsageWatts: (Math.random() * 60).toFixed(2), // 0 to 60 watts
        timestamp: new Date().toISOString()
      };

      const telemetryTopic = `home/${homeId}/device/${deviceId}/telemetry`;
      try {
        await publishMessage(telemetryTopic, telemetryData);
      } catch (err) {
        logger.error(`❌ Failed to publish telemetry for ${deviceId}`, err);
      }
    }
  }, 10000);
};

// Handle graceful shutdown
process.on('SIGINT', () => {
  logger.info('🛑 Simulator shutting down...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('🛑 Simulator shutting down...');
  process.exit(0);
});

// Boot up
startSimulator();

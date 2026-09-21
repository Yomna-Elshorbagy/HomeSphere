import { env } from './config/env.js';
import app from './app.js';
import logger from '@homesphere/logger';
import prisma from './prisma/client.js';
import { connectMqtt, subscribeTopic, onMessage, connectRabbitMQ } from '@homesphere/messaging';
import { handleMqttMessage } from './events/mqtt.events.js';

const startServer = async () => {
  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully');

    // Connect to Event Broker (RabbitMQ)
    await connectRabbitMQ(env.RABBITMQ_URL);

    // Connect to MQTT Broker
    await connectMqtt(env.MQTT_URL, env.MQTT_USERNAME, env.MQTT_PASSWORD);
    
    // Subscribe to all device state and telemetry globally
    subscribeTopic('home/+/device/+/state');
    subscribeTopic('home/+/device/+/telemetry');

    // Listen for incoming messages
    onMessage(handleMqttMessage);

    app.listen(env.PORT, () => {
      logger.info(`🚀 Device Service running on port ${env.PORT} in ${env.NODE_ENV} mode`);
    });
  } catch (err) {
    logger.error({ err }, 'Failed to start server');
    process.exit(1);
  }
};

startServer();

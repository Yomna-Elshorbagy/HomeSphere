import mqtt from 'mqtt';
import logger from '@homesphere/logger';

let client = null;

/**
 * Connects to the MQTT broker.
 * @param {string} brokerUrl - The MQTT broker URL (e.g., mqtt://localhost:1883)
 * @returns {Promise<mqtt.MqttClient>}
 */
export const connectMqtt = (brokerUrl) => {
  return new Promise((resolve, reject) => {
    if (client && client.connected) {
      return resolve(client);
    }

    logger.info(`Attempting to connect to MQTT broker at ${brokerUrl}...`);
    client = mqtt.connect(brokerUrl);

    client.on('connect', () => {
      logger.info('✅ Successfully connected to MQTT Broker');
      resolve(client);
    });

    client.on('error', (err) => {
      logger.error({ err }, '❌ MQTT Connection Error');
      reject(err);
    });

    client.on('reconnect', () => {
      logger.info('🔄 Reconnecting to MQTT Broker...');
    });
  });
};

/**
 * Publishes a message to an MQTT topic.
 * @param {string} topic 
 * @param {object} payload 
 */
export const publishMessage = (topic, payload) => {
  if (!client || !client.connected) {
    logger.warn(`Cannot publish to ${topic}. MQTT client is not connected.`);
    return;
  }
  const messageString = JSON.stringify(payload);
  client.publish(topic, messageString, { qos: 1 }, (err) => {
    if (err) logger.error({ err, topic }, 'Failed to publish MQTT message');
    else logger.info({ topic, payload }, '📤 Published MQTT message');
  });
};

/**
 * Subscribes to an MQTT topic.
 * @param {string} topic 
 */
export const subscribeTopic = (topic) => {
  if (!client || !client.connected) {
    logger.warn(`Cannot subscribe to ${topic}. MQTT client is not connected.`);
    return;
  }
  client.subscribe(topic, { qos: 1 }, (err) => {
    if (err) logger.error({ err, topic }, 'Failed to subscribe to MQTT topic');
    else logger.info({ topic }, '📥 Subscribed to MQTT topic');
  });
};

/**
 * Registers a global message handler for incoming MQTT events.
 * @param {function} handler - function(topic, payloadObject)
 */
export const onMessage = (handler) => {
  if (!client) return;
  client.on('message', (topic, message) => {
    try {
      const payload = JSON.parse(message.toString());
      handler(topic, payload);
    } catch (err) {
      logger.error({ err, topic, rawMessage: message.toString() }, 'Failed to parse incoming MQTT message');
    }
  });
};

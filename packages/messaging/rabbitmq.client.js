import amqp from 'amqplib';
import logger from '@homesphere/logger';

let channel = null;

/**
 * Connects to the RabbitMQ broker and initializes a channel.
 * @param {string} brokerUrl - The AMQP broker URL (e.g., amqp://guest:guest@localhost:5672)
 */
export const connectRabbitMQ = async (brokerUrl) => {
  try {
    logger.info(`Attempting to connect to RabbitMQ broker at ${brokerUrl}...`);
    const connection = await amqp.connect(brokerUrl);
    channel = await connection.createChannel();
    logger.info('✅ Successfully connected to RabbitMQ Broker and created channel');

    // Handle connection errors
    connection.on('error', (err) => {
      logger.error({ err }, '❌ RabbitMQ Connection Error');
    });

    connection.on('close', () => {
      logger.warn('RabbitMQ connection closed');
    });
  } catch (error) {
    logger.error({ error }, '❌ Failed to connect to RabbitMQ Broker');
    throw error;
  }
};

/**
 * Publishes an event to a specific RabbitMQ exchange.
 * @param {string} exchange - The exchange name (e.g., 'device_events')
 * @param {string} routingKey - The routing key (e.g., 'device.state.changed')
 * @param {object} payload - The event data to publish
 */
export const publishEvent = async (exchange, routingKey, payload) => {
  if (!channel) {
    logger.warn('Cannot publish event. RabbitMQ channel is not initialized.');
    return;
  }

  try {
    // Ensure the exchange exists (fanout, direct, topic, etc.). We'll use 'topic' for flexible routing.
    await channel.assertExchange(exchange, 'topic', { durable: true });
    
    const messageBuffer = Buffer.from(JSON.stringify(payload));
    const published = channel.publish(exchange, routingKey, messageBuffer, { persistent: true });
    
    if (published) {
      logger.info({ exchange, routingKey, payload }, '📤 Published AMQP event');
    } else {
      logger.warn({ exchange, routingKey }, 'RabbitMQ publish buffer full, event dropped');
    }
  } catch (error) {
    logger.error({ error, exchange, routingKey }, 'Failed to publish AMQP event');
  }
};

/**
 * Consumes events from a specific queue bound to an exchange.
 * @param {string} exchange - The exchange name
 * @param {string} queue - The queue name to consume from
 * @param {string} routingKey - The routing key pattern to bind (e.g., '#', 'device.state.*')
 * @param {function} handler - The function to call when a message is received
 */
export const consumeEvent = async (exchange, queue, routingKey, handler) => {
  if (!channel) {
    logger.warn('Cannot consume events. RabbitMQ channel is not initialized.');
    return;
  }

  try {
    await channel.assertExchange(exchange, 'topic', { durable: true });
    
    // Ensure the queue exists
    const q = await channel.assertQueue(queue, { durable: true });
    
    // Bind the queue to the exchange with the routing key
    await channel.bindQueue(q.queue, exchange, routingKey);

    logger.info(`📥 Listening for AMQP events on queue '${q.queue}' (binding: '${routingKey}')`);

    channel.consume(q.queue, (msg) => {
      if (msg !== null) {
        try {
          const payload = JSON.parse(msg.content.toString());
          handler(msg.fields.routingKey, payload);
          // Acknowledge the message so RabbitMQ knows it was successfully processed
          channel.ack(msg);
        } catch (err) {
          logger.error({ err, rawMessage: msg.content.toString() }, 'Failed to parse AMQP message');
          // Acknowledge anyway to remove the bad message from the queue
          channel.ack(msg);
        }
      }
    });
  } catch (error) {
    logger.error({ error, exchange, queue, routingKey }, 'Failed to setup AMQP consumer');
  }
};

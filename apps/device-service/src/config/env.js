import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load service-specific .env first
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
// Fallback to root .env
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

const requiredVars = ['DATABASE_URL'];
for (const envVar of requiredVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

export const env = {
  PORT: process.env.PORT || 3003,
  NODE_ENV: process.env.NODE_ENV || 'development',
  DATABASE_URL: process.env.DATABASE_URL,
  HOME_SERVICE_URL: process.env.HOME_SERVICE_URL || 'http://localhost:3002',
  MQTT_URL: process.env.MQTT_URL || 'mqtt://localhost:1883',
  MQTT_USERNAME: process.env.MQTT_USERNAME,
  MQTT_PASSWORD: process.env.MQTT_PASSWORD,
  RABBITMQ_URL: process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672',
};

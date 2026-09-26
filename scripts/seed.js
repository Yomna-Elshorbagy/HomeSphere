import { PrismaClient as AuthClient } from '@prisma/client-auth';
import { PrismaClient as HomeClient } from '@prisma/client-home';
import { PrismaClient as DeviceClient } from '@prisma/client-device';
import { randomUUID } from 'crypto';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper function to read a specific .env file and extract DATABASE_URL
function getDbUrl(serviceName) {
  const envPath = path.resolve(__dirname, `../apps/${serviceName}/.env`);
  if (!fs.existsSync(envPath)) return undefined;
  
  const parsed = dotenv.parse(fs.readFileSync(envPath));
  return parsed.DATABASE_URL;
}

const authUrl = getDbUrl('auth-service');
const homeUrl = getDbUrl('home-service');
const deviceUrl = getDbUrl('device-service');

const authClient = new AuthClient(authUrl ? { datasources: { db: { url: authUrl } } } : undefined);
const homeClient = new HomeClient(homeUrl ? { datasources: { db: { url: homeUrl } } } : undefined);
const deviceClient = new DeviceClient(deviceUrl ? { datasources: { db: { url: deviceUrl } } } : undefined);

// Pre-defined UUIDs for cross-service consistency
const ADMIN_ID = '00000000-0000-0000-0000-000000000001';
const OWNER_1_ID = '00000000-0000-0000-0000-000000000002';
const MEMBER_1_ID = '00000000-0000-0000-0000-000000000003';
const GUEST_1_ID = '00000000-0000-0000-0000-000000000004';

const HOME_1_ID = '11111111-1111-1111-1111-111111111111';
const ROOM_LIVING_ID = '22222222-2222-2222-2222-222222222221';
const ROOM_BEDROOM_ID = '22222222-2222-2222-2222-222222222222';

const DEVICE_LIGHT_ID = '33333333-3333-3333-3333-333333333331';
const DEVICE_THERMOSTAT_ID = '33333333-3333-3333-3333-333333333332';
const DEVICE_SENSOR_ID = '33333333-3333-3333-3333-333333333333';

async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

async function seedAuth() {
  console.log('Seeding Auth Service...');
  const passwordHash = await hashPassword('password123');

  const users = [
    { id: ADMIN_ID, name: 'System Admin', email: 'admin@homesphere.com', passwordHash, role: 'ADMIN', status: 'ACTIVE' },
    { id: OWNER_1_ID, name: 'John Doe', email: 'john@example.com', passwordHash, role: 'OWNER', status: 'ACTIVE' },
    { id: MEMBER_1_ID, name: 'Jane Doe', email: 'jane@example.com', passwordHash, role: 'MEMBER', status: 'ACTIVE' },
    { id: GUEST_1_ID, name: 'Guest User', email: 'guest@example.com', passwordHash, role: 'GUEST', status: 'ACTIVE' },
  ];

  for (const user of users) {
    await authClient.user.upsert({
      where: { id: user.id },
      update: {},
      create: user,
    });
  }
  console.log('✅ Auth Service Seeded');
}

async function seedHome() {
  console.log('Seeding Home Service...');
  
  // Create Home
  await homeClient.home.upsert({
    where: { id: HOME_1_ID },
    update: {},
    create: {
      id: HOME_1_ID,
      name: "John's Smart Home",
      ownerId: OWNER_1_ID,
      address: "123 Tech Lane",
    }
  });

  // Create Rooms
  const rooms = [
    { id: ROOM_LIVING_ID, name: 'Living Room', homeId: HOME_1_ID },
    { id: ROOM_BEDROOM_ID, name: 'Master Bedroom', homeId: HOME_1_ID }
  ];

  for (const room of rooms) {
    await homeClient.room.upsert({
      where: { id: room.id },
      update: {},
      create: room
    });
  }

  // Create Members
  // The owner is already added as a member in some implementations, but let's ensure it here
  const members = [
    { id: randomUUID(), homeId: HOME_1_ID, userId: OWNER_1_ID, role: 'ADMIN' },
    { id: randomUUID(), homeId: HOME_1_ID, userId: MEMBER_1_ID, role: 'MEMBER', permissions: '{"lights":true,"thermostat":true}' },
  ];

  for (const member of members) {
    // Avoid duplicates using the unique compound constraint homeId_userId
    const existing = await homeClient.homeMember.findUnique({
      where: { homeId_userId: { homeId: member.homeId, userId: member.userId } }
    });
    if (!existing) {
      await homeClient.homeMember.create({ data: member });
    }
  }

  console.log('✅ Home Service Seeded');
}

async function seedDevice() {
  console.log('Seeding Device Service...');

  const devices = [
    {
      id: DEVICE_LIGHT_ID,
      name: 'Smart Light Bulb',
      type: 'LIGHT',
      homeId: HOME_1_ID,
      roomId: ROOM_LIVING_ID,
      macAddress: 'AA:BB:CC:DD:EE:01',
      mqttTopic: `home/${HOME_1_ID}/device/${DEVICE_LIGHT_ID}/state`,
      status: 'OFF',
      isOnline: true,
      metadata: '{"brightness":80,"color":"#ffffff"}'
    },
    {
      id: DEVICE_THERMOSTAT_ID,
      name: 'Smart Thermostat',
      type: 'THERMOSTAT',
      homeId: HOME_1_ID,
      roomId: ROOM_LIVING_ID,
      macAddress: 'AA:BB:CC:DD:EE:02',
      mqttTopic: `home/${HOME_1_ID}/device/${DEVICE_THERMOSTAT_ID}/state`,
      status: 'ON',
      isOnline: true,
      metadata: '{"target_temperature":22,"current_temperature":21.5}'
    },
    {
      id: DEVICE_SENSOR_ID,
      name: 'Bedroom Motion Sensor',
      type: 'SENSOR',
      homeId: HOME_1_ID,
      roomId: ROOM_BEDROOM_ID,
      macAddress: 'AA:BB:CC:DD:EE:03',
      mqttTopic: `home/${HOME_1_ID}/device/${DEVICE_SENSOR_ID}/state`,
      status: 'ON',
      isOnline: true,
      metadata: '{"motion_detected":false}'
    }
  ];

  for (const device of devices) {
    await deviceClient.device.upsert({
      where: { id: device.id },
      update: {},
      create: device
    });
  }

  console.log('✅ Device Service Seeded');
}

async function main() {
  console.log('🌱 Starting Global Database Seed...\n');
  try {
    await seedAuth();
    await seedHome();
    await seedDevice();
    console.log('\n🎉 All databases successfully seeded!');
  } catch (error) {
    console.error('❌ Error during seeding:', error);
  } finally {
    await authClient.$disconnect();
    await homeClient.$disconnect();
    await deviceClient.$disconnect();
  }
}

main();

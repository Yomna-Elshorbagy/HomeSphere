# HomeSphere Backend

HomeSphere is a highly scalable, event-driven microservices architecture for managing a modern smart home ecosystem. It handles user authentication, home management, and real-time IoT device telemetry using MQTT and Redis.

## 🏗 Architecture & Tech Stack

- **Framework**: Node.js & Express.js
- **Database**: PostgreSQL (managed via Prisma ORM with connection pooling)
- **Messaging/IoT**: Mosquitto (MQTT) & RabbitMQ
- **Caching & Rate Limiting**: Redis
- **Structure**: Monorepo (using NPM workspaces)

### Microservices:
1. **API Gateway (`apps/api-gateway`)**: Entry point for all HTTP traffic. Handles tiered rate limiting and proxies requests to underlying services.
2. **Auth Service (`apps/auth-service`)**: JWT-based authentication, user management, and automated background token cleanup.
3. **Home Service (`apps/home-service`)**: Manages physical "Homes", rooms, and home member access controls.
4. **Device Service (`apps/device-service`)**: Manages IoT devices, handles command dispatching, and processes telemetry streams.
5. **Device Simulator (`apps/device-simulator`)**: Simulates thousands of physical IoT devices listening to MQTT to load-test the platform.

## 🚀 Getting Started

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- [Docker](https://www.docker.com/) & Docker Compose

### 2. Start Infrastructure Services
The project relies on PostgreSQL, Redis, RabbitMQ, and Mosquitto MQTT. Run them locally using Docker:
```bash
docker-compose up -d
```

### 3. Install Dependencies
Run from the root directory to install dependencies for all workspaces:
```bash
npm install
```

### 4. Environment Variables (.env)
Before running the database setup, you must configure your environment variables. 
By default, the system requires `.env` files at the root level and within specific microservices.

**Root `.env` Example:**
```env
# Database (Postgres)
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/homesphere?connection_limit=5"

# Security 
JWT_ACCESS_SECRET="yourSuperSecretAccessKey"
JWT_REFRESH_SECRET="yourSuperSecretRefreshKey"

# Infrastructure URLs
REDIS_URL="redis://localhost:6380"
RABBITMQ_URL="amqp://guest:guest@localhost:5672"
MQTT_URL="mqtt://localhost:1883"
MQTT_USERNAME=
MQTT_PASSWORD=
```
*(Make sure to verify the `.env`  & `.env.test` configurations inside `apps/auth-service`, `apps/home-service`, and `apps/device-service` as well to overwrite them with their seperted DATABASE_URL, as they may connect to specific database schemas).*

### 5. Database Setup
Ensure your `.env` files are correctly configured, then run database migrations and generate Prisma clients:
```bash
# Push schema to the database and generate clients
npm run db:generate
npm run db:migrate:auth
npm run db:migrate:home
npm run db:migrate:device
```

### 6. Running the Application
To boot up the API Gateway and all microservices concurrently in development mode:
```bash
npm run dev
```

Alternatively, you can run each service individually in its own terminal:
```bash
npm run dev:auth
npm run dev:home
npm run dev:device
npm run dev:gateway
```

To run the Device Simulator and start generating mock IoT data:
```bash
npm run dev:simulator
```

## 📖 API Documentation (Swagger)
The API Gateway seamlessly proxies all documentation, meaning you only need to connect to port `3000`. Once the services are running, you can interact with the APIs directly from your browser:
- **Auth Service API**: [http://localhost:3000/api-docs/auth-service](http://localhost:3000/api-docs/auth-service)
- **Home Service API**: [http://localhost:3000/api-docs/home-service](http://localhost:3000/api-docs/home-service)
- **Device Service API**: [http://localhost:3000/api-docs/device-service](http://localhost:3000/api-docs/device-service)

## 🧪 Testing
The project features a comprehensive test suite using Jest and Supertest.

Run all tests across all services (automatically resets test databases):
```bash
npm test
```
Or test a specific service:
```bash
npm run test:auth
npm run test:home
npm run test:device
```

## 🧹 Maintenance (Cron Jobs)
To prevent database bloat over time, you can manually trigger the token cleanup script which purges expired JWT refresh tokens using a distributed Redis lock:
```bash
npm run cron:cleanup --workspace=@homesphere/auth-service
```
*(Note: The Auth Service also runs this automatically in the background every 24 hours).*

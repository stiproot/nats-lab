# Streaming API

A WebSocket-based streaming service that consumes messages from NATS via Dapr and broadcasts them to connected clients in real-time.

## Overview

This service provides real-time message streaming capabilities by:

- Subscribing to NATS topics through Dapr pubsub
- Broadcasting received messages to all connected WebSocket clients
- Providing health check endpoints for monitoring

## Architecture

```txt
NATS → Dapr Sidecar → Streaming API → WebSocket Clients
```

**Components:**

- **Express Server**: HTTP server for health checks and WebSocket upgrade
- **WebSocket Server**: Manages client connections and broadcasts
- **Dapr Client**: Subscribes to NATS topics via Dapr pubsub component
- **NATS**: Message streaming managed by Dapr

## Prerequisites

### For Docker Deployment

- Docker Engine 20.x or later
- Docker Compose 2.x or later

### For Local Development

- Node.js 20.x or later
- npm 10.x or later
- Dapr CLI 1.x or later
- NATS Server (can be run via Docker)

## Installation

```bash
# Clone the repository and navigate to the project
cd streaming-api

# Install dependencies
npm install
```

## Configuration

Configuration is managed through environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | HTTP server port |
| `HOST` | `0.0.0.0` | Server bind address |
| `DAPR_HOST` | `127.0.0.1` | Dapr sidecar host |
| `DAPR_HTTP_PORT` | `3500` | Dapr HTTP port |
| `PUBSUB_NAME` | `chatstream-pubsub` | Dapr pubsub component name |
| `TOPIC_NAME` | `chatstream-topic` | NATS topic to subscribe to |
| `NATS_URL` | `nats://localhost:4222` | NATS connection URL |

## Running the Service

### Using Docker Compose (Recommended)

Start all services (NATS, Dapr, and Streaming API):

```bash
docker-compose up -d
```

**Services started:**

- Streaming API: `http://localhost:3000`
- NATS: `nats://localhost:4222`
- NATS Management UI: `http://localhost:8222`
- Dapr HTTP: `http://localhost:3500`

Stop all services:

```sh
docker-compose down
```

### Local Development

#### Step 1: Start NATS

```sh
docker-compose up -d nats
```

#### Step 2: Run the application with Dapr

```sh
dapr run \
  --app-id streaming-api \
  --app-port 3000 \
  --dapr-http-port 3500 \
  --components-path ./components \
  -- npm run dev
```

For local development, use the local component configuration:

```sh
# Use the local components
dapr run --app-id streaming-api --app-port 3000 --dapr-http-port 3500 --components-path ./dapr/components.local -- npm run dev
```

## Usage

### Health Check

Check service status:

```sh
curl http://localhost:3000/health
```

Response:

```json
{
  "status": "healthy",
  "clients": 2
}
```

### WebSocket Connection

Connect to the WebSocket server:

```javascript
const ws = new WebSocket('ws://localhost:3000');

ws.onopen = () => {
  console.log('Connected to streaming API');
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  console.log('Received message:', message);
};

ws.onerror = (error) => {
  console.error('WebSocket error:', error);
};

ws.onclose = () => {
  console.log('Disconnected from streaming API');
};
```

### Publishing Messages to NATS

**Using Dapr CLI:**

```sh
dapr publish --publish-app-id streaming-api --pubsub chatstream-pubsub --topic chatstream-topic --data '{"message": "Hello, World!"}'
```

**Using curl (via Dapr API):**

```sh
curl -X POST http://localhost:3500/v1.0/publish/chatstream-pubsub/chatstream-topic \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello from curl!"}'
```

## Development

### Project Structure

```txt
streaming-api/
├── src/
│   ├── config.ts       # Configuration management
│   ├── types.ts        # TypeScript interfaces
│   ├── websocket.ts    # WebSocket service
│   ├── dapr.ts         # Dapr integration
│   └── index.ts        # Application entry point
├── dapr/
│   ├── components/
│   │   ├── pubsub.yaml              # Dapr component (Docker)
│   │   └── pubsub.chatstream.yml    # Dapr chatstream component (Docker)
│   └── components.local/
│       ├── pubsub.yaml              # Dapr component (Local)
│       └── pubsub.chatstream.yml    # Dapr chatstream component (Local)
├── docker-compose.yaml
├── Dockerfile
├── package.json
└── tsconfig.json
```

### Available Scripts

```bash
# Development with hot reload
npm run dev

# Build TypeScript
npm run build

# Run production build
npm start

# Run tests (not yet implemented)
npm test
```

### Building for Production

```bash
# Build TypeScript
npm run build

# Build Docker image
docker build -t streaming-api:latest .
```

## Troubleshooting

### WebSocket Connection Issues

**Problem:** Cannot connect to WebSocket

**Solution:**

1. Check if service is running: `curl http://localhost:3000/health`
2. Verify port 3000 is not in use: `lsof -i :3000`
3. Check Docker logs: `docker-compose logs streaming-api`

### Dapr Connection Issues

**Problem:** Messages not being received from NATS

**Solution:**

1. Check Dapr logs: `docker-compose logs streaming-api-dapr`
2. Verify NATS is healthy: `docker-compose ps nats`
3. Check component configuration: `cat dapr/components/pubsub.yaml`
4. Test Dapr directly: `dapr components -k`

### NATS Connection Issues

**Problem:** Cannot connect to NATS

**Solution:**

1. Check NATS status: `docker-compose ps nats`
2. View NATS logs: `docker-compose logs nats`
3. Verify connection URL in component configuration
4. Check network connectivity: `docker-compose exec streaming-api ping nats`

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f streaming-api
docker-compose logs -f nats
docker-compose logs -f streaming-api-dapr

# Last 100 lines
docker-compose logs --tail=100 streaming-api
```

## Testing with websocat

Install websocat for WebSocket testing:

```bash
# macOS
brew install websocat

# Linux
cargo install websocat
```

Connect to WebSocket:

```bash
websocat ws://localhost:3000
```

## API Reference

### HTTP Endpoints

#### `GET /health`

Returns service health status.

**Response:**

```json
{
  "status": "healthy",
  "clients": 0
}
```

### WebSocket

#### Connection: `ws://localhost:3000`

Accepts WebSocket connections. Messages from NATS are broadcast to all connected clients in JSON format.

## Dapr Components

### NATS Pubsub Component

Located in `dapr/components/pubsub.chatstream.yml`

**Configuration:**

- **Component Name**: `chatstream-pubsub`
- **Type**: `pubsub.natsstreaming`
- **Topic**: `chatstream-topic`
- **Subscription Type**: `queue`
- **Durable Subscription**: `dapr-durable`

## License

ISC

## Contributing

1. Create a feature branch
2. Make your changes
3. Run tests (when available)
4. Submit a pull request

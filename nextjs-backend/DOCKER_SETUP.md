# Docker Setup for Next.js Backend with Ngrok

This guide will help you containerize your Next.js backend server and expose it through ngrok using Docker Desktop.

## Prerequisites

1. **Docker Desktop** installed and running
2. **Ngrok extension** enabled in Docker Desktop
3. **Ngrok account** and auth token

## Setup Instructions

### 1. Get Your Ngrok Auth Token

1. Sign up at [ngrok.com](https://ngrok.com) if you haven't already
2. Go to your [Auth Token page](https://dashboard.ngrok.com/get-started/your-authtoken)
3. Copy your auth token

### 2. Configure Environment Variables

1. Copy the example environment file:
   ```bash
   cp env.example .env
   ```

2. Edit `.env` and add your ngrok auth token:
   ```
   NGROK_AUTHTOKEN=your_actual_auth_token_here
   ```

### 3. Build and Run with Docker Compose

```bash
# Build and start both services
pnpm run docker:compose

# Or run in detached mode (background)
pnpm run docker:compose:detached
```

### 4. Access Your Application

- **Local access**: http://localhost:3000
- **Public access**: Check Docker Desktop's ngrok extension for the public URL

## Available Commands

```bash
# Build Docker image
pnpm run docker:build

# Run container manually
pnpm run docker:run

# Start with docker-compose
pnpm run docker:compose

# Start in background
pnpm run docker:compose:detached

# Stop services
docker-compose down

# View logs
docker-compose logs -f

# View logs for specific service
docker-compose logs -f nextjs-backend
docker-compose logs -f ngrok
```

## Docker Services

### Next.js Backend Service
- **Image**: Custom built from Dockerfile
- **Port**: 3000 (mapped to host)
- **Volume**: `./markdown.db:/app/markdown.db` (persistent database)
- **Environment**: Production mode

### Ngrok Service
- **Image**: `ngrok/ngrok:latest`
- **Function**: Creates public tunnel to Next.js service
- **Configuration**: Uses your auth token from environment

## Database Persistence

The SQLite database (`markdown.db`) is mounted as a volume, so your data persists between container restarts.

## Troubleshooting

### Container Won't Start
```bash
# Check logs
docker-compose logs

# Rebuild without cache
docker-compose build --no-cache
```

### Ngrok Not Working
1. Verify your auth token in `.env`
2. Check ngrok logs: `docker-compose logs ngrok`
3. Ensure Docker Desktop ngrok extension is enabled

### Database Issues
```bash
# Check if database file exists
ls -la markdown.db

# Recreate database
rm markdown.db
pnpm run setup-db
```

## Production Considerations

1. **Security**: Change default ports and add authentication
2. **SSL**: Use ngrok's HTTPS endpoints
3. **Monitoring**: Add health checks and logging
4. **Scaling**: Consider using Docker Swarm or Kubernetes

## API Endpoints

Once running, your API will be available at:

- **POST** `{ngrok-url}/api/save-markdown`
- **GET** `{ngrok-url}/api/get-latest-markdown`

Example with ngrok URL:
```bash
curl -X POST https://abc123.ngrok.io/api/save-markdown \
  -H "Content-Type: application/json" \
  -d '{"markdownContent": "# Hello World"}'
```

## File Structure

```
nextjs-backend/
├── Dockerfile
├── docker-compose.yml
├── .dockerignore
├── ngrok-config.yml
├── env.example
├── .env (create this)
└── DOCKER_SETUP.md
```

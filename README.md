# ChatFirst

A proactive, long-term personal AI companion designed to act as an executive assistant, accountability coach, and connected second brain.

## Features

- **Proactive Messaging**: AI reaches out first to follow up on commitments and check in on goals
- **Multi-Bot Group Chat**: Autonomous bots interact and coordinate in dedicated groups
- **Persistent Long-Term Memory**: Retains context across weeks and months
- **Accountability & Tracking**: Habit tracker and goal monitor with streak tracking
- **Calendar Sync**: Connects with productivity tools (Google Calendar, Todoist)
- **Customizable Persona**: Adaptable tone from gentle supporter to strict accountability partner

## Tech Stack

- **Backend**: Node.js + Express + TypeScript
- **Database**: SQLite with WAL mode
- **AI**: OpenAI / Groq compatible API
- **Frontend**: React + Vite + Tailwind CSS
- **Scheduler**: node-cron for proactive messaging
- **Authentication**: JWT with refresh tokens

## Quick Start

### Prerequisites

- Node.js 22+
- npm 10+
- OpenAI API key (or Groq API key)

### Installation

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your API keys

# Run database migrations
npm run db:migrate

# Start development server
npm run dev
```

### Production Deployment

```bash
# Build and run with Docker
docker-compose up -d

# Or deploy to Render.com
# 1. Push to GitHub
# 2. Connect repo at render.com
# 3. Set environment variables
```

## Environment Variables

See `.env.example` for all available configuration options.

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `POST /api/auth/register` | Register new user |
| `POST /api/auth/login` | Login user |
| `GET /api/users/me` | Get current user |
| `PUT /api/users/persona` | Update AI persona |
| `GET /api/memory` | List memories |
| `POST /api/memory` | Create memory |
| `GET /api/goals` | List goals |
| `POST /api/goals` | Create goal |
| `GET /api/accountability/commitments` | List commitments |
| `POST /api/accountability/commitments` | Create commitment |
| `POST /api/accountability/checkins` | Record check-in |
| `GET /api/chat/history` | Get chat history |
| `POST /api/chat/message` | Send chat message |
| `GET /api/bots/groups` | List bot groups |
| `POST /api/bots/groups` | Create bot group |
| `GET /api/health` | Health check |

## License

MIT

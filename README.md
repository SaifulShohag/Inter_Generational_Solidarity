# Inter-GenAIrational Solidarity — VibeForAll

> Connecting seniors with local volunteers through AI-powered conversations.

---

## Project Structure

```
Inter_Generational_Solidarity/
├── app/                    # FastAPI backend
│   ├── main.py             # App entry point, middleware, router registration
│   ├── config.py           # Environment variable settings
│   ├── dependencies.py     # Auth & DB dependency injection
│   ├── models/             # SQLAlchemy database models
│   ├── routers/            # API route handlers (auth, requests, conversations…)
│   ├── schemas/            # Pydantic request/response schemas
│   └── services/           # Business logic (AI agent, auth, database, sessions)
├── mcp_server/             # Tools exposed to the AI agent
│   └── tools/request_tools.py
├── alembic/                # Database migration scripts
├── static/                 # HTML/JS/CSS frontend (served by the API)
├── start.sh                # Container entrypoint (runs migrations then starts server)
├── requirements.txt
└── .env                    # ← you create this (see below)
```

---

## Running with Docker (Recommended)

Docker is the easiest way to run the project — no Python setup required, works the same on Windows, Mac, and Linux.

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/)

### 1. Create the `.env` file

Create a file named `.env` in the project root with the following content:

```env
# Generate any long random string, e.g.: openssl rand -hex 32
SECRET_KEY=your-secret-key-here

# LLM API — pick one of the options below

# Option A: Groq (free tier available — recommended for getting started)
OPENAI_API_KEY=your-groq-api-key
OPENAI_BASE_URL=https://api.groq.com/openai/v1
LLM_MODEL_NAME=llama-3.1-8b-instant

# Option B: Mistral
# OPENAI_API_KEY=your-mistral-api-key
# OPENAI_BASE_URL=https://api.mistral.ai/v1
# LLM_MODEL_NAME=mistral-small-latest

# Option C: Any other OpenAI-compatible API
# OPENAI_API_KEY=your-key
# OPENAI_BASE_URL=https://your-provider/v1
# LLM_MODEL_NAME=your-model-name
```

> The `DATABASE_URL` and `CONVERSATIONS_DIR` are already set in `docker-compose.yml` — do not add them to `.env`.

### 2. Build and start

```bash
docker compose up --build
```

The first run builds the image and runs database migrations automatically via `start.sh`.
Subsequent runs just need:

```bash
docker compose up
```

### 3. Open the app

- **Frontend:** http://localhost:8000
- **API docs (Swagger):** http://localhost:8000/docs

### Stop

```bash
docker compose down
```

Data (database + conversation files) is stored in a Docker volume and survives restarts.

---

## Running without Docker (Python / FastAPI)

### Prerequisites

- Python 3.11+
- An API key for a supported LLM provider (Groq, Mistral, or any OpenAI-compatible API)

### 1. Create the `.env` file

In the project root, create `.env`:

```env
SECRET_KEY=your-secret-key-here
DATABASE_URL=sqlite+aiosqlite:///./helpme.db
CONVERSATIONS_DIR=./conversations

OPENAI_API_KEY=your-api-key-here
OPENAI_BASE_URL=https://api.groq.com/openai/v1
LLM_MODEL_NAME=llama-3.1-8b-instant
```

### 2. Create and activate a virtual environment

```bash
python -m venv .venv

# macOS / Linux
source .venv/bin/activate

# Windows
.venv\Scripts\activate
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Run database migrations

```bash
alembic upgrade head
```

This creates `helpme.db` with all required tables.

### 5. Start the server

```bash
uvicorn app.main:app --reload
```

The server runs at **http://localhost:8000**

- **Frontend:** http://localhost:8000
- **API docs (Swagger):** http://localhost:8000/docs

---

## How It Works

1. **Senior opens the app** and starts a conversation (voice or text)
2. **AI agent** guides them through a friendly chat to collect:
   - What kind of help they need (medical, grocery, transport, cleaning, other)
   - Description of the task
   - Date and time
   - Location and priority
3. **AI agent** calls `create_help_request` once all details are confirmed
4. **Help request** is saved to the database with status `PENDING`
5. **Volunteers** browse open requests sorted by distance, and accept missions
6. A **meeting code** is generated for both parties to verify each other in person
7. The volunteer can withdraw (with explanation) — the request is rebroadcast to other volunteers
8. The senior can cancel a pending request at any time
9. After completion, both parties can leave a review

---

## API Overview

### Auth

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/auth/register` | Create a new account |
| `POST` | `/auth/login` | Login and receive a JWT token |
| `GET` | `/auth/me` | Get the current user |
| `DELETE` | `/auth/me` | Delete account and all associated data |

### Conversations (AI agent)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/conversations` | List all sessions for current user |
| `POST` | `/conversations/start` | Start a new AI conversation session |
| `POST` | `/conversations/{id}/message` | Send a message (streams SSE response) |
| `GET` | `/conversations/{id}/history` | Get full message history of a session |
| `DELETE` | `/conversations/{id}` | Delete a session |

### Help Requests

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/requests` | List requests (filter by `status`, `limit`) |
| `GET` | `/requests/mine` | List requests created by current senior |
| `GET` | `/requests/{id}` | Get a specific request + assignment |
| `POST` | `/requests/{id}/accept` | Volunteer accepts a mission (generates meeting code) |
| `POST` | `/requests/{id}/withdraw` | Volunteer withdraws (requires reason, rebroadcasts) |
| `POST` | `/requests/{id}/complete` | Mark a mission as completed |
| `POST` | `/requests/{id}/cancel` | Senior cancels a pending request |

### Reviews & Location

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/requests/{id}/review` | Submit a rating after a completed mission |
| `GET` | `/users/{id}/reviews` | Get reviews for a user |
| `WS` | `/ws/location/{request_id}` | WebSocket for real-time location sharing |

Full interactive docs at **http://localhost:8000/docs** when the server is running.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend API | FastAPI + Uvicorn |
| Database | SQLite (async via aiosqlite + SQLAlchemy) |
| Migrations | Alembic |
| Auth | JWT (python-jose + passlib/bcrypt) |
| AI Model | Any OpenAI-compatible API (Groq, Mistral, etc.) |
| Agent tooling | Tool calling via streaming SSE |
| Frontend | Static HTML + vanilla JS (served by the API) |

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
│   ├── routers/            # API route handlers (auth, help requests, conversations…)
│   ├── schemas/            # Pydantic request/response schemas
│   └── services/           # Business logic (AI agent, auth, database, sessions)
├── mcp_server/             # MCP server — tools exposed to the AI agent
│   └── tools/request_tools.py
├── alembic/                # Database migration scripts
├── static/                 # Simple HTML frontend (login, register, chat)
├── vibeforall/             # React + TypeScript frontend (polished UI)
├── requirements.txt
└── .env                    # ← you create this (see below)
```

---

## Running with Docker (Recommended)

Docker is the easiest way to run the backend — no Python, no virtual environment, works the same on Windows, Mac, and Linux.

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/)

### 1. Create the `.env` file

Copy the example and fill in your values:

```bash
cp .env.example .env
```

Edit `.env`:

```env
SECRET_KEY=your-secret-key-here        # any long random string
DATABASE_URL=sqlite+aiosqlite:///./helpme.db  # leave as-is
OPENAI_API_KEY=your-api-key-here       # Groq / ZhipuAI / any OpenAI-compatible key
OPENAI_BASE_URL=https://api.groq.com/openai/v1
LLM_MODEL_NAME=llama-3.1-8b-instant
```

### 2. Build and start

```bash
docker compose up --build
```

The first run builds the image and runs database migrations automatically.
Subsequent runs just need:

```bash
docker compose up
```

### 3. Open the app

- **Simple HTML frontend:** http://localhost:8000
- **API docs (Swagger):** http://localhost:8000/docs

### Stop

```bash
docker compose down
```

Data (database + conversation sessions) is stored in a Docker volume and survives restarts.

---

## Backend Setup (Python / FastAPI)

### Prerequisites

- Python 3.11+
- A [ZhipuAI](https://open.bigmodel.cn/) API key (for the GLM-4-Flash AI model)

### 1. Create the `.env` file

In the repo root, create a file named `.env` with the following content:

```env
# Generate any long random string, e.g.: openssl rand -hex 32
SECRET_KEY=your-secret-key-here

# SQLite database (created automatically on first run)
DATABASE_URL=sqlite+aiosqlite:///./helpme.db

# ZhipuAI key — get one at https://open.bigmodel.cn/
GLM_API_KEY=your-zhipuai-api-key

# Optional — these are the defaults, only set them if you want to override
# GLM_BASE_URL=https://open.bigmodel.cn/api/paas/v4/
# GLM_MODEL=glm-4-flash
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

This creates the SQLite database file (`helpme.db`) with all the required tables:
- `users` — seniors and volunteers
- `help_requests` — requests submitted by seniors
- `volunteer_assignments` — matches between volunteers and requests
- `reviews` — post-mission ratings

### 5. Start the backend server

```bash
uvicorn app.main:app --reload
```

The server runs at **http://localhost:8000**

- **API docs (Swagger):** http://localhost:8000/docs
- **Simple HTML frontend:** http://localhost:8000

---

## Frontend Setup (React / TypeScript)

The React frontend runs independently with mock data — no backend required.

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or higher

### 1. Install dependencies

```bash
cd vibeforall
npm install
```

### 2. Start the development server

```bash
npm run dev
```

The app runs at **http://localhost:5173**

### Demo login

On the login screen, select a role then click the **demo login** button — no credentials needed.

| Role | Access |
|------|--------|
| **Bénévole (Volunteer)** | Dashboard, missions list, history, statistics, profile |
| **Senior** | Home screen with AI voice assistant and AI chat |

### Other frontend commands

```bash
# Type-check without building
npx tsc --noEmit

# Build for production
npm run build

# Preview the production build locally
npm run preview
```

---

## How It Works

1. **Senior opens the app** and starts a conversation (voice or text)
2. **AI agent (GLM-4-Flash)** guides them through a friendly chat to collect:
   - What kind of help they need (medical, grocery, transport, cleaning, other)
   - Description of the task
   - Date and time
   - Location
3. **AI agent** calls `create_help_request` directly once all details are confirmed
4. **Help request** is saved to the database with status `PENDING`
5. **Volunteers** browse open requests and accept missions
6. After completion, both parties can leave a review

---

## API Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/auth/register` | Create a new account |
| `POST` | `/auth/login` | Login and receive a JWT token |
| `GET` | `/auth/me` | Get the current user |
| `POST` | `/conversations/` | Start a new AI conversation session |
| `POST` | `/conversations/{id}/message` | Send a message (streams SSE response) |
| `GET` | `/help-requests/` | List help requests |
| `GET` | `/help-requests/{id}` | Get a specific request |
| `POST` | `/help-requests/{id}/accept` | Volunteer accepts a mission |
| `POST` | `/reviews/` | Submit a review |
| `GET` | `/location/nearby` | Get nearby open requests |

Full interactive docs available at **http://localhost:8000/docs** when the server is running.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend API | FastAPI + Uvicorn |
| Database | SQLite (async via aiosqlite + SQLAlchemy) |
| Migrations | Alembic |
| Auth | JWT (python-jose + passlib/bcrypt) |
| AI Model | GLM-4-Flash / Llama 3 (any OpenAI-compatible API) |
| Agent tooling | Tool calling via OpenAI-compatible streaming API |
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS v3 |
| Charts | Recharts |
| Icons | Lucide React |

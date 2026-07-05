# Inter-GenAIrational Solidarity — VibeForAll

> Connecting seniors with local volunteers through AI-powered conversations.

---

## Project Structure

```
Inter_Generational_Solidarity/
├── app/
│   ├── main.py                  # App entry point, middleware, router registration
│   ├── config.py                # Environment variable settings (pydantic-settings)
│   ├── dependencies.py          # Auth & DB dependency injection, require_role()
│   ├── limiter.py               # Shared slowapi rate-limiter instance
│   ├── models/                  # SQLAlchemy models (User, HelpRequest, Assignment, Review, Conversation)
│   ├── routers/                 # Route handlers
│   │   ├── auth.py              # Register, login (httpOnly cookie), logout, me, delete account
│   │   ├── conversations.py     # AI chat sessions (SSE streaming)
│   │   ├── help_requests.py     # CRUD + accept / withdraw / complete / cancel
│   │   ├── reviews.py           # Post-mission ratings
│   │   └── location.py          # Nearby requests
│   ├── schemas/                 # Pydantic request/response models
│   └── services/
│       ├── agent_service.py     # AI agent (streaming, tool calling, validation)
│       ├── auth_service.py      # JWT creation & verification
│       ├── conversation_store.py# Session persistence (encrypted JSON files)
│       ├── crypto.py            # Fernet AES encryption for conversation files
│       └── database.py          # Async SQLAlchemy engine & session
├── mcp_server/
│   └── tools/request_tools.py  # Tools exposed to the AI agent
├── alembic/                     # Database migration scripts
├── static/                      # HTML/CSS/JS frontend (served by FastAPI)
│   ├── api.js                   # Shared fetch wrapper (credentials + doLogout)
│   ├── chat.html / chat.js      # Senior AI chat interface
│   ├── volunteer-dashboard.*    # Volunteer dashboard
│   ├── missions.*               # Mission browsing + filtering
│   ├── mission-detail.*         # Mission detail + accept/withdraw
│   ├── accepted-missions.*      # Volunteer mission history
│   ├── help-history.*           # Senior request history + reviews
│   ├── elderly-home.*           # Senior home screen
│   └── styles.css
├── vibeforall/                  # React + TypeScript frontend (polished UI)
├── conversations/               # Encrypted conversation session files (auto-created)
├── requirements.txt
├── Dockerfile
├── docker-compose.yml
└── .env                         # ← you create this (see below)
```

---

## Running with Docker (Recommended)

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/)

### 1. Create the `.env` file

```bash
cp .env.example .env
```

Edit `.env`:

```env
# Auth — generate with: openssl rand -hex 32
SECRET_KEY=your-secret-key-here

# Database
DATABASE_URL=sqlite+aiosqlite:///./helpme.db

# LLM — Groq (free tier available at console.groq.com)
OPENAI_API_KEY=your-groq-api-key
OPENAI_BASE_URL=https://api.groq.com/openai/v1
LLM_MODEL_NAME=llama-3.1-8b-instant

# Conversation encryption (GDPR) — generate with:
# python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
CONVERSATION_SECRET_KEY=your-fernet-key-here

# CORS — comma-separated list of allowed origins
ALLOWED_ORIGINS=http://localhost:8000

# Set to true only if your app itself terminates TLS (not needed on Render/Heroku)
HTTPS_ENABLED=false
```

### 2. Build and start

```bash
docker compose up --build
```

The first run builds the image and runs database migrations automatically. Subsequent runs:

```bash
docker compose up
```

### 3. Open the app

| URL | Description |
|-----|-------------|
| http://localhost:8000 | HTML frontend |
| http://localhost:8000/docs | Interactive API docs (Swagger) |

### Stop

```bash
docker compose down
```

Data (SQLite database + encrypted conversation files) is stored in a Docker volume and survives restarts.

---

## Backend Setup (Python / FastAPI)

### Prerequisites

- Python 3.11+
- A [Groq](https://console.groq.com/) API key (free tier, Llama 3.1)

### 1. Create the `.env` file

See the Docker section above for the full list of variables.

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

This creates `helpme.db` with the tables:

| Table | Purpose |
|-------|---------|
| `users` | Seniors (role: `requester`) and volunteers |
| `help_requests` | Requests submitted by seniors via AI chat |
| `volunteer_assignments` | Volunteer–request matches with meeting code |
| `reviews` | Post-mission star ratings |

### 5. Start the server

```bash
uvicorn app.main:app --reload
```

---

## Frontend Setup (React / TypeScript)

The React frontend runs independently with mock data — no backend required.

### Prerequisites

- Node.js v18+

### 1. Install and run

```bash
cd vibeforall
npm install
npm run dev
```

Runs at **http://localhost:5173**. Use the demo login button — no credentials needed.

---

## How It Works

1. **Senior opens the app** and starts a conversation (voice or text)
2. **AI agent (Llama 3.1 via Groq)** guides them through a friendly multilingual chat to collect:
   - What kind of help (medical, grocery, transport, cleaning, other)
   - Description of the task
   - Exact date and time
   - Location (Paris region)
   - Priority level
3. **Server-side validation** blocks the agent from submitting until all 6 fields are confirmed
4. **Agent calls `create_help_request`** — request saved with status `PENDING`
5. **Volunteers** browse, filter, and accept open missions
6. A **meeting code** is generated on acceptance — the senior shows it to confirm identity
7. After completion, both parties rate each other

---

## Security

| Measure | Implementation |
|---------|---------------|
| Auth tokens | httpOnly cookies (JS-inaccessible) + Bearer header fallback |
| Conversation files | AES-128 encrypted at rest (Fernet) |
| Role enforcement | Server-side `require_role()` on every endpoint |
| Brute force protection | 10 req/min rate limit on `/auth/login` and `/auth/register` |
| CORS | Restricted to `ALLOWED_ORIGINS` (no wildcard in production) |
| Password storage | bcrypt |

---

## API Reference

### Auth

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/auth/register` | — | Create account; sets httpOnly cookie |
| `POST` | `/auth/login` | — | Login; sets httpOnly cookie |
| `POST` | `/auth/logout` | cookie | Clear auth cookie |
| `GET` | `/auth/me` | cookie | Get current user |
| `DELETE` | `/auth/me` | cookie | Delete account and all data |

### Conversations (seniors only)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/conversations` | List user's sessions |
| `POST` | `/conversations/start` | Start a new session |
| `POST` | `/conversations/{id}/message` | Send message (SSE streaming) |
| `GET` | `/conversations/{id}/history` | Get session history |

### Help Requests

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| `GET` | `/requests` | volunteer | Browse pending missions |
| `GET` | `/requests/mine` | requester | My own requests |
| `GET` | `/requests/{id}` | any | Request detail + assignment |
| `POST` | `/requests/{id}/accept` | volunteer | Accept a mission |
| `POST` | `/requests/{id}/withdraw` | volunteer | Withdraw from a mission |
| `POST` | `/requests/{id}/complete` | either | Mark as completed |
| `POST` | `/requests/{id}/cancel` | requester | Cancel a pending request |

### Reviews & Location

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/requests/{id}/review` | Submit a star rating |
| `GET` | `/users/{id}/reviews` | Get reviews for a user |
| `GET` | `/location/nearby` | Nearby open requests |

Full interactive docs at **http://localhost:8000/docs**

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend API | FastAPI + Uvicorn |
| Database | SQLite (async — aiosqlite + SQLAlchemy 2.0) |
| Migrations | Alembic |
| Auth | JWT via python-jose; passwords via passlib/bcrypt; httpOnly cookies |
| Rate limiting | slowapi |
| Encryption | cryptography (Fernet) — conversation files at rest |
| AI Model | Llama 3.1-8b-instant via Groq (OpenAI-compatible API) |
| AI tooling | Streaming tool calling with server-side field validation |
| HTML frontend | Vanilla JS + CSS (served by FastAPI from `/static`) |
| React frontend | React 18 + TypeScript + Vite + Tailwind CSS v3 |

---

## Deployment (Render)

1. Push to GitHub
2. New Web Service → connect repo → **Docker** environment
3. Add all `.env` variables in the Render dashboard
4. Set `ALLOWED_ORIGINS=https://your-app.onrender.com`
5. Leave `HTTPS_ENABLED=false` — Render terminates TLS at the edge, not inside your container

> **Note:** Render's filesystem is ephemeral. For persistent data, add a **Render PostgreSQL** database and update `DATABASE_URL` — no code changes required.

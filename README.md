# Inter-GenAIrational Solidarity — VibeForAll_Hackaton
Live at https://inter-generational-solidarity.onrender.com
> Connecting seniors with local volunteers through AI-powered conversations.

---

## Project Structure

```
Inter_Generational_Solidarity/
├── app/
│   ├── main.py                  # App entry point, CORS middleware, router registration
│   ├── config.py                # Environment variable settings (pydantic-settings)
│   ├── dependencies.py          # Auth & DB dependency injection, require_role()
│   ├── models/                  # SQLAlchemy models (User, HelpRequest, Assignment, Review)
│   ├── routers/
│   │   ├── auth.py              # Register, login (httpOnly cookie), logout, me, delete account
│   │   ├── conversations.py     # AI chat sessions (SSE streaming)
│   │   ├── help_requests.py     # CRUD + accept / withdraw / complete / cancel
│   │   ├── reviews.py           # Post-mission ratings
│   │   └── location.py          # Nearby requests
│   ├── schemas/                 # Pydantic request/response models
│   └── services/
│       ├── agent_service.py     # AI agent (streaming, tool calling, server-side validation)
│       ├── auth_service.py      # JWT creation & verification
│       ├── conversation_store.py# Session persistence (Fernet-encrypted JSON files)
│       ├── crypto.py            # AES-128 encryption/decryption (cryptography.fernet)
│       └── database.py          # Async SQLAlchemy engine & session factory
├── mcp_server/
│   └── tools/request_tools.py  # Tools exposed to the AI agent via tool calling
├── static/                      # Vanilla HTML/CSS/JS frontend (served by FastAPI)
│   ├── api.js                   # Global fetch wrapper — injects auth cookie + doLogout()
│   ├── chat.html / chat.js      # Senior AI chat (text + voice input, SSE streaming)
│   ├── elderly-home.*           # Senior home screen
│   ├── help-history.*           # Senior request history + reviews
│   ├── volunteer-dashboard.*    # Volunteer dashboard with stats
│   ├── missions.*               # Mission browsing + filtering
│   ├── mission-detail.*         # Mission detail + accept / withdraw
│   ├── accepted-missions.*      # Volunteer active missions
│   ├── login.*                  # Login / register
│   └── styles.css
├── conversations/               # Encrypted conversation files (auto-created at runtime)
├── requirements.txt
├── Dockerfile
├── docker-compose.yml
└── .env                         # ← create this locally (see below)
```

---

## Running with Docker (Recommended)

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/)

### 1. Create the `.env` file

```env
# Auth — generate with: openssl rand -hex 32
SECRET_KEY=your-secret-key-here

# Database — SQLite for local, Neon PostgreSQL for production
DATABASE_URL=sqlite+aiosqlite:///./helpme.db

# LLM — Groq free tier at console.groq.com
OPENAI_API_KEY=your-groq-api-key
OPENAI_BASE_URL=https://api.mistral.ai/v1
LLM_MODEL_NAME=mistral-small-latest

# Conversation encryption — generate with:
# python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
CONVERSATION_SECRET_KEY=your-fernet-key-here

# CORS — comma-separated allowed origins
ALLOWED_ORIGINS=http://localhost:8000

# Cookie security — set true only if your app itself terminates TLS
HTTPS_ENABLED=false
```

### 2. Build and start

```bash
docker compose up --build
```

Subsequent runs:

```bash
docker compose up
```

### 3. Open the app

| URL | Description |
|-----|-------------|
| http://localhost:8000 | Frontend |
| http://localhost:8000/docs | Swagger API docs |

### Stop

```bash
docker compose down
```

---

## Running without Docker

### Prerequisites

- Python 3.11+
- A [Groq](https://console.groq.com/) API key

```bash
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Tables are created automatically on first startup via SQLAlchemy `create_all`.

---

## How It Works

1. **Senior opens the app** and starts an AI conversation (text or voice)
2. **AI agent (Llama 3.1 via Groq)** guides them through a friendly multilingual chat to collect:
   - Type of help needed (medical, grocery, transport, cleaning, other)
   - Task description
   - Date and time
   - Location (Paris region)
   - Priority level
3. **Server-side validation** prevents the agent from submitting until all fields are confirmed by the user
4. **Agent calls `create_help_request`** — request saved with status `PENDING`
5. **Volunteers** browse and accept open missions
6. A **meeting code** is generated on acceptance for identity confirmation
7. After completion, both parties can leave a star rating

---

## Security

| Measure | How |
|---------|-----|
| Authentication | JWT stored in an **httpOnly cookie** — inaccessible to JavaScript, preventing XSS token theft. Bearer header accepted as fallback for API clients. |
| Conversation privacy | All conversation files encrypted at rest with **Fernet (AES-128-CBC + HMAC-SHA256)** via the `cryptography` package. Legacy plaintext files are read transparently during migration. |
| Role enforcement | Server-side `require_role()` dependency on every endpoint — role checks cannot be bypassed from the frontend. |
| CORS | Restricted to explicit `ALLOWED_ORIGINS` — no wildcard in production. |
| Password storage | `bcrypt` via `passlib`. |

---

## Key Packages

| Package | Purpose |
|---------|---------|
| `fastapi` + `uvicorn` | Async web framework and server |
| `sqlalchemy` + `aiosqlite` / `asyncpg` | Async ORM — SQLite locally, PostgreSQL in production |
| `python-jose` | JWT creation and verification |
| `passlib[bcrypt]` | Password hashing |
| `cryptography` | Fernet encryption for conversation files |
| `openai` | LLM client (OpenAI-compatible, used with Groq) |
| `mcp` | Model Context Protocol — tool calling interface |
| `sse-starlette` | Server-Sent Events for streaming AI responses |
| `pydantic-settings` | Environment variable management |

---

## API Reference

### Auth

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/auth/register` | Create account — sets httpOnly cookie |
| `POST` | `/auth/login` | Login — sets httpOnly cookie |
| `POST` | `/auth/logout` | Clear auth cookie |
| `GET` | `/auth/me` | Get current user |
| `DELETE` | `/auth/me` | Delete account and all associated data |

### Conversations (seniors only)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/conversations` | List sessions |
| `POST` | `/conversations/start` | Start new session |
| `POST` | `/conversations/{id}/message` | Send message (SSE streaming) |
| `GET` | `/conversations/{id}/history` | Get session history |

### Help Requests

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| `GET` | `/requests` | volunteer | Browse pending missions |
| `GET` | `/requests/mine` | requester | My requests |
| `GET` | `/requests/{id}` | any | Request + assignment detail |
| `POST` | `/requests/{id}/accept` | volunteer | Accept a mission |
| `POST` | `/requests/{id}/withdraw` | volunteer | Withdraw from a mission |
| `POST` | `/requests/{id}/complete` | either | Mark completed |
| `POST` | `/requests/{id}/cancel` | requester | Cancel a request |

### Reviews & Location

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/requests/{id}/review` | Submit star rating |
| `GET` | `/users/{id}/reviews` | Get user reviews |
| `GET` | `/location/nearby` | Nearby open requests |

---

## Deployment (Render)

1. Push to GitHub
2. **New Web Service** → connect repo → select **Docker** environment
3. Add environment variables in the Render dashboard (same as `.env` above)
4. Set `ALLOWED_ORIGINS=https://your-app.onrender.com`
5. Set `HTTPS_ENABLED=false` — Render terminates TLS at the edge; your container receives plain HTTP internally
6. For persistent data use **Neon PostgreSQL** — change `DATABASE_URL` to `postgresql+asyncpg://...` (no code changes needed)

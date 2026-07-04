# Inter-GenAIrational Solidarity — VibeForAll

> Connecting seniors with local volunteers through AI-powered conversations.

---

## Project Structure

```
Inter_Generational_Solidarity/
├── backend/                # FastAPI backend (Python)
│   ├── app/                # API routes, models, services
│   ├── mcp_server/         # AI agent tool definitions
│   ├── alembic/            # Database migrations
│   ├── requirements.txt
│   ├── Dockerfile
│   └── start.sh
├── vibeforall/             # React + TypeScript frontend
│   ├── src/
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
├── docker-compose.yml      # Runs both services together
└── .env                    # ← you create this (see below)
```

---

## Running with Docker (Recommended)

One command runs everything — the React frontend and the FastAPI backend.

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/)

### 1. Create the `.env` file

```bash
cp .env.example .env
```

Edit `.env` and fill in your API key:

```env
SECRET_KEY=any-long-random-string
DATABASE_URL=sqlite+aiosqlite:///./helpme.db
OPENAI_API_KEY=your-api-key-here
OPENAI_BASE_URL=https://api.groq.com/openai/v1
LLM_MODEL_NAME=llama-3.1-8b-instant
```

### 2. Build and start

```bash
docker compose up --build
```

The first run builds both images and runs database migrations automatically.
Subsequent runs:

```bash
docker compose up
```

### 3. Open the app

**http://localhost**

- Create an account on the login screen (register tab)
- Log in as a **Senior** to use the AI chat/voice assistant
- Log in as a **Bénévole** to browse and accept missions

### Stop

```bash
docker compose down
```

Data (database + conversation sessions) is stored in a Docker volume and survives restarts.

---

## Local Development (without Docker)

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload
```

Backend runs at **http://localhost:8000**

### Frontend

```bash
cd vibeforall
npm install
npm run dev
```

Frontend runs at **http://localhost:5173**

> For local dev, create `vibeforall/.env.local` with:
> ```
> VITE_API_URL=http://localhost:8000
> ```

---

## How It Works

1. **Senior opens the app** and starts a conversation (voice or text)
2. **AI agent** guides them through a friendly chat to collect:
   - What kind of help they need (medical, grocery, transport, cleaning, other)
   - Description of the task, date and time, location
3. **AI agent** calls `create_help_request` once all details are confirmed
4. **Help request** is saved with status `PENDING`
5. **Volunteers** browse open requests and accept missions

---

## API Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/auth/register` | Create a new account |
| `POST` | `/auth/login` | Login and receive a JWT token |
| `GET` | `/auth/me` | Get the current user |
| `POST` | `/conversations/start` | Start a new AI conversation session |
| `POST` | `/conversations/{id}/message` | Send a message (streams SSE response) |
| `GET` | `/help-requests/` | List help requests |
| `POST` | `/help-requests/{id}/accept` | Volunteer accepts a mission |
| `POST` | `/reviews/` | Submit a review |

Full interactive docs: **http://localhost:8000/docs** (when backend is running locally)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend API | FastAPI + Uvicorn |
| Database | SQLite (async via aiosqlite + SQLAlchemy) |
| Auth | JWT (python-jose + passlib/bcrypt) |
| AI Model | GLM-4-Flash / Llama 3 (any OpenAI-compatible API) |
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS v3 |
| Reverse proxy | Nginx (serves React + proxies API calls) |

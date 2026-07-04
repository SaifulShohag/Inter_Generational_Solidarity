import sys
import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.services.database import engine, Base
from app.routers import auth, conversations, location, reviews
from app.routers import help_requests   # explicit import avoids shadowing stdlib 'requests'
from fastapi.staticfiles import StaticFiles

if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())

@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield

app = FastAPI(title="HelpMe API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],        # tighten in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(conversations.router)
app.include_router(help_requests.router)
app.include_router(location.router)
app.include_router(reviews.router)

@app.get("/health")
async def health():
    return {"status": "ok"}

app.mount("/", StaticFiles(directory="static", html=True), name="static")
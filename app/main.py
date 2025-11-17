from contextlib import asynccontextmanager
from fastapi import FastAPI

from app.db import create_db_and_tables
from app.routers import users, sessions, interruptions, stats

@asynccontextmanager
async def lifespan(app: FastAPI):
    create_db_and_tables()
    yield


app = FastAPI(
    title="HyperFocus API",
    version="0.1.0",
    description="Backend para analizar interrupciones y enfoque en sesiones de teletrabajo.",
    lifespan=lifespan,
)

# Registrar routers
app.include_router(users.router)
app.include_router(sessions.router)


@app.get("/", tags=["health"])
def read_root():
    return {"message": "HyperFocus API is running 🚀"}

app.include_router(users.router)
app.include_router(sessions.router)
app.include_router(interruptions.router)
app.include_router(stats.router)

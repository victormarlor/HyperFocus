# C:\Users\victo\Desktop\hyperfocus\app\main.py

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.db import create_db_and_tables
from app.routers import users, sessions, interruptions, stats


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan context:
    - Creates DB tables on startup (if they don't exist).
    """
    create_db_and_tables()
    yield


app = FastAPI(
    title="HyperFocus API",
    version="0.1.0",
    description="Backend para analizar interrupciones y enfoque en sesiones de teletrabajo.",
    lifespan=lifespan,
)

# 👇 CORS: permitir peticiones desde el frontend de Vite
origins = [
    "http://localhost:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,   # en dev puedes usar ["*"] si quieres probar rápido
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/", tags=["health"])
def read_root():
    return {"message": "HyperFocus API is running 🚀"}


# Registrar routers una sola vez
app.include_router(users.router)
app.include_router(sessions.router)
app.include_router(interruptions.router)
app.include_router(stats.router)

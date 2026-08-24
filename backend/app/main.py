from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

from app.routes.tutor import router as tutor_router
from app.routes.learning_plan import router as learning_plan_router
from app.routes.quiz import router as quiz_router


# ============================================================
# FASTAPI APPLICATION
# ============================================================

app = FastAPI(
    title="AI Data Science Mentor",
    description="Agentic AI Data Science Learning Platform",
    version="0.1.0",
)


# ============================================================
# CORS CONFIGURATION
# ============================================================

# Default frontend origins
ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://tri-minds-learning-app-o89m.vercel.app",
]


# Optional: allow additional frontend origin from environment
# Example:
# FRONTEND_URL=https://your-vercel-app.vercel.app
frontend_url = os.getenv("FRONTEND_URL")

if frontend_url:
    frontend_url = frontend_url.rstrip("/")

    if frontend_url not in ALLOWED_ORIGINS:
        ALLOWED_ORIGINS.append(frontend_url)


app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# ROOT ENDPOINT
# ============================================================

@app.get("/")
def root():
    return {
        "status": "online",
        "service": "AI Data Science Mentor",
        "version": "0.1.0",
        "message": "Backend API is running successfully",
    }


# ============================================================
# HEALTH CHECK
# ============================================================

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "AI Data Science Mentor",
    }


# ============================================================
# API ROUTERS
# ============================================================

app.include_router(tutor_router)
app.include_router(learning_plan_router)
app.include_router(quiz_router)
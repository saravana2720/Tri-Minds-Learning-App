from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

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

# Allow requests from all origins.
# This is suitable for the current deployment/testing setup.
# We are not using credentials/cookies.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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
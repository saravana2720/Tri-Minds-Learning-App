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

# Allowed frontend origins
ALLOWED_ORIGINS = [
    # Local Vite development
    "http://localhost:5173",
    "http://127.0.0.1:5173",

    # Vercel production frontend
    "https://tri-minds-learning-app-o89m.vercel.app",
]


app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


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

app.include_router(
    tutor_router
)

app.include_router(
    learning_plan_router
)

app.include_router(
    quiz_router
)
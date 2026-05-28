"""
CatVision AI — FastAPI Application
===================================
Main entrypoint for the CatVision AI backend API.
Handles cat breed classification from uploaded images.
"""

from contextlib import asynccontextmanager
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.routes.predict import router as predict_router
from app.services.classifier import get_model, load_model

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle events for the FastAPI application."""
    # Run at startup
    load_model("oxford", settings.oxford_model_path)
    load_model("gano", settings.gano_model_path)
    yield
    # Run at shutdown (clean up if needed)

app = FastAPI(
    title="CatVision AI API",
    description="Upload a cat photo and get breed predictions with confidence scores.",
    version="1.0.0",
    lifespan=lifespan,
)

# ---------------------------------------------------------------------------
# CORS — allow the Next.js frontend to call this API
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------
app.include_router(predict_router, prefix="/api", tags=["Predictions"])


@app.get("/health", tags=["System"])
async def health_check():
    """Health check that reports model load status for each variant."""
    models_status = {}
    for name in ("oxford", "gano"):
        models_status[name] = "loaded" if get_model(name) is not None else "unavailable"

    all_loaded = all(s == "loaded" for s in models_status.values())

    return {
        "status": "ok" if all_loaded else "degraded",
        "service": "catvision-ai",
        "models": models_status,
    }

# ---------------------------------------------------------------------------
# Serve Next.js Static Frontend (for Docker / Hugging Face Spaces)
# ---------------------------------------------------------------------------
if os.path.isdir("static"):
    app.mount("/", StaticFiles(directory="static", html=True), name="static")
elif os.path.isdir("../frontend/out"):
    app.mount("/", StaticFiles(directory="../frontend/out", html=True), name="static")

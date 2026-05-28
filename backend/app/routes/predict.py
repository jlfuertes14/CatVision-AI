"""
CatVision AI — Prediction Routes
==================================
Endpoints for cat breed classification and Grad-CAM visualization.
"""

import json
from pathlib import Path

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from fastapi.responses import Response

from app.config import settings
from app.services.classifier import predict
from app.services.gradcam import generate_heatmap

router = APIRouter()

# ---------------------------------------------------------------------------
# Load breed metadata once at startup
# ---------------------------------------------------------------------------
_breeds_path = Path(settings.breeds_json_path)
if _breeds_path.exists():
    with open(_breeds_path, "r", encoding="utf-8") as f:
        BREEDS_DATA = json.load(f)
else:
    BREEDS_DATA = {}


@router.post("/predict")
async def predict_breed(
    file: UploadFile = File(...),
    model: str = Form("gano")
):
    """
    Accept an uploaded cat image and return breed predictions.

    Returns:
        JSON with prediction, confidence, top_predictions, and metadata.
    """
    # --- Validate file type ---
    if file.content_type not in ("image/jpeg", "image/png", "image/webp"):
        raise HTTPException(
            status_code=400,
            detail="Invalid file type. Please upload a JPEG, PNG, or WebP image.",
        )

    # --- Validate file size ---
    contents = await file.read()
    max_bytes = settings.max_file_size_mb * 1024 * 1024
    if len(contents) > max_bytes:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Maximum size is {settings.max_file_size_mb}MB.",
        )

    # --- Run inference ---
    if model not in ("oxford", "gano"):
        model = "gano"
        
    result = predict(contents, model_name=model)

    # --- Attach breed metadata ---
    top_breed = result["prediction"]
    metadata = BREEDS_DATA.get(top_breed, {})

    # Include metadata for all top predictions (for breed comparison UI)
    all_breeds_meta = {}
    for pred in result["top_predictions"]:
        breed_key = pred["breed"]
        if breed_key in BREEDS_DATA:
            all_breeds_meta[breed_key] = BREEDS_DATA[breed_key]

    return {
        "prediction": result["prediction"],
        "confidence": result["confidence"],
        "top_predictions": result["top_predictions"],
        "metadata": metadata,
        "breeds": all_breeds_meta,
    }


@router.post("/gradcam")
async def gradcam_visualization(
    file: UploadFile = File(...),
    model: str = Form("gano"),
):
    """
    Accept an uploaded cat image and return a Grad-CAM heatmap.

    Returns:
        PNG image bytes of the Grad-CAM overlay.
    """
    # --- Validate file type ---
    if file.content_type not in ("image/jpeg", "image/png", "image/webp"):
        raise HTTPException(
            status_code=400,
            detail="Invalid file type. Please upload a JPEG, PNG, or WebP image.",
        )

    contents = await file.read()
    max_bytes = settings.max_file_size_mb * 1024 * 1024
    if len(contents) > max_bytes:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Maximum size is {settings.max_file_size_mb}MB.",
        )

    if model not in ("oxford", "gano"):
        model = "gano"

    heatmap = generate_heatmap(contents, model_name=model)

    if heatmap is None:
        raise HTTPException(status_code=503, detail="Grad-CAM is unavailable because the model is not loaded.")

    return Response(content=heatmap, media_type="image/png")

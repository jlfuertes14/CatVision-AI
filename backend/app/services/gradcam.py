"""
CatVision AI — Grad-CAM Service
=================================
Generates Grad-CAM heatmap visualizations to explain model predictions.
This is an optional Phase 6 feature.
"""

import logging
from io import BytesIO

from PIL import Image
import torch
import torch.nn.functional as F

from app.services.classifier import get_class_names, get_model, preprocess_image

logger = logging.getLogger(__name__)


def _heat_color(intensity: int) -> tuple[int, int, int, int]:
    """Map a 0-255 activation value to a warm transparent heatmap color."""
    if intensity <= 0:
        return (0, 0, 0, 0)

    red = min(255, 120 + intensity)
    green = min(210, int(intensity * 0.72))
    blue = max(0, 70 - int(intensity * 0.25))
    alpha = min(175, int(intensity * 0.68))
    return (red, green, blue, alpha)


def generate_heatmap(image_bytes: bytes, model_name: str = "gano"):
    """
    Generate a Grad-CAM heatmap for the given image.

    Args:
        image_bytes: Raw bytes of the uploaded image.
        model_name: The loaded classifier variant to explain.

    Returns:
        PNG bytes of the heatmap overlay, or None if the model is unavailable.
    """
    model = get_model(model_name)
    if model is None:
        logger.warning("Grad-CAM requested but model %s is not loaded.", model_name)
        return None

    original = Image.open(BytesIO(image_bytes)).convert("RGB")
    input_tensor = preprocess_image(original)
    activations = []
    gradients = []

    def forward_hook(_module, _inputs, output):
        activations.append(output.detach())

    def backward_hook(_module, _grad_input, grad_output):
        gradients.append(grad_output[0].detach())

    target_layer = model.layer4[-1]
    forward_handle = target_layer.register_forward_hook(forward_hook)
    backward_handle = target_layer.register_full_backward_hook(backward_hook)

    try:
        model.zero_grad(set_to_none=True)
        outputs = model(input_tensor)
        class_index = int(outputs.argmax(dim=1).item())
        score = outputs[:, class_index].sum()
        score.backward()

        if not activations or not gradients:
            logger.warning("Grad-CAM hooks did not capture activations for %s.", model_name)
            return None

        activation = activations[0]
        gradient = gradients[0]
        weights = gradient.mean(dim=(2, 3), keepdim=True)
        cam = (weights * activation).sum(dim=1, keepdim=True)
        cam = F.relu(cam)

        cam_min = cam.min()
        cam_max = cam.max()
        if torch.isclose(cam_max, cam_min):
            logger.warning("Grad-CAM produced a flat activation map for %s.", model_name)
            return None

        cam = (cam - cam_min) / (cam_max - cam_min)
        cam = F.interpolate(
            cam,
            size=(original.height, original.width),
            mode="bilinear",
            align_corners=False,
        )[0, 0]

        intensity = (cam.clamp(0, 1) * 255).byte().cpu().numpy()
        heatmap = Image.new("RGBA", original.size, (0, 0, 0, 0))
        heatmap.putdata([_heat_color(int(value)) for value in intensity.reshape(-1)])

        base = original.convert("RGBA")
        overlay = Image.alpha_composite(base, heatmap)
        output = BytesIO()
        overlay.save(output, format="PNG")
        output.seek(0)

        class_name = get_class_names(model_name)[class_index]
        logger.info("Generated Grad-CAM for %s using %s.", class_name, model_name)
        return output.getvalue()
    finally:
        forward_handle.remove()
        backward_handle.remove()

/**
 * API Helper — CatVision AI
 * Handles all communication with the FastAPI backend.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || (process.env.NODE_ENV === "development" ? "http://localhost:8000" : "");

/**
 * Upload a cat image and get breed predictions.
 *
 * @param {File} imageFile - The image file to classify.
 * @returns {Promise<Object>} Prediction result with breed, confidence, and metadata.
 */
export async function predictBreed(imageFile, modelType = "gano") {
  const formData = new FormData();
  formData.append("file", imageFile);
  formData.append("model", modelType);

  let response;
  try {
    response = await fetch(`${API_URL}/api/predict`, {
      method: "POST",
      body: formData,
    });
  } catch {
    throw new Error("Backend is offline. Start the FastAPI server and try again.");
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || `Prediction failed (${response.status})`);
  }

  return response.json();
}

/**
 * Upload a cat image and get a Grad-CAM heatmap visualization.
 *
 * @param {File} imageFile - The image file to visualize.
 * @returns {Promise<Blob>} PNG image blob of the Grad-CAM overlay.
 */
export async function getGradcam(imageFile, modelType = "gano") {
  const formData = new FormData();
  formData.append("file", imageFile);
  formData.append("model", modelType);

  let response;
  try {
    response = await fetch(`${API_URL}/api/gradcam`, {
      method: "POST",
      body: formData,
    });
  } catch {
    throw new Error("Grad-CAM needs the backend server to be running.");
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || `Grad-CAM failed (${response.status})`);
  }

  return response.blob();
}

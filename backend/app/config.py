"""
CatVision AI — Configuration
=============================
Loads settings from environment variables via pydantic-settings.
"""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from .env or environment variables."""

    # Path to the trained model files (.pth or .onnx)
    oxford_model_path: str = "./model/oxfordmodel.pth"
    gano_model_path: str = "./model/ganomodel.pth"

    # Path to the breed metadata JSON
    breeds_json_path: str = "./breeds.json"

    # Comma-separated list of allowed CORS origins
    allowed_origins: str = "http://localhost:3000,https://cat-vision-ai-ruby.vercel.app"

    # Maximum upload file size in megabytes
    max_file_size_mb: int = 10

    @property
    def allowed_origins_list(self) -> list[str]:
        """Parse comma-separated origins string into a list."""
        return [origin.strip() for origin in self.allowed_origins.split(",")]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()

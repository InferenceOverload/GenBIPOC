"""FastAPI entrypoint for the Claims Performance Narrative Engine."""
import os
import json
from pathlib import Path
from dotenv import load_dotenv

# Load env before any google imports
env_path = Path(__file__).parent / ".env"
load_dotenv(env_path)

# Set GCP environment variables
os.environ.setdefault("GOOGLE_CLOUD_PROJECT", os.getenv("GOOGLE_CLOUD_PROJECT", ""))
os.environ.setdefault("GOOGLE_CLOUD_LOCATION", os.getenv("GOOGLE_CLOUD_LOCATION", "global"))

from google.adk.cli.fast_api import get_fast_api_app
import uvicorn

AGENTS_DIR = str(Path(__file__).parent)

app = get_fast_api_app(
    agents_dir=AGENTS_DIR,
    session_service_uri="sqlite:///sessions.db",
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    web=False,
)

# Serve synthetic data as REST endpoint for the frontend dashboard
data_path = Path(__file__).parent / "data" / "synthetic_data.json"


@app.get("/api/data")
async def get_data():
    """Serve synthetic data to the frontend for dashboard rendering."""
    with open(data_path) as f:
        return json.load(f)


if __name__ == "__main__":
    port = int(os.getenv("BACKEND_PORT", "8000"))
    uvicorn.run(app, host="0.0.0.0", port=port)

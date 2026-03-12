#!/usr/bin/env bash
set -e

echo "=== Claims Performance Narrative Engine Setup ==="
echo ""

# Check prerequisites
command -v python3 >/dev/null 2>&1 || { echo "Error: python3 is required but not installed."; exit 1; }
command -v node >/dev/null 2>&1 || { echo "Error: node is required but not installed."; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "Error: npm is required but not installed."; exit 1; }

PYTHON_VERSION=$(python3 -c 'import sys; print(f"{sys.version_info.major}.{sys.version_info.minor}")')
echo "Python version: $PYTHON_VERSION"
echo "Node version: $(node --version)"
echo ""

# 1. Python virtual environment
if [ ! -d ".venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv .venv
fi
source .venv/bin/activate
echo "Installing Python dependencies..."
pip install -q -r backend/requirements.txt

# 2. Backend .env
if [ ! -f "backend/.env" ]; then
    echo ""
    echo "Creating backend/.env from template..."
    cp backend/.env.example backend/.env
    echo ">> IMPORTANT: Edit backend/.env with your GCP project ID"
    echo ">> Then run: gcloud auth application-default login"
else
    echo "backend/.env already exists, skipping."
fi

# 3. Generate synthetic data
echo ""
echo "Generating synthetic data..."
python3 data_generator/generate_synthetic_data.py

# 4. Frontend dependencies
echo ""
echo "Installing frontend dependencies..."
cd frontend
npm install --silent
cd ..

echo ""
echo "=== Setup complete! ==="
echo ""
echo "To start the servers, run:"
echo "  ./start.sh"
echo ""
echo "Or manually:"
echo "  Terminal 1: source .venv/bin/activate && cd backend && uvicorn main:app --host 0.0.0.0 --port 8000"
echo "  Terminal 2: cd frontend && npm run dev"
echo ""
echo "Then open http://localhost:3000"

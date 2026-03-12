#!/usr/bin/env bash
set -e

echo "=== Starting Claims Performance Engine ==="

# Activate venv
if [ -f ".venv/bin/activate" ]; then
    source .venv/bin/activate
else
    echo "Error: Virtual environment not found. Run ./setup.sh first."
    exit 1
fi

# Check .env
if [ ! -f "backend/.env" ]; then
    echo "Error: backend/.env not found. Run ./setup.sh first."
    exit 1
fi

# Kill existing processes on our ports
lsof -ti :8000 2>/dev/null | xargs kill 2>/dev/null || true
lsof -ti :3000 2>/dev/null | xargs kill 2>/dev/null || true
sleep 1

# Start backend
echo "Starting backend on port 8000..."
cd backend
nohup uvicorn main:app --host 0.0.0.0 --port 8000 > /tmp/claims-backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Wait for backend
for i in {1..10}; do
    if curl -s http://localhost:8000/api/data > /dev/null 2>&1; then
        echo "Backend ready (PID: $BACKEND_PID)"
        break
    fi
    sleep 1
done

# Start frontend
echo "Starting frontend on port 3000..."
cd frontend
nohup npm run dev > /tmp/claims-frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..
sleep 3
echo "Frontend ready (PID: $FRONTEND_PID)"

echo ""
echo "=== Servers running ==="
echo "  Frontend: http://localhost:3000"
echo "  Backend:  http://localhost:8000"
echo ""
echo "  Backend log:  tail -f /tmp/claims-backend.log"
echo "  Frontend log: tail -f /tmp/claims-frontend.log"
echo ""
echo "To stop: kill $BACKEND_PID $FRONTEND_PID"

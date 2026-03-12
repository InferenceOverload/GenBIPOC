import { createServer } from 'http';
import {
  CopilotRuntime,
  ExperimentalEmptyAdapter,
  copilotRuntimeNodeHttpEndpoint,
} from '@copilotkit/runtime';
import { HttpAgent } from '@ag-ui/client';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

const serviceAdapter = new ExperimentalEmptyAdapter();
const runtime = new CopilotRuntime({
  agents: {
    claims_performance_agent: new HttpAgent({
      url: `${BACKEND_URL}/`,
    }),
  },
});

const handler = copilotRuntimeNodeHttpEndpoint({
  runtime,
  serviceAdapter,
  endpoint: '/api/copilotkit',
});

const server = createServer((req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.url === '/api/copilotkit' && req.method === 'POST') {
    return handler(req, res);
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

const PORT = process.env.COPILOT_RUNTIME_PORT || 4000;
server.listen(PORT, () => {
  console.log(`CopilotKit runtime bridge running on http://localhost:${PORT}`);
});

import express from 'express';
import cors from 'cors';
import {
  CopilotRuntime,
  ExperimentalEmptyAdapter,
  copilotRuntimeNodeHttpEndpoint,
} from '@copilotkit/runtime';
import { HttpAgent } from '@ag-ui/client';

const app = express();
app.use(cors({ origin: ['http://localhost:3000', 'http://localhost:5173'] }));

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

const serviceAdapter = new ExperimentalEmptyAdapter();
const runtime = new CopilotRuntime({
  agents: {
    claims_performance_agent: new HttpAgent({
      url: `${BACKEND_URL}/`,
    }),
  },
});

app.use('/api/copilotkit', (req, res) => {
  const handler = copilotRuntimeNodeHttpEndpoint({
    runtime,
    serviceAdapter,
    endpoint: '/api/copilotkit',
  });
  return handler(req, res);
});

const PORT = process.env.COPILOT_RUNTIME_PORT || 4000;
app.listen(PORT, () => {
  console.log(`CopilotKit runtime bridge running on http://localhost:${PORT}`);
});

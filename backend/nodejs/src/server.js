require('dotenv').config();
const express = require('express');
const cors = require('cors');
const client = require('prom-client');
const taskRoutes = require('./routes/taskRoutes');

const app = express();
const PORT = process.env.PORT || 3001;

// Enable default metrics (Node.js runtime metrics)
client.collectDefaultMetrics();

// Custom histogram for request duration
const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_ms',
  help: 'Duration of HTTP requests in ms',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000]
});

// Request logging AND metrics middleware
app.use((req, res, next) => {
    const start = Date.now();
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    res.on('finish', () => {
      const duration = Date.now() - start;
      const route = req.route ? req.route.path : req.path;
      httpRequestDuration
        .labels(req.method, route, res.statusCode)
        .observe(duration);
    });
    next();
});

app.use(cors());
app.use(express.json());

app.use('/api', taskRoutes);

// Metrics endpoint for Prometheus
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
});

app.get('/', (req, res) => {
  res.json({
    message: 'Node.js Task Manager API',
    backend: process.env.BACKEND_NAME || 'Node.js',
    status: 'running'
  });
});

app.listen(PORT, () => {
  console.log(`Node.js backend running on port ${PORT}`);
  console.log(`Backend name: ${process.env.BACKEND_NAME || 'Node.js'}`);
});
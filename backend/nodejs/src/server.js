require('dotenv').config();
const express = require('express');
const cors = require('cors');
const taskRoutes = require('./routes/taskRoutes');

const app = express();
const PORT = process.env.PORT || 3001;

// Request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

app.use(cors());
app.use(express.json());

app.use('/api', taskRoutes);

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
const Task = require('../models/Task');

exports.getAllTasks = async (req, res) => {
  try {
    const tasks = await Task.findAll();
    res.json({
      success: true,
      backend: process.env.BACKEND_NAME || 'Node.js',
      data: tasks
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, error: 'Task not found' });
    }
    res.json({
      success: true,
      backend: process.env.BACKEND_NAME || 'Node.js',
      data: task
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.createTask = async (req, res) => {
  try {
    const { title, description, status } = req.body;
    if (!title) {
      return res.status(400).json({ success: false, error: 'Title is required' });
    }
    const task = await Task.create(title, description, status);
    res.status(201).json({
      success: true,
      backend: process.env.BACKEND_NAME || 'Node.js',
      data: task
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.updateTask = async (req, res) => {
  try {
    const { title, description, status } = req.body;
    const task = await Task.update(req.params.id, title, description, status);
    if (!task) {
      return res.status(404).json({ success: false, error: 'Task not found' });
    }
    res.json({
      success: true,
      backend: process.env.BACKEND_NAME || 'Node.js',
      data: task
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.delete(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, error: 'Task not found' });
    }
    res.json({
      success: true,
      backend: process.env.BACKEND_NAME || 'Node.js',
      message: 'Task deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.healthCheck = (req, res) => {
  res.json({
    status: 'healthy',
    backend: process.env.BACKEND_NAME || 'Node.js',
    timestamp: new Date().toISOString()
  });
};

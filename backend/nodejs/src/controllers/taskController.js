const getConnection = require('../config/database');

exports.getAllTasks = async (req, res) => {
  try {
    const promisePool = await getConnection();
    const [tasks] = await promisePool.query('SELECT * FROM tasks ORDER BY created_at DESC');
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
    const promisePool = await getConnection();
    const [rows] = await promisePool.query('SELECT * FROM tasks WHERE id = ?', [req.params.id]);
    const task = rows[0];
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
    
    const promisePool = await getConnection();
    const taskStatus = status || 'pending';
    const [result] = await promisePool.query(
      'INSERT INTO tasks (title, description, status) VALUES (?, ?, ?)',
      [title, description, taskStatus]
    );
    
    const [rows] = await promisePool.query('SELECT * FROM tasks WHERE id = ?', [result.insertId]);
    res.status(201).json({
      success: true,
      backend: process.env.BACKEND_NAME || 'Node.js',
      data: rows[0]
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.updateTask = async (req, res) => {
  try {
    const { title, description, status } = req.body;
    const promisePool = await getConnection();
    
    const [rows] = await promisePool.query('SELECT * FROM tasks WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Task not found' });
    }
    
    await promisePool.query(
      'UPDATE tasks SET title = ?, description = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [title || rows[0].title, description || rows[0].description, status || rows[0].status, req.params.id]
    );
    
    const [updatedRows] = await promisePool.query('SELECT * FROM tasks WHERE id = ?', [req.params.id]);
    res.json({
      success: true,
      backend: process.env.BACKEND_NAME || 'Node.js',
      data: updatedRows[0]
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.deleteTask = async (req, res) => {
  try {
    const promisePool = await getConnection();
    const [rows] = await promisePool.query('SELECT * FROM tasks WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Task not found' });
    }
    
    await promisePool.query('DELETE FROM tasks WHERE id = ?', [req.params.id]);
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
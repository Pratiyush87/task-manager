const pool = require('../config/database');

class Task {
  static async findAll() {
    const [rows] = await pool.query('SELECT * FROM tasks ORDER BY created_at DESC');
    return rows;
  }

  static async findById(id) {
    const [rows] = await pool.query('SELECT * FROM tasks WHERE id = ?', [id]);
    return rows[0];
  }

  // FIXED: Added status parameter with default value 'pending'
  static async create(title, description, status = 'pending') {
    const [result] = await pool.query(
      'INSERT INTO tasks (title, description, status) VALUES (?, ?, ?)',
      [title, description, status]
    );
    const [rows] = await pool.query('SELECT * FROM tasks WHERE id = ?', [result.insertId]);
    return rows[0];
  }

  static async update(id, title, description, status) {
    await pool.query(
      'UPDATE tasks SET title = ?, description = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [title, description, status, id]
    );
    const [rows] = await pool.query('SELECT * FROM tasks WHERE id = ?', [id]);
    return rows[0];
  }

  static async delete(id) {
    const [rows] = await pool.query('SELECT * FROM tasks WHERE id = ?', [id]);
    await pool.query('DELETE FROM tasks WHERE id = ?', [id]);
    return rows[0];
  }
}

module.exports = Task;
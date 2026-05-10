const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { verifyToken, verifySuper } = require('../middleware/auth');
const multer = require('../middleware/upload');
require('dotenv').config();

// POST /admin-k9x7/api/login - 管理员登录
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ code: 400, message: '请输入账号密码', data: null });
  }
  try {
    const [rows] = await pool.query('SELECT * FROM admins WHERE username = ?', [username]);
    if (rows.length === 0) {
      return res.status(401).json({ code: 401, message: '账号或密码错误', data: null });
    }
    const admin = rows[0];
    const match = await bcrypt.compare(password, admin.password);
    if (!match) {
      return res.status(401).json({ code: 401, message: '账号或密码错误', data: null });
    }
    const token = jwt.sign(
      { id: admin.id, username: admin.username, role: admin.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );
    res.json({ code: 200, message: '登录成功', data: { token, role: admin.role } });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ code: 500, message: '登录失败', data: null });
  }
});

// GET /admin-k9x7/api/stats - 统计数据（需登录）
router.get('/stats', verifyToken, async (req, res) => {
  try {
    const [[msg]] = await pool.query('SELECT COUNT(*) as count FROM messages');
    const [[danmaku]] = await pool.query('SELECT COUNT(*) as count FROM danmaku');
    const [[stats]] = await pool.query('SELECT total_count FROM checkin_stats WHERE id = 1');
    const [[pending]] = await pool.query("SELECT COUNT(*) as count FROM images WHERE status = 'pending'");
    res.json({ code: 200, message: 'success', data: {
      messages: msg.count,
      danmaku: danmaku.count,
      checkins: stats.total_count || 0,
      pending
    }});
  } catch (err) {
    res.status(500).json({ code: 500, message: '查询失败', data: null });
  }
});

// 留言管理
router.get('/messages', verifyToken, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM messages ORDER BY created_at DESC');
    res.json({ code: 200, message: 'success', data: rows });
  } catch (err) {
    res.status(500).json({ code: 500, message: '查询失败', data: null });
  }
});
router.delete('/messages/:id', verifyToken, async (req, res) => {
  try {
    await pool.query('DELETE FROM messages WHERE id = ?', [req.params.id]);
    res.json({ code: 200, message: '删除成功', data: null });
  } catch (err) {
    res.status(500).json({ code: 500, message: '删除失败', data: null });
  }
});

// 弹幕管理
router.get('/danmaku', verifyToken, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM danmaku ORDER BY created_at DESC');
    res.json({ code: 200, message: 'success', data: rows });
  } catch (err) {
    res.status(500).json({ code: 500, message: '查询失败', data: null });
  }
});
router.delete('/danmaku/:id', verifyToken, async (req, res) => {
  try {
    await pool.query('DELETE FROM danmaku WHERE id = ?', [req.params.id]);
    res.json({ code: 200, message: '删除成功', data: null });
  } catch (err) {
    res.status(500).json({ code: 500, message: '删除失败', data: null });
  }
});

// 图片管理
router.get('/images', verifyToken, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM images ORDER BY created_at DESC');
    res.json({ code: 200, message: 'success', data: rows });
  } catch (err) {
    res.status(500).json({ code: 500, message: '查询失败', data: null });
  }
});
router.delete('/images/:id', verifyToken, async (req, res) => {
  try {
    await pool.query('DELETE FROM images WHERE id = ?', [req.params.id]);
    res.json({ code: 200, message: '删除成功', data: null });
  } catch (err) {
    res.status(500).json({ code: 500, message: '查询失败', data: null });
  }
});
router.put('/images/:id/status', verifyToken, async (req, res) => {
  const { status } = req.body;
  try {
    await pool.query('UPDATE images SET status = ? WHERE id = ?', [status, req.params.id]);
    res.json({ code: 200, message: '更新成功', data: null });
  } catch (err) {
    res.status(500).json({ code: 500, message: '更新失败', data: null });
  }
});

// 大事件管理
router.get('/milestones', verifyToken, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM milestones ORDER BY date DESC');
    res.json({ code: 200, message: 'success', data: rows });
  } catch (err) {
    res.status(500).json({ code: 500, message: '查询失败', data: null });
  }
});
router.post('/milestones', verifyToken, async (req, res) => {
  const { date, title, description } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO milestones (date, title, description) VALUES (?, ?, ?)',
      [date, title, description]
    );
    res.json({ code: 200, message: '添加成功', data: { id: result.insertId } });
  } catch (err) {
    res.status(500).json({ code: 500, message: '添加失败', data: null });
  }
});
router.put('/milestones/:id', verifyToken, async (req, res) => {
  const { date, title, description } = req.body;
  try {
    await pool.query('UPDATE milestones SET date=?, title=?, description=? WHERE id=?',
      [date, title, description, req.params.id]);
    res.json({ code: 200, message: '更新成功', data: null });
  } catch (err) {
    res.status(500).json({ code: 500, message: '更新失败', data: null });
  }
});
router.delete('/milestones/:id', verifyToken, async (req, res) => {
  try {
    await pool.query('DELETE FROM milestones WHERE id = ?', [req.params.id]);
    res.json({ code: 200, message: '删除成功', data: null });
  } catch (err) {
    res.status(500).json({ code: 500, message: '删除失败', data: null });
  }
});

// 管理员管理（仅超管）
router.get('/admins', verifyToken, verifySuper, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, username, role, created_at FROM admins');
    res.json({ code: 200, message: 'success', data: rows });
  } catch (err) {
    res.status(500).json({ code: 500, message: '查询失败', data: null });
  }
});
router.post('/admins', verifyToken, verifySuper, async (req, res) => {
  const { username, password, role = 'normal' } = req.body;
  const hash = await bcrypt.hash(password, 10);
  try {
    const [result] = await pool.query(
      'INSERT INTO admins (username, password, role) VALUES (?, ?, ?)',
      [username, hash, role]
    );
    res.json({ code: 200, message: '添加成功', data: { id: result.insertId } });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ code: 400, message: '用户名已存在', data: null });
    }
    res.status(500).json({ code: 500, message: '添加失败', data: null });
  }
});
router.delete('/admins/:id', verifyToken, verifySuper, async (req, res) => {
  if (parseInt(req.params.id) === req.admin.id) {
    return res.status(400).json({ code: 400, message: '不能删除自己', data: null });
  }
  try {
    await pool.query('DELETE FROM admins WHERE id = ?', [req.params.id]);
    res.json({ code: 200, message: '删除成功', data: null });
  } catch (err) {
    res.status(500).json({ code: 500, message: '删除失败', data: null });
  }
});

module.exports = router;
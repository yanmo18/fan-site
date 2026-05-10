const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// GET /api/messages - 获取留言列表
router.get('/', async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;
  try {
    const [rows] = await pool.query(
      'SELECT id, nickname, content, source, created_at FROM messages ORDER BY created_at DESC LIMIT ? OFFSET ?',
      [parseInt(limit), parseInt(offset)]
    );
    const [[{ total }]] = await pool.query('SELECT COUNT(*) as total FROM messages');
    res.json({ code: 200, message: 'success', data: { list: rows, total, page: parseInt(page) } });
  } catch (err) {
    console.error('Messages query error:', err);
    res.status(500).json({ code: 500, message: '查询失败', data: null });
  }
});

// POST /api/messages - 提交留言
router.post('/', async (req, res) => {
  const { nickname, content, source = 'web' } = req.body;
  if (!nickname || !content) {
    return res.status(400).json({ code: 400, message: '缺少参数', data: null });
  }
  if (nickname.length > 20 || content.length > 200) {
    return res.status(400).json({ code: 400, message: '昵称不超过20字，内容不超过200字', data: null });
  }
  try {
    const [result] = await pool.query(
      'INSERT INTO messages (nickname, content, source) VALUES (?, ?, ?)',
      [nickname, content, source]
    );
    res.json({ code: 200, message: '留言成功', data: { id: result.insertId } });
  } catch (err) {
    console.error('Messages post error:', err);
    res.status(500).json({ code: 500, message: '留言失败', data: null });
  }
});

module.exports = router;
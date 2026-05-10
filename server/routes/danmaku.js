const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// GET /api/danmaku - 获取弹幕列表
router.get('/', async (req, res) => {
  const { after_id = 0, limit = 50 } = req.query;
  try {
    const [rows] = await pool.query(
      'SELECT id, nickname, content, source, created_at FROM danmaku WHERE id > ? ORDER BY id ASC LIMIT ?',
      [after_id, parseInt(limit)]
    );
    res.json({ code: 200, message: 'success', data: rows });
  } catch (err) {
    console.error('Danmaku query error:', err);
    res.status(500).json({ code: 500, message: '查询失败', data: null });
  }
});

// POST /api/danmaku - 发送弹幕
router.post('/', async (req, res) => {
  const { nickname, content, source = 'web' } = req.body;
  if (!nickname || !content) {
    return res.status(400).json({ code: 400, message: '缺少参数', data: null });
  }
  if (content.length > 50) {
    return res.status(400).json({ code: 400, message: '弹幕内容不能超过50字', data: null });
  }
  try {
    const [result] = await pool.query(
      'INSERT INTO danmaku (nickname, content, source) VALUES (?, ?, ?)',
      [nickname, content, source]
    );
    res.json({ code: 200, message: '发送成功', data: { id: result.insertId } });
  } catch (err) {
    console.error('Danmaku post error:', err);
    res.status(500).json({ code: 500, message: '发送失败', data: null });
  }
});

module.exports = router;
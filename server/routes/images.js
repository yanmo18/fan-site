const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const multer = require('../middleware/upload');
require('dotenv').config();

// GET /api/images - 获取图片列表
router.get('/', async (req, res) => {
  const { category, status = 'approved', page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;
  try {
    let sql = 'SELECT id, title, description, url, category, uploader, source, created_at FROM images WHERE 1=1';
    const params = [];
    if (category) { sql += ' AND category = ?'; params.push(category); }
    if (status) { sql += ' AND status = ?'; params.push(status); }
    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));
    const [rows] = await pool.query(sql, params);
    res.json({ code: 200, message: 'success', data: rows });
  } catch (err) {
    console.error('Images query error:', err);
    res.status(500).json({ code: 500, message: '查询失败', data: null });
  }
});

// POST /api/images/upload - 上传图片（投稿）
router.post('/upload', multer.single('image'), async (req, res) => {
  const { title, description = '', uploader = '匿名', source = 'web' } = req.body;
  if (!req.file) {
    return res.status(400).json({ code: 400, message: '请选择图片', data: null });
  }
  const url = `/uploads/${req.file.filename}`;
  const category = req.body.category || 'fanart';
  try {
    const [result] = await pool.query(
      'INSERT INTO images (title, description, url, category, uploader, source, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [title, description, url, category, uploader, source, 'pending']
    );
    res.json({ code: 200, message: '上传成功', data: { id: result.insertId, url } });
  } catch (err) {
    console.error('Images upload error:', err);
    res.status(500).json({ code: 500, message: '上传失败', data: null });
  }
});

module.exports = router;
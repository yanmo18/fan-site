const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// GET /api/milestones - 获取所有大事件
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, date, title, description FROM milestones ORDER BY date DESC'
    );
    res.json({ code: 200, message: 'success', data: rows });
  } catch (err) {
    console.error('Milestones query error:', err);
    res.status(500).json({ code: 500, message: '查询失败', data: null });
  }
});

module.exports = router;
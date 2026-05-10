const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// GET /api/checkins/stats - 获取签到统计
router.get('/stats', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT total_count FROM checkin_stats WHERE id = 1');
    res.json({ code: 200, message: 'success', data: { total_count: rows[0]?.total_count || 0 } });
  } catch (err) {
    console.error('Checkins stats error:', err);
    res.status(500).json({ code: 500, message: '查询失败', data: null });
  }
});

// GET /api/checkins/me?nickname=xxx - 查询个人签到记录
router.get('/me', async (req, res) => {
  const { nickname } = req.query;
  if (!nickname) return res.status(400).json({ code: 400, message: '缺少昵称', data: null });
  
  try {
    const [rows] = await pool.query(
      'SELECT checkin_date, streak FROM checkins WHERE nickname = ? ORDER BY checkin_date DESC LIMIT 30',
      [nickname]
    );
    const dates = rows.map(r => r.checkin_date);
    const streak = dates.length > 0 ? rows[0].streak : 0;
    res.json({ code: 200, message: 'success', data: { streak, dates } });
  } catch (err) {
    res.status(500).json({ code: 500, message: '查询失败', data: null });
  }
});

// POST /api/checkins - 签到
router.post('/', async (req, res) => {
  const { nickname, source = 'web' } = req.body;
  if (!nickname) return res.status(400).json({ code: 400, message: '缺少昵称', data: null });
  
  const today = new Date().toISOString().split('T')[0];
  
  try {
    // 先查昨天有没有签到
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const [yesterdayRows] = await pool.query(
      'SELECT streak FROM checkins WHERE nickname = ? AND checkin_date = ?',
      [nickname, yesterday]
    );
    
    // 计算连签天数：昨天签了就连签+1，否则重置为1
    const streak = yesterdayRows.length > 0 ? yesterdayRows[0].streak + 1 : 1;
    // streak是当前连签到数
    // 插入签到记录（UNIQUE KEY保证不会重复）
    await pool.query(
      'INSERT INTO checkins (nickname, source, checkin_date, streak) VALUES (?, ?, ?, ?)',
      [nickname, source, today, streak]
    );
    
    // 更新总数
    await pool.query('UPDATE checkin_stats SET total_count = total_count + 1 WHERE id = 1');
    
    // 返回最新数据
    const [stats] = await pool.query('SELECT total_count FROM checkin_stats WHERE id = 1');
    
    res.json({ code: 200, message: '签到成功', data: { streak, total_count: stats[0].total_count } });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.json({ code: 200, message: '今日已签到', data: null });
    }
    console.error('Checkin error:', err);
    res.status(500).json({ code: 500, message: '签到失败', data: null });
  }
});

module.exports = router;
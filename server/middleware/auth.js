const jwt = require('jsonwebtoken');
require('dotenv').config();

// 验证 JWT token
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ code: 401, message: '未登录', data: null });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.admin = decoded;  // 把解密后的管理员信息挂到 req 上
    next();
  } catch (err) {
    return res.status(401).json({ code: 401, message: '登录已过期', data: null });
  }
};

// 验证超管权限
const verifySuper = (req, res, next) => {
  if (req.admin.role !== 'super') {
    return res.status(403).json({ code: 403, message: '权限不足', data: null });
  }
  next();
};

module.exports = { verifyToken, verifySuper };
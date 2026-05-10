const mysql = require('mysql2/promise');
require('dotenv').config();

// 创建连接池，不用每次请求都新建连接
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,    // 连接池满了就等着，不用就空跑
  connectionLimit: 10,         // 最多10个连接
  queueLimit: 0
});

module.exports = pool;
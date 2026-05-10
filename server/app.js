const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 静态文件服务（uploads目录可以直接访问）
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 路由
const milestonesRouter = require('./routes/milestones');
const checkinsRouter = require('./routes/checkins');
const danmakuRouter = require('./routes/danmaku');
const messagesRouter = require('./routes/messages');
const imagesRouter = require('./routes/images');
const adminRouter = require('./routes/admin');

app.use('/api/milestones', milestonesRouter);
app.use('/api/checkins', checkinsRouter);
app.use('/api/danmaku', danmakuRouter);
app.use('/api/messages', messagesRouter);
app.use('/api/images', imagesRouter);
app.use(`/${process.env.ADMIN_PATH}/api`, adminRouter);

// 根路径
app.get('/', (req, res) => {
  res.json({ message: 'Fan Site API Running', version: '1.0' });
});

// 统一错误处理
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({ code: 500, message: '服务器内部错误', data: null });
});

app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
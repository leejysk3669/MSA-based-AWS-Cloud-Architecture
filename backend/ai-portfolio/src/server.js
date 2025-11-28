require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { register, collectDefaultMetrics, Counter, Histogram, Gauge } = require('prom-client');

const app = express();
const port = process.env.BACKEND_PORT || 4000;

// Prometheus 메트릭 설정
collectDefaultMetrics({ register });

// 커스텀 메트릭 정의
const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10]
});

const portfolioFeedbacksTotal = new Gauge({
  name: 'portfolio_feedbacks_total',
  help: 'Total number of portfolio feedbacks'
});

const aiRequestsTotal = new Counter({
  name: 'ai_requests_total',
  help: 'Total number of AI requests',
  labelNames: ['model', 'status']
});

// CORS 설정 - 모든 도메인에서 접근 허용
app.use(cors({
  origin: true, // 모든 origin 허용
  credentials: true, // 쿠키/인증 헤더 허용
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // 허용할 HTTP 메서드
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'], // 허용할 헤더
}));

app.use(express.json());

// 메트릭 수집 미들웨어
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route ? req.route.path : req.path;
    
    httpRequestsTotal
      .labels(req.method, route, res.statusCode.toString())
      .inc();
    
    httpRequestDuration
      .labels(req.method, route, res.statusCode.toString())
      .observe(duration);
  });
  
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'ai-portfolio-api', 
    timestamp: new Date().toISOString(),
    storage: 'in-memory'
  });
});

// Prometheus 메트릭 엔드포인트
app.get('/metrics', async (req, res) => {
  try {
    // 포트폴리오 피드백 수 업데이트 (실제 DB 연결이 있다면)
    // const feedbacksResult = await pool.query('SELECT COUNT(*) FROM portfolio_feedbacks');
    // portfolioFeedbacksTotal.set(parseInt(feedbacksResult.rows[0].count));
    
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (error) {
    console.error('Error collecting metrics:', error);
    res.status(500).end('Error collecting metrics');
  }
});

// Root endpoint
app.get('/', (req, res) => {
  res.send('AI Portfolio Backend is running! (In-Memory Storage)');
});

// Portfolio routes
const portfolioRoutes = require('./routes/portfolio');
app.use('/api/portfolio', portfolioRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

const server = app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 AI Portfolio API 서버가 포트 ${port}에서 실행 중입니다.`);
  console.log(`📊 API: http://localhost:${port}/api/portfolio`);
  console.log(`🌐 외부 접속 가능: http://0.0.0.0:${port}`);
  console.log(`💾 저장 방식: In-Memory Storage`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

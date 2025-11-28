import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { register, collectDefaultMetrics, Counter, Histogram, Gauge } from 'prom-client';
import { notificationRouter } from './routes/notifications';
import { testConnection } from './config/database';

dotenv.config();

const app = express();

const PORT = parseInt(process.env.PORT || '3004', 10);

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

const notificationsTotal = new Gauge({
  name: 'notifications_total',
  help: 'Total number of notifications'
});

const unreadNotificationsTotal = new Gauge({
  name: 'unread_notifications_total',
  help: 'Total number of unread notifications'
});

// CORS 설정 - seesun.cloud 도메인 허용
app.use(cors({
  origin: [
    'https://seesun.cloud',
    'https://www.seesun.cloud',
    'https://*.seesun.cloud',
    'https://d12so42486otqg.cloudfront.net'
  ],
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

// 헬스 체크
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'notification-api', 
    timestamp: new Date().toISOString() 
  });
});

// Prometheus 메트릭 엔드포인트
app.get('/metrics', async (req, res) => {
  try {
    // 알림 수 업데이트 (실제 DB 연결이 있다면)
    // const notificationsResult = await pool.query('SELECT COUNT(*) FROM notification.notifications');
    // notificationsTotal.set(parseInt(notificationsResult.rows[0].count));
    
    // 읽지 않은 알림 수 업데이트 (실제 DB 연결이 있다면)
    // const unreadResult = await pool.query('SELECT COUNT(*) FROM notification.notifications WHERE is_read = false');
    // unreadNotificationsTotal.set(parseInt(unreadResult.rows[0].count));
    
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (error) {
    console.error('Error collecting metrics:', error);
    res.status(500).end('Error collecting metrics');
  }
});

// API 라우터
app.use('/api/notifications', notificationRouter);

// 404 핸들러
app.use('*', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

// 에러 핸들러
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, '0.0.0.0', async () => {
  console.log(`🚀 Notification API 서버가 포트 ${PORT}에서 실행 중입니다.`);
  console.log(`🔔 알림 API: http://localhost:${PORT}/api/notifications`);
  console.log(`🌐 외부 접속 가능: http://0.0.0.0:${PORT}/api/notifications`);
  
  // 데이터베이스 연결 테스트
  await testConnection();
});

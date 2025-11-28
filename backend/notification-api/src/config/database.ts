import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  user: process.env.DB_USER || 'hippo_user',
  password: process.env.DB_PASSWORD || 'hippo_password',
  database: process.env.DB_NAME || 'hippo_unified_db',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  // SSL 설정
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  // 스키마 설정
  options: '-c search_path=notification'
});

// 연결 이벤트 리스너
pool.on('connect', () => {
  console.log('✅ 알림 API 데이터베이스 연결 성공');
});

pool.on('error', (err) => {
  console.error('❌ 알림 API 데이터베이스 연결 오류:', err);
});

// 데이터베이스 연결 테스트
export const testConnection = async () => {
  try {
    const client = await pool.connect();
    console.log('✅ 알림 API 데이터베이스 연결 테스트 성공');
    client.release();
  } catch (error) {
    console.error('❌ 알림 API 데이터베이스 연결 테스트 실패:', error);
    throw error;
  }
};

export default pool;

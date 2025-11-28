import { Pool, PoolConfig } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const dbConfig: PoolConfig = {
  user: process.env.DB_USERNAME || process.env.DB_USER || 'hippo_user',
  host: process.env.RDS_ENDPOINT || process.env.DB_HOST || 'localhost',
  database: process.env.DATABASE_NAME || process.env.DB_NAME || 'hippo_unified_db',
  password: process.env.DB_PASSWORD || 'hippo_password',
  port: parseInt(process.env.DB_PORT || '5432'),
  max: 20, // 최대 연결 수
  idleTimeoutMillis: 30000, // 유휴 연결 타임아웃
  connectionTimeoutMillis: 2000, // 연결 타임아웃
  // SSL 설정
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  // 스키마 설정
  options: '-c search_path=study'
};

// PostgreSQL 연결 풀 생성
export const pool = new Pool(dbConfig);

// 연결 테스트
pool.on('connect', () => {
  console.log('✅ PostgreSQL 데이터베이스에 연결되었습니다.');
});

pool.on('error', (err) => {
  console.error('❌ PostgreSQL 연결 오류:', err);
});

// 데이터베이스 연결 테스트 함수
export const testConnection = async () => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    client.release();
    console.log('✅ PostgreSQL 연결 테스트 성공:', result.rows[0]);
    return true;
  } catch (error) {
    console.error('❌ PostgreSQL 연결 테스트 실패:', error);
    return false;
  }
};

export default pool;

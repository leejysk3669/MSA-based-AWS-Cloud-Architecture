# Notification API

알림 관리 API 서비스입니다.

## 🚀 기능

- 알림 생성 및 관리
- 사용자별 알림 조회
- 알림 읽음 처리
- 읽지 않은 알림 개수 조회
- 알림 삭제

## 📋 API 엔드포인트

### 알림 생성
```
POST /api/notifications
```

### 사용자별 알림 조회
```
GET /api/notifications/user/:userId
```

### 특정 알림 조회
```
GET /api/notifications/:id
```

### 알림 읽음 처리
```
PUT /api/notifications/:id/read
```

### 모든 알림 읽음 처리
```
PUT /api/notifications/user/:userId/read-all
```

### 읽지 않은 알림 개수 조회
```
GET /api/notifications/user/:userId/unread-count
```

### 알림 삭제
```
DELETE /api/notifications/:id
```

## 🛠️ 설치 및 실행

### 개발 환경
```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

### 프로덕션 환경
```bash
# 빌드
npm run build

# 서버 실행
npm start
```

### Docker 실행
```bash
# 이미지 빌드
npm run docker:build

# 컨테이너 실행
npm run docker:run
```

## 🔧 환경변수

`.env` 파일을 생성하고 다음 변수들을 설정하세요:

```env
PORT=3004
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_USER=study_user
DB_PASSWORD=study_password
DB_NAME=study_group_db
```

## 📊 데이터베이스 스키마

알림 테이블이 PostgreSQL에 생성되어야 합니다:

```sql
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  group_id VARCHAR(255),
  group_name VARCHAR(255),
  related_id VARCHAR(255),
  action_url VARCHAR(500),
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
```

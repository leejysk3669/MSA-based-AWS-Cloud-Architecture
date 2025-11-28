# 🗄️ 통합 데이터베이스 구조 문서

## 📋 개요
이 문서는 하이브리드 클라우드 MSA 프로젝트의 통합 PostgreSQL 데이터베이스 구조를 정리한 것입니다. 모든 서비스(게시판, 스터디 그룹, 알림)가 하나의 PostgreSQL 인스턴스에서 스키마별로 분리되어 운영됩니다.

## 🗂️ 통합 데이터베이스 정보

### PostgreSQL - 통합 데이터베이스 (포트: 5432)
**용도**: 모든 서비스의 데이터 저장 (게시판, 스터디 그룹, 알림)
**환경변수**:
```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=hippo_user
DB_PASSWORD=hippo_password
DB_NAME=hippo_unified_db
```

## 📊 스키마별 구조

### 1. board 스키마 - 커뮤니티 게시판

#### categories 테이블
```sql
CREATE TABLE board.categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

#### posts 테이블
```sql
CREATE TABLE board.posts (
  id VARCHAR(36) PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  author VARCHAR(100) NOT NULL,
  author_id VARCHAR(100),
  category_id INTEGER REFERENCES board.categories(id) ON DELETE SET NULL,
  view_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  is_hot BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

#### comments 테이블
```sql
CREATE TABLE board.comments (
  id VARCHAR(36) PRIMARY KEY,
  post_id VARCHAR(36) NOT NULL REFERENCES board.posts(id) ON DELETE CASCADE,
  author VARCHAR(100) NOT NULL,
  author_id VARCHAR(100),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

#### likes 테이블
```sql
CREATE TABLE board.likes (
  id VARCHAR(36) PRIMARY KEY,
  post_id VARCHAR(36) NOT NULL REFERENCES board.posts(id) ON DELETE CASCADE,
  user_id VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(post_id, user_id)
);
```

### 2. study 스키마 - 스터디 그룹

#### study_groups 테이블
```sql
CREATE TABLE study.study_groups (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL,
  leader VARCHAR(100) NOT NULL,
  max_members INTEGER DEFAULT 10,
  current_members INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

#### group_members 테이블
```sql
CREATE TABLE study.group_members (
  id VARCHAR(36) PRIMARY KEY,
  group_id VARCHAR(36) NOT NULL REFERENCES study.study_groups(id) ON DELETE CASCADE,
  user_id VARCHAR(100) NOT NULL,
  user_name VARCHAR(100) NOT NULL,
  role VARCHAR(20) DEFAULT 'member',
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(group_id, user_id)
);
```

#### meetings 테이블
```sql
CREATE TABLE study.meetings (
  id VARCHAR(36) PRIMARY KEY,
  group_id VARCHAR(36) NOT NULL REFERENCES study.study_groups(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  location VARCHAR(200),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

#### meeting_attendees 테이블
```sql
CREATE TABLE study.meeting_attendees (
  id VARCHAR(36) PRIMARY KEY,
  meeting_id VARCHAR(36) NOT NULL REFERENCES study.meetings(id) ON DELETE CASCADE,
  user_id VARCHAR(100) NOT NULL,
  user_name VARCHAR(100) NOT NULL,
  status VARCHAR(20) DEFAULT 'maybe',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(meeting_id, user_id)
);
```

### 3. notification 스키마 - 알림 서비스

#### notifications 테이블
```sql
CREATE TABLE notification.notifications (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(100) NOT NULL,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

## 🔧 인덱스 및 제약조건

### board 스키마 인덱스
```sql
-- 게시판 인덱스
CREATE INDEX idx_posts_category_id ON board.posts(category_id);
CREATE INDEX idx_posts_created_at ON board.posts(created_at);
CREATE INDEX idx_posts_is_hot ON board.posts(is_hot);
CREATE INDEX idx_comments_post_id ON board.comments(post_id);
CREATE INDEX idx_likes_post_id ON board.likes(post_id);
CREATE INDEX idx_likes_user_id ON board.likes(user_id);
```

### study 스키마 인덱스
```sql
-- 스터디 그룹 인덱스
CREATE INDEX idx_study_groups_category ON study.study_groups(category);
CREATE INDEX idx_study_groups_leader ON study.study_groups(leader);
CREATE INDEX idx_study_groups_created_at ON study.study_groups(created_at);
CREATE INDEX idx_group_members_group_id ON study.group_members(group_id);
CREATE INDEX idx_group_members_user_id ON study.group_members(user_id);
CREATE INDEX idx_meetings_group_id ON study.meetings(group_id);
CREATE INDEX idx_meetings_date ON study.meetings(date);
CREATE INDEX idx_meeting_attendees_meeting_id ON study.meeting_attendees(meeting_id);
```

### notification 스키마 인덱스
```sql
-- 알림 인덱스
CREATE INDEX idx_notifications_user_id ON notification.notifications(user_id);
CREATE INDEX idx_notifications_type ON notification.notifications(type);
CREATE INDEX idx_notifications_is_read ON notification.notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notification.notifications(created_at);
```

## 🔄 트리거 및 뷰

### 게시판 댓글 수 자동 업데이트 트리거
```sql
CREATE OR REPLACE FUNCTION board.update_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE board.posts SET comment_count = comment_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE board.posts SET comment_count = comment_count - 1 WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_comment_count
  AFTER INSERT OR DELETE ON board.comments
  FOR EACH ROW EXECUTE FUNCTION board.update_comment_count();
```

### 게시판 추천 수 자동 업데이트 트리거
```sql
CREATE OR REPLACE FUNCTION board.update_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE board.posts SET like_count = like_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE board.posts SET like_count = like_count - 1 WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_like_count
  AFTER INSERT OR DELETE ON board.likes
  FOR EACH ROW EXECUTE FUNCTION board.update_like_count();
```

## 📈 샘플 데이터

### 기본 카테고리 데이터
```sql
INSERT INTO board.categories (name, description) VALUES 
('공지사항', '중요한 공지사항을 올리는 게시판'),
('자유게시판', '자유로운 소통을 위한 게시판'),
('채용공고', '채용 관련 정보를 공유하는 게시판'),
('취업후기', '취업 후기와 면접 경험을 공유하는 게시판'),
('진로상담', '진로와 상담 관련 게시판');
```

### 샘플 게시글 데이터
```sql
INSERT INTO board.posts (id, title, content, author, author_id, category_id, view_count, like_count, comment_count, is_hot) VALUES 
('post-1', '📢 중요한 공지사항입니다', '안녕하세요! 커뮤니티 이용에 관한 중요한 공지사항입니다.', '관리자', 'admin', 1, 150, 25, 8, true),
('post-2', '🔥 오늘의 핫토픽: 취업 준비', '안녕하세요! 취업 준비생들끼리 정보 공유해요.', 'user1', 'user1', 2, 320, 45, 23, true),
('post-3', '💡 포트폴리오 작성 팁 공유', '포트폴리오 작성할 때 도움이 될 만한 팁들을 정리해봤어요.', 'user2', 'user2', 2, 189, 32, 15, true);
```

### 샘플 스터디 그룹 데이터
```sql
INSERT INTO study.study_groups (id, name, description, category, leader, max_members, current_members) VALUES 
('sg-1', 'React 스터디 그룹', 'React와 관련 기술들을 함께 공부하는 그룹입니다.', '프로그래밍', 'user1', 8, 1),
('sg-2', '자격증 준비 스터디', '정보처리기사, SQLD 등 IT 자격증 준비 그룹입니다.', '자격증', 'user2', 10, 1);
```

## 🚀 배포 시 고려사항

### 1. AWS RDS 설정
- **엔진**: PostgreSQL 15.x 이상
- **인스턴스 클래스**: db.t3.micro (개발) / db.t3.small (운영)
- **스토리지**: 20GB 이상
- **백업**: 자동 백업 활성화
- **멀티 AZ**: 운영 환경에서 권장

### 2. 보안 설정
- **VPC**: 프라이빗 서브넷에 배치
- **보안 그룹**: 필요한 포트만 허용 (5432)
- **SSL**: 연결 시 SSL 사용 권장
- **암호화**: 저장 데이터 암호화 활성화

### 3. 성능 최적화
- **연결 풀**: 각 서비스별 적절한 연결 풀 크기 설정
- **모니터링**: CloudWatch를 통한 성능 모니터링
- **백업**: 정기적인 스냅샷 생성

## 📝 마이그레이션 가이드

기존 분리된 데이터베이스에서 통합 데이터베이스로 마이그레이션할 때는 `init-unified-database.sql` 파일을 사용하세요.

```bash
# 통합 데이터베이스 초기화
psql -U hippo_user -d hippo_unified_db -f init-unified-database.sql
```

이 문서는 통합 데이터베이스 구조를 완전히 반영하며, 모든 서비스가 하나의 PostgreSQL 인스턴스에서 스키마별로 안전하게 분리되어 운영됩니다.

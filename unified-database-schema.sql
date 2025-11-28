-- =====================================================
-- HIPPO 프로젝트 통합 데이터베이스 스키마
-- PostgreSQL 15 기반
-- =====================================================

-- 데이터베이스 생성
CREATE DATABASE hippo_unified_db;

-- 한국 시간대 설정
SET timezone = 'Asia/Seoul';

-- =====================================================
-- 1. 게시판 스키마 (board)
-- =====================================================
CREATE SCHEMA board;

-- 1-1. 카테고리 테이블
CREATE TABLE board.categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 1-2. 게시글 테이블 (실시간 인기글, 추천 시스템 지원)
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

-- 1-3. 댓글 테이블
CREATE TABLE board.comments (
  id VARCHAR(36) PRIMARY KEY,
  post_id VARCHAR(36) NOT NULL REFERENCES board.posts(id) ON DELETE CASCADE,
  author VARCHAR(100) NOT NULL,
  author_id VARCHAR(100),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 1-4. 추천 테이블 (중복 추천 방지)
CREATE TABLE board.likes (
  id VARCHAR(36) PRIMARY KEY,
  post_id VARCHAR(36) NOT NULL REFERENCES board.posts(id) ON DELETE CASCADE,
  user_id VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(post_id, user_id)
);

-- =====================================================
-- 2. 스터디 그룹 스키마 (study)
-- =====================================================
CREATE SCHEMA study;

-- 2-1. 스터디 그룹 테이블
CREATE TABLE study.study_groups (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  category VARCHAR(100) NOT NULL,
  leader VARCHAR(100) NOT NULL,
  max_members INTEGER DEFAULT 5,
  current_members INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2-2. 그룹 멤버 테이블
CREATE TABLE study.group_members (
  id VARCHAR(36) PRIMARY KEY,
  group_id VARCHAR(36) NOT NULL REFERENCES study.study_groups(id) ON DELETE CASCADE,
  user_id VARCHAR(100) NOT NULL,
  user_name VARCHAR(100) NOT NULL,
  role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('leader', 'member')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(group_id, user_id)
);

-- 2-3. 모임 일정 테이블
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

-- 2-4. 출석 관리 테이블
CREATE TABLE study.meeting_attendees (
  id VARCHAR(36) PRIMARY KEY,
  meeting_id VARCHAR(36) NOT NULL REFERENCES study.meetings(id) ON DELETE CASCADE,
  user_id VARCHAR(100) NOT NULL,
  user_name VARCHAR(100) NOT NULL,
  status VARCHAR(20) DEFAULT 'maybe' CHECK (status IN ('attending', 'not_attending', 'maybe')),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(meeting_id, user_id)
);

-- =====================================================
-- 3. 알림 스키마 (notification)
-- =====================================================
CREATE SCHEMA notification;

-- 3-1. 알림 테이블
CREATE TABLE notification.notifications (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(100) NOT NULL,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  group_id VARCHAR(36),
  group_name VARCHAR(200),
  related_id VARCHAR(36),
  action_url VARCHAR(500),
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 4. 인덱스 생성
-- =====================================================

-- 게시판 인덱스
CREATE INDEX idx_board_posts_category_id ON board.posts(category_id);
CREATE INDEX idx_board_posts_created_at ON board.posts(created_at);
CREATE INDEX idx_board_posts_is_hot ON board.posts(is_hot);
CREATE INDEX idx_board_posts_like_count ON board.posts(like_count);
CREATE INDEX idx_board_comments_post_id ON board.comments(post_id);
CREATE INDEX idx_board_comments_created_at ON board.comments(created_at);
CREATE INDEX idx_board_likes_post_id ON board.likes(post_id);
CREATE INDEX idx_board_likes_user_id ON board.likes(user_id);

-- 스터디 그룹 인덱스
CREATE INDEX idx_study_groups_category ON study.study_groups(category);
CREATE INDEX idx_study_groups_is_active ON study.study_groups(is_active);
CREATE INDEX idx_study_groups_created_at ON study.study_groups(created_at);
CREATE INDEX idx_group_members_group_id ON study.group_members(group_id);
CREATE INDEX idx_group_members_user_id ON study.group_members(user_id);
CREATE INDEX idx_meetings_group_id ON study.meetings(group_id);
CREATE INDEX idx_meetings_date ON study.meetings(date);
CREATE INDEX idx_meeting_attendees_meeting_id ON study.meeting_attendees(meeting_id);
CREATE INDEX idx_meeting_attendees_user_id ON study.meeting_attendees(user_id);

-- 알림 인덱스
CREATE INDEX idx_notifications_user_id ON notification.notifications(user_id);
CREATE INDEX idx_notifications_created_at ON notification.notifications(created_at);
CREATE INDEX idx_notifications_is_read ON notification.notifications(is_read);
CREATE INDEX idx_notifications_type ON notification.notifications(type);

-- =====================================================
-- 5. 함수 및 트리거 생성
-- =====================================================

-- 업데이트 시간 자동 갱신 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 게시판 트리거
CREATE TRIGGER update_board_posts_updated_at 
    BEFORE UPDATE ON board.posts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_board_comments_updated_at 
    BEFORE UPDATE ON board.comments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 스터디 그룹 트리거
CREATE TRIGGER update_study_groups_updated_at 
    BEFORE UPDATE ON study.study_groups
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_meetings_updated_at 
    BEFORE UPDATE ON study.meetings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 알림 트리거
CREATE TRIGGER update_notifications_updated_at 
    BEFORE UPDATE ON notification.notifications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 6. 뷰 생성 (자주 사용하는 쿼리)
-- =====================================================

-- 게시판 요약 뷰
CREATE OR REPLACE VIEW board.post_summary AS
SELECT 
  p.id,
  p.title,
  p.author,
  p.category_id,
  c.name as category_name,
  p.view_count,
  p.like_count,
  p.comment_count,
  p.is_hot,
  p.created_at
FROM board.posts p
LEFT JOIN board.categories c ON p.category_id = c.id;

-- 스터디 그룹 요약 뷰
CREATE OR REPLACE VIEW study.study_group_summary AS
SELECT 
  sg.id,
  sg.name,
  sg.description,
  sg.category,
  sg.leader,
  sg.max_members,
  sg.current_members,
  sg.is_active,
  sg.created_at,
  sg.updated_at,
  COUNT(DISTINCT m.id) as meeting_count,
  COUNT(DISTINCT gm.user_id) as member_count
FROM study.study_groups sg
LEFT JOIN study.group_members gm ON sg.id = gm.group_id
LEFT JOIN study.meetings m ON sg.id = m.group_id
WHERE sg.is_active = true
GROUP BY sg.id, sg.name, sg.description, sg.category, sg.leader, sg.max_members, sg.current_members, sg.is_active, sg.created_at, sg.updated_at;

-- =====================================================
-- 7. 사용자 및 권한 설정
-- =====================================================

-- 통합 사용자 생성
CREATE USER hippo_user WITH PASSWORD 'hippo_password';

-- 스키마별 권한 부여
GRANT USAGE ON SCHEMA board TO hippo_user;
GRANT USAGE ON SCHEMA study TO hippo_user;
GRANT USAGE ON SCHEMA notification TO hippo_user;

-- 테이블 권한 부여
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA board TO hippo_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA study TO hippo_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA notification TO hippo_user;

-- 시퀀스 권한 부여
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA board TO hippo_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA study TO hippo_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA notification TO hippo_user;

-- 함수 권한 부여
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO hippo_user;

-- 뷰 권한 부여
GRANT SELECT ON ALL TABLES IN SCHEMA board TO hippo_user;
GRANT SELECT ON ALL TABLES IN SCHEMA study TO hippo_user;
GRANT SELECT ON ALL TABLES IN SCHEMA notification TO hippo_user;

-- =====================================================
-- 8. 기본 데이터 삽입
-- =====================================================

-- 게시판 카테고리
INSERT INTO board.categories (name, description) VALUES 
('공지사항', '중요한 공지사항을 올리는 게시판'),
('자유게시판', '자유로운 소통을 위한 게시판'),
('채용공고', '채용 관련 정보를 공유하는 게시판'),
('취업후기', '취업 후기와 면접 경험을 공유하는 게시판'),
('진로상담', '진로와 상담 관련 게시판')
ON CONFLICT DO NOTHING;

-- 샘플 게시글 (실시간 인기글 테스트용)
INSERT INTO board.posts (id, title, content, author, author_id, category_id, view_count, like_count, comment_count, is_hot) VALUES
('post-1', '📢 중요한 공지사항입니다', '안녕하세요! 커뮤니티 이용에 관한 중요한 공지사항입니다.', '관리자', 'admin', 1, 150, 25, 8, TRUE),
('post-2', '🔥 오늘의 핫토픽: 취업 준비', '안녕하세요! 취업 준비생들끼리 정보 공유해요.', 'user1', 'user1', 2, 320, 45, 23, TRUE),
('post-3', '💡 포트폴리오 작성 팁 공유', '포트폴리오 작성할 때 도움이 될 만한 팁들을 정리해봤어요.', 'user2', 'user2', 2, 189, 32, 15, TRUE)
ON CONFLICT DO NOTHING;

-- 샘플 스터디 그룹
INSERT INTO study.study_groups (id, name, description, category, leader, max_members, current_members) VALUES
('sg-1', 'React 스터디 그룹', 'React와 TypeScript를 함께 공부하는 스터디 그룹입니다.', '프로그래밍', 'user1', 5, 3),
('sg-2', '자격증 준비 스터디', '정보처리기사 자격증 준비를 위한 스터디 그룹입니다.', '자격증', 'user2', 5, 2)
ON CONFLICT DO NOTHING;

-- 샘플 알림
INSERT INTO notification.notifications (id, user_id, type, title, message, group_id, group_name, action_url) VALUES
('notif-1', 'user1', 'member_join', '새로운 멤버 가입', 'React 스터디 그룹에 user2님이 가입했습니다.', 'sg-1', 'React 스터디 그룹', '/study-groups/sg-1'),
('notif-2', 'user1', 'meeting_created', '새로운 모임 일정', 'React 스터디 그룹에 새로운 모임이 생성되었습니다.', 'sg-1', 'React 스터디 그룹', '/study-groups/sg-1')
ON CONFLICT DO NOTHING;

-- =====================================================
-- 9. 연결 문자열 예시
-- =====================================================

/*
게시판 서비스 연결 문자열:
postgresql://hippo_user:hippo_password@localhost:5432/hippo_unified_db?search_path=board

스터디 그룹 서비스 연결 문자열:
postgresql://hippo_user:hippo_password@localhost:5432/hippo_unified_db?search_path=study

알림 서비스 연결 문자열:
postgresql://hippo_user:hippo_password@localhost:5432/hippo_unified_db?search_path=notification
*/

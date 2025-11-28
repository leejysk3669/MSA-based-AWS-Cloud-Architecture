import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import { notificationService } from './notificationService';
import { authMiddleware, optionalAuthMiddleware, AuthenticatedRequest } from './middleware/auth';
import { getUserDisplayName } from './utils/userDisplayName';
import { 
  metricsMiddleware, 
  metricsHandler, 
  healthCheckHandler,
  databaseConnections,
  postsTotal,
  commentsTotal
} from './middleware/metrics';

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(helmet());
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

app.use(morgan('combined'));
app.use(compression());
app.use(express.json());

// 메트릭 수집 미들웨어 (metrics.ts에서 import)
app.use(metricsMiddleware);

// PostgreSQL connection pool
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'hippo_user',
  password: process.env.DB_PASSWORD || 'hippo_password',
  database: process.env.DB_NAME || 'hippo_unified_db',
  port: parseInt(process.env.DB_PORT || '5432'),
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  // PostgreSQL 15의 scram-sha-256 인증 방식 지원
  application_name: 'community-board-api'
});

// Initialize database tables
async function initializeDatabase() {
  try {
    const client = await pool.connect();
    
    // 스키마 설정
    await client.query('SET search_path TO board');
    
    // 테이블이 이미 존재하는지 확인 (통합 DB에서 이미 생성됨)
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'board' 
        AND table_name = 'categories'
      );
    `);
    
    if (!tableCheck.rows[0].exists) {
      console.log('Tables not found, creating them...');
      
      // Create categories table
      await client.query(`
        CREATE TABLE IF NOT EXISTS board.categories (
          id SERIAL PRIMARY KEY,
          name VARCHAR(50) NOT NULL,
          description TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create posts table
      await client.query(`
        CREATE TABLE IF NOT EXISTS board.posts (
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
        )
      `);

      // Create comments table
      await client.query(`
        CREATE TABLE IF NOT EXISTS board.comments (
          id VARCHAR(36) PRIMARY KEY,
          post_id VARCHAR(36) NOT NULL REFERENCES board.posts(id) ON DELETE CASCADE,
          author VARCHAR(100) NOT NULL,
          author_id VARCHAR(100),
          content TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create likes table
      await client.query(`
        CREATE TABLE IF NOT EXISTS board.likes (
          id VARCHAR(36) PRIMARY KEY,
          post_id VARCHAR(36) NOT NULL REFERENCES board.posts(id) ON DELETE CASCADE,
          user_id VARCHAR(100) NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(post_id, user_id)
        )
      `);

      // Create indexes
      await client.query('CREATE INDEX IF NOT EXISTS idx_posts_category_id ON board.posts(category_id)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_posts_created_at ON board.posts(created_at)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_posts_is_hot ON board.posts(is_hot)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_comments_post_id ON board.comments(post_id)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_likes_post_id ON board.likes(post_id)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_likes_user_id ON board.likes(user_id)');

      console.log('Database tables created successfully');
    } else {
      console.log('Database tables already exist');
    }

    client.release();
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
}

// Health check endpoint (metrics.ts의 healthCheckHandler 사용)
app.get('/health', healthCheckHandler);

// Prometheus 메트릭 엔드포인트
app.get('/metrics', async (req, res) => {
  try {
    // 데이터베이스 연결 상태 업데이트
    databaseConnections.set(pool.totalCount);
    
    // 게시글 수 업데이트
    const postsResult = await pool.query('SELECT COUNT(*) FROM board.posts');
    postsTotal.set(parseInt(postsResult.rows[0].count));
    
    // 댓글 수 업데이트
    const commentsResult = await pool.query('SELECT COUNT(*) FROM board.comments');
    commentsTotal.set(parseInt(commentsResult.rows[0].count));
    
    // 메트릭 반환 (metrics.ts의 metricsHandler 사용)
    await metricsHandler(req, res);
  } catch (error) {
    console.error('Error collecting metrics:', error);
    res.status(500).end('Error collecting metrics');
  }
});

// Get all posts
app.get('/api/board/posts', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;
    const search = req.query.search as string;
    const category = req.query.category ? decodeURIComponent(req.query.category as string) : '';

    console.log('API Request - Full query:', req.query);
    console.log('API Request - search:', search, 'category:', category);
    console.log('API Request - category type:', typeof category);
    console.log('API Request - category length:', category.length);

    let whereClause = '';
    let params: any[] = [];
    let paramIndex = 1;

    // 검색 조건 추가
    if (search && search.trim()) {
      whereClause += ` WHERE (p.title ILIKE $${paramIndex++} OR p.content ILIKE $${paramIndex++})`;
      const searchTerm = `%${search.trim()}%`;
      params.push(searchTerm, searchTerm);
    }

    // 카테고리 필터 추가
    if (category && category !== 'all') {
      if (whereClause) {
        whereClause += ` AND c.name = $${paramIndex++}`;
      } else {
        whereClause += ` WHERE c.name = $${paramIndex++}`;
      }
      params.push(category);
    }

    console.log('Final whereClause:', whereClause);
    console.log('Final params:', params);

    // 게시글 조회
    const query = `
      SELECT 
        p.id,
        p.title,
        p.content,
        p.author,
        p.author_id as "authorId",
        p.view_count as "viewCount",
        p.like_count as "likeCount",
        p.comment_count as "commentCount",
        p.is_hot as "isHot",
        p.created_at as "createdAt",
        p.updated_at as "updatedAt",
        c.name as category_name 
      FROM board.posts p 
      LEFT JOIN board.categories c ON p.category_id = c.id 
      ${whereClause}
      ORDER BY p.created_at DESC 
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;
    
    params.push(limit, offset);
    const result = await pool.query(query, params);

    // 전체 개수 조회 (검색 조건 포함)
    let countQuery = `
      SELECT COUNT(*) as count 
      FROM board.posts p 
      LEFT JOIN board.categories c ON p.category_id = c.id
      ${whereClause}
    `;
    const countParams = params.slice(0, -2); // LIMIT, OFFSET 제외
    const countResult = await pool.query(countQuery, countParams);
    
    res.json({
      posts: result.rows,
      pagination: {
        page,
        limit,
        total: parseInt(countResult.rows[0].count),
        totalPages: Math.ceil(parseInt(countResult.rows[0].count) / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ error: '게시글 조회 중 오류가 발생했습니다.' });
  }
});

// Get post by ID
app.get('/api/board/posts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(`
      SELECT 
        p.id,
        p.title,
        p.content,
        p.author,
        p.author_id as "authorId",
        p.view_count as "viewCount",
        p.like_count as "likeCount",
        p.comment_count as "commentCount",
        p.is_hot as "isHot",
        p.created_at as "createdAt",
        p.updated_at as "updatedAt",
        c.name as category_name 
      FROM board.posts p 
      LEFT JOIN board.categories c ON p.category_id = c.id 
      WHERE p.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '게시글을 찾을 수 없습니다.' });
    }

    // 댓글 조회
    const commentsResult = await pool.query(`
      SELECT 
        id,
        post_id,
        author,
        author_id,
        content,
        created_at,
        updated_at
      FROM board.comments 
      WHERE post_id = $1 
      ORDER BY created_at ASC
    `, [id]);

    const post = result.rows[0];
    post.comments = commentsResult.rows;

    res.json(post);
  } catch (error) {
    console.error('Error fetching post:', error);
    res.status(500).json({ error: '게시글 조회 중 오류가 발생했습니다.' });
  }
});

// Increment view count
app.post('/api/board/posts/:id/view', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Increment view count
    await pool.query('UPDATE board.posts SET view_count = view_count + 1 WHERE id = $1', [id]);
    
    res.json({ message: '조회수가 증가되었습니다.' });
  } catch (error) {
    console.error('Error incrementing view count:', error);
    res.status(500).json({ error: '조회수 증가 중 오류가 발생했습니다.' });
  }
});

// Create new post
app.post('/api/board/posts', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { title, content, category } = req.body;
    
    if (!title || !content || !category) {
      return res.status(400).json({ error: '필수 필드가 누락되었습니다.' });
    }

    // 공지사항 게시판은 관리자만 글 작성 가능
    if (category === '공지사항') {
      const isAdmin = req.user?.groups?.includes('admin') || req.user?.groups?.includes('Admin');
      if (!isAdmin) {
        return res.status(403).json({ error: '공지사항 게시판은 관리자만 글을 작성할 수 있습니다.' });
      }
    }

    // 인증된 사용자 정보 사용
    console.log('🔍 백엔드 - 사용자 정보:', req.user);
    console.log('📧 백엔드 - 사용자 이메일:', req.user?.email);
    console.log('👤 백엔드 - 사용자명:', req.user?.username);
    console.log('🆔 백엔드 - 사용자 ID:', req.user?.sub);
    
    const author = getUserDisplayName(req.user);
    console.log('✏️ 백엔드 - 생성된 작성자명:', author);
    
    const authorId = req.user?.sub;

    // Get category ID
    console.log('Received category:', category);
    
    // 카테고리 조회
    const categoriesResult = await pool.query('SELECT id, name FROM board.categories WHERE name = $1 OR name ILIKE $2', [category, `%${category}%`]);
    console.log('Found categories:', categoriesResult.rows);
    
    // 모든 카테고리 목록도 로그로 확인
    const allCategoriesResult = await pool.query('SELECT id, name FROM board.categories');
    console.log('All categories in DB:', allCategoriesResult.rows);
    
    if (categoriesResult.rows.length === 0) {
      return res.status(400).json({ 
        error: '유효하지 않은 카테고리입니다.',
        receivedCategory: category,
        availableCategories: allCategoriesResult.rows.map((c: any) => c.name)
      });
    }

    const categoryId = categoriesResult.rows[0].id;
    const postId = uuidv4();

    await pool.query(`
      INSERT INTO board.posts (id, title, content, category_id, author, author_id, view_count, like_count, comment_count, is_hot) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `, [postId, title, content, categoryId, author, authorId || null, 0, 0, 0, false]);

    const newPostResult = await pool.query(`
      SELECT 
        p.id,
        p.title,
        p.content,
        p.author,
        p.author_id as "authorId",
        p.view_count as "viewCount",
        p.like_count as "likeCount",
        p.comment_count as "commentCount",
        p.is_hot as "isHot",
        p.created_at as "createdAt",
        p.updated_at as "updatedAt",
        c.name as category_name 
      FROM board.posts p 
      LEFT JOIN board.categories c ON p.category_id = c.id 
      WHERE p.id = $1
    `, [postId]);

    res.status(201).json(newPostResult.rows[0]);
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ error: '게시글 작성 중 오류가 발생했습니다.' });
  }
});

// Get categories
app.get('/api/board/categories', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM board.categories ORDER BY id');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: '카테고리 조회 중 오류가 발생했습니다.' });
  }
});

// Get comments for a post
app.get('/api/board/posts/:postId/comments', async (req, res) => {
  try {
    const { postId } = req.params;
    
    const result = await pool.query(`
      SELECT * FROM board.comments WHERE post_id = $1 ORDER BY created_at ASC
    `, [postId]);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ error: '댓글 조회 중 오류가 발생했습니다.' });
  }
});

// Create new comment
app.post('/api/board/posts/:postId/comments', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { postId } = req.params;
    const { content } = req.body;
    
    if (!content) {
      return res.status(400).json({ error: '댓글 내용을 입력해주세요.' });
    }

    // 인증된 사용자 정보 사용
    console.log('🔍 백엔드 댓글 - 사용자 정보:', req.user);
    console.log('📧 백엔드 댓글 - 사용자 이메일:', req.user?.email);
    console.log('👤 백엔드 댓글 - 사용자명:', req.user?.username);
    console.log('🆔 백엔드 댓글 - 사용자 ID:', req.user?.sub);
    
    const author = getUserDisplayName(req.user);
    console.log('✏️ 백엔드 댓글 - 생성된 작성자명:', author);
    
    const authorId = req.user?.sub;

    // Check if post exists and get post info
    const postsResult = await pool.query('SELECT id, title, author_id FROM board.posts WHERE id = $1', [postId]);
    if (postsResult.rows.length === 0) {
      return res.status(404).json({ error: '게시글을 찾을 수 없습니다.' });
    }

    const post = postsResult.rows[0];
    const commentId = uuidv4();

    await pool.query(`
      INSERT INTO board.comments (id, post_id, author, author_id, content) 
      VALUES ($1, $2, $3, $4, $5)
    `, [commentId, postId, author, authorId || null, content]);

    // Update comment count in posts table
    await pool.query(`
      UPDATE board.posts SET comment_count = comment_count + 1 WHERE id = $1
    `, [postId]);

    // 댓글 알림 발송
    try {
      await notificationService.sendCommentNotification(
        postId,
        post.title,
        post.author_id,
        author
      );
    } catch (notificationError) {
      console.error('댓글 알림 발송 실패:', notificationError);
      // 알림 실패해도 댓글 작성은 성공으로 처리
    }

    const newCommentResult = await pool.query(`
      SELECT 
        id,
        post_id,
        author,
        author_id,
        content,
        created_at,
        updated_at
      FROM board.comments WHERE id = $1
    `, [commentId]);

    res.status(201).json(newCommentResult.rows[0]);
  } catch (error) {
    console.error('Error creating comment:', error);
    res.status(500).json({ error: '댓글 작성 중 오류가 발생했습니다.' });
  }
});

// Like a post
app.post('/api/board/posts/:postId/like', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user?.sub;
    
    if (!userId) {
      return res.status(400).json({ error: '인증이 필요합니다.' });
    }

    // Check if post exists
    const postsResult = await pool.query('SELECT id FROM board.posts WHERE id = $1', [postId]);
    if (postsResult.rows.length === 0) {
      return res.status(404).json({ error: '게시글을 찾을 수 없습니다.' });
    }

    // 관리자 권한 확인
    const isAdmin = req.user?.groups?.includes('admin') || req.user?.groups?.includes('Admin');
    
    console.log('🔍 추천 API - 사용자 정보:', req.user);
    console.log('🔑 추천 API - 관리자 권한:', isAdmin);
    console.log('👥 추천 API - 사용자 그룹:', req.user?.groups);
    
    // Check if already liked (관리자가 아닌 경우에만 중복 체크)
    if (!isAdmin) {
      const existingLikesResult = await pool.query('SELECT id FROM board.likes WHERE post_id = $1 AND user_id = $2', [postId, userId]);
      if (existingLikesResult.rows.length > 0) {
        return res.status(400).json({ error: '이미 좋아요를 눌렀습니다.' });
      }
    } else {
      // 관리자의 경우 기존 좋아요가 있으면 삭제 후 새로 추가 (중복 추천)
      const existingLikesResult = await pool.query('SELECT id FROM board.likes WHERE post_id = $1 AND user_id = $2', [postId, userId]);
      if (existingLikesResult.rows.length > 0) {
        // 기존 좋아요 삭제
        await pool.query('DELETE FROM board.likes WHERE post_id = $1 AND user_id = $2', [postId, userId]);
        // 좋아요 수는 그대로 유지 (새로 추가할 예정이므로)
      }
    }

    // 새 좋아요 추가
    const likeId = uuidv4();
    await pool.query(`
      INSERT INTO board.likes (id, post_id, user_id) 
      VALUES ($1, $2, $3)
    `, [likeId, postId, userId]);

    // 좋아요 수 증가
    await pool.query(`
      UPDATE board.posts SET like_count = like_count + 1 WHERE id = $1
    `, [postId]);

    // Check if post should be marked as hot (10+ likes)
    const updatedPostResult = await pool.query('SELECT like_count, title, author_id FROM board.posts WHERE id = $1', [postId]);
    if (updatedPostResult.rows[0].like_count >= 10) {
      await pool.query('UPDATE board.posts SET is_hot = TRUE WHERE id = $1', [postId]);
    }

    // 추천수 마일스톤 알림 발송
    try {
      await notificationService.sendLikeMilestoneNotification(
        postId,
        updatedPostResult.rows[0].title,
        updatedPostResult.rows[0].author_id,
        updatedPostResult.rows[0].like_count
      );
    } catch (notificationError) {
      console.error('추천수 마일스톤 알림 발송 실패:', notificationError);
      // 알림 실패해도 추천은 성공으로 처리
    }

    res.status(201).json({ message: '좋아요가 추가되었습니다.' });
  } catch (error) {
    console.error('Error liking post:', error);
    res.status(500).json({ error: '좋아요 처리 중 오류가 발생했습니다.' });
  }
});

// Unlike a post
app.delete('/api/board/posts/:postId/like', async (req, res) => {
  try {
    const { postId } = req.params;
    const { userId } = req.body;
    
    console.log('좋아요 취소 요청:', { postId, userId, body: req.body });
    
    if (!userId) {
      return res.status(400).json({ error: '사용자 ID가 필요합니다.' });
    }

    // 관리자는 좋아요 취소 불가 (하드코딩된 admin 체크 제거)
    // Cognito 관리자 그룹 사용자도 좋아요 취소 가능하도록 변경

    // Check if post exists
    const postsResult = await pool.query('SELECT id FROM board.posts WHERE id = $1', [postId]);
    if (postsResult.rows.length === 0) {
      return res.status(404).json({ error: '게시글을 찾을 수 없습니다.' });
    }

    // Check if liked
    const existingLikesResult = await pool.query('SELECT id FROM board.likes WHERE post_id = $1 AND user_id = $2', [postId, userId]);
    if (existingLikesResult.rows.length === 0) {
      return res.status(400).json({ error: '좋아요를 누르지 않았습니다.' });
    }

    // 좋아요 삭제
    await pool.query(`
      DELETE FROM board.likes WHERE post_id = $1 AND user_id = $2
    `, [postId, userId]);

    // 좋아요 수 감소
    await pool.query(`
      UPDATE board.posts SET like_count = like_count - 1 WHERE id = $1
    `, [postId]);

    // Check if post should be unmarked as hot (less than 10 likes)
    const updatedPostResult = await pool.query('SELECT like_count FROM board.posts WHERE id = $1', [postId]);
    if (updatedPostResult.rows[0].like_count < 10) {
      await pool.query('UPDATE board.posts SET is_hot = FALSE WHERE id = $1', [postId]);
    }

    res.json({ message: '좋아요가 취소되었습니다.' });
  } catch (error) {
    console.error('Error unliking post:', error);
    res.status(500).json({ error: '좋아요 취소 중 오류가 발생했습니다.' });
  }
});

// Check if user liked a post
app.get('/api/board/posts/:postId/like', async (req, res) => {
  try {
    const { postId } = req.params;
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({ error: '사용자 ID가 필요합니다.' });
    }

    const likesResult = await pool.query('SELECT id FROM board.likes WHERE post_id = $1 AND user_id = $2', [postId, userId]);
    
    res.json({ liked: likesResult.rows.length > 0 });
  } catch (error) {
    console.error('Error checking like status:', error);
    res.status(500).json({ error: '좋아요 상태 확인 중 오류가 발생했습니다.' });
  }
});

// Update post
app.put('/api/board/posts/:postId', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { postId } = req.params;
    const { title, content, authorId } = req.body;
    
    if (!title || !content) {
      return res.status(400).json({ error: '제목과 내용을 입력해주세요.' });
    }

    // Check if post exists and get current author
    const postsResult = await pool.query(`
      SELECT author_id FROM board.posts WHERE id = $1
    `, [postId]);

    if (postsResult.rows.length === 0) {
      return res.status(404).json({ error: '게시글을 찾을 수 없습니다.' });
    }

    // Check if user is the author (or admin)
    const isAdmin = req.user?.groups?.includes('admin') || req.user?.groups?.includes('Admin');
    if (postsResult.rows[0].author_id !== authorId && !isAdmin) {
      return res.status(403).json({ error: '게시글을 수정할 권한이 없습니다.' });
    }

    // Update post
    await pool.query(`
      UPDATE board.posts 
      SET title = $1, content = $2, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $3
    `, [title, content, postId]);

    // Get updated post
    const updatedPostResult = await pool.query(`
      SELECT 
        p.*,
        c.name as category_name,
        p.created_at as created_at,
        p.updated_at as updated_at
      FROM board.posts p
      LEFT JOIN board.categories c ON p.category_id = c.id
      WHERE p.id = $1
    `, [postId]);

    res.json(updatedPostResult.rows[0]);
  } catch (error) {
    console.error('Error updating post:', error);
    res.status(500).json({ error: '게시글 수정 중 오류가 발생했습니다.' });
  }
});

// Delete post
app.delete('/api/board/posts/:postId', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { postId } = req.params;
    const { authorId } = req.body;
    
    if (!authorId) {
      return res.status(400).json({ error: '사용자 ID가 필요합니다.' });
    }

    // Check if post exists and get current author
    const postsResult = await pool.query(`
      SELECT author_id FROM board.posts WHERE id = $1
    `, [postId]);

    if (postsResult.rows.length === 0) {
      return res.status(404).json({ error: '게시글을 찾을 수 없습니다.' });
    }

    // Check if user is the author (or admin)
    const isAdmin = req.user?.groups?.includes('admin') || req.user?.groups?.includes('Admin');
    if (postsResult.rows[0].author_id !== authorId && !isAdmin) {
      return res.status(403).json({ error: '게시글을 삭제할 권한이 없습니다.' });
    }

    // Delete post (comments and likes will be deleted automatically due to CASCADE)
    await pool.query('DELETE FROM board.posts WHERE id = $1', [postId]);

    res.json({ message: '게시글이 삭제되었습니다.' });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ error: '게시글 삭제 중 오류가 발생했습니다.' });
  }
});

// Update comment
app.put('/api/board/comments/:commentId', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { commentId } = req.params;
    const { content, authorId } = req.body;
    
    console.log('댓글 수정 요청:', { commentId, content, authorId, body: req.body });
    
    if (!content) {
      return res.status(400).json({ error: '댓글 내용을 입력해주세요.' });
    }

    if (!authorId) {
      return res.status(400).json({ error: '사용자 ID가 필요합니다.' });
    }

    // Check if comment exists and get current author
    const commentsResult = await pool.query(`
      SELECT author_id FROM board.comments WHERE id = $1
    `, [commentId]);

    if (commentsResult.rows.length === 0) {
      return res.status(404).json({ error: '댓글을 찾을 수 없습니다.' });
    }

    // Check if user is the author (or admin)
    const isAdmin = req.user?.groups?.includes('admin') || req.user?.groups?.includes('Admin');
    if (commentsResult.rows[0].author_id !== authorId && !isAdmin) {
      return res.status(403).json({ error: '댓글을 수정할 권한이 없습니다.' });
    }

    const result = await pool.query(`
      UPDATE board.comments SET content = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2
    `, [content, commentId]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: '댓글을 찾을 수 없습니다.' });
    }

    const updatedCommentResult = await pool.query(`
      SELECT 
        id,
        post_id,
        author,
        author_id,
        content,
        created_at,
        updated_at
      FROM board.comments WHERE id = $1
    `, [commentId]);

    res.json(updatedCommentResult.rows[0]);
  } catch (error) {
    console.error('Error updating comment:', error);
    res.status(500).json({ error: '댓글 수정 중 오류가 발생했습니다.' });
  }
});

// Delete comment
app.delete('/api/board/comments/:commentId', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { commentId } = req.params;
    const { authorId } = req.body;
    
    console.log('댓글 삭제 요청:', { commentId, authorId, body: req.body });
    
    if (!authorId) {
      return res.status(400).json({ error: '사용자 ID가 필요합니다.' });
    }

    // Get comment info before deleting
    const commentsResult = await pool.query(`
      SELECT post_id, author_id FROM board.comments WHERE id = $1
    `, [commentId]);

    if (commentsResult.rows.length === 0) {
      return res.status(404).json({ error: '댓글을 찾을 수 없습니다.' });
    }

    // Check if user is the author (or admin)
    const isAdmin = req.user?.groups?.includes('admin') || req.user?.groups?.includes('Admin');
    if (commentsResult.rows[0].author_id !== authorId && !isAdmin) {
      return res.status(403).json({ error: '댓글을 삭제할 권한이 없습니다.' });
    }

    const postId = commentsResult.rows[0].post_id;

    // Delete comment
    await pool.query('DELETE FROM board.comments WHERE id = $1', [commentId]);

    // Update comment count in posts table
    await pool.query(`
      UPDATE board.posts SET comment_count = comment_count - 1 WHERE id = $1
    `, [postId]);

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ error: '댓글 삭제 중 오류가 발생했습니다.' });
  }
});

// Get user's posts
app.get('/api/board/users/:userId/posts', async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
    
    console.log('User posts request:', { userId, page, limit, offset });

    // Get user's posts with category information
    const result = await pool.query(`
      SELECT 
        p.id,
        p.title,
        p.content,
        p.category_id,
        c.name as category_name,
        p.author,
        p.author_id as "authorId",
        p.view_count as "viewCount",
        p.like_count as "likeCount",
        p.comment_count as "commentCount",
        p.is_hot as "isHot",
        p.created_at as "createdAt",
        p.updated_at as "updatedAt"
      FROM board.posts p
      LEFT JOIN board.categories c ON p.category_id = c.id
      WHERE p.author_id = $1
      ORDER BY p.created_at DESC
      LIMIT $2 OFFSET $3
    `, [userId, parseInt(limit as string), offset]);

    // Get total count for pagination
    const countResult = await pool.query(`
      SELECT COUNT(*) as total FROM board.posts WHERE author_id = $1
    `, [userId]);

    const totalPosts = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(totalPosts / parseInt(limit as string));

    res.json({
      posts: result.rows,
      pagination: {
        currentPage: parseInt(page as string),
        totalPages,
        totalPosts,
        hasNext: parseInt(page as string) < totalPages,
        hasPrev: parseInt(page as string) > 1
      }
    });
  } catch (error) {
    console.error('Error fetching user posts:', error);
    res.status(500).json({ error: '사용자 게시글 조회 중 오류가 발생했습니다.' });
  }
});

// Get user's comments
app.get('/api/board/users/:userId/comments', async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

    // Get user's comments with post information
    const result = await pool.query(`
      SELECT 
        c.id,
        c.post_id,
        c.content,
        c.author,
        c.author_id as "authorId",
        c.created_at as "createdAt",
        c.updated_at as "updatedAt",
        p.title as post_title,
        p.category_id,
        cat.name as category_name
      FROM board.comments c
      LEFT JOIN board.posts p ON c.post_id = p.id
      LEFT JOIN board.categories cat ON p.category_id = cat.id
      WHERE c.author_id = $1
      ORDER BY c.created_at DESC
      LIMIT $2 OFFSET $3
    `, [userId, parseInt(limit as string), offset]);

    // Get total count for pagination
    const countResult = await pool.query(`
      SELECT COUNT(*) as total FROM board.comments WHERE author_id = $1
    `, [userId]);

    const totalComments = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(totalComments / parseInt(limit as string));

    res.json({
      comments: result.rows,
      pagination: {
        currentPage: parseInt(page as string),
        totalPages,
        totalComments,
        hasNext: parseInt(page as string) < totalPages,
        hasPrev: parseInt(page as string) > 1
      }
    });
  } catch (error) {
    console.error('Error fetching user comments:', error);
    res.status(500).json({ error: '사용자 댓글 조회 중 오류가 발생했습니다.' });
  }
});

// Start server
async function startServer() {
  try {
    await initializeDatabase();
    app.listen(PORT, () => {
      console.log(`🚀 Community Board API server running on port ${PORT}`);
      console.log(`📊 Connected to PostgreSQL database`);
      console.log(`🔗 Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

import axios from 'axios';
import { getApiConfig } from '../config/api';
import { getAuthHeader } from '../config/cognito';

// API 설정 가져오기
const apiConfig = getApiConfig();
const API_BASE_URL = `${apiConfig.baseURL}/api/board`;
const STUDY_GROUP_API_BASE_URL = `${apiConfig.baseURL}/api/study-groups`;

// 디버깅: 현재 API 설정 로그
console.log('🔍 API 설정:', {
  baseURL: apiConfig.baseURL,
  boardURL: API_BASE_URL,
  studyGroupURL: STUDY_GROUP_API_BASE_URL,
  currentHost: typeof window !== 'undefined' ? window.location.hostname : 'server'
});

// 게시판용 axios 인스턴스 생성
const apiClient = axios.create({
  baseURL: apiConfig.baseURL, // baseURL만 사용
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false, // CORS 문제 방지
  timeout: 30000, // 30초 타임아웃
});

// 스터디 그룹용 axios 인스턴스 생성
const studyGroupApiClient = axios.create({
  baseURL: `${apiConfig.baseURL}/api/study-groups`, // API Gateway를 통해 스터디 그룹 API 연결
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10초 타임아웃
  withCredentials: false, // CORS 문제 방지
});

// 취업뉴스용 axios 인스턴스 생성
const jobsNewsApiClient = axios.create({
  baseURL: `${apiConfig.baseURL}/api/jobs-news`, // API Gateway를 통해 취업뉴스 API 연결
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000, // 15초 타임아웃 (크롤링 시간 고려)
  withCredentials: false,
});

// 자격증 검색용 axios 인스턴스 생성
const certificateSearchApiClient = axios.create({
  baseURL: `${apiConfig.baseURL}/api/search`, // API Gateway를 통해 자격증 검색 API 연결
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 20000, // 20초 타임아웃 (AI 처리 시간 고려)
  withCredentials: false,
});

// AI 포트폴리오용 axios 인스턴스 생성
const aiPortfolioApiClient = axios.create({
  baseURL: `${apiConfig.baseURL}/api/portfolio`, // API Gateway를 통해 AI 포트폴리오 API 연결
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30초 타임아웃 (AI 처리 시간 고려)
  withCredentials: false,
});

// 알림 API용 axios 인스턴스 생성
const notificationApiClient = axios.create({
  baseURL: `${apiConfig.baseURL}/api/notifications`,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
  withCredentials: false,
});

// 요청 인터셉터 (Cognito JWT 토큰 추가)
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const authHeader = await getAuthHeader();
      if (authHeader) {
        config.headers.Authorization = authHeader.Authorization;
        console.log('🔐 인증 토큰 추가됨:', {
          url: config.url,
          hasToken: !!authHeader.Authorization,
          tokenLength: authHeader.Authorization.length
        });
      } else {
        console.warn('⚠️ 인증 토큰 없음:', config.url);
      }
    } catch (error) {
      console.warn('❌ 인증 토큰을 가져올 수 없습니다:', error);
      // 토큰이 없으면 인증 헤더를 제거하여 비로그인 상태로 요청
      delete config.headers.Authorization;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터 (오류 로깅)
apiClient.interceptors.response.use(
  (response) => {
    console.log('✅ API 응답 성공:', {
      url: response.config.url,
      status: response.status,
      dataLength: response.data ? Object.keys(response.data).length : 0
    });
    return response;
  },
  (error) => {
    console.error('❌ API 응답 오류:', {
      url: error.config?.url,
      status: error.response?.status,
      statusText: error.response?.statusText,
      message: error.message,
      data: error.response?.data
    });
    return Promise.reject(error);
  }
);

studyGroupApiClient.interceptors.request.use(
  async (config) => {
    try {
      const authHeader = await getAuthHeader();
      if (authHeader) {
        config.headers.Authorization = authHeader.Authorization;
      }
    } catch (error) {
      console.warn('인증 토큰을 가져올 수 없습니다:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 알림 API 클라이언트에 인증 인터셉터 추가
notificationApiClient.interceptors.request.use(
  async (config) => {
    try {
      console.log('🔍 알림 API 요청 인터셉터 시작:', {
        method: config.method,
        url: config.url,
        baseURL: config.baseURL,
        fullURL: `${config.baseURL}${config.url}`
      });
      
      const authHeader = await getAuthHeader();
      if (authHeader) {
        config.headers.Authorization = authHeader.Authorization;
        console.log('✅ 인증 헤더 설정됨:', authHeader.Authorization.substring(0, 20) + '...');
      } else {
        console.log('⚠️ 인증 헤더 없음');
      }
      
      console.log('📤 최종 요청 헤더:', config.headers);
      return config;
    } catch (error) {
      console.error('❌ 알림 API 인증 토큰을 가져올 수 없습니다:', error);
      return config;
    }
  },
  (error) => {
    console.error('❌ 알림 API 요청 인터셉터 오류:', error);
    return Promise.reject(error);
  }
);

// 응답 인터셉터 (에러 처리)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

studyGroupApiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('Study Group API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

jobsNewsApiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('Jobs News API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

certificateSearchApiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('Certificate Search API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

aiPortfolioApiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('AI Portfolio API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

notificationApiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('Notification API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// 타입 정의
export interface Post {
  id: string;
  title: string;
  content: string;
  category: string;
  category_name?: string; // API에서 반환하는 카테고리명
  author: string;
  authorId?: string;
  createdAt: string;
  updatedAt: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  isAdmin?: boolean;
  // 추가된 속성들
  isHot?: boolean | number; // 인기글 여부 (boolean 또는 number)
  comments?: Comment[]; // 댓글 목록
  likes?: number; // 좋아요 수 (기존 likeCount와 별도)
}

export interface Comment {
  id: string;
  postId: string;
  content: string;
  author: string;
  authorId?: string;
  createdAt: string;
  updatedAt: string;
}

// 취업뉴스 타입 정의
export interface JobNewsItem {
  title: string;
  href: string;
  date: string;
  publishedAt?: string; // 백엔드에서 제공하는 publishedAt 필드 추가
  summary?: string;
  thumbnail?: string;
  // 팀원의 백엔드에서 제공하는 추가 필드들
  id?: number;
  source?: string;
  sourceCategory?: string;
  categories?: string[];
  content?: string;
}

export interface JobNewsResponse {
  source: 'cache' | 'live';
  items: JobNewsItem[];
}

// 알림 타입 정의
export interface Notification {
  id: string;
  userId: string;
  type: 'member_join' | 'member_leave' | 'meeting_created' | 'study_group' | 'board' | 'comment' | 'like' | 'like_milestone';
  title: string;
  message: string;
  groupId?: string;
  groupName?: string;
  relatedId?: string;
  actionUrl?: string;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationResponse {
  success: boolean;
  data: Notification | Notification[];
  message?: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
}

export interface CreatePostRequest {
  title: string;
  content: string;
  category: string;
  author: string;
  authorId?: string;
}

export interface UpdatePostRequest {
  title?: string;
  content?: string;
  authorId?: string;
}

export interface CreateCommentRequest {
  content: string;
  author: string;
  authorId?: string | null;
}

// 페이지네이션 응답 타입 정의
export interface PaginationResponse {
  posts: Post[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// 스터디 그룹 관련 타입 정의
export interface StudyGroup {
  id: string;
  name: string;
  description: string;
  category: string;
  leader: string;
  maxMembers: number;
  currentMembers: number;
  members: GroupMember[];
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  location?: string;
}

export interface GroupMember {
  userId: string;
  userName: string;
  joinedAt: string;
  role: 'leader' | 'member';
}

export interface Meeting {
  id: string;
  groupId: string;
  title: string;
  description?: string;
  date: string;
  location?: string;
  createdAt: string;
  attendees: string[];
}

export interface MeetingAttendee {
  userId: string;
  userName: string;
  status: 'attending' | 'not_attending' | 'maybe';
  updatedAt: string;
}

export interface UpdateAttendanceRequest {
  userId: string;
  userName: string;
  status: 'attending' | 'not_attending' | 'maybe';
}

export interface CreateStudyGroupRequest {
  name: string;
  description: string;
  category: string;
  maxMembers: number;
  leader: string;
  leaderName?: string; // 사용자 이름 추가
}

export interface UpdateStudyGroupRequest {
  name?: string;
  description?: string;
  maxMembers?: number;
}

export interface JoinRequest {
  userId: string;
  userName: string;
}

export interface CreateMeetingRequest {
  title: string;
  description?: string;
  date: string;
  location?: string;
}

export interface UpdateMeetingRequest {
  title?: string;
  description?: string;
  date?: string;
  location?: string;
}

export interface JoinResult {
  success: boolean;
  message: string;
  group?: StudyGroup;
}

// 게시글 관련 API
export const postAPI = {
  // 게시글 목록 조회
  getPosts: async (category: string = 'all', page: number = 1, limit: number = 20, search?: string): Promise<PaginationResponse> => {
    const response = await apiClient.get('/api/board/posts', { // /api/board 경로 포함
      params: { category, page, limit, search }
    });

    
    return response.data;
  },

  // 게시글 상세 조회
  getPostById: async (id: string): Promise<Post> => {
    const response = await apiClient.get(`/api/board/posts/${id}`);
    return response.data;
  },

  // 조회수 증가 (별도 API 호출)
  incrementViewCount: async (id: string): Promise<void> => {
    await apiClient.post(`/api/board/posts/${id}/view`);
  },

  // 게시글 작성
  createPost: async (postData: CreatePostRequest): Promise<Post> => {
    const response = await apiClient.post('/api/board/posts', postData);
    return response.data;
  },

  // 게시글 수정
  updatePost: async (id: string, updateData: UpdatePostRequest): Promise<Post> => {
    const response = await apiClient.put(`/api/board/posts/${id}`, updateData);
    return response.data;
  },

  // 게시글 삭제
  deletePost: async (id: string, authorId: string): Promise<void> => {
    await apiClient.delete(`/api/board/posts/${id}`, { 
      data: { authorId } 
    });
  },

  // 사용자별 게시글 조회
  getUserPosts: async (userId: string, page: number = 1, limit: number = 10): Promise<{ posts: Post[], pagination: any }> => {
    const response = await apiClient.get(`/api/board/users/${userId}/posts`, {
      params: { page, limit }
    });
    return response.data;
  }
};

// 댓글 관련 API
export const commentAPI = {
  // 댓글 목록 조회
  getComments: async (postId: string): Promise<Comment[]> => {
    const response = await apiClient.get(`/api/board/posts/${postId}/comments`);
    return response.data;
  },

  // 댓글 작성
  createComment: async (postId: string, commentData: CreateCommentRequest): Promise<Comment> => {
    const response = await apiClient.post(`/api/board/posts/${postId}/comments`, commentData);
    return response.data;
  },

  // 댓글 수정
  updateComment: async (id: string, content: string, authorId: string): Promise<Comment> => {
    const response = await apiClient.put(`/api/board/comments/${id}`, { content, authorId });
    return response.data;
  },

  // 댓글 삭제
  deleteComment: async (id: string, authorId: string): Promise<void> => {
    await apiClient.delete(`/api/board/comments/${id}`, { 
      data: { authorId } 
    });
  },

  // 사용자별 댓글 조회
  getUserComments: async (userId: string, page: number = 1, limit: number = 10): Promise<{ comments: Comment[], pagination: any }> => {
    const response = await apiClient.get(`/api/board/users/${userId}/comments`, {
      params: { page, limit }
    });
    return response.data;
  }
};

// 좋아요 관련 API
export const likeAPI = {
  // 좋아요 추가
  likePost: async (postId: string, userId: string): Promise<any> => {
    const response = await apiClient.post(`/api/board/posts/${postId}/like`, { userId });
    return response.data;
  },

  // 좋아요 취소
  unlikePost: async (postId: string, userId: string): Promise<any> => {
    const response = await apiClient.delete(`/api/board/posts/${postId}/like`, { 
      data: { userId } 
    });
    return response.data;
  },

  // 좋아요 상태 확인
  checkLikeStatus: async (postId: string, userId: string): Promise<{ liked: boolean }> => {
    const response = await apiClient.get(`/api/board/posts/${postId}/like`, {
      params: { userId }
    });
    return response.data;
  }
};

// 카테고리 관련 API
export const categoryAPI = {
  // 카테고리 목록 조회
  getCategories: async (): Promise<Category[]> => {
    const response = await apiClient.get('/api/board/categories');
    return response.data;
  },

  // 카테고리 생성 (관리자만)
  createCategory: async (name: string, description?: string): Promise<Category> => {
    const response = await apiClient.post('/api/board/categories', { name, description });
    return response.data;
  }
};

// 스터디 그룹 관련 API
export const studyGroupAPI = {
  // 스터디 그룹 목록 조회
  getStudyGroups: async (category: string = 'all', page: number = 1, limit: number = 20): Promise<StudyGroup[]> => {
    console.log('🔍 스터디 그룹 API 호출:', { category, page, limit });
    try {
      const response = await studyGroupApiClient.get('/', {
        params: { category, page, limit }
      });
      console.log('✅ 스터디 그룹 API 응답:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ 스터디 그룹 API 오류:', error);
      throw error;
    }
  },

  // 스터디 그룹 상세 조회
  getStudyGroupById: async (id: string): Promise<StudyGroup> => {
    const response = await studyGroupApiClient.get(`/${id}`);
    return response.data;
  },

  // 스터디 그룹 생성
  createStudyGroup: async (groupData: CreateStudyGroupRequest): Promise<StudyGroup> => {
    const response = await studyGroupApiClient.post('/', groupData);
    return response.data;
  },

  // 스터디 그룹 수정
  updateStudyGroup: async (id: string, updateData: UpdateStudyGroupRequest): Promise<StudyGroup> => {
    const response = await studyGroupApiClient.put(`/${id}`, updateData);
    return response.data;
  },

  // 스터디 그룹 삭제
  deleteStudyGroup: async (id: string): Promise<void> => {
    await studyGroupApiClient.delete(`/${id}`);
  },

  // 스터디 그룹 가입
  joinStudyGroup: async (id: string, joinData: JoinRequest): Promise<JoinResult> => {
    const response = await studyGroupApiClient.post(`/${id}/join`, joinData);
    return response.data;
  },

  // 스터디 그룹 탈퇴
  leaveStudyGroup: async (id: string, userId: string): Promise<JoinResult> => {
    const response = await studyGroupApiClient.post(`/${id}/leave`, { userId });
    return response.data;
  },

  // 멤버 추방 (그룹장만 가능)
  kickMember: async (groupId: string, memberId: string): Promise<JoinResult> => {
    const response = await studyGroupApiClient.post(`/${groupId}/kick`, { memberId });
    return response.data;
  },

  // 모임 일정 조회
  getMeetings: async (groupId: string): Promise<Meeting[]> => {
    const response = await studyGroupApiClient.get(`/${groupId}/meetings`);
    return response.data;
  },

  // 모임 일정 생성
  createMeeting: async (groupId: string, meetingData: CreateMeetingRequest): Promise<Meeting> => {
    const response = await studyGroupApiClient.post(`/${groupId}/meetings`, meetingData);
    return response.data;
  },

  updateMeeting: async (meetingId: string, meetingData: UpdateMeetingRequest): Promise<Meeting> => {
    const response = await studyGroupApiClient.put(`/meetings/${meetingId}`, meetingData);
    return response.data;
  },

  deleteMeeting: async (meetingId: string): Promise<void> => {
    await studyGroupApiClient.delete(`/meetings/${meetingId}`);
  },

  updateMeetingAttendance: async (meetingId: string, attendanceData: UpdateAttendanceRequest): Promise<MeetingAttendee> => {
    const response = await studyGroupApiClient.post(`/meetings/${meetingId}/attendance`, attendanceData);
    return response.data;
  },

  getMeetingAttendees: async (meetingId: string): Promise<MeetingAttendee[]> => {
    const response = await studyGroupApiClient.get(`/meetings/${meetingId}/attendance`);
    return response.data;
  },

  // 카테고리 목록 조회
  getCategories: async (): Promise<string[]> => {
    const response = await studyGroupApiClient.get('/categories');
    return response.data;
  },

  // 사용자별 스터디 그룹 조회 (만든 스터디)
  getUserStudyGroups: async (userId: string, page: number = 1, limit: number = 10): Promise<{ groups: StudyGroup[], pagination: any }> => {
    const response = await studyGroupApiClient.get(`/users/${userId}`, {
      params: { page, limit }
    });
    return response.data;
  },

  // 사용자가 참여하고 있는 스터디 그룹 조회
  getUserParticipatingGroups: async (userId: string, page: number = 1, limit: number = 10): Promise<{ groups: StudyGroup[], pagination: any }> => {
    const response = await studyGroupApiClient.get(`/users/${userId}/participating`, {
      params: { page, limit }
    });
    return response.data;
  }
};

// 취업뉴스 관련 API
export const jobsNewsAPI = {
  // 취업뉴스 목록 조회
  getJobNews: async (forceRefresh: boolean = false): Promise<JobNewsResponse> => {
    const response = await jobsNewsApiClient.get('', {
      params: { force: forceRefresh ? '1' : '0' }
    });
    
    // 백엔드 응답을 프론트엔드 형식으로 변환
    const transformedItems: JobNewsItem[] = response.data.map((item: any) => ({
      id: item.id,
      title: item.title,
      href: item.link,
      date: item.publishedAt || item.pubDate, // publishedAt 또는 pubDate 필드 사용
      summary: item.content,
      thumbnail: item.imageUrl,
      source: item.source,
      sourceCategory: item.sourceCategory,
      categories: item.categories,
      content: item.content
    }));
    
    return {
      source: 'live',
      items: transformedItems
    };
  }
};

// 자격증 검색 관련 API
export const certificateSearchAPI = {
  // 자격증 검색
  searchCertificates: async (query: string): Promise<any[]> => {
    const response = await certificateSearchApiClient.get('/search', {
      params: { q: query }
    });
    return response.data;
  },

  // 자격증 자동완성
  getAutocomplete: async (query: string): Promise<string[]> => {
    const response = await certificateSearchApiClient.get('/autocomplete', {
      params: { q: query }
    });
    return response.data;
  }
};

// AI 포트폴리오 관련 API
export const aiPortfolioAPI = {
  // 포트폴리오 피드백 요청
  getFeedback: async (text: string): Promise<any> => {
    const response = await aiPortfolioApiClient.post('/', { text });
    return response.data;
  },

  // 최근 피드백 조회
  getRecentFeedbacks: async (limit: number = 10): Promise<any[]> => {
    const response = await aiPortfolioApiClient.get('/feedbacks', {
      params: { limit }
    });
    return response.data.data;
  },

  // 피드백 검색
  searchFeedbacks: async (query: string): Promise<any[]> => {
    const response = await aiPortfolioApiClient.get('/search', {
      params: { q: query }
    });
    return response.data.data;
  },

  // 통계 조회
  getStats: async (): Promise<any> => {
    const response = await aiPortfolioApiClient.get('/stats');
    return response.data.data;
  }
};

// 알림 관련 API
export const notificationAPI = {
  // 알림 생성
  createNotification: async (data: Omit<Notification, 'id' | 'isRead' | 'createdAt' | 'updatedAt'>): Promise<NotificationResponse> => {
    const response = await notificationApiClient.post('/', data);
    return response.data;
  },

  // 사용자별 알림 조회
  getNotificationsByUser: async (userId: string, filters?: {
    type?: Notification['type'];
    isRead?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<NotificationResponse> => {
    const params = new URLSearchParams();
    if (filters?.type) params.append('type', filters.type);
    if (filters?.isRead !== undefined) params.append('isRead', filters.isRead.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.offset) params.append('offset', filters.offset.toString());
    
    const response = await notificationApiClient.get(`/user/${userId}?${params.toString()}`);
    return response.data;
  },

  // 알림 읽음 처리
  markAsRead: async (notificationId: string): Promise<NotificationResponse> => {
    console.log('🔍 notificationAPI.markAsRead 호출:', {
      notificationId,
      baseURL: notificationApiClient.defaults.baseURL,
      fullURL: `${notificationApiClient.defaults.baseURL}/${notificationId}/read`
    });
    
    try {
      const response = await notificationApiClient.put(`/${notificationId}/read`);
      console.log('✅ markAsRead API 응답:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ markAsRead API 오류:', {
        message: error?.message,
        response: error?.response?.data,
        status: error?.response?.status,
        config: error?.config
      });
      throw error;
    }
  },

  // 모든 알림 읽음 처리
  markAllAsRead: async (userId: string): Promise<NotificationResponse> => {
    const response = await notificationApiClient.put(`/user/${userId}/read-all`);
    return response.data;
  },

  // 읽지 않은 알림 개수 조회
  getUnreadCount: async (userId: string): Promise<{ count: number }> => {
    const response = await notificationApiClient.get(`/user/${userId}/unread-count`);
    return response.data.data;
  },

  // 알림 삭제
  deleteNotification: async (notificationId: string): Promise<{ success: boolean; message: string }> => {
    const response = await notificationApiClient.delete(`/${notificationId}`);
    return response.data;
  },
};

// 헬스 체크
export const healthAPI = {
  checkHealth: async () => {
    const config = getApiConfig();
    const response = await axios.get(`${config.baseURL}/health`);
    return response.data;
  }
};

// API Gateway용 통합 API (팀원이 설정한 API Gateway 사용)
export const apiGatewayAPI = {
  // 게시판 관련 API
  board: {
    // 게시글 목록 조회
    getPosts: async (category: string = 'all', page: number = 1, limit: number = 20, search?: string): Promise<PaginationResponse> => {
      const response = await apiClient.get('/api/board/posts', {
        params: { category, page, limit, search }
      });
      return response.data;
    },

    // 게시글 상세 조회
    getPostById: async (id: string): Promise<Post> => {
      const response = await apiClient.get(`/api/board/posts/${id}`);
      return response.data;
    },

    // 게시글 작성
    createPost: async (postData: CreatePostRequest): Promise<Post> => {
      const response = await apiClient.post('/api/board/posts', postData);
      return response.data;
    },

    // 게시글 수정
    updatePost: async (id: string, updateData: UpdatePostRequest): Promise<Post> => {
      const response = await apiClient.put(`/api/board/posts/${id}`, updateData);
      return response.data;
    },

    // 게시글 삭제
    deletePost: async (id: string, authorId: string): Promise<void> => {
      await apiClient.delete(`/api/board/posts/${id}`, { 
        data: { authorId } 
      });
    },

    // 댓글 목록 조회
    getComments: async (postId: string): Promise<Comment[]> => {
      const response = await apiClient.get(`/api/board/posts/${postId}/comments`);
      return response.data;
    },

    // 댓글 작성
    createComment: async (postId: string, commentData: CreateCommentRequest): Promise<Comment> => {
      const response = await apiClient.post(`/api/board/posts/${postId}/comments`, commentData);
      return response.data;
    },

    // 댓글 수정
    updateComment: async (postId: string, commentId: string, updateData: CreateCommentRequest): Promise<Comment> => {
      const response = await apiClient.put(`/api/board/posts/${postId}/comments/${commentId}`, updateData);
      return response.data;
    },

    // 댓글 삭제
    deleteComment: async (postId: string, commentId: string, authorId: string): Promise<void> => {
      await apiClient.delete(`/api/board/posts/${postId}/comments/${commentId}`, { 
        data: { authorId } 
      });
    },

    // 좋아요 토글
    toggleLike: async (postId: string, userId: string): Promise<{ success: boolean; message: string }> => {
      const response = await apiClient.post(`/api/board/posts/${postId}/like`, { userId });
      return response.data;
    }
  },

  // 스터디 그룹 관련 API
  studyGroups: {
    // 스터디 그룹 목록 조회
    getStudyGroups: async (category: string = 'all', page: number = 1, limit: number = 20): Promise<{ groups: StudyGroup[], total: number, totalPages: number }> => {
      const response = await apiClient.get('/study-groups', {
        params: { category, page, limit }
      });
      return response.data;
    },

    // 스터디 그룹 상세 조회
    getStudyGroupById: async (id: string): Promise<StudyGroup> => {
      const response = await apiClient.get(`/study-groups/${id}`);
      return response.data;
    },

    // 스터디 그룹 생성
    createStudyGroup: async (groupData: CreateStudyGroupRequest): Promise<StudyGroup> => {
      const response = await apiClient.post('/study-groups', groupData);
      return response.data;
    },

    // 스터디 그룹 수정
    updateStudyGroup: async (id: string, updateData: UpdateStudyGroupRequest): Promise<StudyGroup> => {
      const response = await apiClient.put(`/study-groups/${id}`, updateData);
      return response.data;
    },

    // 스터디 그룹 삭제
    deleteStudyGroup: async (id: string): Promise<{ success: boolean; message: string }> => {
      const response = await apiClient.delete(`/study-groups/${id}`);
      return response.data;
    },

    // 스터디 그룹 가입
    joinStudyGroup: async (groupId: string, joinData: JoinRequest): Promise<JoinResult> => {
      const response = await apiClient.post(`/study-groups/${groupId}/join`, joinData);
      return response.data;
    },

    // 스터디 그룹 탈퇴
    leaveStudyGroup: async (groupId: string, userId: string): Promise<JoinResult> => {
      const response = await apiClient.post(`/study-groups/${groupId}/leave`, { userId });
      return response.data;
    }
  },

  // 알림 관련 API
  notifications: {
    // 사용자별 알림 조회
    getNotificationsByUser: async (userId: string, filters?: {
      type?: string;
      isRead?: boolean;
      limit?: number;
      offset?: number;
    }): Promise<any> => {
      const params = new URLSearchParams();
      if (filters?.type) params.append('type', filters.type);
      if (filters?.isRead !== undefined) params.append('isRead', filters.isRead.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());
      if (filters?.offset) params.append('offset', filters.offset.toString());
      
      const response = await apiClient.get(`/notifications/user/${userId}?${params.toString()}`);
      return response.data;
    },

    // 읽지 않은 알림 개수 조회
    getUnreadCount: async (userId: string): Promise<{ count: number }> => {
      const response = await apiClient.get(`/notifications/user/${userId}/unread-count`);
      return response.data.data;
    },

    // 알림 읽음 처리
    markAsRead: async (notificationId: string): Promise<any> => {
      const response = await apiClient.put(`/notifications/${notificationId}/read`);
      return response.data;
    }
  },

  // 취업뉴스 관련 API
  jobsNews: {
    // 취업뉴스 목록 조회
    getJobsNews: async (page: number = 1, limit: number = 20): Promise<any> => {
      const response = await apiClient.get('/jobs-news', {
        params: { page, limit }
      });
      return response.data;
    }
  },

  // AI 포트폴리오 관련 API
  portfolio: {
    // 포트폴리오 피드백 요청
    getFeedback: async (text: string): Promise<any> => {
      const response = await apiClient.post('/portfolio', { text });
      return response.data;
    }
  },

  // 자격증 검색 관련 API
  search: {
    // 자격증 검색
    searchCertificates: async (query: string): Promise<any> => {
      const response = await apiClient.get('/search', {
        params: { q: query }
      });
      return response.data;
    },

    // 자격증 자동완성
    getAutocomplete: async (query: string): Promise<string[]> => {
      const response = await apiClient.get('/autocomplete', {
        params: { q: query }
      });
      return response.data;
    }
  }
};

export default apiClient;

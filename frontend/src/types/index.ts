// types/index.ts
export type BoardKey = "notice" | "free" | "jobs" | "reviews" | "counsel";

export const BOARD_LIST: { key: BoardKey; label: string }[] = [
  { key: "notice", label: "공지사항" },
  { key: "free", label: "자유게시판" },
  { key: "jobs", label: "채용공고 게시판" },
  { key: "reviews", label: "취업 후기·면접" },
  { key: "counsel", label: "진로 상담" },
];

export interface Post {
  id: string;
  title: string;
  content: string;
  author: string;
  authorId?: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  isHot: boolean;
  createdAt: string;
  updatedAt: string;
  category_name?: string;
  comments?: Comment[];
}

export interface Comment {
  id: number;
  author: string;
  text: string;
  time: string;
  authorId?: string;
}

export interface CreatePostRequest {
  title: string;
  content: string;
  author: string;
  authorId: string;
  category: string;
}

export interface UpdatePostRequest {
  title?: string;
  content?: string;
  category?: string;
}

export interface CreateCommentRequest {
  author: string;
  text: string;
  authorId: string;
}

export interface PaginationResponse {
  posts: Post[];
  total: number;
  totalPages: number;
  currentPage: number;
}

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface JobNews {
  id: string;
  title: string;
  content: string;
  link: string;
  publishedAt: string;
  source: string;
}

export interface PortfolioFeedback {
  id: string;
  content: string;
  feedback: {
    structure: string;
    content: string;
    language: string;
    suggestions: string[];
  };
  createdAt: string;
}

export interface CreatePortfolioRequest {
  content: string;
}

export interface Study {
  id: number;
  title: string;
  location: string;
  type: string;
  members: string;
  date: string;
  tags: string[];
}

// 스터디 그룹 관련 타입들
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
  location?: string; // 스터디 장소 (온라인/오프라인)
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
  status: 'attending' | 'not_attending';
  updatedAt: string;
}

export interface UpdateAttendanceRequest {
  userId: string;
  userName: string;
  status: 'attending' | 'not_attending';
}

export interface CreateStudyGroupRequest {
  name: string;
  description: string;
  category: string;
  maxMembers: number;
  leader: string;
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

// 스터디 그룹 카테고리
export const STUDY_GROUP_CATEGORIES = [
  '프로그래밍',
  '자격증',
  '언어',
  '취업준비',
  '프로젝트',
  '기타'
] as const;

export type StudyGroupCategory = typeof STUDY_GROUP_CATEGORIES[number];
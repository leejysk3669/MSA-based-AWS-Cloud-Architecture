import React, { useState, useEffect } from 'react';
import { User, FileText, MessageCircle, Users, Calendar, Eye, Heart, MessageSquare, AlertTriangle } from 'lucide-react';
import { postAPI, commentAPI, studyGroupAPI, Post as ApiPost } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { getUserDisplayName } from '../utils/userDisplayName';
import DeleteAccountModal from './DeleteAccountModal';
import EditAccountModal from './EditAccountModal';

interface MyPageProps {
  userId: string;
  onNavigate: (url: string) => void;
}

type TabType = 'posts' | 'comments' | 'studyGroups' | 'participatingGroups';

// Post 타입은 api.ts에서 import한 ApiPost 사용

interface Comment {
  id: string;
  post_id: string;
  content: string;
  author: string;
  author_id: string;
  created_at: string;
  updated_at: string;
  post_title: string;
  category_name: string;
}

interface StudyGroup {
  id: string;
  name: string;
  description: string;
  category: string;
  leader: string;
  maxMembers: number;
  currentMembers: number;
  members: any[];
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

const MyPage: React.FC<MyPageProps> = ({ userId, onNavigate }) => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('posts');
  const [posts, setPosts] = useState<ApiPost[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [studyGroups, setStudyGroups] = useState<StudyGroup[]>([]);
  const [participatingGroups, setParticipatingGroups] = useState<StudyGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [postsPagination, setPostsPagination] = useState<any>(null);
  const [commentsPagination, setCommentsPagination] = useState<any>(null);
  const [studyGroupsPagination, setStudyGroupsPagination] = useState<any>(null);
  const [participatingGroupsPagination, setParticipatingGroupsPagination] = useState<any>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // 데이터 로드 함수들
  const loadPosts = async (page: number = 1) => {
    try {
      setLoading(true);
      // 기존 게시글 API를 사용하여 모든 게시글을 가져온 후 클라이언트에서 필터링
      const response = await postAPI.getPosts('all', page, 50);
      const userPosts = response.posts.filter((post: any) => post.authorId === userId);
      setPosts(userPosts);
      setPostsPagination({
        currentPage: page,
        totalPages: Math.ceil(userPosts.length / 10),
        totalPosts: userPosts.length,
        hasNext: userPosts.length > 10,
        hasPrev: page > 1
      });
    } catch (error) {
      console.error('게시글 로드 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadComments = async (page: number = 1) => {
    try {
      setLoading(true);
      // 모든 게시글을 가져와서 각 게시글의 댓글을 확인
      const response = await postAPI.getPosts('all', 1, 100);
      const allComments: any[] = [];
      
      for (const post of response.posts) {
        try {
          const comments = await commentAPI.getComments(post.id);
          const userComments = comments.filter((comment: any) => comment.author_id === userId);
          allComments.push(...userComments.map((comment: any) => ({
            ...comment,
            post_title: post.title,
            category_name: post.category_name
          })));
        } catch (error) {
          console.error(`댓글 조회 오류 (게시글 ${post.id}):`, error);
        }
      }
      
      setComments(allComments);
      setCommentsPagination({
        currentPage: page,
        totalPages: Math.ceil(allComments.length / 10),
        totalComments: allComments.length,
        hasNext: allComments.length > 10,
        hasPrev: page > 1
      });
    } catch (error) {
      console.error('댓글 로드 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStudyGroups = async (page: number = 1) => {
    try {
      setLoading(true);
      console.log('🔍 내가 만든 스터디 그룹 로드 시작:', { userId, page });
      const response = await studyGroupAPI.getUserStudyGroups(userId, page, 10);
      console.log('✅ 내가 만든 스터디 그룹 로드 성공:', response);
      
      // 활성 상태인 그룹만 필터링 (백엔드에서 이미 필터링되지만 추가 안전장치)
      const activeGroups = response.groups.filter(group => group.isActive !== false);
      console.log('🔍 활성 그룹만 필터링:', activeGroups);
      
      setStudyGroups(activeGroups);
      setStudyGroupsPagination(response.pagination);
    } catch (error: any) {
      console.error('❌ 스터디 그룹 로드 오류:', error);
      console.error('에러 상세 정보:', {
        message: error?.message,
        response: error?.response?.data,
        status: error?.response?.status
      });
    } finally {
      setLoading(false);
    }
  };

  const loadParticipatingGroups = async (page: number = 1) => {
    try {
      setLoading(true);
      console.log('🔍 내가 참여한 스터디 그룹 로드 시작:', { userId, page });
      const response = await studyGroupAPI.getUserParticipatingGroups(userId, page, 10);
      console.log('✅ 내가 참여한 스터디 그룹 로드 성공:', response);
      
      // 활성 상태인 그룹만 필터링 (백엔드에서 이미 필터링되지만 추가 안전장치)
      const activeGroups = response.groups.filter(group => group.isActive !== false);
      console.log('🔍 활성 그룹만 필터링:', activeGroups);
      
      setParticipatingGroups(activeGroups);
      setParticipatingGroupsPagination(response.pagination);
    } catch (error: any) {
      console.error('❌ 참여 스터디 그룹 로드 오류:', error);
      console.error('에러 상세 정보:', {
        message: error?.message,
        response: error?.response?.data,
        status: error?.response?.status
      });
    } finally {
      setLoading(false);
    }
  };

  // 탭 변경 시 데이터 로드
  useEffect(() => {
    switch (activeTab) {
      case 'posts':
        loadPosts();
        break;
      case 'comments':
        loadComments();
        break;
              case 'studyGroups':
          loadStudyGroups();
          break;
        case 'participatingGroups':
          loadParticipatingGroups();
          break;
    }
  }, [activeTab, userId]);

  // 게시글 클릭 핸들러
  const handlePostClick = (post: ApiPost) => {
    onNavigate(`/board/posts/${post.id}?category=${encodeURIComponent(post.category_name || post.category || '')}`);
  };

  // 댓글 클릭 핸들러
  const handleCommentClick = (comment: Comment) => {
    onNavigate(`/board/posts/${comment.post_id}?category=${encodeURIComponent(comment.category_name)}`);
  };

  // 스터디 그룹 클릭 핸들러
  const handleStudyGroupClick = (groupId: string) => {
    onNavigate(`/study-groups/${groupId}`);
  };

  // 시간 포맷팅 함수
  const formatDate = (dateString: string) => {
    if (!dateString) return '날짜 없음';
    
    // MySQL datetime 형식 (YYYY-MM-DD HH:mm:ss)을 처리
    let date: Date;
    if (dateString.includes('T')) {
      // ISO 형식인 경우
      date = new Date(dateString);
    } else {
      // MySQL datetime 형식인 경우 (YYYY-MM-DD HH:mm:ss)
      date = new Date(dateString.replace(' ', 'T'));
    }
    
    // 유효하지 않은 날짜인 경우
    if (isNaN(date.getTime())) {
      console.error('Invalid date string:', dateString);
      return '날짜 오류';
    }
    
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return `${diffInSeconds}초 전`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}분 전`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}시간 전`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}일 전`;
    
    return date.toLocaleDateString('ko-KR');
  };

  // 페이지네이션 핸들러
  const handlePageChange = (tab: TabType, page: number) => {
    switch (tab) {
      case 'posts':
        loadPosts(page);
        break;
      case 'comments':
        loadComments(page);
        break;
              case 'studyGroups':
          loadStudyGroups(page);
          break;
        case 'participatingGroups':
          loadParticipatingGroups(page);
          break;
    }
  };

  // 탈퇴 성공 핸들러
  const handleDeleteSuccess = () => {
    logout();
    onNavigate('/');
  };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6">
      {/* 헤더 */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            마이페이지
          </h1>
          <p className="text-gray-600">
            {user?.groups?.includes('admin') ? '👑 관리자' : 
             `👤 ${getUserDisplayName(user)}`}님의 활동 내역입니다.
          </p>
        </div>
        
        {/* 계정 관리 버튼들 */}
        <div className="flex gap-3">
          <button
            onClick={() => setShowEditModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-600/80 transition-colors"
          >
            <User size={16} />
            <span className="text-sm font-medium">계정 수정</span>
          </button>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <AlertTriangle size={16} />
            <span className="text-sm font-medium">계정 탈퇴</span>
          </button>
        </div>
      </div>

      {/* 탭 네비게이션 */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('posts')}
            className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
              activeTab === 'posts'
                ? 'border-sky-500 text-sky-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <FileText size={16} />
            내가 쓴 게시글
          </button>
          <button
            onClick={() => setActiveTab('comments')}
            className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
              activeTab === 'comments'
                ? 'border-sky-500 text-sky-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <MessageCircle size={16} />
            내가 쓴 댓글
          </button>
          <button
            onClick={() => setActiveTab('studyGroups')}
            className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
              activeTab === 'studyGroups'
                ? 'border-sky-500 text-sky-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Users size={16} />
            내가 만든 스터디
          </button>
          <button
            onClick={() => setActiveTab('participatingGroups')}
            className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
              activeTab === 'participatingGroups'
                ? 'border-sky-500 text-sky-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Users size={16} />
            내가 참여한 스터디
          </button>
        </nav>
      </div>

      {/* 로딩 상태 */}
      {loading && (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500"></div>
        </div>
      )}

      {/* 탭 컨텐츠 */}
      {!loading && (
        <div className="space-y-6">
          {/* 내가 쓴 게시글 */}
          {activeTab === 'posts' && (
            <div>
              {posts.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileText size={48} className="mx-auto mb-4 text-gray-300" />
                  <p>아직 작성한 게시글이 없습니다.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {posts.map((post) => (
                                         <div
                       key={post.id}
                       onClick={() => handlePostClick(post)}
                       className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                     >
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-gray-900 line-clamp-2 flex-1">
                          {post.title}
                        </h3>
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded ml-2">
                          {post.category_name || post.category || '기타'}
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm line-clamp-2 mb-3">
                        {post.content}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar size={12} />
                          {formatDate(post.createdAt)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye size={12} />
                          {post.viewCount}
                        </span>
                        <span className="flex items-center gap-1">
                          <Heart size={12} />
                          {post.likeCount}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageSquare size={12} />
                          {post.commentCount}
                        </span>
                      </div>
                    </div>
                  ))}
                  
                  {/* 페이지네이션 */}
                  {postsPagination && postsPagination.totalPages > 1 && (
                    <div className="flex justify-center gap-2 mt-6">
                      {postsPagination.hasPrev && (
                        <button
                          onClick={() => handlePageChange('posts', postsPagination.currentPage - 1)}
                          className="px-3 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50"
                        >
                          이전
                        </button>
                      )}
                      <span className="px-3 py-2 text-sm text-gray-600">
                        {postsPagination.currentPage} / {postsPagination.totalPages}
                      </span>
                      {postsPagination.hasNext && (
                        <button
                          onClick={() => handlePageChange('posts', postsPagination.currentPage + 1)}
                          className="px-3 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50"
                        >
                          다음
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 내가 쓴 댓글 */}
          {activeTab === 'comments' && (
            <div>
              {comments.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <MessageCircle size={48} className="mx-auto mb-4 text-gray-300" />
                  <p>아직 작성한 댓글이 없습니다.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {comments.map((comment) => (
                                         <div
                       key={comment.id}
                       onClick={() => handleCommentClick(comment)}
                       className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                     >
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-gray-900 line-clamp-1 flex-1">
                          {comment.post_title}
                        </h3>
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded ml-2">
                          {comment.category_name}
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm line-clamp-3 mb-3">
                        {comment.content}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar size={12} />
                          {formatDate(comment.created_at)}
                        </span>
                      </div>
                    </div>
                  ))}
                  
                  {/* 페이지네이션 */}
                  {commentsPagination && commentsPagination.totalPages > 1 && (
                    <div className="flex justify-center gap-2 mt-6">
                      {commentsPagination.hasPrev && (
                        <button
                          onClick={() => handlePageChange('comments', commentsPagination.currentPage - 1)}
                          className="px-3 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50"
                        >
                          이전
                        </button>
                      )}
                      <span className="px-3 py-2 text-sm text-gray-600">
                        {commentsPagination.currentPage} / {commentsPagination.totalPages}
                      </span>
                      {commentsPagination.hasNext && (
                        <button
                          onClick={() => handlePageChange('comments', commentsPagination.currentPage + 1)}
                          className="px-3 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50"
                        >
                          다음
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 내가 만든 스터디 */}
          {activeTab === 'studyGroups' && (
            <div>
              {studyGroups.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Users size={48} className="mx-auto mb-4 text-gray-300" />
                  <p>아직 만든 스터디 그룹이 없습니다.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {studyGroups.map((group) => (
                    <div
                      key={group.id}
                      onClick={() => handleStudyGroupClick(group.id)}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-gray-900 line-clamp-1 flex-1">
                          {group.name}
                        </h3>
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded ml-2">
                          {group.category}
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm line-clamp-2 mb-3">
                        {group.description}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Users size={12} />
                          {group.currentMembers}/{group.maxMembers}명
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar size={12} />
                          {formatDate(group.createdAt)}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded ${
                          group.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {group.isActive ? '활성' : '비활성'}
                        </span>
                      </div>
                    </div>
                  ))}
                  
                  {/* 페이지네이션 */}
                  {studyGroupsPagination && studyGroupsPagination.totalPages > 1 && (
                    <div className="flex justify-center gap-2 mt-6">
                      {studyGroupsPagination.hasPrev && (
                        <button
                          onClick={() => handlePageChange('studyGroups', studyGroupsPagination.currentPage - 1)}
                          className="px-3 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50"
                        >
                          이전
                        </button>
                      )}
                      <span className="px-3 py-2 text-sm text-gray-600">
                        {studyGroupsPagination.currentPage} / {studyGroupsPagination.totalPages}
                      </span>
                      {studyGroupsPagination.hasNext && (
                        <button
                          onClick={() => handlePageChange('studyGroups', studyGroupsPagination.currentPage + 1)}
                          className="px-3 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50"
                        >
                          다음
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 내가 참여한 스터디 */}
          {activeTab === 'participatingGroups' && (
            <div>
              {participatingGroups.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Users size={48} className="mx-auto mb-4 text-gray-300" />
                  <p>아직 참여한 스터디 그룹이 없습니다.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {participatingGroups.map((group) => (
                    <div
                      key={group.id}
                      onClick={() => handleStudyGroupClick(group.id)}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-gray-900 line-clamp-1 flex-1">
                          {group.name}
                        </h3>
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded ml-2">
                          {group.category}
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm line-clamp-2 mb-3">
                        {group.description}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Users size={12} />
                          {group.currentMembers}/{group.maxMembers}명
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar size={12} />
                          {formatDate(group.createdAt)}
                        </span>
                        <span className="text-xs text-sky-600 bg-blue-50 px-2 py-1 rounded">
                          멤버
                        </span>
                      </div>
                    </div>
                  ))}
                  
                  {/* 페이지네이션 */}
                  {participatingGroupsPagination && participatingGroupsPagination.totalPages > 1 && (
                    <div className="flex justify-center gap-2 mt-6">
                      {participatingGroupsPagination.hasPrev && (
                        <button
                          onClick={() => handlePageChange('participatingGroups', participatingGroupsPagination.currentPage - 1)}
                          className="px-3 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50"
                        >
                          이전
                        </button>
                      )}
                      <span className="px-3 py-2 text-sm text-gray-600">
                        {participatingGroupsPagination.currentPage} / {participatingGroupsPagination.totalPages}
                      </span>
                      {participatingGroupsPagination.hasNext && (
                        <button
                          onClick={() => handlePageChange('participatingGroups', participatingGroupsPagination.currentPage + 1)}
                          className="px-3 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50"
                        >
                          다음
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 계정 수정 모달 */}
      <EditAccountModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSuccess={() => {
          setShowEditModal(false);
          // 필요시 사용자 정보 새로고침
        }}
      />

      {/* 탈퇴 모달 */}
      <DeleteAccountModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onSuccess={handleDeleteSuccess}
      />
    </div>
  );
};

export default MyPage;

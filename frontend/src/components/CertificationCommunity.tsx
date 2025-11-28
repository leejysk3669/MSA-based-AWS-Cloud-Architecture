import { useEffect, useState, useMemo } from "react";
import {
  ChevronDown,
  Search,
  Bell,
  User,
  Plus,
  Eye,
  MessageCircle,
  Calendar,
  MapPin,
  Users,
  Heart,
  ChevronLeft,
  Menu,
  X,
  FolderOpen,
  CheckCircle,
  HelpCircle,
} from "lucide-react";
import { getUserDisplayName, getPostAuthorDisplayName } from '../utils/userDisplayName';
import { UserDisplayWithIcon } from './UserDisplayWithIcon';
import { postAPI, categoryAPI, commentAPI, likeAPI, studyGroupAPI, jobsNewsAPI, Post, Category, JobNewsItem, Comment } from '../services/api';
import { notificationService } from '../services/notificationService';
import CommentEditModal from './CommentEditModal';
import CertificateSearch from './CertificateSearch';
import StudyGroupList from './StudyGroupList';
import StudyGroupDetail from './StudyGroupDetail';
import NotificationDropdown from './NotificationDropdown';
import NotificationPermission from './NotificationPermission';
import AIPortfolioFeedback from './AIPortfolioFeedback';
import AboutPage from './AboutPage';
import JobNews from './JobNews';
import MyPage from './MyPage';
import { useAuth } from '../contexts/AuthContext';
import LoginModal from './auth/LoginModal';
import RegisterModal from './auth/RegisterModal';
import { isAdmin } from '../config/cognito';

// Global CSS for the marquee animation
const marqueeStyle = `
  @keyframes marquee-v-posts {
    0% { transform: translateY(0); }
    100% { transform: translateY(-50%); }
  }
  
  .animate-marquee-v-posts {
    animation: marquee-v-posts 15s linear infinite;
  }
  
  .animate-marquee-v-posts:hover {
    animation-play-state: paused;
  }
`;

// 게시판(드롭다운) 카테고리
type BoardKey = "notice" | "free" | "jobs" | "reviews" | "counsel";

// 카테고리명을 게시판 키로 변환하는 함수
const getBoardKeyFromCategory = (category: string): BoardKey | null => {
  switch (category) {
    case '공지사항':
      return 'notice';
    case '자유게시판':
      return 'free';
    case '채용공고':
      return 'jobs';
    case '취업후기':
      return 'reviews';
    case '진로상담':
      return 'counsel';
    default:
      return null;
  }
};







const BOARD_LIST: { key: BoardKey; label: string }[] = [
  { key: "notice", label: "공지사항" },
  { key: "free", label: "자유게시판" },
  { key: "jobs", label: "채용공고 게시판" },
  { key: "reviews", label: "취업 후기·면접" },
  { key: "counsel", label: "진로 상담" },
];

/* =========================
 메인 컴포넌트
 ========================= */
const CertificationCommunity = () => {
  // URL에서 초기 게시판 상태를 읽어오는 함수
  const getInitialBoard = () => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const boardFromUrl = urlParams.get('board') as BoardKey;
      return boardFromUrl && BOARD_LIST.find(b => b.key === boardFromUrl) ? boardFromUrl : "notice";
    }
    return "notice";
  };

  const [activeBoard, setActiveBoard] = useState<BoardKey>(getInitialBoard());
  const [showStudyModal, setShowStudyModal] = useState(false);
  // URL에서 초기 페이지 상태를 읽어오는 함수
  const getInitialPage = (): "home" | "board" | "portfolio" | "study" | "jobsNews" | "readPost" | "aiSearch" | "searchResults" | "unifiedSearchResults" => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const pageFromUrl = urlParams.get('page') as string;
      const boardFromUrl = urlParams.get('board') as string;
      const validPages = ["home", "board", "portfolio", "study", "jobsNews", "readPost", "aiSearch", "searchResults", "unifiedSearchResults"] as const;
      
      console.log('getInitialPage 호출:', { pageFromUrl, boardFromUrl });
      
      // board 파라미터가 있으면 board 페이지로 설정
      if (boardFromUrl && !pageFromUrl) {
        console.log('board 파라미터가 있으므로 board 페이지로 설정');
        return "board";
      }
      
      const initialPage = validPages.includes(pageFromUrl as any) ? pageFromUrl as any : "home";
      console.log('최종 initialPage:', initialPage);
      
      // 홈페이지인데 URL에 페이지 정보가 없으면 URL에 추가
      if (initialPage === "home" && !pageFromUrl) {
        const url = new URL(window.location.href);
        url.searchParams.set('page', 'home');
        window.history.replaceState({}, '', url.toString());
      }
      
      return initialPage;
    }
    return "home";
  };

  const [currentPage, setCurrentPage] = useState<
    "home" | "board" | "portfolio" | "study" | "jobsNews" | "readPost" | "aiSearch" | "searchResults" | "unifiedSearchResults" | "myPage" | "about"
  >(getInitialPage());
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  
  // 뉴스 데이터를 메인 컴포넌트에서 관리
  const [jobNewsItems, setJobNewsItems] = useState<JobNewsItem[]>([]);
  const [jobNewsLoading, setJobNewsLoading] = useState(false);
  const [jobNewsLoaded, setJobNewsLoaded] = useState(false);
  const [showHotPostsRolling, setShowHotPostsRolling] = useState(false);
  const [showWriteModal, setShowWriteModal] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [newPost, setNewPost] = useState({ title: '', content: '' });
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  // Cognito 인증 사용
  const { user, isAuthenticated, login, logout } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [selectedStudyGroupId, setSelectedStudyGroupId] = useState<string | null>(null);
  
  // 관리자 권한 상태
  const [adminStatus, setAdminStatus] = useState(false);
  
  // 스터디 그룹 데이터 상태
  const [studyGroups, setStudyGroups] = useState<any[]>([]);
  const [studyGroupsLoading, setStudyGroupsLoading] = useState(false);


  // API에서 가져온 게시글 데이터
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  
  // 게시판별 검색어 관리
  const [searchTerms, setSearchTerms] = useState<{ [key in BoardKey]: string }>({
    notice: '',
    free: '',
    jobs: '',
    reviews: '',
    counsel: ''
  });
  
  // 현재 검색어 (현재 활성 게시판의 검색어)
  const searchTerm = searchTerms[activeBoard];
  
  // 검색 결과 관련 상태
  const [searchResults, setSearchResults] = useState<Post[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // 통합검색 관련 상태
  const [unifiedSearchTerm, setUnifiedSearchTerm] = useState('');
  const [unifiedSearchResults, setUnifiedSearchResults] = useState<Post[]>([]);
  const [unifiedSearchLoading, setUnifiedSearchLoading] = useState(false);
  const [lastUnifiedSearchTerm, setLastUnifiedSearchTerm] = useState(''); // 실제 검색에 사용된 검색어

  // 페이지네이션 상태
  const [currentPageNum, setCurrentPageNum] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPosts, setTotalPosts] = useState(0);
  const [postsPerPage] = useState(10);

  // 게시글 수정 모달 상태
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);

  // 댓글 수정 모달 상태
  const [showCommentEditModal, setShowCommentEditModal] = useState(false);
  const [editCommentLoading, setEditCommentLoading] = useState(false);
  const [editingComment, setEditingComment] = useState<any>(null);

  // 게시글 수정 함수
  const handleEditPost = (post: Post) => {
    setEditTitle(post.title);
    setEditContent(post.content);
    setEditingPost(post);
    setShowEditModal(true);
  };

    // 게시글 수정 제출
  const handleEditSubmit = async () => {
    if (!editTitle.trim() || !editContent.trim() || !editingPost) {
      alert('제목과 내용을 입력해주세요.');
      return;
    }

    try {
      setEditLoading(true);

      const updatedPost = await postAPI.updatePost(editingPost.id, {
        title: editTitle.trim(),
        content: editContent.trim(),
        authorId: user?.sub || editingPost.authorId
      });

      // 게시글 정보 업데이트
      if (selectedPost && selectedPost.id === editingPost.id) {
        Object.assign(selectedPost, updatedPost);
      }
      
      // 게시글 목록도 업데이트
      setPosts(prevPosts => 
        prevPosts.map(post => 
          post.id === editingPost.id ? { ...post, ...updatedPost } : post
        )
      );
      
      // 검색 결과도 업데이트 (검색 결과 페이지에 있는 경우)
      setSearchResults(prevResults => 
        prevResults.map(post => 
          post.id === editingPost.id ? { ...post, ...updatedPost } : post
        )
      );
    
      setShowEditModal(false);
      setEditingPost(null);
      alert('게시글이 수정되었습니다.');
    } catch (error: any) {
      console.error('게시글 수정 오류:', error);
      alert(error.response?.data?.error || '게시글 수정에 실패했습니다.');
    } finally {
      setEditLoading(false);
    }
  };

  // 댓글 수정 함수
  const handleEditComment = (comment: any) => {
    setEditingComment(comment);
    setShowCommentEditModal(true);
  };

  // 댓글 수정 제출
  const handleCommentEditSubmit = async (content: string) => {
    if (!editingComment) {
      alert('수정할 댓글을 찾을 수 없습니다.');
      return;
    }

    try {
      setEditCommentLoading(true);

      console.log('댓글 수정 요청:', {
        commentId: editingComment.id,
        content,
        authorId: user?.sub || editingComment.author_id || '',
        userSub: user?.sub,
        commentAuthorId: editingComment.author_id
      });

      await commentAPI.updateComment(editingComment.id, content, user?.sub || editingComment.author_id || '');

      setShowCommentEditModal(false);
      setEditingComment(null);
      alert('댓글이 수정되었습니다.');
      
      // 페이지 새로고침으로 댓글 목록 업데이트 (임시 해결책)
      window.location.reload();
    } catch (error: any) {
      console.error('댓글 수정 오류:', error);
      alert(error.response?.data?.error || '댓글 수정에 실패했습니다.');
    } finally {
      setEditCommentLoading(false);
    }
  };

  // API에서 게시글 데이터 가져오기
  const fetchPosts = async (page: number = 1) => {
    try {
      setLoading(true);
      // 카테고리 매핑
      const categoryMapping: { [key: string]: string } = {
        'notice': '공지사항',
        'free': '자유게시판', 
        'jobs': '채용공고',
        'reviews': '취업후기',
        'counsel': '진로상담'
      };
      const category = categoryMapping[activeBoard] || '';
      
      console.log('fetchPosts 호출:', {
        category,
        searchTerm,
        activeBoard,
        page
      });
      
      const response = await postAPI.getPosts(category, page, postsPerPage, searchTerm);
      console.log('API 응답 데이터:', response);
      
      // 페이지네이션 정보가 포함된 응답인지 확인
      if (response && typeof response === 'object' && 'posts' in response && 'pagination' in response) {
        setPosts(response.posts);
        setTotalPages(response.pagination.totalPages);
        setTotalPosts(response.pagination.total);
        setCurrentPageNum(response.pagination.page);
      } else {
        // 기존 형식 (배열)인 경우
        const postsArray = Array.isArray(response) ? response : [];
        setPosts(postsArray);
        setTotalPages(1);
        setTotalPosts(postsArray.length);
        setCurrentPageNum(1);
      }
      
      setError('');
    } catch (err) {
      setError('게시글을 불러오는데 실패했습니다.');
      console.error('게시글 조회 오류:', err);
    } finally {
      setLoading(false);
    }
  };

  // 페이지 변경 함수
  const handlePageChange = (page: number) => {
    setCurrentPageNum(page);
    fetchPosts(page);
    // URL에 페이지 정보 업데이트 (페이지네이션용)
    const url = new URL(window.location.href);
    url.searchParams.set('pageNum', page.toString());
    window.history.pushState({}, '', url.toString());
  };

  // 페이지네이션 그룹 계산 (5페이지씩 표시)
  const getPageNumbers = () => {
    const pagesPerGroup = 5;
    const currentGroup = Math.ceil(currentPageNum / pagesPerGroup);
    const startPage = (currentGroup - 1) * pagesPerGroup + 1;
    const endPage = Math.min(startPage + pagesPerGroup - 1, totalPages);
    
    return Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);
  };

  const pageNumbers = getPageNumbers();

  // 컴포넌트 마운트 시 게시글 데이터 가져오기
  useEffect(() => {
    console.log('activeBoard 변경됨:', activeBoard);
    fetchPosts(currentPageNum);
  }, [activeBoard]); // searchTerm 의존성 제거

  // 관리자 권한 확인
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (isAuthenticated) {
        try {
          const adminCheck = await isAdmin();
          setAdminStatus(adminCheck);
          console.log('관리자 권한 확인:', adminCheck);
        } catch (error) {
          console.error('관리자 권한 확인 오류:', error);
          setAdminStatus(false);
        }
      } else {
        setAdminStatus(false);
      }
    };

    checkAdminStatus();
  }, [isAuthenticated]);

  // 사용자 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (showUserDropdown && !target.closest('.user-dropdown')) {
        setShowUserDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserDropdown]);

  // 게시판 페이지로 이동할 때 게시글 로드
  useEffect(() => {
    console.log('currentPage 변경됨:', currentPage);
    if (currentPage === 'board') {
      console.log('게시판 페이지로 이동, 게시글 로드 시작');
      fetchPosts(currentPageNum);
    }
  }, [currentPage, activeBoard]);

  // 홈 페이지로 이동할 때 게시글 로드
  useEffect(() => {
    if (currentPage === 'home') {
      console.log('홈 페이지로 이동, 게시글 로드 시작');
      // 홈 페이지에서는 모든 게시글을 가져오기 위해 'all' 카테고리 사용
      const fetchAllPosts = async () => {
        try {
          setLoading(true);
          console.log('홈 페이지 게시글 API 호출 시작');
          const response = await postAPI.getPosts('all', 1, 50, '');
          console.log('홈 페이지 게시글 API 응답:', response);
          if (response && typeof response === 'object' && 'posts' in response && 'pagination' in response) {
            setPosts(response.posts);
            console.log('홈 페이지 게시글 설정 완료 (pagination 형식):', response.posts.length);
          } else {
            const postsArray = Array.isArray(response) ? response : [];
            setPosts(postsArray);
            console.log('홈 페이지 게시글 설정 완료 (배열 형식):', postsArray.length);
          }
          setError('');
        } catch (err) {
          setError('게시글을 불러오는데 실패했습니다.');
          console.error('홈 페이지 게시글 조회 오류:', err);
        } finally {
          setLoading(false);
          console.log('홈 페이지 게시글 로드 완료');
        }
      };
      fetchAllPosts();
    }
  }, [currentPage]);

  // 홈페이지 진입 시 뉴스 로드 (한 번만)
  useEffect(() => {
    if (currentPage === 'home' && !jobNewsLoaded) {
      const fetchJobNews = async () => {
        try {
          setJobNewsLoading(true);
          const response = await jobsNewsAPI.getJobNews();
          setJobNewsItems(response.items);
          setJobNewsLoaded(true);
        } catch (err) {
          console.error('취업뉴스 로딩 오류:', err);
        } finally {
          setJobNewsLoading(false);
        }
      };
      fetchJobNews();
    }
  }, [currentPage, jobNewsLoaded]);

  // 검색어 업데이트 함수
  const updateSearchTerm = (board: BoardKey, term: string) => {
    setSearchTerms(prev => ({
      ...prev,
      [board]: term
    }));
  };

  // 검색 실행 함수
  const executeSearch = async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setCurrentPage('board');
      return;
    }

    try {
      setSearchLoading(true);
      setCurrentPage('searchResults');
      
      // 카테고리 매핑
      const categoryMapping: { [key: string]: string } = {
        'notice': '공지사항',
        'free': '자유게시판', 
        'jobs': '채용공고',
        'reviews': '취업후기',
        'counsel': '진로상담'
      };
      const category = categoryMapping[activeBoard] || 'all';
      
      const data = await postAPI.getPosts(category, 1, 50, searchTerm);
      setSearchResults(data.posts);
    } catch (err) {
      console.error('검색 오류:', err);
      alert('검색 중 오류가 발생했습니다.');
    } finally {
      setSearchLoading(false);
    }
  };

  // 통합검색 실행 함수
  const executeUnifiedSearch = async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setCurrentPage('home');
      return;
    }

    try {
      setUnifiedSearchLoading(true);
      setCurrentPage('unifiedSearchResults');
      
      // 검색어를 별도로 저장 (실시간 변경 방지)
      setLastUnifiedSearchTerm(searchTerm);
      
      // URL에 통합검색 정보 저장
      const url = new URL(window.location.href);
      url.searchParams.delete('board');
      url.searchParams.delete('postId');
      url.searchParams.set('page', 'unifiedSearchResults');
      url.searchParams.set('search', searchTerm);
      window.history.pushState({}, '', url.toString());
      
      // 모든 게시판에서 검색
      const allCategories = ['공지사항', '자유게시판', '채용공고', '취업후기', '진로상담'];
      const searchPromises = allCategories.map(category => 
        postAPI.getPosts(category, 1, 50, searchTerm)
      );
      
      const results = await Promise.all(searchPromises);
      
      // 모든 결과를 하나로 합치고 게시판 정보 추가
      const allPosts = results.flatMap((result, index) => 
        result.posts.map(post => ({
          ...post,
          boardName: allCategories[index] // 게시판 이름 추가
        }))
      );
      
      setUnifiedSearchResults(allPosts);
    } catch (err) {
      console.error('통합검색 오류:', err);
      alert('통합검색 중 오류가 발생했습니다.');
    } finally {
      setUnifiedSearchLoading(false);
    }
  };

  // Cognito 인증 상태는 AuthContext에서 자동으로 관리됨

  // URL 상태 관리를 위한 useEffect 추가 (검색어와 게시글 상세 페이지 복원)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const searchFromUrl = urlParams.get('search') || '';
    const postIdFromUrl = urlParams.get('postId') as string;
    const boardFromUrl = urlParams.get('board') as BoardKey;
    const pageFromUrl = urlParams.get('page') as string;
    
    console.log('초기 URL 상태 복원:', { pageFromUrl, boardFromUrl, searchFromUrl, postIdFromUrl });
    
    // 게시판 상태 복원
    if (boardFromUrl && BOARD_LIST.find(b => b.key === boardFromUrl)) {
      setActiveBoard(boardFromUrl);
    }
    
    // 검색어 복원
    if (searchFromUrl) {
      updateSearchTerm(boardFromUrl || activeBoard, searchFromUrl);
    }
    
    // 게시글 상세 페이지 복원
    if (postIdFromUrl && pageFromUrl === 'readPost') {
      console.log('게시글 상세 페이지 복원 시작:', postIdFromUrl);
      setCurrentPage('readPost'); // 페이지 상태를 먼저 설정
      
      const fetchPostForURL = async () => {
        try {
          const post = await postAPI.getPostById(postIdFromUrl);
          setSelectedPost(post);
          console.log('게시글 상세 페이지 복원 완료:', post.title);
          
          // 게시글 데이터를 가져온 후 URL 설정 (새로고침 시 히스토리 유지)
          const url = new URL(window.location.href);
          if (url.searchParams.get('page') !== 'readPost' || url.searchParams.get('postId') !== postIdFromUrl) {
            url.searchParams.set('page', 'readPost');
            url.searchParams.set('postId', postIdFromUrl);
            if (boardFromUrl) url.searchParams.set('board', boardFromUrl);
            window.history.replaceState({}, '', url.toString());
          }
        } catch (err) {
          console.error('게시글 복원 실패:', err);
          setCurrentPage('board');
        }
      };
      fetchPostForURL();
    }
    
    // 통합검색 결과 복원
    if (pageFromUrl === 'unifiedSearchResults' && searchFromUrl) {
      setLastUnifiedSearchTerm(searchFromUrl);
      // 통합검색 결과는 새로고침 시 다시 검색하도록 처리
      executeUnifiedSearch(searchFromUrl);
    }
    
    // 초기 로드 완료 표시
    setIsInitialLoad(false);
  }, []);

  // URL 업데이트 함수
  const updateURL = (board?: BoardKey, search?: string, page?: string, postId?: string) => {
    const url = new URL(window.location.href);
    
    // 기존 파라미터들 제거
    url.searchParams.delete('board');
    url.searchParams.delete('search');
    url.searchParams.delete('page');
    url.searchParams.delete('postId');
    
    // 새로운 파라미터들 설정
    if (board) url.searchParams.set('board', board);
    if (search !== undefined) {
      if (search) {
        url.searchParams.set('search', search);
      }
    }
    if (page) url.searchParams.set('page', page);
    if (postId) url.searchParams.set('postId', postId);
    
    // 현재 URL과 다를 때만 히스토리에 추가
    const newURL = url.toString();
    if (newURL !== window.location.href) {
      window.history.pushState({}, '', newURL);
    }
  };

  // URL 업데이트 통합 로직
  useEffect(() => {
    // 초기 로드가 완료된 후에만 URL 업데이트
    if (!isInitialLoad) {
      if (currentPage === 'board') {
        updateURL(activeBoard, searchTerm, 'board');
      } else if (currentPage === 'readPost') {
        // 게시글 상세 페이지: selectedPost가 있으면 사용, 없으면 URL에서 postId 가져오기
        const urlParams = new URLSearchParams(window.location.search);
        const postIdFromUrl = urlParams.get('postId');
        const postId = selectedPost?.id || postIdFromUrl;
        
        if (postId) {
          updateURL(activeBoard, searchTerm, 'readPost', postId);
        }
      } else if (currentPage === 'home') {
        // 홈페이지로 돌아갈 때는 URL을 깔끔하게 정리
        const url = new URL(window.location.href);
        url.searchParams.delete('board');
        url.searchParams.delete('search');
        url.searchParams.delete('postId');
        url.searchParams.set('page', 'home');
        window.history.pushState({}, '', url.toString());
      } else {
        updateURL(undefined, undefined, currentPage);
      }
    }
  }, [currentPage, activeBoard, searchTerm, selectedPost, isInitialLoad]);

  // 브라우저 뒤로가기/앞으로가기 처리
  useEffect(() => {
    const handlePopState = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const boardFromUrl = urlParams.get('board') as BoardKey;
      const searchFromUrl = urlParams.get('search') || '';
      const pageFromUrl = urlParams.get('page') as string;
      const postIdFromUrl = urlParams.get('postId') as string;
      const studyGroupIdFromUrl = urlParams.get('studyGroupId') as string;
      
      console.log('popstate 이벤트 발생:', { pageFromUrl, boardFromUrl, searchFromUrl, postIdFromUrl, studyGroupIdFromUrl });
      
      // 홈페이지로 돌아가는 경우
      if (pageFromUrl === 'home' || (!pageFromUrl && !boardFromUrl && !postIdFromUrl && !studyGroupIdFromUrl)) {
        console.log('홈페이지로 복원');
        setCurrentPage('home');
        setSelectedPost(null);
        setSelectedStudyGroupId(null);
        return;
      }
      
      // 페이지 복원
      if (pageFromUrl && pageFromUrl !== currentPage) {
        console.log('페이지 변경:', currentPage, '->', pageFromUrl);
        setCurrentPage(pageFromUrl as any);
      }
      
      // 게시판 복원
      if (boardFromUrl && BOARD_LIST.find(b => b.key === boardFromUrl)) {
        console.log('게시판 복원:', boardFromUrl);
        setActiveBoard(boardFromUrl);
      }
      
      // 검색어 복원
      if (searchFromUrl !== searchTerms[boardFromUrl || activeBoard]) {
        console.log('검색어 복원:', searchFromUrl);
        updateSearchTerm(boardFromUrl || activeBoard, searchFromUrl);
      }
      
      // 게시글 상세 페이지 복원
      if (postIdFromUrl && pageFromUrl === 'readPost') {
        console.log('게시글 상세 페이지 복원:', postIdFromUrl);
        setCurrentPage('readPost'); // 페이지 상태를 먼저 설정
        
        const fetchPostForURL = async () => {
          try {
            const post = await postAPI.getPostById(postIdFromUrl);
            setSelectedPost(post);
          } catch (err) {
            console.error('게시글 복원 실패:', err);
            setCurrentPage('board');
          }
        };
        fetchPostForURL();
      }
      
      // 스터디 그룹 상세 페이지 복원
      if (studyGroupIdFromUrl && pageFromUrl === 'study') {
        console.log('스터디 그룹 상세 페이지 복원:', studyGroupIdFromUrl);
        setCurrentPage('study');
        setSelectedStudyGroupId(studyGroupIdFromUrl);
      } else if (pageFromUrl === 'study' && !studyGroupIdFromUrl) {
        // 스터디 모임 목록으로 복원
        console.log('스터디 모임 목록으로 복원');
        setCurrentPage('study');
        setSelectedStudyGroupId(null);
      } else if (!pageFromUrl && !boardFromUrl && !postIdFromUrl && !studyGroupIdFromUrl) {
        // URL 파라미터가 모두 없는 경우 홈페이지로 복원
        console.log('홈페이지로 복원 (URL 파라미터 없음)');
        setCurrentPage('home');
        setSelectedPost(null);
        setSelectedStudyGroupId(null);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [searchTerms, currentPage, activeBoard]);

  // 스터디 그룹 데이터 가져오기
  const fetchStudyGroups = async () => {
    try {
      setStudyGroupsLoading(true);
      const data = await studyGroupAPI.getStudyGroups('all', 1, 4); // 홈페이지에서는 상위 4개 표시
      
      // 새로운 API 응답 구조 처리
      if (data && typeof data === 'object' && 'groups' in data) {
        setStudyGroups(data.groups as any[]);
      } else {
        // 기존 API 응답 (호환성 유지)
        const groupsArray = Array.isArray(data) ? data : [];
        setStudyGroups(groupsArray);
      }
    } catch (error) {
      console.error('스터디 그룹 로드 오류:', error);
      setStudyGroups([]); // 오류 시 빈 배열로 설정
    } finally {
      setStudyGroupsLoading(false);
    }
  };

  // 홈페이지에서 스터디 그룹 데이터 로드
  useEffect(() => {
    if (currentPage === 'home') {
      fetchStudyGroups();
    }
  }, [currentPage]);

  // 스터디 그룹 데이터를 홈페이지 형식으로 변환
  const studies = useMemo(() => {
    // studyGroups가 배열인지 확인
    if (!Array.isArray(studyGroups)) {
      return [];
    }
    
    return studyGroups.map(group => ({
      id: group.id,
      title: group.name,
      location: group.description.match(/📍 지역: (.+)/)?.[1]?.split(', ')[0] || '지역 미정',
      type: group.description.includes('온라인') ? '온라인' : '오프라인',
      members: `${group.currentMembers}/${group.maxMembers}`,
      date: new Date(group.createdAt).toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }),
      category: group.category,
      leader: group.leader,
      isRecruiting: group.currentMembers < group.maxMembers,
      tags: [
        group.category,
        ...(group.description.match(/#\w+/g) || []).map((tag: string) => tag.replace('#', ''))
      ].slice(0, 3), // 최대 3개 태그만 표시
      locationTags: group.description.match(/📍 지역: (.+)/)?.[1]?.split(', ').map((tag: string) => tag.trim()) || []
    }));
  }, [studyGroups]);

  const handleWritePost = () => {
    const newPostItem: Post = {
      id: (posts.length + 1).toString(),
      title: newPost.title,
      content: newPost.content,
      category: activeBoard,
      category_name: BOARD_LIST.find(b => b.key === activeBoard)?.label,
      author: getUserDisplayName(user),
      authorId: user?.sub || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      viewCount: 0,
      likeCount: 0,
      commentCount: 0,
      isHot: false,
      comments: [],
    };
    
    setPosts([newPostItem, ...posts]);
    setNewPost({ title: '', content: '' });
    setShowWriteModal(false);
  };
  
  const handlePostClick = async (post: Post) => {
    try {
      // 조회수 증가
      await incrementViewCount(post.id);
      
      // 게시글의 카테고리에 따라 activeBoard 설정
      const categoryMapping: { [key: string]: BoardKey } = {
        '공지사항': 'notice',
        '자유게시판': 'free',
        '채용공고': 'jobs',
        '취업후기': 'reviews',
        '진로상담': 'counsel'
      };
      
      const boardKey = categoryMapping[post.category_name || ''];
      if (boardKey) {
        setActiveBoard(boardKey);
      }
      
      // API에서 게시글 상세 정보 가져오기
      const detailedPost = await postAPI.getPostById(post.id);
      setSelectedPost(detailedPost);

      setCurrentPage("readPost");
    } catch (err) {
      console.error('게시글 상세 조회 오류:', err);
      alert('게시글을 불러오는데 실패했습니다.');
    }
  };

  const handleLikeClick = (postId: string) => {
    if (!isAuthenticated) {
      alert("로그인 후 이용해 주세요.");
      return;
    }
    const updatedPosts = posts.map(p => 
      p.id === postId ? { ...p, likes: (p.likes || 0) + 1 } : p
    );
    setPosts(updatedPosts);
    setSelectedPost(updatedPosts.find(p => p.id === postId) || null);
  };

  const handleCommentSubmit = (postId: string, commentText: string) => {
    if (!isAuthenticated) {
      alert("로그인 후 이용해 주세요.");
      return;
    }
    if (commentText.trim()) {
      const updatedPosts: Post[] = posts.map(p => {
        if (p.id === postId) {
          const newComment: Comment = {
            id: ((p.comments?.length || 0) + 1).toString(),
            postId: postId,
            content: commentText,
            author: getUserDisplayName(user),
            authorId: user?.sub || undefined,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          return { ...p, comments: [...(p.comments || []), newComment] };
        }
        return p;
      });
      setPosts(updatedPosts);
      setSelectedPost(updatedPosts.find(p => p.id === postId) || null);
    }
  };
  
  // Cognito 로그인 핸들러
  const handleLogin = () => {
    window.location.href = '/auth';
  };

  const handleLogout = async () => {
    try {
      await logout();
      // 알림 서비스에서 사용자 제거
      notificationService.clearCurrentUser();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // 한국시간으로 변환하는 함수
  const convertToKST = (date: Date): Date => {
    console.log('🕐 원본 Date 객체:', date);
    console.log('🕐 UTC 시간:', date.toISOString());
    console.log('🕐 로컬 시간:', date.toString());
    
    // 서버에서 받은 시간이 이미 한국시간인지 확인
    // 현재 상황을 보면 서버가 이미 한국시간을 보내고 있을 가능성이 높음
    // 따라서 원본 시간을 그대로 사용
    console.log('🕐 원본 시간을 그대로 사용합니다');
    return date;
  };

  // Helper function for date formatting - 기사 날짜를 정확하게 표시 (예: 9월 2일)
  const timeAgo = (date: Date) => {
    // 유효하지 않은 날짜인지 확인
    if (!date || isNaN(date.getTime())) {
      console.warn('Invalid date passed to timeAgo:', date);
      return "날짜 정보 없음";
    }
    
    // 한국시간으로 변환 (현재는 원본 시간 사용)
    const dateKST = convertToKST(date);
    
    // 현재 시간과 비교하여 날짜 조정
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const articleDate = new Date(dateKST.getFullYear(), dateKST.getMonth(), dateKST.getDate());
    
    // 크롤링된 기사의 날짜가 현재보다 미래인 경우, 현재 날짜로 조정
    let adjustedDate = dateKST;
    if (articleDate > today) {
      console.log('🕐 미래 날짜 감지, 현재 날짜로 조정:', {
        원본: date,
        기사날짜: articleDate,
        오늘: today
      });
      
      // 현재 날짜의 같은 시간으로 조정 (시간 정보는 유지)
      adjustedDate = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
        dateKST.getHours(),
        dateKST.getMinutes(),
        dateKST.getSeconds()
      );
    }
    
    // "M월 D일" 형식으로 표시 (년도 제거)
    return adjustedDate.toLocaleDateString('ko-KR', { 
      month: 'long', 
      day: 'numeric'
    });
  };

  // 게시글 조회수 증가 함수
  const incrementViewCount = async (postId: string) => {
    try {
      // API를 통해 조회수 증가
      await postAPI.incrementViewCount(postId);
      
      // 프론트엔드에서도 조회수 증가
      setPosts(prevPosts => 
        prevPosts.map(post => 
          post.id === postId 
            ? { ...post, viewCount: (post.viewCount || 0) + 1 }
            : post
        )
      );
    } catch (err) {
      console.error('조회수 증가 오류:', err);
    }
  };

  /* 공지사항 컴포넌트 */
  const Announcements = () => {
    const [currentNoticeIndex, setCurrentNoticeIndex] = useState(0);
    
    // 공지사항 게시글 필터링 (최신순으로 상위 3개)
    const noticePosts = posts
      .filter(post => post.category_name === '공지사항')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 3);

    // 공지사항 순환 효과
    useEffect(() => {
      if (noticePosts.length <= 1) return;
      
      const interval = setInterval(() => {
        setCurrentNoticeIndex((prevIndex) => (prevIndex + 1) % noticePosts.length);
      }, 5000); // 5초마다 변경

      return () => clearInterval(interval);
    }, [noticePosts.length]);

    return (
      <div className="bg-red-50 border border-red-200 rounded-lg overflow-hidden">
        <div className="flex items-center px-3 sm:px-4 py-2">
          <span className="text-red-500 font-bold text-sm mr-3">공지</span>
          <div className="flex-1 overflow-hidden relative h-6 flex items-center">
            {noticePosts.length > 0 ? (
              <div className="w-full h-full">
                {noticePosts.map((post, index) => (
                  <div
                    key={post.id}
                    className={`absolute top-0 left-0 w-full h-full flex items-center cursor-pointer hover:text-red-900 transition-opacity duration-500 ${
                      index === currentNoticeIndex ? 'opacity-100' : 'opacity-0'
                    }`}
                    style={{
                      pointerEvents: index === currentNoticeIndex ? 'auto' : 'none'
                    }}
                    onClick={() => handlePostClick(post)}
                    title={post.title}
                  >
                    <span className="text-red-700 text-xs font-medium truncate">
                      {post.title}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="w-full h-full flex items-center">
                <span className="text-red-700 text-xs">공지사항이 없어요.</span>
              </div>
            )}
          </div>
          <button 
            onClick={() => {
              setActiveBoard('notice');
              setCurrentPage('board');
            }}
            className="text-red-600 hover:text-red-800 text-xs hover:underline ml-2 flex-shrink-0"
          >
            더보기
          </button>
        </div>
      </div>
    );
  };
  
  // 실시간 인기글 롤링 컴포넌트
  const HotPostsRolling = ({ hotPosts }: { hotPosts: Post[] }) => {
    // 추천수 순서대로 정렬 후 최대 3개까지 표시
    const sortedHotPosts = hotPosts.sort((a: Post, b: Post) => {
      const aCount = Number(a.likeCount) || 0;
      const bCount = Number(b.likeCount) || 0;
      return bCount - aCount;
    });
    const limitedHotPosts = sortedHotPosts.slice(0, 3);
    
    if (limitedHotPosts.length === 0) {
      return (
        <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6">
          <div className="text-gray-500 text-center text-sm">인기 게시글이 없어요.</div>
        </div>
      );
    }
    
        return (
      <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4">
        <div className="space-y-2">
          {limitedHotPosts.map((post: Post, idx: number) => (
            <div key={post.id} className="block py-2 cursor-pointer hover:bg-gray-50 rounded" onClick={() => handlePostClick(post)}>
              <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                <span className="text-red-500 flex-shrink-0">🔥</span>
                <span className="font-bold text-gray-900 w-3 sm:w-4 flex-shrink-0">{idx + 1}</span>
                <span className="text-gray-900 hover:text-sky-600 font-medium flex-1 line-clamp-1 min-w-0">
                  {post.title}
                </span>
                <span className="text-gray-500 text-xs w-12 sm:w-16 flex-shrink-0">조회 {post.viewCount}</span>
                <span className="text-gray-500 text-xs w-12 sm:w-16 flex-shrink-0">추천 {post.likeCount}</span>
                <span className="text-gray-500 text-xs w-16 sm:w-20 flex-shrink-0">{timeAgo(new Date(post.createdAt))}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // 홈 우측: 취업 뉴스 컴팩트 위젯 (실제 API 데이터 사용)
  const CompactJobsNews = ({ limit = 4 }: { limit?: number }) => {
    const sorted = useMemo(() => {
        return [...jobNewsItems].sort((a, b) => {
        const ta = a.date ? +new Date(a.date) : 0;
        const tb = b.date ? +new Date(b.date) : 0;
          return tb - ta;
        });
    }, [jobNewsItems]);

    const handleRefresh = async () => {
      try {
        setJobNewsLoading(true);
        const response = await jobsNewsAPI.getJobNews();
        setJobNewsItems(response.items);
      } catch (err) {
        console.error('취업뉴스 로딩 오류:', err);
      } finally {
        setJobNewsLoading(false);
      }
    };

    return (
      <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4 flex flex-col h-full">
        <div className="flex items-center justify-between mb-3">
          <div className="font-bold text-gray-900 text-sm sm:text-base">📰 취업 뉴스</div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={jobNewsLoading}
              className="text-gray-500 hover:text-gray-700 disabled:opacity-50 p-1"
              title="새로고침"
            >
              🔄
            </button>
            <button
              onClick={() => setCurrentPage("jobsNews")}
              className="text-xs bg-sky-600 text-white px-2 py-1 rounded hover:bg-sky-700 transition-colors"
            >
              전체 보기
            </button>
          </div>
        </div>

        {jobNewsLoading ? (
          <div className="text-xs sm:text-sm text-gray-500 flex items-center justify-center h-[450px]">불러오는 중…</div>
        ) : !jobNewsLoaded && currentPage === "home" ? (
          <div className="text-xs sm:text-sm text-gray-500 flex items-center justify-center h-[450px]">새로고침 버튼을 눌러 뉴스를 불러오세요.</div>
        ) : sorted.length === 0 ? (
          <div className="text-xs sm:text-sm text-gray-500 flex items-center justify-center h-[450px]">표시할 뉴스가 없어요.</div>
        ) : (
          <ul className="space-y-2 sm:space-y-3 h-[450px] overflow-y-auto pr-1">
            {sorted.slice(0, limit).map((n, i) => (
              <li key={i} className="group">
                <a
                  href={n.href}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs sm:text-sm text-gray-900 group-hover:text-sky-600 font-medium line-clamp-2"
                >
                  {n.title}
                </a>
                <div className="text-xs text-gray-500">
                  <span>{n.source || '뉴스앤잡'}</span>
                  <span className="mx-1">•</span>
                  <span>{n.date ? timeAgo(new Date(n.date)) : ""}</span>
                </div>
                <div className="mt-2 h-px bg-gray-100" />
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  };

    /* =========================
   페이지: 홈
   ========================= */
  const renderHome = () => {
    console.log('renderHome 함수 호출됨');
    console.log('현재 posts 배열:', posts);
    console.log('posts 배열 길이:', posts.length);
    console.log('posts 배열 타입:', typeof posts);
    
    let hotPosts: Post[] = [];
    try {
      console.log('=== 전체 posts 데이터 확인 ===');
      console.log('posts 배열:', posts);
      console.log('첫 번째 게시글:', posts[0]);
      console.log('첫 번째 게시글의 모든 속성:', Object.keys(posts[0] || {}));
      
      const filteredPosts = posts.filter(p => p.isHot === 1 || p.isHot === true);
      console.log('isHot === true로 필터링된 결과:', filteredPosts.map(p => ({ title: p.title, isHot: p.isHot, likeCount: p.likeCount })));
      
      hotPosts = filteredPosts.sort((a, b) => {
        const aCount = Number(a.likeCount) || 0;
        const bCount = Number(b.likeCount) || 0;
        console.log(`정렬 비교: ${a.title} (${aCount}) vs ${b.title} (${bCount})`);
        return bCount - aCount;
      }); // 추천수 내림차순 정렬
      console.log('필터링된 hotPosts:', hotPosts);
      console.log('hotPosts 길이:', hotPosts.length);
      console.log('정렬된 hotPosts의 추천수:', hotPosts.map(p => ({ 
        title: p.title, 
        likeCount: p.likeCount, 
        likeCountType: typeof p.likeCount,
        isHot: p.isHot 
      })));
    } catch (error) {
      console.error('hotPosts 필터링 중 오류:', error);
      hotPosts = [];
    }

    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <style>
          {`
            @keyframes marquee {
              0% { transform: translateX(0); }
              100% { transform: translateX(-100%); }
            }
            .animate-marquee {
              animation: marquee 10s linear infinite;
            }
            @keyframes marquee-v-posts {
                0% { transform: translateY(0); }
                100% { transform: translateY(-50%); }
            }
            .animate-marquee-v-posts {
                animation: marquee-v-posts 15s linear infinite;
            }
          `}
        </style>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* 왼쪽: 배너 + 공지 + (인기글/스터디) + 오늘·내일 공고(길게) */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* 배너 */}
            <button
              onClick={() => setCurrentPage("about")}
              className="w-full bg-gradient-to-r from-sky-600 to-indigo-600 text-white rounded-lg px-4 sm:px-6 lg:px-8 py-4 sm:py-5 lg:py-6 min-h-[120px] shadow-lg hover:shadow-xl transition-shadow duration-300 text-left"
            >
              <h1 className="text-2xl sm:text-3xl font-bold mb-2 break-words">See Sun, 우리 함께 해보자!</h1>
              <p className="text-sky-100 text-sm sm:text-base">밝은 미래를 향해, 오늘도 도전하는 커뮤니티</p>
            </button>

            {/* 공지 */}
            <Announcements />

            {/* 인기글 / 스터디 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              {/* 🔥 실시간 인기글 */}
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300">
                <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-100 flex items-center justify-between">
                  <h2 className="text-base sm:text-lg font-bold text-gray-900">🔥 실시간 인기글</h2>
                  <div className="w-16"></div> {/* 스터디 모임 버튼과 동일한 공간 확보 */}
                </div>
                  <div className="divide-y divide-gray-100">
                    {hotPosts.length > 0 ? (
                        hotPosts.slice(0, 4).map((post, idx) => (
                          <div key={post.id} className="px-4 sm:px-6 py-3 sm:py-4 hover:bg-gray-50 cursor-pointer" onClick={() => handlePostClick(post)}>
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-sm font-bold text-gray-900">{idx + 1}</span>
                              {post.isHot && <span className="text-red-500 text-xs">🔥</span>}
                              <span className="text-gray-500 text-xs">{timeAgo(new Date(post.createdAt))}</span>
                            </div>
                            <h3 
                              className="text-gray-900 hover:text-sky-600 font-medium mb-2 line-clamp-2 text-sm sm:text-base"
                            >
                              {post.title}
                            </h3>
                            <div className="flex items-center gap-2 sm:gap-4 text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <Eye size={12} />
                                {post.viewCount}
                              </span>
                              <span className="flex items-center gap-1">
                                <MessageCircle size={12} />
                                {post.commentCount}
                              </span>
                              <span>👍 {post.likeCount}</span>
                            </div>
                          </div>
                        ))
                    ) : (
                        <div className="px-4 sm:px-6 py-4 text-gray-500 text-center">인기 게시글이 없어요.</div>
                    )}
                  </div>
              </div>

              {/* 📚 스터디 모임(요약) */}
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300">
                <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-100 flex items-center justify-between">
                  <h2 className="text-base sm:text-lg font-bold text-gray-900">📚 스터디 모임</h2>
                  <button
                    onClick={() => setCurrentPage("study")}
                    className="text-xs bg-sky-600 text-white px-2 py-1 rounded hover:bg-sky-700 transition-colors"
                  >
                    전체 보기
                  </button>
                </div>
                <div className="p-4 sm:p-6">
                  {studyGroupsLoading ? (
                    <div className="text-gray-500 text-center">스터디 그룹을 불러오는 중...</div>
                  ) : studies.length > 0 ? (
                    <div className="space-y-3">
                      {studies.map((s) => (
                        <div
                          key={s.id}
                          onClick={() => {
                            setSelectedStudyGroupId(s.id);
                            setCurrentPage("study");
                            // URL 업데이트 - pushState 사용하여 홈페이지에서 상세로 이동할 때 히스토리 엔트리 생성
                            const url = new URL(window.location.href);
                            url.searchParams.set('page', 'study');
                            url.searchParams.set('studyGroupId', s.id);
                            window.history.pushState({}, '', url.toString());
                          }}
                          className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:shadow-sm transition-all duration-200 cursor-pointer"
                        >
                          <div className="flex-1 min-w-0">
                            {/* 제목과 모집 상태 */}
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium text-gray-900 text-sm truncate">
                                {s.title}
                              </h4>
                              <span className={`px-2 py-1 rounded text-xs font-medium flex-shrink-0 ${
                                s.isRecruiting ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                              }`}>
                                {s.isRecruiting ? '모집중' : '모집완료'}
                              </span>
                            </div>
                            
                            {/* 상세 정보 */}
                            <div className="flex items-center gap-3 text-xs text-gray-600 flex-wrap">
                              <span className="flex items-center gap-1 whitespace-nowrap">
                                <FolderOpen size={12} />
                                {s.category}
                              </span>
                              <span className="flex items-center gap-1 whitespace-nowrap">
                                <MapPin size={12} />
                                {s.locationTags[0] || '지역 미정'}
                              </span>
                              <span className="flex items-center gap-1 whitespace-nowrap">
                                <Users size={12} />
                                {s.members}명
                              </span>
                              <span className="text-yellow-600 whitespace-nowrap">👑 {s.leader}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-gray-500 text-center">모집 중인 스터디가 없어요.</div>
                  )}
                </div>

              </div>
            </div>


          </div>

          {/* 오른쪽 사이드바: (달력/검색/버튼) ↑  /  취업 뉴스 ↓ */}
          <aside className="lg:col-span-1 h-full flex flex-col gap-4 sticky top-20">
              {/* AI 버튼 모음 */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="font-bold text-gray-900 mb-3">🤖 AI 도구</div>
              <div className="grid grid-cols-1 gap-2">
                <button 
                  onClick={() => setCurrentPage("aiSearch")}
                  className="w-full bg-sky-600 text-white px-4 py-2 rounded text-sm hover:bg-sky-700 transition-colors"
                >
                  AI 자격증 검색
                </button>
                <button 
                  onClick={() => setCurrentPage("portfolio")}
                  className="w-full bg-sky-600 text-white px-4 py-2 rounded text-sm hover:bg-sky-700 transition-colors"
                >
                  AI 포트폴리오 만들기
                </button>
              </div>
            </div>

            {/* 취업 뉴스(컴팩트) */}
            <CompactJobsNews limit={10} />
          </aside>
        </div>
      </div>
    );
  };

    /* =========================
   페이지: 게시판 (5개 보드)
   ========================= */
  const renderBoard = () => {
    const hotPosts = posts.filter(p => p.isHot);

    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* 보드 사이드바 (데스크톱) */}
          <aside className="hidden lg:block lg:col-span-1">
            <div className="bg-white border border-gray-200 rounded-lg sticky top-20">
              <div className="px-4 py-3 border-b border-gray-100">
                <h3 className="font-bold text-gray-900">📋 게시판 목록</h3>
              </div>
              <div className="p-2">
                {BOARD_LIST.map((b) => (
                  <button
                    key={b.key}
                    onClick={() => setActiveBoard(b.key)}
                    className={`w-full text-left px-3 py-2 rounded text-sm mb-1 transition-colors ${
                      activeBoard === b.key
                        ? "bg-sky-50 text-sky-700"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {b.label}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* 게시글 목록 (데모) */}
          <section className="col-span-1 lg:col-span-3">
            <div className="bg-white border border-gray-200 rounded-lg">
              <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                      {BOARD_LIST.find((b) => b.key === activeBoard)?.label}
                    </h2>
                    
                    {/* 모바일 게시판 선택 드롭다운 */}
                    <div className="lg:hidden">
                      <select
                        value={activeBoard}
                        onChange={(e) => setActiveBoard(e.target.value as BoardKey)}
                        className="border border-gray-300 rounded px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                      >
                        {BOARD_LIST.map((b) => (
                          <option key={b.key} value={b.key}>
                            {b.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => setShowWriteModal(true)} 
                    disabled={!isAuthenticated || (activeBoard === 'notice' && !adminStatus)} 
                    className={`px-4 sm:px-5 py-3 rounded-lg flex items-center gap-2 text-sm transition-colors min-h-[44px] ${
                      isAuthenticated && !(activeBoard === 'notice' && !adminStatus) 
                        ? 'bg-sky-600 text-white hover:bg-sky-700 shadow-sm hover:shadow-md' 
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    <Plus size={16} />
                    글쓰기
                  </button>
                </div>
                                 <div className="relative max-w-md mt-4">
                   <Search
                     className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                     size={16}
                   />
                                       <input
                      type="text"
                      placeholder="검색어를 입력하세요"
                      value={searchTerm}
                      onChange={(e) => updateSearchTerm(activeBoard, e.target.value)}
                      onKeyPress={(e) => {
                         if (e.key === 'Enter') {
                           // Enter 키 입력 시 검색 실행
                           console.log('Enter 키 검색, searchTerm:', searchTerm);
                           executeSearch(searchTerm);
                         }
                       }}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-sky-500 text-gray-900"
                    />
                    <button
                       onClick={() => {
                         // 검색 버튼 클릭 시 검색 실행
                         console.log('검색 버튼 클릭, searchTerm:', searchTerm);
                         executeSearch(searchTerm);
                       }}
                       className="absolute right-2 top-1/2 -translate-y-1/2 bg-sky-600 text-white px-3 py-1 rounded text-sm hover:bg-sky-700"
                     >
                       검색
                     </button>
                 </div>
              </div>
              
              {/* 자유게시판(free)일 때만 인기글 롤링 표시 */}
              {activeBoard === 'free' && (
                <div className="p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">🔥 실시간 인기글</h3>
                  <HotPostsRolling hotPosts={posts.filter(p => p.isHot && p.category_name === '자유게시판')} />
                </div>
              )}

              {/* 테이블 헤더 */}
              <div className="px-4 sm:px-6 py-3 bg-gray-50 border-b border-gray-200">
                <div className="hidden sm:grid grid-cols-12 gap-4 text-sm font-medium text-gray-700">
                  <div className="col-span-1">번호</div>
                  <div className="col-span-6">제목</div>
                  <div className="col-span-2">작성자</div>
                  <div className="col-span-1">조회</div>
                  <div className="col-span-1">추천</div>
                  <div className="col-span-1">시간</div>
                </div>
              </div>

              {/* 게시글 리스트 */}
              <div className="divide-y divide-gray-100">
                {loading ? (
                  <div className="px-4 sm:px-6 py-4 text-gray-500 text-center">불러오는 중...</div>
                ) : error ? (
                  <div className="px-4 sm:px-6 py-4 text-red-500 text-center">{error}</div>
                ) : posts.length > 0 ? (
                  posts.map((p, idx) => {

                    
                    return (
                     <div 
                       key={p.id} 
                       className="px-4 sm:px-6 py-3 sm:py-4 hover:bg-gray-50 hover:shadow-sm transition-all duration-200 cursor-pointer"
                       onClick={() => handlePostClick(p)}
                     >
                       {/* 모바일 뷰 */}
                       <div className="sm:hidden">
                         <div className="flex items-start justify-between mb-2">
                           <span className="text-sm text-gray-500">{(currentPageNum - 1) * postsPerPage + idx + 1}</span>
                           <span className="text-xs text-gray-400">{timeAgo(new Date(p.createdAt))}</span>
                         </div>
                         <h3 className="text-gray-900 hover:text-sky-600 font-medium mb-2 line-clamp-2">
                           {p.title}
                           {p.commentCount > 0 && (
                             <span className="text-sky-600 text-sm ml-1">[{p.commentCount}]</span>
                           )}
                         </h3>
                         <div className="flex items-center justify-between text-xs text-gray-500">
                           <UserDisplayWithIcon 
                             username={p.author} 
                             authorId={p.authorId} 
                             currentUser={user} 
                           />
                           <div className="flex items-center gap-3">
                             <span>조회 {p.viewCount}</span>
                             <span>추천 {p.likeCount}</span>
                           </div>
                         </div>
                       </div>
                       
                       {/* 데스크톱 뷰 */}
                       <div className="hidden sm:grid grid-cols-12 gap-4 items-center">
                         <div className="col-span-1 text-sm text-gray-500">
                           {(currentPageNum - 1) * postsPerPage + idx + 1}
                         </div>
                         <div className="col-span-6">
                           <div className="flex items-center gap-2">
                             <span className="text-gray-900 hover:text-sky-600 font-medium line-clamp-1">
                               {p.title}
                             </span>
                             {p.commentCount > 0 && (
                               <span className="text-sky-600 text-sm">[{p.commentCount}]</span>
                             )}
                           </div>
                         </div>
                         <div className="col-span-2 text-sm text-gray-600">
                           <UserDisplayWithIcon 
                             username={p.author} 
                             authorId={p.authorId} 
                             currentUser={user} 
                           />
                         </div>
                         <div className="col-span-1 text-sm text-gray-500">{p.viewCount}</div>
                         <div className="col-span-1 text-sm text-gray-500">{p.likeCount}</div>
                         <div className="col-span-1 text-sm text-gray-500">
                           {timeAgo(new Date(p.createdAt))}
                         </div>
                       </div>
                     </div>
                   );
                   })
                ) : (
                  <div className="px-4 sm:px-6 py-4 text-gray-500 text-center">게시글이 없어요.</div>
                )}
              </div>

              {/* 페이지네이션 */}
              {totalPages > 1 && (
                <div className="px-4 sm:px-6 py-4 border-t border-gray-200">
                  <div className="flex items-center justify-center gap-1 sm:gap-2">
                    <button 
                      onClick={() => handlePageChange(Math.max(1, currentPageNum - 5))}
                      disabled={currentPageNum <= 5}
                      className={`px-3 py-2 border border-gray-300 rounded text-sm transition-colors bg-gray-100 ${
                        currentPageNum <= 5
                          ? 'text-gray-400 cursor-not-allowed' 
                          : 'text-gray-700 hover:bg-gray-200 hover:border-gray-400'
                      }`}
                    >
                      이전
                    </button>
                    
                    {pageNumbers.map((page) => (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`px-3 py-2 border border-gray-300 rounded text-sm transition-colors ${
                          page === currentPageNum
                            ? 'bg-sky-600 text-white border-sky-600'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:border-gray-400'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                    
                    <button 
                      onClick={() => handlePageChange(Math.min(totalPages, currentPageNum + 5))}
                      disabled={currentPageNum + 5 > totalPages}
                      className={`px-3 py-2 border border-gray-300 rounded text-sm transition-colors bg-gray-100 ${
                        currentPageNum + 5 > totalPages
                          ? 'text-gray-400 cursor-not-allowed' 
                          : 'text-gray-700 hover:bg-gray-200 hover:border-gray-400'
                      }`}
                    >
                      다음
                    </button>
                  </div>
                  
                  {/* 페이지 정보 */}
                  <div className="flex justify-center mt-3">
                    <span className="text-sm text-gray-600">
                      {(currentPageNum - 1) * postsPerPage + 1}-{Math.min(currentPageNum * postsPerPage, totalPosts)} / {totalPosts} 게시글
                    </span>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    );
  };

    /* =========================
     페이지: 스터디 모임
     ========================= */
  const renderStudy = () => {
    if (selectedStudyGroupId) {
      return (
        <StudyGroupDetail
          groupId={selectedStudyGroupId}
          onBack={() => {
            setSelectedStudyGroupId(null);
            // URL 업데이트 - 스터디 모임 목록으로
            const url = new URL(window.location.href);
            url.searchParams.set('page', 'study');
            url.searchParams.delete('studyGroupId');
            window.history.pushState({}, '', url.toString());
          }}
          currentUserId={user?.sub || undefined}
        />
      );
    }

    return (
      <div className="max-w-7xl mx-auto px-4 py-6">
        <StudyGroupList
          onViewDetail={(groupId) => {
            setSelectedStudyGroupId(groupId);
            // URL 업데이트 - pushState 사용하여 스터디 모임 목록에서 상세로 이동할 때 히스토리 엔트리 생성
            const url = new URL(window.location.href);
            url.searchParams.set('page', 'study');
            url.searchParams.set('studyGroupId', groupId);
            window.history.pushState({}, '', url.toString());
          }}
                currentUserId={user?.sub || undefined}
      isAdmin={user?.groups?.includes('admin')}
        />
      </div>
    );
  };

    /* =========================
     페이지: 취업 뉴스 (풀 페이지)
     ========================= */
  const JobsNewsPage = () => {
    return (
      <div className="max-w-7xl mx-auto px-4 py-6">
        <JobNews />
      </div>
    );
  };

  /* 스터디 모달 */
  const StudyModal = () => {
    const [title, setTitle] = useState('');
    const [studyType, setStudyType] = useState('');
    const [location, setLocation] = useState('');
    const [members, setMembers] = useState(2);
    const [description, setDescription] = useState('');
    const [tags, setTags] = useState('');

    const handleCreateStudy = async () => {
      // This is a placeholder since Firebase is not used
      console.log("스터디 모임 생성 (데모):", { title, studyType, location, members, description, tags });
      setShowStudyModal(false);
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg max-w-lg w-full p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6">스터디 모임 만들기</h3>
          <div className="space-y-3 sm:space-y-4">
            <input
              type="text"
              placeholder="스터디 제목 *"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm sm:text-base"
            />
            <select
              value={studyType}
              onChange={(e) => setStudyType(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm sm:text-base"
            >
              <option value="">진행 방식 *</option>
              <option value="온라인">온라인</option>
              <option value="오프라인">오프라인</option>
              <option value="온/오프라인 병행">온/오프라인 병행</option>
            </select>
            {studyType !== '온라인' && (
              <input
                type="text"
                placeholder="지역 (오프라인 시)"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm sm:text-base"
              />
            )}
            <input
              type="number"
              min={2}
              max={20}
              value={members}
              onChange={(e) => setMembers(Number(e.target.value))}
              placeholder="모집 인원 *"
              className="w-full border border-gray-300 rounded px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm sm:text-base"
            />
            <textarea
              rows={4}
              placeholder="스터디 설명"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm sm:text-base resize-none"
            />
            <input
                type="text"
                placeholder="태그 (쉼표로 구분, 예: #정보처리기사, #실기)"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm sm:text-base"
            />
          </div>
          <div className="flex gap-3 mt-4 sm:mt-6">
            <button
              onClick={() => setShowStudyModal(false)}
              className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-50 text-sm sm:text-base transition-colors min-h-[44px]"
            >
              취소
            </button>
            <button
              onClick={handleCreateStudy}
              className="flex-1 bg-sky-600 text-white py-3 rounded-lg hover:bg-sky-700 text-sm sm:text-base transition-colors min-h-[44px] shadow-sm hover:shadow-md"
            >
              만들기
            </button>
          </div>
        </div>
      </div>
    );
  };

  const WritePostModal = () => {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // 글자 수 계산
    const titleCharCount = title?.length || 0;
    const contentCharCount = content?.length || 0;
    const maxTitleLength = 100;
    const maxContentLength = 5000;

    // ESC 키로 모달 닫기
    useEffect(() => {
      const handleEscKey = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          setShowWriteModal(false);
        }
      };

      document.addEventListener('keydown', handleEscKey);
      return () => document.removeEventListener('keydown', handleEscKey);
    }, []);

    // Ctrl+S 단축키로 저장
    useEffect(() => {
      const handleKeyDown = (event: KeyboardEvent) => {
        if ((event.ctrlKey || event.metaKey) && event.key === 's') {
          event.preventDefault();
          if (!submitting && title.trim() && content.trim()) {
            handlePostSubmit();
          }
        }
      };

      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }, [title, content, submitting]);

    const handlePostSubmit = async () => {
      console.log('🔍 글 작성 제출 - 디버그 정보:');
      console.log('📋 활성 게시판:', activeBoard);
      console.log('👤 사용자 정보:', user);
      console.log('🔑 관리자 상태:', adminStatus);
      console.log('👥 사용자 그룹:', user?.groups);
      
      // 공지사항 게시판 권한 체크 - adminStatus 사용
      if (activeBoard === 'notice' && !adminStatus) {
        console.log('❌ 공지사항 권한 없음 - 접근 차단');
        alert('공지사항 게시판은 관리자만 글을 작성할 수 있습니다.');
        return;
      }
      
      console.log('✅ 권한 확인 통과 - 글 작성 진행');

      if (!title.trim() || !content.trim()) {
        alert('제목과 내용을 모두 입력해주세요.');
        return;
      }

      if (titleCharCount > maxTitleLength) {
        alert(`제목은 ${maxTitleLength}자를 초과할 수 없습니다.`);
        return;
      }

      if (contentCharCount > maxContentLength) {
        alert(`내용은 ${maxContentLength}자를 초과할 수 없습니다.`);
        return;
      }

      try {
        setSubmitting(true);
        
        // API 카테고리와 UI 카테고리 매핑
        const categoryMapping: { [key: string]: string } = {
          'notice': '공지사항',
          'free': '자유게시판', 
          'jobs': '채용공고',
          'reviews': '취업후기',
          'counsel': '진로상담'
        };

        console.log('🔍 사용자 정보 디버그:', user);
        console.log('📧 사용자 이메일:', user?.email);
        console.log('👤 사용자명:', user?.username);
        console.log('🆔 사용자 ID:', user?.sub);

        // 사용자 표시 이름 생성 - 이메일 우선 사용
        let displayName = "익명";
        if (user?.email) {
          displayName = user.email.split('@')[0];
        } else if (user?.username && user.username.includes('@')) {
          displayName = user.username.split('@')[0];
        } else if (user?.username && !user.username.includes('@')) {
          displayName = user.username;
        }

        const postData = {
          title: title.trim(),
          content: content.trim(),
          category: categoryMapping[activeBoard],
          author: displayName,
          authorId: user?.sub || undefined
        };

        console.log('📝 게시글 데이터:', postData);
        console.log('📋 활성 게시판:', activeBoard);
        console.log('🏷️ 카테고리 매핑:', categoryMapping[activeBoard]);

        // API를 통해 게시글 작성
        const newPost = await postAPI.createPost(postData);
        
        // 게시글 목록 새로고침
        await fetchPosts();
        
        setShowWriteModal(false);
        setTitle('');
        setContent('');
        
        alert('게시글이 성공적으로 작성되었습니다!');
      } catch (err) {
        console.error('게시글 작성 오류:', err);
        alert('게시글 작성에 실패했습니다. 다시 시도해주세요.');
      } finally {
        setSubmitting(false);
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
          {/* 헤더 */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-sky-50 to-indigo-50">
            <div className="flex items-center gap-3">
              <span className="text-2xl">✏️</span>
              <h3 className="text-xl font-bold text-gray-900">새 글 작성</h3>
            </div>
            <button
              onClick={() => setShowWriteModal(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-full hover:bg-gray-100"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* 본문 */}
          <div className="p-6 space-y-6">
            {/* 제목 입력 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                제목
              </label>
              <input
                type="text"
                placeholder="제목을 입력하세요"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent text-lg transition-all duration-200"
                maxLength={maxTitleLength}
              />
              <div className="flex justify-between items-center mt-2">
                <span className="text-xs text-gray-500">
                  제목은 {maxTitleLength}자까지 입력 가능합니다
                </span>
                <span className={`text-xs ${titleCharCount > maxTitleLength * 0.9 ? 'text-orange-500' : 'text-gray-400'}`}>
                  {titleCharCount}/{maxTitleLength}
                </span>
              </div>
            </div>

            {/* 내용 입력 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                내용
              </label>
              <textarea
                placeholder="내용을 입력하세요"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full border-2 border-gray-200 rounded-lg px-4 py-4 text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent resize-none transition-all duration-200"
                rows={15}
                maxLength={maxContentLength}
              />
              <div className="flex justify-between items-center mt-2">
                <span className="text-xs text-gray-500">
                  내용은 {maxContentLength}자까지 입력 가능합니다
                </span>
                <span className={`text-xs ${contentCharCount > maxContentLength * 0.9 ? 'text-orange-500' : 'text-gray-400'}`}>
                  {contentCharCount}/{maxContentLength}
                </span>
              </div>
            </div>
          </div>

          {/* 푸터 */}
          <div className="flex gap-4 p-6 border-t border-gray-200 bg-gray-50">
            <button
              onClick={() => setShowWriteModal(false)}
              className="flex-1 border-2 border-gray-300 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-100 hover:border-gray-400 transition-all duration-200 font-medium"
            >
              취소
            </button>
            <button
              onClick={handlePostSubmit}
              disabled={submitting || !title.trim() || !content.trim()}
              className={`flex-1 py-3 px-6 rounded-lg font-medium transition-all duration-200 ${
                submitting || !title.trim() || !content.trim()
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                  : 'bg-sky-600 text-white hover:bg-sky-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
              }`}
            >
              {submitting ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  등록 중...
                </div>
              ) : (
                '작성 완료'
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };
  
  const ReadPostPage = ({ post }: { post: Post }) => {
    const [comment, setComment] = useState('');
    const [comments, setComments] = useState<any[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [loading, setLoading] = useState(true);
    const [isLiked, setIsLiked] = useState(false);
    const [likeCount, setLikeCount] = useState(post.likeCount || 0);
    const [likeLoading, setLikeLoading] = useState(false);

    // 댓글 목록 가져오기
    const fetchComments = async () => {
      try {
        setLoading(true);
        const data = await commentAPI.getComments(post.id);
        setComments(data);
      } catch (err) {
        console.error('댓글 조회 오류:', err);
      } finally {
        setLoading(false);
      }
    };

    // 좋아요 상태 확인
    const checkLikeStatus = async () => {
      if (!isAuthenticated || !user?.sub) return;
      
      try {
        const { liked } = await likeAPI.checkLikeStatus(post.id, user?.sub || '');
        setIsLiked(liked);
      } catch (err) {
        console.error('좋아요 상태 확인 오류:', err);
      }
    };

    // 컴포넌트 마운트 시 댓글과 좋아요 상태 가져오기
    useEffect(() => {
      fetchComments();
      checkLikeStatus();
    }, [post.id, isAuthenticated, user?.sub]);

    const handleLikeClick = async () => {
      if (!isAuthenticated) {
        alert("로그인 후 이용해 주세요.");
        return;
      }

      try {
        setLikeLoading(true);
        
        console.log('🔍 추천 클릭 - 디버그 정보:');
        console.log('👤 사용자 정보:', user);
        console.log('🔑 관리자 상태:', adminStatus);
        console.log('👥 사용자 그룹:', user?.groups);
        console.log('❤️ 현재 추천 상태:', isLiked);
        
        if (isLiked && !adminStatus) {
          // 좋아요 취소 (관리자 제외)
          console.log('❌ 일반 사용자 - 추천 취소');
          await likeAPI.unlikePost(post.id, user?.sub || '');
          setLikeCount(prev => prev - 1);
          setIsLiked(false);
        } else {
          // 좋아요 추가 (관리자는 중복 추천 가능)
          console.log('✅ 추천 추가 (관리자 무제한 추천 가능)');
          await likeAPI.likePost(post.id, user?.sub || '');
          setLikeCount(prev => prev + 1);
          setIsLiked(true);
        }
      } catch (err) {
        console.error('좋아요 처리 오류:', err);
        alert('좋아요 처리 중 오류가 발생했습니다.');
      } finally {
        setLikeLoading(false);
      }
    };

    const handleCommentSubmit = async () => {
      if (!isAuthenticated) {
        alert("로그인 후 이용해 주세요.");
        return;
      }
      if (!comment.trim()) {
        alert("댓글 내용을 입력해주세요.");
        return;
      }

      try {
        setSubmitting(true);
        
        // 사용자 표시 이름 생성 - 이메일 우선 사용
        let displayName = "익명";
        if (user?.email) {
          displayName = user.email.split('@')[0];
        } else if (user?.username && user.username.includes('@')) {
          displayName = user.username.split('@')[0];
        } else if (user?.username && !user.username.includes('@')) {
          displayName = user.username;
        }
      

        const commentData = {
          content: comment.trim(),
          author: displayName,
          authorId: user?.sub || ''
        };

        await commentAPI.createComment(post.id, commentData);
        
        // 댓글 목록 새로고침
        await fetchComments();
        
        setComment('');
        alert('댓글이 성공적으로 작성되었습니다!');
      } catch (err) {
        console.error('댓글 작성 오류:', err);
        alert('댓글 작성에 실패했습니다. 다시 시도해주세요.');
      } finally {
        setSubmitting(false);
      }
    };

    // 게시글 삭제 함수
    const handleDeletePost = async () => {
      if (!confirm('정말로 이 게시글을 삭제하시겠습니까?')) {
        return;
      }

      try {
        await postAPI.deletePost(post.id, user?.sub || post.authorId || '');
        alert('게시글이 삭제되었습니다.');
        
        // 게시글 목록에서 삭제된 게시글 제거
        setPosts(prevPosts => prevPosts.filter(p => p.id !== post.id));
        
        // 목록으로 돌아가기
        setCurrentPage('board');
      } catch (error: any) {
        console.error('게시글 삭제 오류:', error);
        alert(error.response?.data?.error || '게시글 삭제에 실패했습니다.');
      }
    };



    // 댓글 삭제 함수
    const handleDeleteComment = async (commentId: string) => {
      if (!confirm('정말로 이 댓글을 삭제하시겠습니까?')) {
        return;
      }

      try {
        console.log('댓글 삭제 요청:', {
          commentId,
          authorId: user?.sub || '',
          userSub: user?.sub
        });

        await commentAPI.deleteComment(commentId, user?.sub || '');
        alert('댓글이 삭제되었습니다.');
        
        // 페이지 새로고침으로 댓글 목록 업데이트
        window.location.reload();
      } catch (error) {
        console.error('댓글 삭제 오류:', error);
        alert('댓글 삭제에 실패했습니다.');
      }
    };


    
    return (
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* 보드 사이드바 (데스크톱) */}
          <aside className="hidden lg:block lg:col-span-1">
            <div className="bg-white border border-gray-200 rounded-lg sticky top-20">
              <div className="px-4 py-3 border-b border-gray-100">
                <h3 className="font-bold text-gray-900">📋 게시판 목록</h3>
              </div>
              <div className="p-2">
                {BOARD_LIST.map((b) => (
                  <button
                    key={b.key}
                    onClick={() => {
                        setActiveBoard(b.key);
                        setCurrentPage("board");
                    }}
                    className={`w-full text-left px-3 py-2 rounded text-sm mb-1 transition-colors ${
                      activeBoard === b.key
                        ? "bg-sky-50 text-sky-700"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {b.label}
                  </button>
                ))}
              </div>
            </div>
          </aside>
          
          {/* 글 내용 + 댓글 */}
          <div className="col-span-1 lg:col-span-3 bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
            <button
              onClick={() => setCurrentPage('board')}
              className="mb-4 text-sm text-sky-600 hover:underline flex items-center gap-1"
            >
              <ChevronLeft size={16} /> 목록으로
            </button>
            
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 break-words">{post.title}</h1>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between text-sm text-gray-500 border-b pb-4 mb-4 gap-2 sm:gap-0">
                <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                  <span className="flex items-center">
                    <User size={14} className="mr-1" /> 
                    <UserDisplayWithIcon 
                      username={post.author} 
                      authorId={post.authorId} 
                      currentUser={user} 
                    />
                  </span>
                  <span className="flex items-center">
                    <Eye size={14} className="mr-1" /> {post.viewCount}
                  </span>
                  <span className="flex items-center">
                    <MessageCircle size={14} className="mr-1" /> {post.commentCount}
                  </span>
                  <span className="flex items-center">
                    <Calendar size={14} className="mr-1" /> {new Date(post.createdAt).toLocaleString()}
                  </span>
                </div>
                
                {/* 게시글 수정/삭제 버튼 (작성자 또는 관리자만) */}
                {(user?.sub === post.authorId || adminStatus) && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEditPost(post)}
                      className="text-sky-600 hover:text-sky-800 text-xs px-2 py-1 rounded border border-sky-600 hover:bg-sky-50"
                    >
                      수정
                    </button>
                    <button
                      onClick={() => handleDeletePost()}
                      className="text-red-600 hover:text-red-800 text-xs px-2 py-1 rounded border border-red-600 hover:bg-red-50"
                    >
                      삭제
                    </button>
                  </div>
                )}
              </div>
              
              <div className="prose max-w-none text-gray-700 leading-relaxed mb-6">
                <p className="whitespace-pre-wrap break-words">{post.content}</p>
              </div>
              
                             <div className="flex items-center gap-4 border-t pt-4">
                 <button 
                   onClick={handleLikeClick}
                   disabled={likeLoading}
                   className={`flex items-center gap-1 transition-colors ${
                     isLiked 
                       ? 'text-red-500' 
                       : 'text-gray-600 hover:text-red-500'
                   } ${likeLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                 >
                   <Heart size={20} fill={isLiked ? 'currentColor' : 'none'} /> 
                   {likeCount} {adminStatus && isLiked ? '추가 공감' : '공감'}
                 </button>
               </div>
              
              <div className="mt-8">
                <h4 className="text-xl font-bold mb-4">댓글 ({comments.length})</h4>
                <div className="space-y-4">
                  {loading ? (
                    <div className="text-gray-500">댓글을 불러오는 중...</div>
                  ) : comments.length > 0 ? (
                    comments.map((c) => (
                      <div key={c.id} className="border-b pb-4">
                        <div className="flex items-start justify-between text-sm font-medium text-gray-900 gap-2">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <span className="truncate">
                              <UserDisplayWithIcon 
                                username={c.author} 
                                authorId={c.author_id} 
                                currentUser={user} 
                              />
                            </span>
                            <span className="text-gray-500 text-xs flex-shrink-0">· {new Date(c.created_at).toLocaleString('ko-KR')}</span>
                          </div>
                          
                          {/* 댓글 수정/삭제 버튼 (작성자 또는 관리자만) */}
                          {(() => {
                            console.log('댓글 권한 확인:', {
                              userSub: user?.sub,
                              commentAuthorId: c.author_id,
                              isMatch: user?.sub === c.author_id,
                              isAdmin: user?.groups?.includes('admin')
                            });
                            return (user?.sub === c.author_id || adminStatus);
                          })() && (
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <button
                                onClick={() => handleEditComment(c)}
                                className="text-sky-600 hover:text-sky-800 text-xs px-1 py-0.5 rounded hover:bg-sky-50"
                              >
                                수정
                              </button>
                              <button
                                onClick={() => handleDeleteComment(c.id)}
                                className="text-red-600 hover:text-red-800 text-xs px-1 py-0.5 rounded hover:bg-red-50"
                              >
                                삭제
                              </button>
                            </div>
                          )}
                        </div>
                        <p className="mt-1 text-gray-700 break-words whitespace-pre-wrap">{c.content}</p>
                      </div>
                    ))
                  ) : (
                    <div className="text-gray-500">아직 댓글이 없어요.</div>
                  )}
                </div>

                <div className="mt-6 flex flex-col sm:flex-row items-start gap-2">
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder={isAuthenticated ? "댓글을 남겨보세요..." : "로그인 후 댓글을 작성할 수 있습니다."}
                    rows={2}
                    className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
                    disabled={!isAuthenticated}
                  />
                  <button
                    onClick={handleCommentSubmit}
                    disabled={!isAuthenticated || submitting}
                    className={`px-4 sm:px-5 py-3 rounded-lg text-sm transition-colors min-h-[44px] ${
                      isAuthenticated && !submitting 
                        ? 'bg-sky-600 text-white hover:bg-sky-700 shadow-sm hover:shadow-md' 
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {submitting ? '등록 중...' : '등록'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

    );
  };


  /* 헤더 + 라우팅 */
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                      <div className="flex items-center justify-between h-20 pr-2">
            <div className="flex items-center gap-4 sm:gap-8">
              {/* 로고 = 홈 */}
              <button
                onClick={() => {
                  console.log('로고 클릭됨, 홈으로 이동');
                  setCurrentPage("home");
                }}
                className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-gray-100 transition-colors min-h-[44px] min-w-[44px]"
                title="홈"
              >
                <img 
                  src="/seesun-logo.png" 
                  alt="SeeSun 집중 로고" 
                  className="h-10 w-auto"
                />
              </button>

              <nav className="hidden xl:flex items-center">
                {/* 게시판 드롭다운 */}
                <div className="relative">
                  <button
                    className={`px-4 py-2 text-xs xl:text-sm font-medium flex items-center gap-1 ${
                      currentPage === "board" ? "text-sky-600" : "text-gray-700 hover:text-gray-900"
                    }`}
                    onClick={() => setShowCategoryDropdown((v) => !v)}
                  >
                    게시판
                    <ChevronDown size={14} />
                  </button>
                  {showCategoryDropdown && (
                    <div className="absolute top-full left-0 bg-white border border-gray-200 rounded-lg shadow-lg py-2 w-56 z-50">
                      {BOARD_LIST.map((b) => (
                        <button
                          key={b.key}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          onClick={() => {
                            setActiveBoard(b.key);
                            setCurrentPage("board");
                            setShowCategoryDropdown(false);
                          }}
                        >
                          {b.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* 스터디 모임 */}
                <button
                  onClick={() => setCurrentPage("study")}
                  className={`px-4 py-2 text-xs xl:text-sm font-medium ${
                    currentPage === "study" ? "text-sky-600" : "text-gray-700 hover:text-gray-900"
                  }`}
                >
                  스터디 모임
                </button>

                {/* 취업 뉴스 */}
                <button
                  onClick={() => setCurrentPage("jobsNews")}
                  className={`px-4 py-2 text-xs xl:text-sm font-medium ${
                    currentPage === "jobsNews" ? "text-sky-600" : "text-gray-700 hover:text-gray-900"
                  }`}
                >
                  취업 뉴스
                </button>

                {/* 취업 뉴스 (팀원 버전) */}

                
                {/* AI 자격증 검색 */}
                <button
                  onClick={() => setCurrentPage("aiSearch")}
                  className={`px-4 py-2 text-xs xl:text-sm font-medium ${
                    currentPage === "aiSearch" ? "text-sky-600" : "text-gray-700 hover:text-gray-900"
                  }`}
                >
                  AI 자격증 검색
                </button>

                {/* 포트폴리오 */}
                <button
                  onClick={() => setCurrentPage("portfolio")}
                  className={`px-4 py-2 text-xs xl:text-sm font-medium ${
                    currentPage === "portfolio" ? "text-sky-600" : "text-gray-700 hover:text-gray-900"
                  }`}
                >
                  AI 포트폴리오
                </button>
              </nav>
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
              {/* 모바일 메뉴 버튼 */}
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="xl:hidden p-3 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="메뉴 열기"
              >
                {showMobileMenu ? <X size={20} /> : <Menu size={20} />}
              </button>
              
              <div className="relative hidden sm:block">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={16}
                />
                <input
                  type="text"
                  placeholder="통합검색"
                  value={unifiedSearchTerm}
                  onChange={(e) => setUnifiedSearchTerm(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      executeUnifiedSearch(unifiedSearchTerm);
                    }
                  }}
                  className="pl-10 pr-4 py-2 w-44 lg:w-52 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-sky-500 text-gray-900"
                />
              </div>
              <div className="flex items-center gap-0.5">
                {isAuthenticated && user?.sub && (
                  <NotificationDropdown
                    currentUserId={user?.sub}
                    onNavigate={async (url) => {
                      console.log('🔍 알림 클릭 - 이동할 URL:', url);
                      
                      // URL에 따른 페이지 이동 로직
                      if (url.startsWith('/study-groups/')) {
                        const groupId = url.split('/').pop();
                        if (groupId) {
                          console.log('📚 스터디 그룹으로 이동:', groupId);
                          setSelectedStudyGroupId(groupId);
                          setCurrentPage("study");
                        }
                      } else if (url.startsWith('/board/posts/')) {
                        const postId = url.split('/').pop();
                        if (postId) {
                          try {
                            console.log('📝 게시글로 이동:', postId);
                            // 게시글 상세 정보 조회
                            const post = await postAPI.getPostById(postId);
                            setSelectedPost(post);
                            setCurrentPage("readPost");
                          } catch (error) {
                            console.error('❌ 게시글 조회 실패:', error);
                            // 실패 시 게시판 목록으로 이동
                            setCurrentPage("board");
                          }
                        }
                      } else {
                        console.log('⚠️ 알 수 없는 URL 형식:', url);
                      }
                    }}
                  />
                )}
                {isAuthenticated && (
                  <button 
                    onClick={() => setCurrentPage("myPage")}
                    className="p-1 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                  >
                  <User size={18} />
                </button>
                )}
                {isAuthenticated ? (
                  <div className="relative user-dropdown">
                    {/* 사용자 드롭다운 버튼 */}
                    <button 
                      onClick={() => setShowUserDropdown(!showUserDropdown)}
                      className="flex items-center space-x-2 bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-lg transition-colors min-h-[44px]"
                    >
                      <CheckCircle size={16} className="text-green-600" />
                      <span className="hidden sm:inline text-gray-700 text-sm">
                        {user?.groups?.includes('admin') ? '👑 관리자' : '내 정보'}
                      </span>
                      <ChevronDown size={14} className="text-gray-500" />
                    </button>
                    
                    {/* 사용자 드롭다운 메뉴 */}
                    {showUserDropdown && (
                      <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                        <div className="p-3 border-b border-gray-100">
                          <div className="text-sm font-medium text-gray-900">
                            {user?.groups?.includes('admin') ? '👑 관리자' : '사용자'}
                          </div>
                          <div className="text-xs text-gray-500 truncate">
                            {user?.email || user?.username || '사용자'}
                          </div>
                        </div>
                        <div className="p-1">
                          <button
                            onClick={() => {
                              handleLogout();
                              setShowUserDropdown(false);
                            }}
                            className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded"
                          >
                            🚪 로그아웃
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <button onClick={handleLogin} className="bg-sky-600 text-white px-3 sm:px-4 py-2 rounded text-xs sm:text-sm hover:bg-sky-700 transition-colors min-h-[44px]">
                    로그인
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
        
                 {/* 모바일 메뉴 */}
         {showMobileMenu && (
           <>
             {/* 모바일 메뉴 배경 오버레이 */}
             <div 
               className="fixed inset-0 bg-black bg-opacity-25 z-30 xl:hidden"
               onClick={() => setShowMobileMenu(false)}
             />
             <div className="xl:hidden bg-white border-t border-gray-200 relative z-40">
              <div className="px-4 py-3">
              {/* 모바일 검색 */}
              <div className="relative mb-4">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={16}
                />
                <input
                  type="text"
                  placeholder="통합검색"
                  value={unifiedSearchTerm}
                  onChange={(e) => setUnifiedSearchTerm(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      executeUnifiedSearch(unifiedSearchTerm);
                      setShowMobileMenu(false);
                    }
                  }}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-sky-500 text-gray-900"
                />
              </div>
              
              {/* 모바일 네비게이션 */}
              <nav className="space-y-2">
                <button
                  onClick={() => {
                    setCurrentPage("home");
                    setShowMobileMenu(false);
                  }}
                  className={`w-full text-left px-3 py-3 rounded-lg text-sm transition-colors min-h-[44px] ${
                    currentPage === "home" ? "bg-sky-50 text-sky-700" : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  🏠 홈
                </button>
                
                <div className="border-t border-gray-100 pt-2">
                  <div className="text-xs font-medium text-gray-500 mb-2 px-3">게시판</div>
                  {BOARD_LIST.map((b) => (
                                          <button
                        key={b.key}
                        onClick={() => {
                          setActiveBoard(b.key);
                          setCurrentPage("board");
                          setShowMobileMenu(false);
                        }}
                        className={`w-full text-left px-3 py-3 rounded-lg text-sm transition-colors min-h-[44px] ${
                          currentPage === "board" && activeBoard === b.key ? "bg-sky-50 text-sky-700" : "text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        {b.label}
                      </button>
                  ))}
                </div>
                
                <div className="border-t border-gray-100 pt-2">
                  <button
                    onClick={() => {
                      setCurrentPage("study");
                      setShowMobileMenu(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded text-sm ${
                      currentPage === "study" ? "bg-sky-50 text-sky-700" : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    📚 스터디 모임
                  </button>
                  
                  <button
                    onClick={() => {
                      setCurrentPage("jobsNews");
                      setShowMobileMenu(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded text-sm ${
                      currentPage === "jobsNews" ? "bg-sky-50 text-sky-700" : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    📰 취업 뉴스
                  </button>
                  
                  <button
                    onClick={() => {
                      setCurrentPage("aiSearch");
                      setShowMobileMenu(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded text-sm ${
                      currentPage === "aiSearch" ? "bg-sky-50 text-sky-700" : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    🤖 AI 자격증 검색
                  </button>
                  
                  <button
                    onClick={() => {
                      setCurrentPage("portfolio");
                      setShowMobileMenu(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded text-sm ${
                      currentPage === "portfolio" ? "bg-sky-50 text-sky-700" : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    📁 AI 포트폴리오
                  </button>
                </div>
              </nav>
            </div>
          </div>
        </>
        )}
      </header>

      {/* Main */}
      <main>
        {currentPage === "home" && renderHome()}
        {currentPage === "board" && renderBoard()}
        {currentPage === "study" && renderStudy()}
        {currentPage === "jobsNews" && <JobNews />}
        
        {currentPage === "aiSearch" && <CertificateSearch />}
        {currentPage === "portfolio" && (
          <AIPortfolioFeedback />
        )}
                      {currentPage === "myPage" && isAuthenticated && user?.sub && (
                <MyPage
                  userId={user?.sub} 
            onNavigate={(url) => {
              // URL에 따른 페이지 이동 로직
              if (url.startsWith('/study-groups/')) {
                const groupId = url.split('/').pop();
                if (groupId) {
                  setSelectedStudyGroupId(groupId);
                  setCurrentPage("study");
                }
              } else if (url.startsWith('/board/posts/')) {
                const urlParts = url.split('?');
                const postId = urlParts[0].split('/').pop();
                const params = new URLSearchParams(urlParts[1] || '');
                const category = params.get('category');
                
                if (postId) {
                  // 카테고리 정보가 있으면 해당 게시판으로 설정
                  if (category) {
                    const boardKey = getBoardKeyFromCategory(category);
                    if (boardKey) {
                      setActiveBoard(boardKey);
                    }
                  }
                  handlePostClick({ id: postId } as Post);
                }
              }
            }}
          />
        )}
        {currentPage === "about" && (
          <AboutPage onBack={() => setCurrentPage("home")} />
        )}
                 {currentPage === "readPost" && selectedPost && <ReadPostPage post={selectedPost} />}
         {currentPage === "unifiedSearchResults" && (
           <div className="max-w-7xl mx-auto px-4 py-6">
             <div className="bg-white border border-gray-200 rounded-lg">
               <div className="px-6 py-4 border-b border-gray-200">
                 <div className="flex items-center justify-between">
                   <h2 className="text-xl font-bold text-gray-900">
                     통합검색 결과: "{lastUnifiedSearchTerm}" ({unifiedSearchResults.length}건)
                   </h2>
                   <button 
                     onClick={() => setCurrentPage('home')}
                     className="text-sm text-sky-600 hover:underline"
                   >
                     홈으로 돌아가기
                   </button>
                 </div>
               </div>

               {/* 통합검색 결과 리스트 */}
               <div className="divide-y divide-gray-100">
                 {unifiedSearchLoading ? (
                   <div className="px-6 py-4 text-gray-500 text-center">검색 중...</div>
                 ) : unifiedSearchResults.length > 0 ? (
                   unifiedSearchResults.map((post, idx) => (
                     <div 
                       key={post.id} 
                       className="px-6 py-4 hover:bg-gray-50 cursor-pointer"
                       onClick={() => handlePostClick(post)}
                     >
                       <div className="flex items-start gap-4">
                         <div className="text-2xl font-bold text-gray-300 min-w-[2rem]">
                           {idx + 1}
                         </div>
                         <div className="flex-1">
                           <div className="flex items-center gap-2 mb-2">
                             <span className="bg-sky-100 text-sky-800 text-xs px-2 py-1 rounded-full">
                               {(post as any).boardName || post.category_name}
                             </span>
                           </div>
                           <h3 className="text-lg font-medium text-gray-900 mb-2">
                             {post.title}
                           </h3>
                           <div className="flex items-center gap-4 text-sm text-gray-500">
                             <UserDisplayWithIcon 
                               username={post.author} 
                               authorId={post.authorId} 
                               currentUser={user} 
                             />
                             <span>조회 {post.viewCount}</span>
                             <span>댓글 {post.commentCount}</span>
                             <span>{timeAgo(new Date(post.createdAt))}</span>
                           </div>
                         </div>
                       </div>
                     </div>
                   ))
                 ) : (
                   <div className="px-6 py-4 text-gray-500 text-center">검색 결과가 없습니다.</div>
                 )}
               </div>
             </div>
           </div>
         )}
         {currentPage === "searchResults" && (
           <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
             <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
               {/* 보드 사이드바 (데스크톱) */}
               <aside className="hidden lg:block lg:col-span-1">
                 <div className="bg-white border border-gray-200 rounded-lg sticky top-20">
                   <div className="px-4 py-3 border-b border-gray-100">
                     <h3 className="font-bold text-gray-900">📋 게시판 목록</h3>
                   </div>
                   <div className="p-2">
                     {BOARD_LIST.map((b) => (
                       <button
                         key={b.key}
                         onClick={() => {
                           setActiveBoard(b.key);
                           setCurrentPage("board");
                         }}
                         className={`w-full text-left px-3 py-2 rounded text-sm mb-1 transition-colors ${
                           activeBoard === b.key
                             ? "bg-sky-50 text-sky-700"
                             : "text-gray-700 hover:bg-gray-50"
                         }`}
                       >
                         {b.label}
                       </button>
                     ))}
                   </div>
                 </div>
               </aside>

               {/* 검색 결과 */}
               <section className="col-span-1 lg:col-span-3">
                 <div className="bg-white border border-gray-200 rounded-lg">
                   <div className="px-6 py-4 border-b border-gray-200">
                     <div className="flex items-center justify-between">
                       <h2 className="text-xl font-bold text-gray-900">
                         검색 결과: "{searchTerm}" ({searchResults.length}건)
                       </h2>
                       <button 
                         onClick={() => setCurrentPage('board')}
                         className="text-sm text-sky-600 hover:underline"
                       >
                         목록으로 돌아가기
                       </button>
                     </div>
                   </div>

                   {/* 검색 결과 리스트 */}
                   <div className="divide-y divide-gray-100">
                     {searchLoading ? (
                       <div className="px-6 py-4 text-gray-500 text-center">검색 중...</div>
                     ) : searchResults.length > 0 ? (
                                               searchResults.map((post, idx) => (
                          <div 
                            key={post.id} 
                            className="px-6 py-4 hover:bg-gray-50 cursor-pointer"
                            onClick={() => handlePostClick(post)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="text-sm font-bold text-gray-900">{idx + 1}</span>
                                  <span className="text-xs bg-sky-100 text-sky-700 px-2 py-1 rounded">
                                    {post.category_name}
                                  </span>
                                </div>
                                <h3 className="text-gray-900 hover:text-sky-600 font-medium mb-2">
                                  {post.title}
                                </h3>
                                <div className="flex items-center gap-4 text-xs text-gray-500">
                                  <UserDisplayWithIcon 
                                    username={post.author} 
                                    authorId={post.authorId} 
                                    currentUser={user} 
                                  />
                                  <span>조회 {post.viewCount}</span>
                                  <span>댓글 {post.commentCount}</span>
                                  <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                     ) : (
                       <div className="px-6 py-4 text-gray-500 text-center">
                         검색 결과가 없습니다.
                       </div>
                     )}
                   </div>
                 </div>
               </section>
             </div>
           </div>
         )}
      </main>

      {/* Study Modal */}
      {showStudyModal && <StudyModal />}
      {showWriteModal && <WritePostModal />}

      {/* 게시글 수정 모달 */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">게시글 수정</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  제목
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm sm:text-base"
                  placeholder="제목을 입력하세요"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  내용
                </label>
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  rows={8}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm sm:text-base resize-none"
                  placeholder="내용을 입력하세요"
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-2 mt-4 sm:mt-6">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 sm:px-5 py-3 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm sm:text-base transition-colors min-h-[44px]"
                disabled={editLoading}
              >
                취소
              </button>
              <button
                onClick={handleEditSubmit}
                disabled={editLoading}
                className={`px-4 sm:px-5 py-3 rounded-lg text-sm sm:text-base transition-colors min-h-[44px] ${
                  editLoading 
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                    : 'bg-sky-600 text-white hover:bg-sky-700 shadow-sm hover:shadow-md'
                }`}
              >
                {editLoading ? '수정 중...' : '수정 완료'}
              </button>
            </div>
          </div>
        </div>
      )}

                {/* Cognito 로그인 모달 */}
                <LoginModal
                  isOpen={showLoginModal}
                  onClose={() => setShowLoginModal(false)}
                  onSwitchToRegister={() => {
                    setShowLoginModal(false);
                    setShowRegisterModal(true);
                  }}
                />

                {/* Cognito 회원가입 모달 */}
                <RegisterModal
                  isOpen={showRegisterModal}
                  onClose={() => setShowRegisterModal(false)}
                  onSwitchToLogin={() => {
                    setShowRegisterModal(false);
                    setShowLoginModal(true);
                  }}
                />

          {/* 댓글 수정 모달 */}
          <CommentEditModal
            isOpen={showCommentEditModal}
            onClose={() => setShowCommentEditModal(false)}
            onSubmit={handleCommentEditSubmit}
            initialContent={editingComment?.content || ''}
            loading={editCommentLoading}
          />

          {/* 알림 권한 컴포넌트 (임시 비활성화) */}
          {/* <NotificationPermission /> */}
    </div>
  );
};

export default CertificationCommunity;

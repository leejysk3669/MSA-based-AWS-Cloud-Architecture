// src/components/JobNews.tsx
import { useEffect, useMemo, useState } from "react";
import { RefreshCw, Search, Bell, User } from "lucide-react";
import { jobsNewsAPI, JobNewsItem } from '../services/api';

type SortBy = "popular" | "latest";

function normalizeTitle(t: string) {
  return (t || "")
    .toLowerCase()
    .replace(/\[[^\]]+\]/g, "")
    .replace(/\([^)]*\)/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// 취업 관련 키워드를 굵은 글자로 강조하는 함수
function highlightJobKeywords(title: string): string {
  const jobKeywords = [
    '취업', '채용', '공채', '신입', '경력', '인턴', '아르바이트', '알바',
    '직장', '회사', '기업', '스타트업', '대기업', '중소기업', '공기업',
    'IT', '개발자', '프로그래머', '엔지니어', '마케팅', '영업', '디자인',
    '기획', '운영', '관리', '서비스', '제품', '솔루션', '플랫폼',
    'AI', '인공지능', '머신러닝', '딥러닝', 'ML', '데이터사이언스',
    '소프트웨어', '하드웨어', '웹개발', '앱개발', '프론트엔드', '백엔드',
    '풀스택', '데이터베이스', '클라우드', '서버', '네트워크', '보안',
    '시스템', '인프라', '데브옵스', 'QA', '테스트', '배포', 'CI/CD',
    // 공모전 관련 키워드
    '공모전', '콘테스트', '대회', '경진대회', '해커톤', '해커톤대회',
    '모집', '접수', '시작', '개최', '주최', '후원', '참가', '참여',
    '수상', '상금', '상품', '시상', '시상식', '결과', '발표',
    '창업', '창업대회', '아이디어', '아이디어톤', '스타트업대회',
    '챌린지', '챌린지대회', '프로젝트', '프로젝트대회', '앱개발대회',
    '웹서비스', '모바일앱', '게임', '게임개발', '게임대회',
    
    // 대외활동 관련 키워드
    '대외활동', '동아리', '동아리활동', '학회', '학술대회', '세미나',
    '워크샵', '컨퍼런스', '심포지엄', '포럼', '토론회', '강연',
    '멘토링', '멘토링프로그램', '멘토', '멘티', '코칭', '코치',
    '인턴십', '인턴', '인턴프로그램', '체험학습', '현장실습',
    '봉사활동', '자원봉사', '사회봉사', '기부', '기부활동',
    '리더십', '리더십프로그램', '리더십개발', '팀워크', '협력',
    '네트워킹', '네트워킹행사', '커뮤니티', '모임', '클럽',
    '스터디', '스터디그룹', '스터디모임', '스터디클럽',
    '프로젝트', '프로젝트활동', '팀프로젝트', '그룹프로젝트',
    '연구', '연구활동', '연구프로젝트', '연구실', '연구소',
    '조사', '설문조사', '시장조사', '리서치', '리서치활동',
    '발표', '발표회', '프레젠테이션', 'PT', '피칭',
    '포트폴리오', '포트폴리오작성', '이력서', '자기소개서',
    '자격증', '자격증취득', '자격증시험', '자격증과정',
    '교육', '교육과정', '교육프로그램', '훈련', '훈련과정',
    '워크숍', '부트캠프', '캠프', '캠프활동', '캠프프로그램'
  ];
  
  let highlightedTitle = title;
  
  // 키워드를 내림차순으로 정렬 (긴 키워드부터 처리)
  const sortedKeywords = jobKeywords.sort((a, b) => b.length - a.length);
  
  for (const keyword of sortedKeywords) {
    const regex = new RegExp(`(${keyword})`, 'gi');
    highlightedTitle = highlightedTitle.replace(regex, '<strong>$1</strong>');
  }
  
  return highlightedTitle;
}

// 한국시간으로 변환하는 함수
function convertToKST(dateString: string): Date {
  console.log('🕐 원본 날짜 문자열:', dateString);
  
  const date = new Date(dateString);
  console.log('🕐 파싱된 Date 객체:', date);
  console.log('🕐 UTC 시간:', date.toISOString());
  console.log('🕐 로컬 시간:', date.toString());
  
  // 서버에서 받은 시간이 이미 한국시간인지 확인
  // 만약 서버가 이미 한국시간으로 보내고 있다면 변환하지 않음
  if (dateString.includes('KST') || dateString.includes('+09:00')) {
    console.log('🕐 이미 한국시간입니다');
    return date;
  }
  
  // 서버가 UTC 시간으로 보내고 있다면 한국시간으로 변환
  // 하지만 현재 상황을 보면 서버가 이미 한국시간을 보내고 있을 가능성이 높음
  // 따라서 원본 시간을 그대로 사용
  console.log('🕐 원본 시간을 그대로 사용합니다');
  return date;
}

// 날짜 포맷팅 함수 - 기사 날짜를 정확하게 표시 (예: 9월 2일)
function formatDate(dateString: string): string {
  // 한국시간으로 변환 (현재는 원본 시간 사용)
  const date = convertToKST(dateString);
  
  // 유효하지 않은 날짜인지 확인
  if (isNaN(date.getTime())) {
    console.warn('유효하지 않은 날짜:', dateString);
    return "날짜 정보 없음";
  }
  
  // 현재 시간과 비교하여 날짜 조정
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const articleDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  
  // 크롤링된 기사의 날짜가 현재보다 미래인 경우, 현재 날짜로 조정
  let adjustedDate = date;
  if (articleDate > today) {
    console.log('🕐 미래 날짜 감지, 현재 날짜로 조정:', {
      원본: dateString,
      기사날짜: articleDate,
      오늘: today
    });
    
    // 현재 날짜의 같은 시간으로 조정 (시간 정보는 유지)
    adjustedDate = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      date.getHours(),
      date.getMinutes(),
      date.getSeconds()
    );
  }
  
  // "M월 D일" 형식으로 표시 (년도 제거)
  return adjustedDate.toLocaleDateString('ko-KR', { 
    month: 'long', 
    day: 'numeric'
  });
}

export default function JobsNews() {
  const [items, setItems] = useState<JobNewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  // 페이지네이션 상태
  const [currentPageNum, setCurrentPageNum] = useState(1);
  const [newsPerPage] = useState(10);

  const fetchNews = async () => {
    setLoading(true);
    try {
      const response = await jobsNewsAPI.getJobNews();
      console.log('🔍 취업뉴스 API 응답:', response);
      console.log('📅 첫 번째 뉴스 아이템:', response.items?.[0]);
      setItems(response.items || []);
    } catch (error) {
      console.error('뉴스 로드 실패:', error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  // 자동 새로고침 (5분마다)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchNews();
    }, 5 * 60 * 1000); // 5분

    return () => clearInterval(interval);
  }, []);

  // 중복(같은 뉴스 제목) 집계해서 '인기순' 기준으로 사용
  const prepared = useMemo(() => {
    const map = new Map<
      string,
      { item: JobNewsItem; count: number; latestAt: number }
    >();

    for (const it of items) {
      const key = normalizeTitle(it.title);
      const at = it.date ? new Date(it.date).getTime() : 0;

      if (!map.has(key)) {
        map.set(key, {
          item: it,
          count: 1,
          latestAt: at,
        });
      } else {
        const v = map.get(key)!;
        v.count += 1;
        if (at > v.latestAt) {
          v.latestAt = at;
          v.item = it; // 최신 항목을 대표로
        }
      }
    }

    const unique = [...map.values()].map((v) => ({
      ...v.item,
      __count: v.count,
      __latestAt: v.latestAt,
    })) as (JobNewsItem & { __count: number; __latestAt: number })[];

    // 항상 최신순으로 정렬
    unique.sort(
      (a, b) =>
        (b.date ? new Date(b.date).getTime() : 0) -
        (a.date ? new Date(a.date).getTime() : 0)
    );

    return unique;
  }, [items]);

  // 페이지 변경 함수
  const handlePageChange = (page: number) => {
    setCurrentPageNum(page);
  };

  // 페이지네이션 계산
  const totalPages = Math.ceil(prepared.length / newsPerPage);
  const startIndex = (currentPageNum - 1) * newsPerPage;
  const endIndex = startIndex + newsPerPage;
  const currentNews = prepared.slice(startIndex, endIndex);

  // 페이지네이션 그룹 계산 (5페이지씩 표시)
  const getPageNumbers = () => {
    const pagesPerGroup = 5;
    const currentGroup = Math.ceil(currentPageNum / pagesPerGroup);
    const startPage = (currentGroup - 1) * pagesPerGroup + 1;
    const endPage = Math.min(startPage + pagesPerGroup - 1, totalPages);
    
    return Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* 카드 전체: 세로 플렉스 (헤더 고정, 리스트 가변) */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg flex flex-col min-h-[600px]">
                 {/* 헤더 */}
         <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
           <div className="flex items-center gap-2">
             <h3 className="text-2xl font-bold text-gray-900">📰 취업 뉴스</h3>
           </div>

          {/* 새로고침 버튼과 뉴스 개수 */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600 font-medium">
              {prepared.length}건
            </span>
            <button
              onClick={fetchNews}
              disabled={loading}
              className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm font-medium disabled:opacity-50 flex items-center gap-1"
              title="새로고침"
            >
              🔄 새로고침
            </button>
          </div>
        </div>

        {/* 리스트 영역: 최소 높이 + 스크롤 */}
        <div className="p-4 flex-1 overflow-y-auto min-h-[500px]">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-sm text-gray-500">뉴스를 불러오는 중...</div>
            </div>
          ) : prepared.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-sm text-gray-500 mb-2">표시할 뉴스가 없어요.</div>
              <button
                onClick={fetchNews}
                className="text-xs text-blue-600 hover:underline"
              >
                새로고침
              </button>
            </div>
          ) : (
            <ul className="space-y-3">
              {currentNews.map((n, i) => (
                <li key={i} className="text-sm border-b border-gray-100 pb-3 last:border-b-0">
                  <div className="flex items-start gap-3">
                    {/* 이미지 */}
                    {n.thumbnail && (
                      <div className="flex-shrink-0">
                        <img 
                          src={n.thumbnail} 
                          alt={n.title}
                          className="w-16 h-12 object-cover rounded"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                    
                                         {/* 텍스트 내용 */}
                     <div className="flex-1 min-w-0">
                       <a
                         href={n.href}
                         target="_blank"
                         rel="noreferrer"
                         className="block hover:bg-gray-50 p-2 -m-2 rounded transition-colors"
                         title={n.title}
                       >
                         <div 
                           className="text-gray-900 hover:text-blue-600 line-clamp-2 font-medium"
                           dangerouslySetInnerHTML={{ __html: highlightJobKeywords(n.title) }}
                         />
                                 <div className="mt-1 text-xs text-gray-500">
          {n.date && formatDate(n.date)}
        </div>
                       </a>
                     </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* 페이지네이션 */}
        {totalPages > 1 && (
          <div className="px-4 py-4 border-t border-gray-200">
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
                {startIndex + 1}-{Math.min(endIndex, prepared.length)} / {prepared.length} 기사
              </span>
            </div>
          </div>
        )}

        {/* 푸터 */}
        {prepared.length > 0 && (
          <div className="px-4 py-2 border-t border-gray-100 bg-gray-50">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>{prepared.length}건의 뉴스</span>
              <span>5분마다 자동 새로고침</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import { Search, Loader2, Calendar, BookOpen, TrendingUp, Target, Award, Info, DollarSign, Users, Star } from 'lucide-react';

interface CertificateResult {
  name: string;
  fullContent: string;
}

interface CertificateSection {
  title: string;
  content: string;
  icon: React.ReactNode;
  color: string;
}

interface BannerItem {
  title: string;
  link: string;
  cover: string;
}

const CertificateSearch: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [results, setResults] = useState<CertificateResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingTime, setLoadingTime] = useState(0);
  const [estimatedTime, setEstimatedTime] = useState(0);
  const [disableAutocomplete, setDisableAutocomplete] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [bannerItems, setBannerItems] = useState<BannerItem[]>([]);
  const [showLeftAd, setShowLeftAd] = useState(false);
  const [showRightAd, setShowRightAd] = useState(false);
  const suggestionRef = useRef<HTMLDivElement>(null);
  const loadingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // AI 응답을 섹션별로 파싱하는 함수
  const parseCertificateContent = (content: string): CertificateSection[] => {
    const sections: CertificateSection[] = [];
    const lines = content.split('\n');
    let currentSection: Partial<CertificateSection> = {};
    let currentContent: string[] = [];

    const sectionConfigs = [
      { 
        title: '자격증 개요', 
        keywords: ['개요', '자격명', '시행기관', '응시자격', '직무범위'],
        icon: <Info className="w-5 h-5" />,
        color: 'blue'
      },
      { 
        title: '시험 구성', 
        keywords: ['시험 구성', '필기', '실기', '과목', '합격 기준'],
        icon: <BookOpen className="w-5 h-5" />,
        color: 'green'
      },
      { 
        title: '시험 일정 및 응시료', 
        keywords: ['시험 일정', '접수기간', '시행일', '발표일', '응시료', '일정 및 응시료'],
        icon: <Calendar className="w-5 h-5" />,
        color: 'purple'
      },
      { 
        title: '출제 경향', 
        keywords: ['출제 경향', '출제 비중', '중요도', '준비 포인트'],
        icon: <TrendingUp className="w-5 h-5" />,
        color: 'orange'
      },
      { 
        title: '취득 방법', 
        keywords: ['취득 방법', '준비 방법', '학습 방법'],
        icon: <Target className="w-5 h-5" />,
        color: 'indigo'
      },
      { 
        title: '합격률 및 중요 포인트', 
        keywords: ['합격률', '중요 포인트', '합격 팁'],
        icon: <Award className="w-5 h-5" />,
        color: 'red'
      },
      { 
        title: '검정 현황', 
        keywords: ['검정 현황', '응시자 현황', '연도별', '직업별', '지역별'],
        icon: <Users className="w-5 h-5" />,
        color: 'teal'
      },
      { 
        title: '우대 현황', 
        keywords: ['우대 현황', '취업 우대', '진학 우대', '기타 혜택'],
        icon: <Star className="w-5 h-5" />,
        color: 'pink'
      }
    ];

    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // 섹션 제목 찾기 (### 또는 ## 로 시작하는 라인)
      if (trimmedLine.startsWith('###') || trimmedLine.startsWith('##')) {
        // 이전 섹션 저장
        if (currentSection.title && currentContent.length > 0) {
          sections.push({
            ...currentSection as CertificateSection,
            content: currentContent.join('\n').trim()
          });
        }

        // 새 섹션 시작
        const title = trimmedLine.replace(/^#+\s*/, '').trim();
        const config = sectionConfigs.find(config => 
          config.keywords.some(keyword => title.includes(keyword))
        );

        currentSection = {
          title,
          icon: config?.icon || <Info className="w-5 h-5" />,
          color: config?.color || 'gray'
        };
        currentContent = [];
      } else if (trimmedLine) {
        currentContent.push(line);
      }
    }

    // 마지막 섹션 저장
    if (currentSection.title && currentContent.length > 0) {
      sections.push({
        ...currentSection as CertificateSection,
        content: currentContent.join('\n').trim()
      });
    }

    return sections;
  };

  // 표 형식을 개선하는 함수
  const formatTableContent = (content: string): string => {
    return content
      // 연도 생략 (2025. -> 빈 문자열)
      .replace(/2025\./g, '')
      .replace(/2024\./g, '')
      // 표 헤더 간소화
      .replace(/필기시험 접수기간/g, '필기 접수')
      .replace(/필기시험 시행일/g, '필기 시험')
      .replace(/필기시험 합격자 발표일/g, '필기 발표')
      .replace(/실기시험 접수기간/g, '실기 접수')
      .replace(/실기시험 시행일/g, '실기 시험')
      .replace(/실기시험 합격자 발표일/g, '실기 발표')
      // 시험명 간소화
      .replace(/2025년 정기 기사/g, '정기 기사');
  };

  // 표를 파싱하고 렌더링하는 함수
  const renderTable = (content: string): string => {
    const lines = content.split('\n');
    const tableLines = lines.filter(line => line.includes('|'));
    
    if (tableLines.length === 0) return content;

    let tableHtml = '<div class="overflow-x-auto my-6 sm:my-4">';
    tableHtml += '<table class="min-w-full bg-white border border-gray-200 rounded-lg shadow-sm">';
    
    tableLines.forEach((line, index) => {
      const cells = line.split('|').map(cell => cell.trim()).filter(cell => cell);
      
      if (cells.length === 0) return;
      
      if (index === 0) {
        // 헤더 행
        tableHtml += '<thead class="bg-gray-50">';
        tableHtml += '<tr>';
        cells.forEach(cell => {
          tableHtml += `<th class="px-3 py-4 sm:px-4 sm:py-3 text-left text-base sm:text-sm font-semibold text-gray-900 border-b border-gray-200 whitespace-nowrap">${cell}</th>`;
        });
        tableHtml += '</tr>';
        tableHtml += '</thead>';
        tableHtml += '<tbody>';
      } else if (index === 1 && cells.every(cell => cell.match(/^-+$/))) {
        // 구분선 행은 건너뛰기
        return;
      } else {
        // 데이터 행
        tableHtml += '<tr class="hover:bg-gray-50">';
        cells.forEach((cell, cellIndex) => {
          const isFirstCell = cellIndex === 0;
          const cellClass = isFirstCell 
            ? 'px-3 py-4 sm:px-4 sm:py-3 text-base sm:text-sm font-medium text-gray-900 border-b border-gray-100 whitespace-nowrap'
            : 'px-3 py-4 sm:px-4 sm:py-3 text-base sm:text-sm text-gray-700 border-b border-gray-100 whitespace-nowrap';
          tableHtml += `<td class="${cellClass}">${cell}</td>`;
        });
        tableHtml += '</tr>';
      }
    });
    
    tableHtml += '</tbody>';
    tableHtml += '</table>';
    tableHtml += '</div>';
    
    // 원본 텍스트에서 표 부분을 HTML로 교체
    const tableStart = content.indexOf(tableLines[0]);
    const tableEnd = content.lastIndexOf(tableLines[tableLines.length - 1]) + tableLines[tableLines.length - 1].length;
    
    return content.substring(0, tableStart) + tableHtml + content.substring(tableEnd);
  };

  // 마크다운 내용을 HTML로 변환하는 함수
  const formatContent = (content: string): string => {
    let formattedContent = renderTable(formatTableContent(content));
    
    // 리스트 처리
    const lines = formattedContent.split('\n');
    let inList = false;
    let listItems: string[] = [];
    let result: string[] = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      if (line.trim().startsWith('- ')) {
        // 리스트 항목 시작
        if (!inList) {
          inList = true;
          listItems = [];
        }
        const itemText = line.trim().substring(2); // '- ' 제거
        listItems.push(`<li class="ml-6 sm:ml-4 text-base sm:text-sm mb-1">${itemText}</li>`);
      } else {
        // 리스트가 끝남
        if (inList && listItems.length > 0) {
          result.push(`<ul class="list-disc space-y-1 mb-4">${listItems.join('')}</ul>`);
          listItems = [];
          inList = false;
        }
        
        if (line.trim()) {
          // 일반 텍스트 처리
          let processedLine = line
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/### (.*?)/g, '<h3 class="text-xl sm:text-lg font-semibold mt-6 sm:mt-4 mb-3 sm:mb-2">$1</h3>')
            .replace(/## (.*?)/g, '<h2 class="text-2xl sm:text-xl font-semibold mt-8 sm:mt-6 mb-4 sm:mb-3">$1</h2>');
          
          result.push(processedLine);
        } else {
          result.push('<br>');
        }
      }
    }
    
    // 마지막 리스트 처리
    if (inList && listItems.length > 0) {
      result.push(`<ul class="list-disc space-y-1 mb-4">${listItems.join('')}</ul>`);
    }
    
    return result.join('\n');
  };

     // 자동완성 기능
   useEffect(() => {
     const fetchSuggestions = async () => {
       if (searchTerm.length < 2 || disableAutocomplete) {
         setSuggestions([]);
         return;
       }
       
       // 백엔드 API 호출 (API Gateway 사용)
       try {
         console.log('Fetching suggestions from backend for:', searchTerm);
         const apiUrl = import.meta.env.VITE_USE_API_GATEWAY === 'true' 
           ? `${import.meta.env.VITE_API_GATEWAY_URL || 'https://7d1opsumn9.execute-api.ap-northeast-2.amazonaws.com/dev'}/api/search/autocomplete?q=${encodeURIComponent(searchTerm)}`
           : `/api/search/autocomplete?q=${encodeURIComponent(searchTerm)}`;
         const response = await fetch(apiUrl);
         console.log('Autocomplete response status:', response.status);
         console.log('Autocomplete response headers:', response.headers);
         
         if (response.ok) {
           const data = await response.json();
           console.log('Autocomplete data from backend:', data);
           if (data && Array.isArray(data) && data.length > 0) {
             setSuggestions(data.slice(0, 10)); // 최대 10개만 표시
             return;
           }
         } else {
           console.error('Backend autocomplete failed with status:', response.status);
           const errorText = await response.text();
           console.error('Backend error response:', errorText);
         }
       } catch (backendErr) {
         console.log('Backend autocomplete not available');
         console.error('Backend error details:', backendErr);
         setSuggestions([]); // 백엔드 실패 시 빈 배열
       }
     };
    
    const handler = setTimeout(() => {
      fetchSuggestions();
    }, 300);
    
    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm, disableAutocomplete]);

  // 검색 기능 (백엔드 API 또는 샘플 데이터 사용)
  const handleSearch = async (term: string) => {
    if (!term || term.trim() === '') {
      setError('검색어를 입력해주세요.');
      setResults([]);
      return;
    }

    setLoading(true);
    setError(null);
    setSuggestions([]);
    setLoadingTime(0);
    setEstimatedTime(0);
    setHasSearched(true);

    // 로딩 시간 측정 시작
    const startTime = Date.now();
    loadingIntervalRef.current = setInterval(() => {
      setLoadingTime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    // 백엔드 API 시도 (프록시 사용)
    setEstimatedTime(17); // 실제 평균 API 호출 시간

    try {
      console.log('Searching for certificate:', term);
      const apiUrl = import.meta.env.VITE_USE_API_GATEWAY === 'true' 
        ? `${import.meta.env.VITE_API_GATEWAY_URL || 'https://7d1opsumn9.execute-api.ap-northeast-2.amazonaws.com/dev'}/api/search?q=${encodeURIComponent(term)}`
        : `/api/search?q=${encodeURIComponent(term)}`;
      const response = await fetch(apiUrl);
      console.log('Search response status:', response.status);
      console.log('Search response headers:', response.headers);
      
      if (!response.ok) {
        console.error('Search failed with status:', response.status);
        const errorText = await response.text();
        console.error('Search error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Search results:', data);
      
      if (data && Array.isArray(data)) {
        setResults(data);
        
        // 알라딘 책 추천 배너 가져오기
        try {
          const bannerBase = import.meta.env.VITE_USE_API_GATEWAY === 'true'
            ? `${import.meta.env.VITE_API_GATEWAY_URL || 'https://7d1opsumn9.execute-api.ap-northeast-2.amazonaws.com/dev'}`
            : '';
          const bannerResp = await fetch(`${bannerBase}/api/ads/banner?keyword=${encodeURIComponent(term)}`);
          
          if (bannerResp.ok) {
            const bannerJson = await bannerResp.json();
            if (bannerJson && Array.isArray(bannerJson.items)) {
              setBannerItems(bannerJson.items.slice(0, 2));
              setShowLeftAd(bannerJson.items.length > 0);
              setShowRightAd(bannerJson.items.length > 1);
            }
          }
        } catch (e) {
          console.error('Failed to fetch banner items', e);
          // 배너 로드 실패는 검색 결과에 영향 없음
        }
        
        return; // 성공하면 여기서 종료
      } else {
        throw new Error('검색 결과 형식이 올바르지 않습니다.');
      }
         } catch (err) {
       console.error('Error during search:', err);
       console.log('Backend search failed');
       setEstimatedTime(2);
       
       // 백엔드 API 실패 시 에러 처리
       setError('검색 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
       setResults([]);
     } finally {
      setLoading(false);
      // 로딩 시간 측정 중지
      if (loadingIntervalRef.current) {
        clearInterval(loadingIntervalRef.current);
        loadingIntervalRef.current = null;
      }
      setLoadingTime(0);
      setEstimatedTime(0);
    }
  };

  // 자동완성 클릭/터치 처리
  const handleSuggestionClick = (suggestion: string) => {
    setDisableAutocomplete(true);
    setSuggestions([]);
    setSearchTerm(suggestion);
  };

  // 자동완성 터치 처리 (모바일 최적화)
  const handleSuggestionTouch = (suggestion: string) => {
    handleSuggestionClick(suggestion);
  };

  // 외부 클릭/터치 시 자동완성 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (suggestionRef.current && !suggestionRef.current.contains(event.target as Node)) {
        setSuggestions([]);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  // 입력 필드 포커스 시 자동완성 재활성화
  const handleInputFocus = () => {
    setDisableAutocomplete(false);
    // 모바일에서 키보드가 올라올 때 자동완성 활성화
    if (searchTerm.length >= 2) {
      // 이미 입력된 텍스트가 있으면 자동완성 표시
      setTimeout(() => {
        if (searchTerm.length >= 2) {
          setDisableAutocomplete(false);
        }
      }, 100);
    }
  };

  // 입력 필드 변경 시 자동완성 재활성화
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    setDisableAutocomplete(false);
    
    // 모바일에서 입력 중일 때 자동완성 활성화
    if (value.length >= 2) {
      setDisableAutocomplete(false);
    }
  };

  // 컴포넌트 언마운트 시 인터벌 정리
  useEffect(() => {
    return () => {
      if (loadingIntervalRef.current) {
        clearInterval(loadingIntervalRef.current);
      }
    };
  }, []);

  // 색상 클래스 매핑
  const getColorClasses = (color: string) => {
    const colorMap: { [key: string]: { bg: string; border: string; text: string; icon: string } } = {
      blue: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-900', icon: 'text-blue-600' },
      green: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-900', icon: 'text-green-600' },
      purple: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-900', icon: 'text-purple-600' },
      orange: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-900', icon: 'text-orange-600' },
      indigo: { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-900', icon: 'text-indigo-600' },
      red: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-900', icon: 'text-red-600' },
      teal: { bg: 'bg-teal-50', border: 'border-teal-200', text: 'text-teal-900', icon: 'text-teal-600' },
      pink: { bg: 'bg-pink-50', border: 'border-pink-200', text: 'text-pink-900', icon: 'text-pink-600' },
      gray: { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-900', icon: 'text-gray-600' }
    };
    return colorMap[color] || colorMap.gray;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 pl-40">
      {/* 알라딘 책 추천 배너 */}
      {bannerItems.length > 0 && (
        <>
          {showLeftAd && bannerItems[0] && (
            <div className="fixed z-[999] bg-white border border-gray-200 rounded-lg shadow-md text-center overflow-hidden" style={{ top: 100, left: 10, width: 150 }}>
              <button 
                onClick={() => setShowLeftAd(false)} 
                className="absolute top-1 right-1 bg-black/60 text-white rounded-full w-5 h-5 text-sm leading-5 hover:bg-black/80"
              >
                ×
              </button>
              <div className="cursor-pointer">
                <a href={bannerItems[0].link} target="_blank" rel="noreferrer">
                  <img src={bannerItems[0].cover} alt={bannerItems[0].title} className="w-full" />
                </a>
                <div className="text-[12px] p-1 line-clamp-3">{bannerItems[0].title}</div>
              </div>
            </div>
          )}
          {showRightAd && bannerItems[1] && (
            <div className="fixed z-[999] bg-white border border-gray-200 rounded-lg shadow-md text-center overflow-hidden" style={{ top: 100, right: 10, width: 150 }}>
              <button 
                onClick={() => setShowRightAd(false)} 
                className="absolute top-1 right-1 bg-black/60 text-white rounded-full w-5 h-5 text-sm leading-5 hover:bg-black/80"
              >
                ×
              </button>
              <div className="cursor-pointer">
                <a href={bannerItems[1].link} target="_blank" rel="noreferrer">
                  <img src={bannerItems[1].cover} alt={bannerItems[1].title} className="w-full" />
                </a>
                <div className="text-[12px] p-1 line-clamp-3">{bannerItems[1].title}</div>
              </div>
            </div>
          )}
        </>
      )}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
        {/* 헤더 */}
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">🤖 AI 자격증 검색</h1>
          <p className="text-gray-600 mt-1 text-sm sm:text-base">자격증 이름을 입력하면 AI가 상세한 정보를 제공합니다</p>
        </div>

        {/* 검색 폼 */}
        <div className="px-4 sm:px-6 py-4 sm:py-6">
          <form 
            onSubmit={(e) => { 
              e.preventDefault(); 
              handleSearch(searchTerm); 
            }}
            className="mb-6"
          >
            <div className="relative">
              <div className="flex">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    className="w-full pl-10 pr-4 py-4 sm:py-3 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-blue-500 text-gray-900 text-base sm:text-sm"
                    placeholder="자격증 이름을 입력하세요..."
                    value={searchTerm}
                    onChange={handleInputChange}
                    onFocus={handleInputFocus}
                  />
                </div>
                <button 
                  type="submit" 
                  className="px-4 sm:px-6 py-4 sm:py-3 bg-sky-600 text-white font-medium rounded-r-lg hover:bg-sky-600/80 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 transition-colors touch-manipulation"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="animate-spin" size={16} />
                      <span className="text-sm sm:text-base">검색 중...</span>
                    </div>
                  ) : (
                    <span className="text-sm sm:text-base">검색</span>
                  )}
                </button>
              </div>

                             {/* 로딩 시간 표시 */}
               {loading && (
                 <div className="mt-3 p-4 sm:p-3 bg-blue-50 border border-blue-200 rounded-lg">
                   <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
                     <div className="flex items-center gap-2">
                       <div className="w-2 h-2 bg-sky-600 rounded-full animate-pulse"></div>
                       <span className="text-sm sm:text-sm text-sky-700">
                         AI가 자격증 정보를 분석하고 있습니다...
                       </span>
                     </div>
                     <div className="text-sm text-blue-600 font-medium">
                       {loadingTime}초 / 예상 {estimatedTime}초
                     </div>
                   </div>
                   <div className="mt-3 sm:mt-2 w-full bg-blue-200 rounded-full h-2">
                     <div 
                       className="bg-sky-600 h-2 rounded-full transition-all duration-1000"
                       style={{ 
                         width: `${Math.min((loadingTime / estimatedTime) * 100, 100)}%` 
                       }}
                     ></div>
                   </div>
                                       <div className="mt-2 sm:mt-1 text-xs text-blue-600">
                      AI 분석 및 Q-net API 호출 중...
                    </div>
                 </div>
               )}

                             {/* 자동완성 드롭다운 */}
               {suggestions.length > 0 && (
                 <div 
                   ref={suggestionRef}
                   className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-60 overflow-y-auto sm:max-h-60"
                 >
                                       {suggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        className="w-full text-left px-4 py-4 sm:py-3 hover:bg-gray-50 active:bg-gray-100 border-b border-gray-100 last:border-b-0 transition-colors touch-manipulation"
                        onClick={() => handleSuggestionClick(suggestion)}
                        onTouchEnd={() => handleSuggestionTouch(suggestion)}
                      >
                        <div className="flex items-center gap-3 sm:gap-2">
                          <Search className="text-gray-400 flex-shrink-0" size={18} />
                          <span className="text-gray-900 text-base sm:text-sm">{suggestion}</span>
                        </div>
                      </button>
                    ))}
                 </div>
               )}
            </div>
          </form>

          {/* 에러 메시지 */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* 검색 결과 */}
          {results.length > 0 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">검색 결과</h2>
              {results.map((cert, index) => {
                const sections = parseCertificateContent(cert.fullContent);
                
                return (
                  <div key={index} className="space-y-4">
                    <div className="bg-gray-50 px-6 py-4 border border-gray-200 rounded-lg">
                      <h3 className="text-lg font-semibold text-gray-900">{cert.name}</h3>
                    </div>
                    
                                                              {/* 카드형 섹션들 */}
                      <div className="space-y-6 sm:space-y-4">
                       {sections.map((section, sectionIndex) => {
                         const colors = getColorClasses(section.color);
                         
                         return (
                           <div 
                             key={sectionIndex}
                             className={`border rounded-lg overflow-hidden transition-all duration-200 ${colors.border} ${colors.bg}`}
                           >
                             {/* 카드 헤더 */}
                             <div className={`px-4 py-4 sm:px-4 sm:py-3 ${colors.bg}`}>
                               <div className="flex items-center gap-3">
                                 <div className={`${colors.icon} flex-shrink-0`}>
                                   <div className="w-6 h-6 sm:w-5 sm:h-5">
                                     {section.icon}
                                   </div>
                                 </div>
                                 <h4 className={`font-semibold text-lg sm:text-base ${colors.text}`}>
                                   {section.title}
                                 </h4>
                               </div>
                             </div>
                             
                             {/* 카드 내용 */}
                             <div className="px-4 pb-6 sm:px-4 sm:pb-4">
                               <div 
                                 className={`prose prose-lg sm:prose-sm max-w-none ${colors.text}`}
                                 dangerouslySetInnerHTML={{ 
                                   __html: formatContent(section.content)
                                 }}
                               />
                             </div>
                           </div>
                         );
                       })}
                     </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* 검색 결과 없음 */}
          {results.length === 0 && !loading && !error && searchTerm && hasSearched && (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <Search size={48} className="mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">검색 결과가 없습니다</h3>
              <p className="text-gray-600">다른 키워드로 검색해보세요.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CertificateSearch;

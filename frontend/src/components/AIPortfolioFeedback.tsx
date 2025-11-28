import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { FileText, Upload, Loader2, Brain, Target, Award, TrendingUp, Users, Star, CheckCircle, Search, Copy, ChevronDown, ChevronUp, Share2, AlertCircle, RefreshCw, FolderOpen } from 'lucide-react';

interface PortfolioData {
  text: string;
}

interface FeedbackData {
  target_company?: string;
  target_job?: string;
  rubric?: {
    strength?: string;
    gap?: string;
    improvement?: string;
  };
  summary?: string;
  revised_text?: string;
}

const AIPortfolioFeedback: React.FC = () => {
  const [text, setText] = useState('');
  const [feedback, setFeedback] = useState<FeedbackData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingTime, setLoadingTime] = useState(0);
  const [estimatedTime, setEstimatedTime] = useState(0);
  const [actualAnalysisTime, setActualAnalysisTime] = useState<number | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const [expandedSections, setExpandedSections] = useState<{[key: string]: boolean}>({
    target: true,
    rubric: true,
    summary: true,
    revised: true
  });

  // 메모이제이션된 값들
  const textLength = useMemo(() => text.trim().length, [text]);
  const isTextValid = useMemo(() => textLength >= 100, [textLength]);
  const canSubmit = useMemo(() => !isLoading && isTextValid, [isLoading, isTextValid]);

  // 디바운스된 텍스트 검증
  const [validationMessage, setValidationMessage] = useState<string>('');

  useEffect(() => {
    const timer = setTimeout(() => {
      if (textLength === 0) {
        setValidationMessage('');
      } else if (textLength < 50) {
        setValidationMessage('더 많은 내용을 입력해주세요.');
      } else if (textLength < 100) {
        setValidationMessage('거의 완성되었습니다!');
      } else {
        setValidationMessage('충분한 내용이 입력되었습니다.');
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [textLength]);

  // 에러 재시도 로직
  const handleRetry = useCallback(async () => {
    if (isRetrying) return;
    
    setIsRetrying(true);
    setError(null);
    setRetryCount(prev => prev + 1);
    
    try {
      const portfolioData: PortfolioData = { text };
      // 환경별 동적 API URL 설정
      const apiUrl = (import.meta as any).env?.DEV 
        ? '/api/portfolio'  // 개발 환경: 프록시 사용
        : 'https://7d1opsumn9.execute-api.ap-northeast-2.amazonaws.com/dev/api/portfolio';  // 프로덕션 환경: API Gateway 사용
      
      const response = await axios.post(apiUrl, portfolioData);
      setFeedback(response.data);
      setRetryCount(0); // 성공 시 재시도 카운트 리셋
    } catch (err: any) {
      console.error('Retry failed:', err);
      const message = err.response?.data?.error || '재시도 중 오류가 발생했습니다.';
      setError(message);
    } finally {
      setIsRetrying(false);
    }
  }, [text, isRetrying]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setIsLoading(true);
    setFeedback(null);
    setError(null);
    setLoadingTime(0);
    setEstimatedTime(90);
    setActualAnalysisTime(null);
    setRetryCount(0);

    // 로딩 시간 측정
    const startTime = Date.now();
    const loadingInterval = setInterval(() => {
      setLoadingTime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    try {
      const portfolioData: PortfolioData = { text };
      // 환경별 동적 API URL 설정
      const apiUrl = (import.meta as any).env?.DEV 
        ? '/api/portfolio'  // 개발 환경: 프록시 사용
        : 'https://7d1opsumn9.execute-api.ap-northeast-2.amazonaws.com/dev/api/portfolio';  // 프로덕션 환경: API Gateway 사용
      
      const response = await axios.post(apiUrl, portfolioData);
      setFeedback(response.data);
      
      // 실제 분석 시간 계산
      const endTime = Date.now();
      const actualTime = Math.floor((endTime - startTime) / 1000);
      setActualAnalysisTime(actualTime);
    } catch (err: any) {
      console.error('Error submitting portfolio:', err);
      let message = '피드백을 생성하는 중 오류가 발생했습니다.';
      
      if (err.response) {
        // 서버 응답이 있는 경우
        if (err.response.status === 429) {
          message = '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.';
        } else if (err.response.status >= 500) {
          message = '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
        } else if (err.response.data?.error) {
          message = err.response.data.error;
        }
      } else if (err.request) {
        // 네트워크 오류
        message = '네트워크 연결을 확인해주세요.';
      }
      
      setError(message);
    } finally {
      setIsLoading(false);
      clearInterval(loadingInterval);
    }
  }, [text, canSubmit]);

  const formatText = useCallback((text: string) => {
    return text;
  }, []);

  const toggleSection = useCallback((section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  }, []);

  const copyToClipboard = useCallback(async (text: string, section: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // 성공 피드백 (실제로는 토스트를 사용하는 것이 좋습니다)
      console.log(`${section} 내용이 클립보드에 복사되었습니다.`);
    } catch (err) {
      console.error('Failed to copy text: ', err);
      setError('클립보드 복사에 실패했습니다.');
    }
  }, []);

  const shareResult = useCallback(() => {
    if (navigator.share) {
      navigator.share({
        title: 'AI 포트폴리오 피드백 결과',
        text: 'AI가 분석한 포트폴리오 피드백 결과입니다.',
        url: window.location.href
      }).catch(err => {
        console.error('Share failed:', err);
      });
    } else {
      // 공유 API가 지원되지 않는 경우 클립보드에 복사
      const resultText = `AI 포트폴리오 피드백 결과\n\n${feedback?.summary || ''}`;
      copyToClipboard(resultText, '전체 결과');
    }
  }, [feedback, copyToClipboard]);

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-3 sm:py-4 lg:py-6">
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
        {/* 헤더 */}
        <div className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <span className="text-2xl sm:text-3xl">📁</span>
            <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">AI 포트폴리오 피드백</h1>
          </div>
          <p className="text-gray-600 mt-1 text-xs sm:text-sm lg:text-base">자기소개서를 AI가 분석하여 맞춤형 피드백과 개선된 버전을 제공합니다</p>
        </div>

        {/* 메인 컨텐츠 */}
        <div className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 lg:py-6">
          {/* 포트폴리오 폼 */}
          <form onSubmit={handleSubmit} className="mb-4 sm:mb-6">
            <div className="space-y-4 sm:space-y-6">
                             {/* 가이드 섹션 */}
               <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
                 <div className="flex items-start gap-2 mb-3">
                   <span className="text-blue-600 text-lg">💡</span>
                   <h4 className="text-sm sm:text-base font-semibold text-blue-900">포트폴리오 작성 가이드</h4>
                 </div>
                 
                 <div className="space-y-2 text-xs sm:text-sm">
                   <div className="flex items-start gap-2">
                     <span className="text-blue-600 mt-0.5">•</span>
                     <span className="text-blue-800">지원하고자 하는 회사명을 구체적으로 작성해주세요 (예: "삼성전자", "네이버", "카카오")</span>
                   </div>
                   <div className="flex items-start gap-2">
                     <span className="text-blue-600 mt-0.5">•</span>
                     <span className="text-blue-800">지원하고자 하는 직무명도 구체적으로 작성해주세요 (예: "소프트웨어 개발자", "프론트엔드 개발자", "백엔드 개발자")</span>
                   </div>
                   <div className="flex items-start gap-2">
                     <span className="text-blue-600 mt-0.5">•</span>
                     <span className="text-blue-800">수치와 성과를 포함하면 더 정확한 분석이 가능합니다 (예: "매출 20% 증가", "사용자 100명")</span>
                   </div>
                   <div className="flex items-start gap-2">
                     <span className="text-blue-600 mt-0.5">•</span>
                     <span className="text-blue-800">지원 회사의 기술 스택이나 서비스와 연관된 경험을 강조해주세요</span>
                   </div>
                   <div className="flex items-start gap-2">
                     <span className="text-blue-600 mt-0.5">•</span>
                     <span className="text-blue-800">프로젝트 경험은 문제-해결-결과 순으로 작성하세요</span>
                   </div>
                   <div className="flex items-start gap-2">
                     <span className="text-blue-600 mt-0.5">•</span>
                     <span className="text-blue-800">지원 직무와 관련된 기술 스택을 명시하세요 (예: JavaScript, React, Node.js, Python)</span>
                   </div>
                   <div className="flex items-start gap-2">
                     <span className="text-blue-600 mt-0.5">•</span>
                     <span className="text-blue-800">최소 100자 이상 입력해주세요</span>
                   </div>
                   <div className="flex items-start gap-2">
                     <span className="text-blue-600 mt-0.5">•</span>
                     <span className="text-blue-800">개인정보는 자동으로 마스킹 처리됩니다</span>
                   </div>
                 </div>
               </div>

              {/* 텍스트 입력 영역 */}
              <div>
                <label htmlFor="portfolio-text" className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                  포트폴리오 내용
                </label>
                <div className="relative">
                  <div className="absolute left-2 sm:left-3 top-2 sm:top-3 text-gray-400">
                    <FileText size={16} className="sm:w-5 sm:h-5" />
                  </div>
                                     <textarea
                     id="portfolio-text"
                     value={text}
                     onChange={(e) => setText(e.target.value)}
                     placeholder="예시: 저는 삼성전자 소프트웨어 개발자 직무에 지원하는 컴퓨터공학과 4학년 학생입니다.

주요 경험:
- 대학생 프로그래밍 경진대회 우수상 수상 (2023)
- React와 Node.js를 활용한 웹 개발 프로젝트 3개 완료
- 스마트 홈 IoT 관리 시스템 프로젝트에서 팀장을 맡아 6개월간 개발하여 실제 사용자 100명에게 서비스 제공
- IT 스타트업에서 6개월간 인턴십 수행

기술 스택: JavaScript, React, Node.js, Python, MySQL, AWS

지원 동기: 삼성전자의 혁신적인 기술 개발과 글로벌 시장 진출에 기여하고 싶어 지원하게 되었습니다.

이런 식으로 구체적인 경험과 성과를 포함하여 작성해주세요..."
                     rows={14}
                     className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-4 sm:py-5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-blue-500 text-gray-900 text-sm sm:text-base resize-none"
                     disabled={isLoading}
                   />
                </div>
                <div className="mt-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0">
                  <p className="text-xs sm:text-sm text-gray-500">
                    최소 100자 이상 입력하시면 더 정확한 분석이 가능합니다.
                  </p>
                  {validationMessage && (
                    <p className={`text-xs sm:text-sm font-medium ${
                      textLength >= 100 ? 'text-green-600' : 
                      textLength >= 50 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {validationMessage}
                    </p>
                  )}
                </div>
              </div>
              
              {/* 분석 버튼 */}
              <div className="relative">
                <button
                  type="submit"
                  disabled={!canSubmit}
                  className="w-full bg-sky-600 text-white py-3 sm:py-4 px-4 rounded-lg hover:bg-sky-600/80 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors touch-manipulation font-medium flex items-center justify-center gap-2 min-h-[44px] sm:min-h-[48px]"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="animate-spin" size={16} />
                      <span className="text-sm sm:text-base">분석 중...</span>
                    </>
                  ) : (
                    <>
                      <Brain size={16} />
                      <span className="text-sm sm:text-base">AI 피드백 받기</span>
                    </>
                  )}
                </button>
                
                {/* 입력 상태 표시 */}
                {text.trim() && (
                  <div className="mt-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0 text-xs sm:text-sm">
                    <span className="text-gray-600">
                      입력된 텍스트: {textLength}자
                    </span>
                    <span className={`font-medium ${isTextValid ? 'text-green-600' : 'text-yellow-600'}`}>
                      {isTextValid ? '✓ 충분한 내용' : '⚠️ 더 입력해주세요'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </form>

          {/* 로딩 상태 */}
          {isLoading && (
            <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex flex-col gap-2 sm:gap-0 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-sky-600 rounded-full animate-pulse"></div>
                  <span className="text-xs sm:text-sm text-sky-700">
                    AI가 포트폴리오를 분석하고 있습니다...
                  </span>
                </div>
                <div className="text-xs sm:text-sm text-blue-600 font-medium">
                  {loadingTime}초 / 예상 {estimatedTime}초
                </div>
              </div>
              <div className="mt-2 sm:mt-3 w-full bg-blue-200 rounded-full h-2">
                <div 
                  className="bg-sky-600 h-2 rounded-full transition-all duration-1000"
                  style={{ 
                    width: `${Math.min((loadingTime / estimatedTime) * 100, 100)}%` 
                  }}
                ></div>
              </div>
              <div className="mt-1 sm:mt-2 text-xs text-blue-600">
                AI 분석 및 피드백 생성 중...
              </div>
            </div>
          )}

          {/* 실제 분석 시간 표시 */}
          {actualAnalysisTime !== null && (
            <div className="mb-4 sm:mb-6 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex flex-col gap-2 sm:gap-0 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-xs sm:text-sm text-green-700">
                    분석 완료!
                  </span>
                </div>
                <div className="text-xs sm:text-sm text-green-600 font-medium">
                  실제 분석 시간: {actualAnalysisTime}초
                </div>
              </div>
              <div className="mt-2 text-xs text-green-600">
                {actualAnalysisTime < estimatedTime 
                  ? `예상 시간(${estimatedTime}초)보다 ${estimatedTime - actualAnalysisTime}초 빠르게 완료되었습니다!` 
                  : `예상 시간(${estimatedTime}초)보다 ${actualAnalysisTime - estimatedTime}초 더 걸렸습니다.`
                }
              </div>
            </div>
          )}

          {/* 에러 메시지 */}
          {error && (
            <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-400" />
                </div>
                <div className="flex-1">
                  <p className="text-xs sm:text-sm text-red-800 mb-2">{error}</p>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <button
                      onClick={handleRetry}
                      disabled={isRetrying}
                      className="inline-flex items-center gap-2 px-3 py-2 text-xs sm:text-sm bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <RefreshCw className={`h-3 w-3 sm:h-4 sm:w-4 ${isRetrying ? 'animate-spin' : ''}`} />
                      {isRetrying ? '재시도 중...' : '다시 시도'}
                    </button>
                    {retryCount > 0 && (
                      <span className="text-xs text-red-600">
                        재시도 횟수: {retryCount}회
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 피드백 결과 */}
          {feedback && !isLoading && (
            <div className="space-y-4 sm:space-y-6 animate-fade-in-up">
              {/* 결과 헤더 */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900">AI 분석 결과</h2>
                <button
                  onClick={shareResult}
                  className="flex items-center justify-center gap-2 px-3 py-2 text-xs sm:text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors min-h-[36px] sm:min-h-[40px]"
                >
                  <Share2 size={14} className="sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">공유</span>
                </button>
              </div>
              
              {/* 지원 대상 */}
              {feedback.target_company && feedback.target_job && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-3 sm:p-4 animate-fade-in-up" style={{animationDelay: '0.1s'}}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="p-1.5 sm:p-2 bg-blue-100 rounded-lg">
                        <Target className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                      </div>
                      <h4 className="text-sm sm:text-base font-semibold text-blue-900">지원 대상</h4>
                    </div>
                    <button
                      onClick={() => toggleSection('target')}
                      className="text-blue-600 hover:text-blue-800 transition-colors p-1"
                    >
                      {expandedSections.target ? <ChevronUp size={18} className="sm:w-5 sm:h-5" /> : <ChevronDown size={18} className="sm:w-5 sm:h-5" />}
                    </button>
                  </div>
                  {expandedSections.target && (
                    <div className="space-y-2 animate-fade-in">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <p className="text-xs sm:text-sm text-blue-800"><strong>회사:</strong> {feedback.target_company}</p>
                        <button
                          onClick={() => copyToClipboard(feedback.target_company!, '회사명')}
                          className="text-blue-600 hover:text-blue-800 transition-colors p-1 self-end sm:self-auto"
                        >
                          <Copy size={14} className="sm:w-4 sm:h-4" />
                        </button>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <p className="text-xs sm:text-sm text-blue-800"><strong>직무:</strong> {feedback.target_job}</p>
                        <button
                          onClick={() => copyToClipboard(feedback.target_job!, '직무명')}
                          className="text-blue-600 hover:text-blue-800 transition-colors p-1 self-end sm:self-auto"
                        >
                          <Copy size={14} className="sm:w-4 sm:h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 종합 피드백 */}
              {feedback.rubric && (
                <div className="space-y-3 sm:space-y-4 animate-fade-in-up" style={{animationDelay: '0.2s'}}>
                  <div className="flex items-center justify-between">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900">종합 피드백 (데이터 기반)</h3>
                    <button
                      onClick={() => toggleSection('rubric')}
                      className="text-gray-600 hover:text-gray-800 transition-colors p-1"
                    >
                      {expandedSections.rubric ? <ChevronUp size={18} className="sm:w-5 sm:h-5" /> : <ChevronDown size={18} className="sm:w-5 sm:h-5" />}
                    </button>
                  </div>
                  
                  {expandedSections.rubric && (
                    <div className="space-y-3 sm:space-y-4 animate-fade-in">
                      {feedback.rubric.strength && (
                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 mb-3">
                            <div className="flex items-center gap-2 sm:gap-3">
                              <div className="p-1.5 sm:p-2 bg-green-100 rounded-lg">
                                <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                              </div>
                              <h5 className="text-sm sm:text-base font-semibold text-green-800">강점</h5>
                            </div>
                            <button
                              onClick={() => copyToClipboard(feedback.rubric!.strength!, '강점')}
                              className="text-green-600 hover:text-green-800 transition-colors p-1 self-end sm:self-auto"
                            >
                              <Copy size={14} className="sm:w-4 sm:h-4" />
                            </button>
                          </div>
                          <p className="text-xs sm:text-sm text-green-700 whitespace-pre-wrap">{formatText(feedback.rubric.strength)}</p>
                        </div>
                      )}
                      
                      {feedback.rubric.gap && (
                        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 mb-3">
                            <div className="flex items-center gap-2 sm:gap-3">
                              <div className="p-1.5 sm:p-2 bg-yellow-100 rounded-lg">
                                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600" />
                              </div>
                              <h5 className="text-sm sm:text-base font-semibold text-yellow-800">보완/미흡 부분</h5>
                            </div>
                            <button
                              onClick={() => copyToClipboard(feedback.rubric!.gap!, '보완 부분')}
                              className="text-yellow-600 hover:text-yellow-800 transition-colors p-1 self-end sm:self-auto"
                            >
                              <Copy size={14} className="sm:w-4 sm:h-4" />
                            </button>
                          </div>
                          <p className="text-xs sm:text-sm text-yellow-700 whitespace-pre-wrap">{formatText(feedback.rubric.gap)}</p>
                        </div>
                      )}
                      
                      {feedback.rubric.improvement && (
                        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 mb-3">
                            <div className="flex items-center gap-2 sm:gap-3">
                              <div className="p-1.5 sm:p-2 bg-blue-100 rounded-lg">
                                <Award className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                              </div>
                              <h5 className="text-sm sm:text-base font-semibold text-blue-800">구체적 보완 방안</h5>
                            </div>
                            <button
                              onClick={() => copyToClipboard(feedback.rubric!.improvement!, '보완 방안')}
                              className="text-blue-600 hover:text-blue-800 transition-colors p-1 self-end sm:self-auto"
                            >
                              <Copy size={14} className="sm:w-4 sm:h-4" />
                            </button>
                          </div>
                          <p className="text-xs sm:text-sm text-sky-700 whitespace-pre-wrap">{formatText(feedback.rubric.improvement)}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* 핵심 직무 적합성 요약 */}
              {feedback.summary && (
                <div className="bg-gradient-to-r from-purple-50 to-violet-50 border border-purple-200 rounded-lg p-3 sm:p-4 animate-fade-in-up hover:shadow-md transition-shadow" style={{animationDelay: '0.3s'}}>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 mb-3">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="p-1.5 sm:p-2 bg-purple-100 rounded-lg">
                        <Star className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                      </div>
                      <h4 className="text-sm sm:text-base font-semibold text-purple-900">핵심 직무 적합성 요약</h4>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2">
                      <button
                        onClick={() => copyToClipboard(feedback.summary!, '직무 적합성 요약')}
                        className="text-purple-600 hover:text-purple-800 transition-colors p-1"
                      >
                        <Copy size={14} className="sm:w-4 sm:h-4" />
                      </button>
                      <button
                        onClick={() => toggleSection('summary')}
                        className="text-purple-600 hover:text-purple-800 transition-colors p-1"
                      >
                        {expandedSections.summary ? <ChevronUp size={18} className="sm:w-5 sm:h-5" /> : <ChevronDown size={18} className="sm:w-5 sm:h-5" />}
                      </button>
                    </div>
                  </div>
                  {expandedSections.summary && (
                    <div className="animate-fade-in">
                      <p className="text-xs sm:text-sm text-purple-800 whitespace-pre-wrap">{formatText(feedback.summary)}</p>
                    </div>
                  )}
                </div>
              )}

              {/* AI 추천 자기소개서 */}
              {feedback.revised_text && (
                <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 rounded-lg p-3 sm:p-4 animate-fade-in-up hover:shadow-md transition-shadow" style={{animationDelay: '0.4s'}}>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 mb-3">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="p-1.5 sm:p-2 bg-indigo-100 rounded-lg">
                        <Users className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />
                      </div>
                      <h4 className="text-sm sm:text-base font-semibold text-indigo-900">AI 추천 자기소개서 (데이터 기반 재구성)</h4>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2">
                      <button
                        onClick={() => copyToClipboard(feedback.revised_text!, 'AI 추천 자기소개서')}
                        className="text-indigo-600 hover:text-indigo-800 transition-colors p-1"
                      >
                        <Copy size={14} className="sm:w-4 sm:h-4" />
                      </button>
                      <button
                        onClick={() => toggleSection('revised')}
                        className="text-indigo-600 hover:text-indigo-800 transition-colors p-1"
                      >
                        {expandedSections.revised ? <ChevronUp size={18} className="sm:w-5 sm:h-5" /> : <ChevronDown size={18} className="sm:w-5 sm:h-5" />}
                      </button>
                    </div>
                  </div>
                  {expandedSections.revised && (
                    <div className="animate-fade-in">
                      <div className="bg-white rounded-md p-3 sm:p-4 border border-indigo-100">
                        <p className="text-xs sm:text-sm text-indigo-800 whitespace-pre-wrap">{formatText(feedback.revised_text)}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 초기 상태 */}
          {!feedback && !isLoading && !error && (
            <div className="text-center py-8 sm:py-12">
              <div className="text-gray-400 mb-3 sm:mb-4">
                <FileText size={36} className="sm:w-12 sm:h-12 mx-auto" />
              </div>
              <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">포트폴리오를 입력해주세요</h3>
              <p className="text-xs sm:text-sm text-gray-600">자기소개서나 이력서를 입력하면 AI가 맞춤형 피드백을 제공합니다.</p>
            </div>
          )}
        </div>
      </div>

      {/* 커스텀 CSS 애니메이션 */}
      <style>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out forwards;
        }
        
        .animate-fade-in {
          animation: fade-in 0.4s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default AIPortfolioFeedback;

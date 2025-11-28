import React from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';

interface ErrorDisplayProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  onGoHome?: () => void;
  showHomeButton?: boolean;
  className?: string;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  title = '오류가 발생했습니다',
  message,
  onRetry,
  onGoHome,
  showHomeButton = false,
  className = ''
}) => {
  return (
    <div className={`text-center py-12 px-4 ${className}`}>
      <div className="max-w-md mx-auto">
        {/* 아이콘 */}
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <AlertCircle size={32} className="text-red-600" />
          </div>
        </div>

        {/* 제목 */}
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {title}
        </h3>

        {/* 메시지 */}
        <p className="text-gray-600 mb-6 leading-relaxed">
          {message}
        </p>

        {/* 버튼들 */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {onRetry && (
            <button
              onClick={onRetry}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-sky-600 text-white rounded-lg hover:bg-sky-600/80 transition-colors font-medium"
            >
              <RefreshCw size={16} />
              다시 시도
            </button>
          )}
          
          {showHomeButton && onGoHome && (
            <button
              onClick={onGoHome}
              className="flex items-center justify-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              <Home size={16} />
              홈으로 돌아가기
            </button>
          )}
        </div>

        {/* 추가 도움말 */}
        <div className="mt-6 text-xs text-gray-500">
          <p>문제가 지속되면 페이지를 새로고침하거나 잠시 후 다시 시도해주세요.</p>
        </div>
      </div>
    </div>
  );
};

export default ErrorDisplay;

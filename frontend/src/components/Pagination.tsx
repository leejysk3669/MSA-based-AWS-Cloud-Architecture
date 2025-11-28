import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  className = ''
}) => {
  // 표시할 페이지 번호들을 계산
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      // 전체 페이지가 5개 이하면 모두 표시
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // 현재 페이지를 중심으로 5개 페이지 표시
      let startPage = Math.max(1, currentPage - 2);
      let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
      
      // 끝 페이지가 totalPages에 가까우면 시작 페이지를 조정
      if (endPage === totalPages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
      }
      
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
    }
    
    return pages;
  };

  const pageNumbers = getPageNumbers();

  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className={`flex items-center justify-center space-x-2 ${className}`}>
      {/* 이전 페이지 버튼 */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg border ${
          currentPage === 1
            ? 'text-gray-400 bg-gray-100 border-gray-200 cursor-not-allowed'
            : 'text-gray-700 bg-white border-gray-300 hover:bg-gray-50 hover:text-gray-900'
        }`}
      >
        <ChevronLeft size={16} className="mr-1" />
        이전
      </button>

      {/* 페이지 번호들 */}
      {pageNumbers.map((page) => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={`px-3 py-2 text-sm font-medium rounded-lg border ${
            page === currentPage
              ? 'text-white bg-sky-600 border-sky-600'
              : 'text-gray-700 bg-white border-gray-300 hover:bg-gray-50 hover:text-gray-900'
          }`}
        >
          {page}
        </button>
      ))}

      {/* 다음 페이지 버튼 */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg border ${
          currentPage === totalPages
            ? 'text-gray-400 bg-gray-100 border-gray-200 cursor-not-allowed'
            : 'text-gray-700 bg-white border-gray-300 hover:bg-gray-50 hover:text-gray-900'
        }`}
      >
        다음
        <ChevronRight size={16} className="ml-1" />
      </button>
    </div>
  );
};

export default Pagination;

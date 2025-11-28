import React, { useState } from 'react';
import { Search, Filter, X, MapPin, Users, Hash } from 'lucide-react';
import { STUDY_GROUP_CATEGORIES } from '../types';

export interface SearchFilters {
  searchTerm: string;
  category: string;
  location: string;
  memberCount: string;
  recruitmentStatus: string;
  onlineOnly: boolean;
}

interface StudyGroupAdvancedSearchProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  onClearFilters: () => void;
}

const LOCATIONS = [
  '전체',
  '서울',
  '경기',
  '인천',
  '부산',
  '대구',
  '광주',
  '대전',
  '울산',
  '세종',
  '강원',
  '충북',
  '충남',
  '전북',
  '전남',
  '경북',
  '경남',
  '제주',
  '온라인'
];

const MEMBER_COUNTS = [
  '전체',
  '1-5명',
  '6-10명',
  '11-15명',
  '16-20명',
  '21명 이상'
];

const RECRUITMENT_STATUS = [
  '전체',
  '모집 중',
  '모집 완료'
];

const StudyGroupAdvancedSearch: React.FC<StudyGroupAdvancedSearchProps> = ({
  filters,
  onFiltersChange,
  onClearFilters
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleFilterChange = (key: keyof SearchFilters, value: string | boolean) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const hasActiveFilters = 
    filters.category !== '전체' ||
    filters.location !== '전체' ||
    filters.memberCount !== '전체' ||
    filters.recruitmentStatus !== '전체' ||
    filters.onlineOnly;

  const activeFilterCount = [
    filters.category !== '전체',
    filters.location !== '전체',
    filters.memberCount !== '전체',
    filters.recruitmentStatus !== '전체',
    filters.onlineOnly
  ].filter(Boolean).length;

    return (
    <div className="bg-white border border-gray-200 rounded-lg p-3 pb-0 mb-4">
      {/* 기본 검색 */}
      <div className="relative mb-4">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
        <input
          type="text"
          placeholder="스터디 그룹명, 설명, 태그 검색..."
          value={filters.searchTerm}
          onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
          className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* 고급 검색 토글 */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 hover:scale-105 transition-all duration-200"
        >
          <Filter size={16} />
          <span className="font-medium">고급 검색</span>
          {hasActiveFilters && (
            <span className="bg-blue-100 text-blue-600 text-xs px-2 py-1 rounded-full">
              {activeFilterCount}
            </span>
          )}
        </button>
        
        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="flex items-center gap-1 text-gray-500 hover:text-gray-700 hover:scale-105 transition-all duration-200 text-sm"
          >
            <X size={14} />
            필터 초기화
          </button>
        )}
      </div>

      {/* 고급 검색 옵션 */}
      <div className={`mt-4 pt-4 border-t border-gray-200 transition-all duration-300 ease-in-out ${
        isExpanded 
          ? 'opacity-100 max-h-96 overflow-visible' 
          : 'opacity-0 max-h-0 overflow-hidden'
      }`}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* 카테고리 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Hash size={14} className="inline mr-1" />
              카테고리
            </label>
            <select
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="w-full px-3 py-3 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
            >
              <option value="전체">전체</option>
              {STUDY_GROUP_CATEGORIES.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          {/* 지역 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MapPin size={14} className="inline mr-1" />
              지역
            </label>
            <select
              value={filters.location}
              onChange={(e) => handleFilterChange('location', e.target.value)}
              className="w-full px-3 py-3 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
            >
              {LOCATIONS.map(location => (
                <option key={location} value={location}>{location}</option>
              ))}
            </select>
          </div>

          {/* 인원수 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Users size={14} className="inline mr-1" />
              인원수
            </label>
            <select
              value={filters.memberCount}
              onChange={(e) => handleFilterChange('memberCount', e.target.value)}
              className="w-full px-3 py-3 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
            >
              {MEMBER_COUNTS.map(count => (
                <option key={count} value={count}>{count}</option>
              ))}
            </select>
          </div>

          {/* 모집 상태 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              모집 상태
            </label>
            <select
              value={filters.recruitmentStatus}
              onChange={(e) => handleFilterChange('recruitmentStatus', e.target.value)}
              className="w-full px-3 py-3 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
            >
              {RECRUITMENT_STATUS.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>
        </div>

        {/* 온라인 전용 체크박스 */}
        <div className="flex items-center p-3 bg-gray-50 rounded-lg mt-4">
          <input
            type="checkbox"
            id="onlineOnly"
            checked={filters.onlineOnly}
            onChange={(e) => handleFilterChange('onlineOnly', e.target.checked)}
            className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="onlineOnly" className="ml-3 text-sm sm:text-base text-gray-700 cursor-pointer">
            온라인 전용 그룹만 보기
          </label>
        </div>
      </div>

      {/* 활성 필터 표시 */}
      <div className={`mt-4 pt-4 border-t border-gray-200 transition-all duration-300 ease-in-out ${
        hasActiveFilters 
          ? 'opacity-100 max-h-none overflow-visible' 
          : 'opacity-0 max-h-0 overflow-hidden'
      }`}>
        <div className="flex flex-wrap gap-2 pb-2">
          {filters.category !== '전체' && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full">
              카테고리: {filters.category}
              <button
                onClick={() => handleFilterChange('category', '전체')}
                className="ml-1 hover:text-blue-900"
              >
                <X size={12} />
              </button>
            </span>
          )}
          {filters.location !== '전체' && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 text-sm rounded-full">
              지역: {filters.location}
              <button
                onClick={() => handleFilterChange('location', '전체')}
                className="ml-1 hover:text-green-900"
              >
                <X size={12} />
              </button>
            </span>
          )}
          {filters.memberCount !== '전체' && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 text-sm rounded-full">
              인원수: {filters.memberCount}
              <button
                onClick={() => handleFilterChange('memberCount', '전체')}
                className="ml-1 hover:text-purple-900"
              >
                <X size={12} />
              </button>
            </span>
          )}
          {filters.recruitmentStatus !== '전체' && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-700 text-sm rounded-full">
              상태: {filters.recruitmentStatus}
              <button
                onClick={() => handleFilterChange('recruitmentStatus', '전체')}
                className="ml-1 hover:text-orange-900"
              >
                <X size={12} />
              </button>
            </span>
          )}
          {filters.onlineOnly && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 text-sm rounded-full">
              온라인 전용
              <button
                onClick={() => handleFilterChange('onlineOnly', false)}
                className="ml-1 hover:text-red-900"
              >
                <X size={12} />
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudyGroupAdvancedSearch;

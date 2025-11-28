import React from 'react';
import { Filter, Calendar, Users, ArrowUpDown, X } from 'lucide-react';

export type TimeFilter = 'all' | 'past' | 'future' | 'thisWeek' | 'thisMonth';
export type AttendanceFilter = 'all' | 'attending' | 'not_attending' | 'noResponse';
export type SortOption = 'date_asc' | 'date_desc' | 'created' | 'attendees';

interface MeetingFilterProps {
  timeFilter: TimeFilter;
  attendanceFilter: AttendanceFilter;
  sortBy: SortOption;
  onTimeFilterChange: (filter: TimeFilter) => void;
  onAttendanceFilterChange: (filter: AttendanceFilter) => void;
  onSortChange: (sort: SortOption) => void;
  onClearFilters: () => void;
}

const MeetingFilter: React.FC<MeetingFilterProps> = ({
  timeFilter,
  attendanceFilter,
  sortBy,
  onTimeFilterChange,
  onAttendanceFilterChange,
  onSortChange,
  onClearFilters
}) => {
  const hasActiveFilters = timeFilter !== 'all' || attendanceFilter !== 'all' || sortBy !== 'date_asc';

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Filter size={20} className="text-blue-600" />
          모임 필터
        </h3>
        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X size={14} />
            필터 초기화
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 시간 필터 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
            <Calendar size={14} />
            시간 필터
          </label>
          <select
            value={timeFilter}
            onChange={(e) => onTimeFilterChange(e.target.value as TimeFilter)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">전체</option>
            <option value="past">과거 모임</option>
            <option value="future">미래 모임</option>
            <option value="thisWeek">이번 주</option>
            <option value="thisMonth">이번 달</option>
          </select>
        </div>

        {/* 참석 상태 필터 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
            <Users size={14} />
            참석 상태
          </label>
          <select
            value={attendanceFilter}
            onChange={(e) => onAttendanceFilterChange(e.target.value as AttendanceFilter)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">전체</option>
            <option value="attending">참석하는 모임</option>
            <option value="not_attending">불참하는 모임</option>
            <option value="noResponse">미응답 모임</option>
          </select>
        </div>

        {/* 정렬 옵션 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
            <ArrowUpDown size={14} />
            정렬
          </label>
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value as SortOption)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="date_asc">날짜순 (빠른순)</option>
            <option value="date_desc">날짜순 (늦은순)</option>
            <option value="created">생성일순</option>
            <option value="attendees">참석자 수순</option>
          </select>
        </div>
      </div>

      {/* 활성 필터 표시 */}
      {hasActiveFilters && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex flex-wrap gap-2">
            {timeFilter !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                시간: {getTimeFilterLabel(timeFilter)}
                <button
                  onClick={() => onTimeFilterChange('all')}
                  className="ml-1 hover:text-blue-900"
                >
                  <X size={12} />
                </button>
              </span>
            )}
            {attendanceFilter !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                참석: {getAttendanceFilterLabel(attendanceFilter)}
                <button
                  onClick={() => onAttendanceFilterChange('all')}
                  className="ml-1 hover:text-green-900"
                >
                  <X size={12} />
                </button>
              </span>
            )}
            {sortBy !== 'date_asc' && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                정렬: {getSortLabel(sortBy)}
                <button
                  onClick={() => onSortChange('date_asc')}
                  className="ml-1 hover:text-purple-900"
                >
                  <X size={12} />
                </button>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const getTimeFilterLabel = (filter: TimeFilter): string => {
  switch (filter) {
    case 'past': return '과거 모임';
    case 'future': return '미래 모임';
    case 'thisWeek': return '이번 주';
    case 'thisMonth': return '이번 달';
    default: return '전체';
  }
};

const getAttendanceFilterLabel = (filter: AttendanceFilter): string => {
  switch (filter) {
    case 'attending': return '참석';
    case 'not_attending': return '불참';
    case 'noResponse': return '미응답';
    default: return '전체';
  }
};

const getSortLabel = (sort: SortOption): string => {
  switch (sort) {
    case 'date_asc': return '날짜순 (빠른순)';
    case 'date_desc': return '날짜순 (늦은순)';
    case 'created': return '생성일순';
    case 'attendees': return '참석자 수순';
    default: return '날짜순 (빠른순)';
  }
};

export default MeetingFilter;

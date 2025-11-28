import React, { useState, useEffect, useMemo } from 'react';
import { Plus } from 'lucide-react';
import { StudyGroup } from '../types';
import { studyGroupAPI } from '../services/api';
import StudyGroupCard from './StudyGroupCard';
import StudyGroupCreateModal from './StudyGroupCreateModal';
import StudyGroupAdvancedSearch, { SearchFilters } from './StudyGroupAdvancedSearch';
import { notificationService } from '../services/notificationService';
import SkeletonLoading from './SkeletonLoading';
import ErrorDisplay from './ErrorDisplay';
import { useAuth } from '../contexts/AuthContext';
import { getUserDisplayName } from '../utils/userDisplayName';

interface StudyGroupListProps {
  onViewDetail?: (groupId: string) => void;
  onJoin?: (groupId: string) => void;
  currentUserId?: string;
  isAdmin?: boolean;
}

const StudyGroupList: React.FC<StudyGroupListProps> = ({
  onViewDetail,
  onJoin,
  currentUserId,
  isAdmin = false
}) => {
  const { user } = useAuth();
  const [groups, setGroups] = useState<StudyGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalGroups, setTotalGroups] = useState(0);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // 고급 검색 필터 상태
  const [filters, setFilters] = useState<SearchFilters>({
    searchTerm: '',
    category: '전체',
    location: '전체',
    memberCount: '전체',
    recruitmentStatus: '전체',
    onlineOnly: false
  });

  const loadStudyGroups = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await studyGroupAPI.getStudyGroups('all', currentPage, 9);
      
      // 새로운 API 응답 구조 처리
      if (response && typeof response === 'object' && 'groups' in response) {
        // 새로운 페이지네이션 API 응답
        setGroups(response.groups);
        setTotalPages(response.totalPages);
        setTotalGroups(response.total);
        console.log('새로운 API 응답:', response);
        console.log('총 개수:', response.total);
        console.log('총 페이지 수:', response.totalPages);
      } else {
        // 기존 API 응답 (호환성 유지)
        setGroups(response);
        setTotalGroups(response.length);
        if (response.length >= 9) {
          setTotalPages(Math.ceil(response.length / 9));
        } else {
          setTotalPages(1);
        }
        console.log('기존 API 응답:', response);
      }
    } catch (err) {
      console.error('스터디 그룹 로드 오류:', err);
      setError('스터디 그룹을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudyGroups();
  }, [currentPage]);

  const handleJoin = async (groupId: string) => {
    if (!currentUserId) {
      alert('로그인이 필요합니다.');
      return;
    }

    try {
      const result = await studyGroupAPI.joinStudyGroup(groupId, {
        userId: currentUserId,
        userName: getUserDisplayName(user) // 사용자 표시 이름 사용
      });
      
      if (result.success) {
        alert('스터디 그룹에 가입되었습니다!');
        loadStudyGroups(); // 목록 새로고침
        
        // 그룹장에게 새로운 멤버 가입 알림 전송
        const group = groups.find(g => g.id === groupId);
        console.log('=== 알림 생성 디버깅 시작 ===');
        console.log('그룹 정보:', group);
        console.log('현재 사용자:', currentUserId);
        console.log('그룹 ID:', groupId);
        
        if (group && currentUserId) {
          console.log('그룹장 정보:', group.leader);
          console.log('그룹명:', group.name);
          
          // 직접 알림 생성 테스트
          try {
            const notification = notificationService.createStudyGroupNotification(
              group.leader,
              'member_join',
              group.id,
              group.name,
              '새로운 멤버가 가입했습니다.'
            );
            
            console.log('✅ 알림 생성 성공:', notification);
            
            // 즉시 알림 확인
            const userNotifications = notificationService.getUserNotifications(group.leader);
            console.log('그룹장의 알림 목록:', userNotifications);
            
          } catch (error) {
            console.error('❌ 알림 생성 실패:', error);
          }
        } else {
          console.log('❌ 알림 생성 조건 불만족');
          console.log('- 그룹 찾음:', !!group);
          console.log('- 현재 사용자 있음:', !!currentUserId);
        }
        console.log('=== 알림 생성 디버깅 끝 ===');
      } else {
        alert(result.message);
      }
    } catch (err) {
      console.error('가입 오류:', err);
      alert('가입 중 오류가 발생했습니다.');
    }
  };



  const handleCreateSuccess = () => {
    loadStudyGroups(); // 목록 새로고침
    alert('스터디 그룹이 성공적으로 생성되었습니다!');
  };

  const handleDelete = async (groupId: string) => {
    if (!isAdmin) {
      alert('관리자만 삭제할 수 있습니다.');
      return;
    }

    try {
      await studyGroupAPI.deleteStudyGroup(groupId);
      alert('스터디 그룹이 삭제되었습니다.');
      loadStudyGroups(); // 목록 새로고침
    } catch (err) {
      console.error('삭제 오류:', err);
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  // 고급 검색 및 필터링
  const filteredGroups = useMemo(() => {
    return groups.filter(group => {
      const searchLower = filters.searchTerm.toLowerCase();
      
      // 1. 검색어 필터링
      const searchMatch = !filters.searchTerm || 
        group.name.toLowerCase().includes(searchLower) ||
        group.description.toLowerCase().includes(searchLower) ||
        group.category.toLowerCase().includes(searchLower) ||
        (group.description.match(/#\w+/g) || []).some(tag => 
          tag.toLowerCase().includes(searchLower)
        );
      
      // 2. 카테고리 필터링
      const categoryMatch = filters.category === '전체' || group.category === filters.category;
      
      // 3. 지역 필터링 (태그 기반)
      const locationMatch = (() => {
        if (filters.location === '전체') return true;
        
        // 설명에서 지역 태그 추출
        const locationTags = group.description.match(/📍 지역: (.+)/);
        if (!locationTags) return false;
        
        const tags = locationTags[1].split(', ').map(tag => tag.trim());
        
        if (filters.location === '온라인') {
          return tags.includes('온라인');
        } else {
          return tags.includes(filters.location);
        }
      })();
      
      // 4. 인원수 필터링
      const memberCountMatch = (() => {
        if (filters.memberCount === '전체') return true;
        const currentMembers = group.members.length;
        const maxMembers = group.maxMembers;
        
        switch (filters.memberCount) {
          case '1-5명': return maxMembers <= 5;
          case '6-10명': return maxMembers >= 6 && maxMembers <= 10;
          case '11-15명': return maxMembers >= 11 && maxMembers <= 15;
          case '16-20명': return maxMembers >= 16 && maxMembers <= 20;
          case '21명 이상': return maxMembers >= 21;
          default: return true;
        }
      })();
      
      // 5. 모집 상태 필터링
      const recruitmentMatch = (() => {
        if (filters.recruitmentStatus === '전체') return true;
        const currentMembers = group.members.length;
        const maxMembers = group.maxMembers;
        const isFull = currentMembers >= maxMembers;
        
        switch (filters.recruitmentStatus) {
          case '모집 중': return !isFull;
          case '모집 완료': return isFull;
          case '모집 예정': return false; // 현재는 미구현
          default: return true;
        }
      })();
      
      // 6. 온라인 전용 필터링 (태그 기반)
      const onlineMatch = (() => {
        if (!filters.onlineOnly) return true;
        
        // 설명에서 지역 태그 추출
        const locationTags = group.description.match(/📍 지역: (.+)/);
        if (!locationTags) return false;
        
        const tags = locationTags[1].split(', ').map(tag => tag.trim());
        return tags.includes('온라인');
      })();
      
      return searchMatch && categoryMatch && locationMatch && memberCountMatch && recruitmentMatch && onlineMatch;
    });
  }, [groups, filters]);

  if (loading) {
    return (
      <div className="space-y-6 bg-gray-50 p-4 sm:p-6 rounded-lg">
        {/* 헤더 스켈레톤 */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
            <div className="h-6 bg-gray-200 rounded w-24 animate-pulse"></div>
          </div>
          <div className="h-12 bg-gray-200 rounded w-32 animate-pulse"></div>
        </div>

        {/* 검색 필터 스켈레톤 */}
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="h-10 bg-gray-200 rounded animate-pulse"></div>
            ))}
          </div>
        </div>

        {/* 카드 스켈레톤 */}
        <SkeletonLoading type="card" count={6} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6 bg-gray-50 p-4 sm:p-6 rounded-lg">
        {/* 헤더 */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold text-gray-900">📚 스터디 모임</h2>
          </div>
        </div>

        {/* 에러 표시 */}
        <ErrorDisplay
          title="스터디 그룹을 불러올 수 없습니다"
          message={error}
          onRetry={loadStudyGroups}
          showHomeButton={true}
          onGoHome={() => window.location.reload()}
        />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6 bg-gray-50 p-4 sm:p-6 rounded-lg">
        {/* 헤더 */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold text-gray-900">📚 스터디 모임</h2>
                         <span className="text-sm text-gray-500 bg-white px-3 py-1 rounded-full">
               총 {totalGroups}개의 그룹
             </span>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-sky-600 text-white px-4 sm:px-6 py-3 rounded-lg hover:bg-sky-600/80 transition-colors font-medium shadow-sm min-h-[44px] touch-manipulation button-press"
          >
            <Plus size={18} />
            모집하기
          </button>
        </div>

        {/* 고급 검색 */}
        <StudyGroupAdvancedSearch
          filters={filters}
          onFiltersChange={setFilters}
          onClearFilters={() => setFilters({
            searchTerm: '',
            category: '전체',
            location: '전체',
            memberCount: '전체',
            recruitmentStatus: '전체',
            onlineOnly: false
          })}
        />

        {/* 스터디 그룹 목록 */}
                          {filteredGroups.length > 0 ? (
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
             {filteredGroups.map((group, index) => (
               <div
                 key={group.id}
                 className="animate-fade-in-up"
                 style={{
                   animationDelay: `${index * 100}ms`,
                   animationFillMode: 'both'
                 }}
               >
                 <StudyGroupCard
                   group={group}
                   onJoin={handleJoin}
                   onViewDetail={onViewDetail}
                   onDelete={handleDelete}
                   currentUserId={currentUserId}
                   isAdmin={isAdmin}
                 />
               </div>
             ))}
           </div>
                 ) : (
           <div className="text-center py-16 bg-white rounded-lg border border-gray-200 animate-bounce-in">
             <div className="max-w-md mx-auto">
               {/* 아이콘 */}
               <div className="flex justify-center mb-6">
                 <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center">
                   <span className="text-3xl">📚</span>
                 </div>
               </div>
               
               {/* 메시지 */}
               <h3 className="text-xl font-semibold text-gray-900 mb-2">
                 {filters.searchTerm || filters.category !== '전체' || filters.location !== '전체' || filters.memberCount !== '전체' || filters.recruitmentStatus !== '전체' || filters.onlineOnly
                   ? '검색 결과가 없습니다' 
                   : '아직 스터디 그룹이 없어요'
                 }
               </h3>
               
               <p className="text-gray-600 mb-6">
                 {filters.searchTerm || filters.category !== '전체' || filters.location !== '전체' || filters.memberCount !== '전체' || filters.recruitmentStatus !== '전체' || filters.onlineOnly
                   ? '다른 검색 조건을 시도해보세요.'
                   : '첫 번째 스터디 그룹을 만들어보세요!'
                 }
               </p>
               
               {/* 액션 버튼 */}
               {!filters.searchTerm && filters.category === '전체' && filters.location === '전체' && filters.memberCount === '전체' && filters.recruitmentStatus === '전체' && !filters.onlineOnly && (
                 <button
                   onClick={() => setShowCreateModal(true)}
                   className="inline-flex items-center gap-2 px-6 py-3 bg-sky-600 text-white rounded-lg hover:bg-sky-600/80 transition-colors font-medium"
                 >
                   <Plus size={18} />
                   스터디 그룹 만들기
                 </button>
               )}
               
               {/* 필터 초기화 버튼 */}
               {(filters.searchTerm || filters.category !== '전체' || filters.location !== '전체' || filters.memberCount !== '전체' || filters.recruitmentStatus !== '전체' || filters.onlineOnly) && (
                 <button
                   onClick={() => setFilters({
                     searchTerm: '',
                     category: '전체',
                     location: '전체',
                     memberCount: '전체',
                     recruitmentStatus: '전체',
                     onlineOnly: false
                   })}
                   className="inline-flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 underline font-medium"
                 >
                   필터 초기화
                 </button>
               )}
             </div>
           </div>
         )}

                                   {/* 페이지네이션 */}
          {totalPages > 1 && (
           <div className="px-4 sm:px-6 py-4 border-t border-gray-200">
             <div className="flex items-center justify-center gap-1 sm:gap-2">
               <button 
                   onClick={() => setCurrentPage(Math.max(1, currentPage - 5))}
                   disabled={currentPage <= 5}
                   className={`px-3 py-2 border border-gray-300 rounded text-sm transition-colors bg-gray-100 ${
                     currentPage <= 5
                       ? 'text-gray-400 cursor-not-allowed' 
                       : 'text-gray-700 hover:bg-gray-200 hover:border-gray-400'
                   }`}
               >
                 이전
               </button>
               
                 {(() => {
                   const pagesPerGroup = 5;
                   const currentGroup = Math.ceil(currentPage / pagesPerGroup);
                   const startPage = (currentGroup - 1) * pagesPerGroup + 1;
                   const endPage = Math.min(startPage + pagesPerGroup - 1, totalPages);

                   return Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);
                 })().map((page) => (
                   <button
                     key={page}
                     onClick={() => setCurrentPage(page)}
                     className={`px-3 py-2 border border-gray-300 rounded text-sm transition-colors ${
                       page === currentPage
                         ? 'bg-sky-600 text-white border-sky-600'
                         : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:border-gray-400'
                     }`}
                   >
                     {page}
                   </button>
                 ))}
                 
               <button 
                   onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 5))}
                   disabled={currentPage + 5 > totalPages}
                   className={`px-3 py-2 border border-gray-300 rounded text-sm transition-colors bg-gray-100 ${
                     currentPage + 5 > totalPages
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
                    {(currentPage - 1) * 9 + 1}-{Math.min(currentPage * 9, totalGroups)} / {totalGroups} 그룹
                  </span>
                </div>
           </div>
         )}
      </div>

      {/* 스터디 그룹 생성 모달 */}
      <StudyGroupCreateModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCreateSuccess}
        currentUserId={currentUserId}
      />
    </>
  );
};

export default StudyGroupList;

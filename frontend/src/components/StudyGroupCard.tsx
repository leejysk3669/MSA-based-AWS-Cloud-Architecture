import React from 'react';
import { MapPin, Calendar, Users, User, Clock, Code, Award, Languages, Briefcase, FolderOpen, Hash } from 'lucide-react';
import { StudyGroup } from '../types';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';

interface StudyGroupCardProps {
  group: StudyGroup;
  onJoin?: (groupId: string) => void;
  onViewDetail?: (groupId: string) => void;
  onDelete?: (groupId: string) => void;
  currentUserId?: string;
  isAdmin?: boolean;
}

const StudyGroupCard: React.FC<StudyGroupCardProps> = ({
  group,
  onJoin,
  onViewDetail,
  onDelete,
  currentUserId,
  isAdmin = false
}) => {
  const { elementRef, isVisible } = useIntersectionObserver({
    threshold: 0.1,
    rootMargin: '50px',
    triggerOnce: true
  });

  const isMember = group.members.some(member => member.userId === currentUserId);
  const isLeader = group.members.some(member => 
    member.userId === currentUserId && member.role === 'leader'
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      '프로그래밍': 'bg-blue-100 text-blue-700',
      '자격증': 'bg-green-100 text-green-700',
      '언어': 'bg-purple-100 text-purple-700',
      '취업준비': 'bg-orange-100 text-orange-700',
      '프로젝트': 'bg-red-100 text-red-700',
      '기타': 'bg-gray-100 text-gray-700'
    };
    return colors[category] || colors['기타'];
  };

  const getCategoryIcon = (category: string) => {
    const icons: { [key: string]: React.ReactNode } = {
      '프로그래밍': <Code size={12} />,
      '자격증': <Award size={12} />,
      '언어': <Languages size={12} />,
      '취업준비': <Briefcase size={12} />,
      '프로젝트': <FolderOpen size={12} />,
      '기타': <Hash size={12} />
    };
    return icons[category] || icons['기타'];
  };

  // 스터디 그룹에서 태그 추출 (카테고리와 관련 키워드)
  const getTags = () => {
    const tags = [group.category];
    
    // 설명에서 키워드 추출 (간단한 예시)
    const keywords = group.description.match(/#\w+/g);
    if (keywords) {
      tags.push(...keywords.map(k => k.substring(1)));
    }
    
    // 중복 제거
    return [...new Set(tags)];
  };

  // 지역 태그 추출
  const getLocationTags = () => {
    const locationMatch = group.description.match(/📍 지역: (.+)/);
    if (locationMatch) {
      return locationMatch[1].split(', ').map(tag => tag.trim());
    }
    return [];
  };

    return (
    <div
      ref={elementRef as React.RefObject<HTMLDivElement>}
      className={`bg-white border border-gray-200 rounded-lg p-4 sm:p-6 hover-lift transition-all duration-700 shadow-sm cursor-pointer ${
        isVisible 
          ? 'opacity-100 translate-y-0' 
          : 'opacity-0 translate-y-8'
      }`}
      onClick={() => onViewDetail?.(group.id)}
    >
      <div className="flex items-start justify-between mb-4 gap-3">
                 <h4 
           className="font-semibold text-gray-900 flex-1 text-base sm:text-lg break-words line-clamp-2 min-h-[3rem] overflow-hidden"
         >
           {group.name}
         </h4>
        {/* 모집 상태 */}
        <span className={`px-3 py-1 rounded-full text-xs font-medium flex-shrink-0 ${
          group.currentMembers >= group.maxMembers 
            ? 'bg-red-100 text-red-700' 
            : 'bg-green-100 text-green-700'
        }`}>
          {group.currentMembers >= group.maxMembers ? '모집완료' : '모집중'}
        </span>
      </div>
      
             <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 text-sm text-gray-600 mb-4">
        <span className="flex items-center gap-2">
          <Calendar size={16} className="text-gray-400" />
          <span className="font-medium">{formatDate(group.createdAt)}</span>
        </span>
        <span className="flex items-center gap-2">
          <Users size={16} className="text-gray-400" />
          <span className="font-medium">{group.currentMembers}/{group.maxMembers}명</span>
        </span>
      </div>
      

      
      {/* 태그 섹션 */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {/* 카테고리 태그 */}
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getCategoryColor(group.category)} flex items-center gap-1`}>
          {getCategoryIcon(group.category)}
          {group.category}
        </span>
        
        {/* 지역 태그 */}
        {getLocationTags().map((tag, index) => (
          <span key={index} className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1">
            <MapPin size={12} />
            {tag}
          </span>
        ))}
        
        {/* 일반 태그 (해시태그) */}
        {getTags().filter(tag => tag !== group.category).map((tag, index) => (
          <span key={index} className="bg-gray-100 text-gray-700 text-xs px-3 py-1 rounded-full font-medium">
            #{tag}
          </span>
        ))}
      </div>
      
             <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-2">
         <div className="flex items-center gap-2">
           <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-700 font-medium">
             👑 {group.leader}
           </span>
         </div>
         
                  <div className="flex flex-wrap gap-2">
           {/* 관리자 삭제 버튼 */}
           {isAdmin && (
             <button
               onClick={(e) => {
                 e.stopPropagation();
                 if (confirm(`"${group.name}" 스터디 그룹을 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`)) {
                   onDelete?.(group.id);
                 }
               }}
                               className="text-xs sm:text-sm bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 hover:scale-105 transition-all duration-200 font-medium min-h-[36px] touch-manipulation button-press"
               title="스터디 그룹 삭제"
             >
               삭제
             </button>
           )}
           

         </div>
      </div>
    </div>
  );
};

export default StudyGroupCard;

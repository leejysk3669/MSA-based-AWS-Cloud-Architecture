import React from 'react';
import { Settings } from 'lucide-react';

interface UserDisplayWithIconProps {
  username: string;
  authorId?: string;
  currentUser?: any;
}

/**
 * 관리자 아이콘과 함께 사용자명을 표시하는 React 컴포넌트
 */
export const UserDisplayWithIcon: React.FC<UserDisplayWithIconProps> = ({ 
  username, 
  authorId, 
  currentUser 
}) => {
  // 현재 로그인한 사용자가 admin 그룹에 속하고, 게시글 작성자가 본인인 경우 관리자 아이콘 표시
  const showAdminIcon = currentUser && 
                       currentUser.groups && 
                       Array.isArray(currentUser.groups) &&
                       currentUser.groups.includes('admin') && 
                       authorId && 
                       currentUser.sub === authorId;
  
  return (
    <span className="flex items-center gap-1">
      {showAdminIcon && <Settings size={14} className="text-gray-600" />}
      <span>{username}</span>
    </span>
  );
};

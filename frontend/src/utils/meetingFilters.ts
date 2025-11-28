import { Meeting, MeetingAttendee } from '../services/api';
import { TimeFilter, AttendanceFilter, SortOption } from '../components/MeetingFilter';

// 시간 필터링 함수
export const filterByTime = (meetings: Meeting[], timeFilter: TimeFilter): Meeting[] => {
  const now = new Date();
  
  switch (timeFilter) {
    case 'past':
      return meetings.filter(meeting => new Date(meeting.date) < now);
    
    case 'future':
      return meetings.filter(meeting => new Date(meeting.date) > now);
    
    case 'thisWeek':
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);
      
      return meetings.filter(meeting => {
        const meetingDate = new Date(meeting.date);
        return meetingDate >= startOfWeek && meetingDate <= endOfWeek;
      });
    
    case 'thisMonth':
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      
      return meetings.filter(meeting => {
        const meetingDate = new Date(meeting.date);
        return meetingDate >= startOfMonth && meetingDate <= endOfMonth;
      });
    
    default:
      return meetings;
  }
};

// 참석 상태 필터링 함수
export const filterByAttendance = (
  meetings: Meeting[], 
  attendanceFilter: AttendanceFilter,
  currentUserId: string,
  attendeesMap: Map<string, MeetingAttendee[]>
): Meeting[] => {
  if (attendanceFilter === 'all') {
    return meetings;
  }

  return meetings.filter(meeting => {
    const attendees = attendeesMap.get(meeting.id) || [];
    const myAttendance = attendees.find(attendee => attendee.userId === currentUserId);
    
    if (attendanceFilter === 'noResponse') {
      return !myAttendance;
    }
    
    return myAttendance?.status === attendanceFilter;
  });
};

// 정렬 함수
export const sortMeetings = (meetings: Meeting[], sortBy: SortOption): Meeting[] => {
  const sortedMeetings = [...meetings];
  
  switch (sortBy) {
    case 'date_asc':
      return sortedMeetings.sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );
    
    case 'date_desc':
      return sortedMeetings.sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
    
    case 'created':
      return sortedMeetings.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    
    case 'attendees':
      return sortedMeetings.sort((a, b) => 
        b.attendees.length - a.attendees.length
      );
    
    default:
      return sortedMeetings;
  }
};

// 통합 필터링 및 정렬 함수
export const filterAndSortMeetings = (
  meetings: Meeting[],
  timeFilter: TimeFilter,
  attendanceFilter: AttendanceFilter,
  sortBy: SortOption,
  currentUserId: string,
  attendeesMap: Map<string, MeetingAttendee[]>
): Meeting[] => {
  let filteredMeetings = meetings;
  
  // 시간 필터 적용
  filteredMeetings = filterByTime(filteredMeetings, timeFilter);
  
  // 참석 상태 필터 적용
  filteredMeetings = filterByAttendance(filteredMeetings, attendanceFilter, currentUserId, attendeesMap);
  
  // 정렬 적용
  filteredMeetings = sortMeetings(filteredMeetings, sortBy);
  
  return filteredMeetings;
};

// 필터 통계 계산
export const getFilterStats = (
  meetings: Meeting[],
  timeFilter: TimeFilter,
  attendanceFilter: AttendanceFilter,
  currentUserId: string,
  attendeesMap: Map<string, MeetingAttendee[]>
) => {
  const timeFiltered = filterByTime(meetings, timeFilter);
  const attendanceFiltered = filterByAttendance(timeFiltered, attendanceFilter, currentUserId, attendeesMap);
  
  return {
    total: meetings.length,
    timeFiltered: timeFiltered.length,
    finalFiltered: attendanceFiltered.length
  };
};

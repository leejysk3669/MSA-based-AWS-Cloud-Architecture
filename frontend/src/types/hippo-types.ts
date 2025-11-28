// types/index.ts
export type BoardKey = "notice" | "free" | "jobs" | "reviews" | "counsel";

export const BOARD_LIST: { key: BoardKey; label: string }[] = [
  { key: "notice", label: "공지사항" },
  { key: "free", label: "자유게시판" },
  { key: "jobs", label: "채용공고 게시판" },
  { key: "reviews", label: "취업 후기·면접" },
  { key: "counsel", label: "진로 상담" },
];

export interface Post {
  id: number;
  board: BoardKey;
  title: string;
  content: string;
  author: string;
  time: string;
  views: number;
  comments: Comment[];
  likes: number;
  isHot: boolean;
}

export interface Comment {
  id: number;
  author: string;
  text: string;
  time: string;
}

export interface Study {
  id: number;
  title: string;
  location: string;
  type: string;
  members: string;
  date: string;
  tags: string[];
}
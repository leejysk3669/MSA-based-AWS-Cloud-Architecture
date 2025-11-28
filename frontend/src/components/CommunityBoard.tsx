import React, { useState, useEffect } from 'react';
import { postAPI, commentAPI, categoryAPI, Post, Comment, Category } from '../services/api';
import { getPostAuthorDisplayName } from '../utils/userDisplayName';
import { UserDisplayWithIcon } from './UserDisplayWithIcon';
import { useAuth } from '../contexts/AuthContext';

const CommunityBoard: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [showPostForm, setShowPostForm] = useState<boolean>(false);
  const [showCommentForm, setShowCommentForm] = useState<boolean>(false);

  // 게시글 목록 조회
  const fetchPosts = async () => {
    try {
      setLoading(true);
      const data = await postAPI.getPosts(selectedCategory);
      setPosts(data.posts); // posts 배열만 추출
      setError('');
    } catch (err) {
      setError('게시글을 불러오는데 실패했습니다.');
      console.error('게시글 조회 오류:', err);
    } finally {
      setLoading(false);
    }
  };

  // 카테고리 목록 조회
  const fetchCategories = async () => {
    try {
      const data = await categoryAPI.getCategories();
      setCategories(data);
    } catch (err) {
      console.error('카테고리 조회 오류:', err);
    }
  };

  // 댓글 목록 조회
  const fetchComments = async (postId: string) => {
    try {
      const data = await commentAPI.getComments(postId);
      setComments(data);
    } catch (err) {
      console.error('댓글 조회 오류:', err);
    }
  };

  // 게시글 상세 조회
  const handlePostClick = async (post: Post) => {
    try {
      const detailedPost = await postAPI.getPostById(post.id);
      setSelectedPost(detailedPost);
      await fetchComments(post.id);
    } catch (err) {
      console.error('게시글 상세 조회 오류:', err);
    }
  };

  // 카테고리 변경
  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [selectedCategory]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        {error}
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">커뮤니티 게시판</h1>
        
        {/* 카테고리 필터 */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => handleCategoryChange('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedCategory === 'all'
                ? 'bg-sky-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            전체
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => handleCategoryChange(category.name)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedCategory === category.name
                  ? 'bg-sky-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>

        {/* 게시글 작성 버튼 */}
        <button
          onClick={() => setShowPostForm(true)}
          className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors mb-6"
        >
          게시글 작성
        </button>
      </div>

      {/* 게시글 목록 */}
      <div className="grid gap-4">
        {posts.map((post) => {

          
          return (
            <div
              key={post.id}
              className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => handlePostClick(post)}
            >
              <div className="flex justify-between items-start mb-3">
                <h2 className="text-xl font-semibold text-gray-800">{post.title}</h2>
                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                  {post.category}
                </span>
              </div>
              <p className="text-gray-600 mb-4 line-clamp-3">{post.content}</p>
              <div className="flex justify-between items-center text-sm text-gray-500">
                <div className="flex items-center gap-4">
                  <span>작성자: <UserDisplayWithIcon 
                  username={post.author} 
                  authorId={post.authorId} 
                  currentUser={currentUser} 
                /></span>
                  <span>조회수: {post.viewCount}</span>
                  <span>댓글: {post.commentCount}</span>
                </div>
                <span>{new Date(post.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 게시글이 없을 때 */}
      {posts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">게시글이 없습니다.</p>
        </div>
      )}

      {/* 게시글 상세 모달 */}
      {selectedPost && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold text-gray-800">{selectedPost.title}</h2>
                <button
                  onClick={() => setSelectedPost(null)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>
              
              <div className="mb-4">
                <span className="bg-blue-100 text-blue-800 text-sm px-2 py-1 rounded">
                  {selectedPost.category}
                </span>
              </div>
              
              <div className="prose max-w-none mb-6">
                <p className="text-gray-700 whitespace-pre-wrap">{selectedPost.content}</p>
              </div>
              
              <div className="flex justify-between items-center text-sm text-gray-500 mb-6">
                <div className="flex items-center gap-4">
                  <span>작성자: <UserDisplayWithIcon 
                  username={selectedPost.author} 
                  authorId={selectedPost.authorId} 
                  currentUser={currentUser} 
                /></span>
                  <span>조회수: {selectedPost.viewCount}</span>
                  <span>댓글: {selectedPost.commentCount}</span>
                </div>
                <span>작성일: {new Date(selectedPost.createdAt).toLocaleString()}</span>
              </div>

              {/* 댓글 섹션 */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">댓글</h3>
                
                {/* 댓글 목록 */}
                <div className="space-y-4 mb-6">
                  {comments.map((comment) => (
                    <div key={comment.id} className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-medium text-gray-800">{comment.author}</span>
                        <span className="text-sm text-gray-500">
                          {new Date(comment.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-gray-700">{comment.content}</p>
                    </div>
                  ))}
                </div>

                {/* 댓글 작성 버튼 */}
                <button
                  onClick={() => setShowCommentForm(true)}
                  className="bg-sky-500 text-white px-4 py-2 rounded-lg hover:bg-sky-500/80 transition-colors"
                >
                  댓글 작성
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommunityBoard;

import React from 'react';
import { Heart } from 'lucide-react';
import { useBookmarks, useToggleBookmark } from '../../hooks/useBookmarks';
import { useAuth } from '../../contexts/AuthContext';

export const BookmarkButton = ({ courseId, className = '' }) => {
  const { user } = useAuth();
  const { data: bookmarkedCourses = [] } = useBookmarks();
  const toggleMutation = useToggleBookmark();

  if (!user || user.role !== 'LEARNER') return null;

  const isBookmarked = bookmarkedCourses.some(
    (c) => Number(c.id) === Number(courseId)
  );

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleMutation.mutate({ courseId: Number(courseId), isBookmarked });
  };

  return (
    <button
      onClick={handleClick}
      disabled={toggleMutation.isPending}
      title={isBookmarked ? 'Remove bookmark' : 'Save course'}
      className={`p-2 rounded-xl transition-all flex items-center justify-center transform active:scale-95 ${
        isBookmarked
          ? 'bg-rose-500/20 text-rose-400 hover:bg-rose-500/30'
          : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700'
      } ${className}`}
    >
      <Heart
        className={`w-4 h-4 transition-colors ${
          isBookmarked ? 'fill-rose-500 text-rose-500' : ''
        }`}
      />
    </button>
  );
};

export default BookmarkButton;

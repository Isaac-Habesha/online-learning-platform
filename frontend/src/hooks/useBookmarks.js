import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import bookmarkService from '../services/bookmarkService';
import { useAuth } from '../contexts/AuthContext';

export const useBookmarks = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['bookmarks'],
    queryFn: () => bookmarkService.getBookmarks(),
    enabled: !!user,
  });
};

export const useToggleBookmark = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ courseId, isBookmarked }) => {
      if (isBookmarked) {
        return await bookmarkService.removeBookmark(courseId);
      } else {
        return await bookmarkService.addBookmark(courseId);
      }
    },
    onMutate: async ({ courseId, isBookmarked }) => {
      await queryClient.cancelQueries({ queryKey: ['bookmarks'] });
      const previousBookmarks = queryClient.getQueryData(['bookmarks']);

      queryClient.setQueryData(['bookmarks'], (old = []) => {
        if (isBookmarked) {
          return old.filter((c) => c.id !== courseId);
        } else {
          return [{ id: courseId, is_bookmarked: true }, ...old];
        }
      });

      return { previousBookmarks };
    },
    onError: (err, variables, context) => {
      if (context?.previousBookmarks) {
        queryClient.setQueryData(['bookmarks'], context.previousBookmarks);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    },
  });
};

export default useBookmarks;

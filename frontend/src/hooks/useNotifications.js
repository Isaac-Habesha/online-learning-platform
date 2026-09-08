import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import notificationService from '../services/notificationService';

export const useNotifications = (socket) => {
  const queryClient = useQueryClient();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationService.getNotifications(),
    refetchInterval: 30000, // 30s polling fallback if socket disconnected
  });

  // Listen for realtime notifications
  useEffect(() => {
    if (!socket) return;

    const handleNewNotification = (notif) => {
      queryClient.setQueryData(['notifications'], (old) => {
        if (!old) return { unread_count: 1, results: [notif] };
        return {
          ...old,
          unread_count: (old.unread_count || 0) + 1,
          results: [notif, ...(old.results || [])],
        };
      });
    };

    socket.on('notification:new', handleNewNotification);

    return () => {
      socket.off('notification:new', handleNewNotification);
    };
  }, [socket, queryClient]);

  const markReadMutation = useMutation({
    mutationFn: (notifId) => notificationService.markRead(notifId),
    onSuccess: (res, notifId) => {
      queryClient.setQueryData(['notifications'], (old) => {
        if (!old) return old;
        return {
          ...old,
          unread_count: Math.max(0, (old.unread_count || 0) - 1),
          results: (old.results || []).map((n) =>
            n.id === notifId ? { ...n, is_read: true } : n
          ),
        };
      });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => notificationService.markAllRead(),
    onSuccess: () => {
      queryClient.setQueryData(['notifications'], (old) => {
        if (!old) return old;
        return {
          ...old,
          unread_count: 0,
          results: (old.results || []).map((n) => ({ ...n, is_read: true })),
        };
      });
    },
  });

  return {
    notifications: data?.results || [],
    unreadCount: data?.unread_count || 0,
    isLoading,
    refetch,
    markRead: markReadMutation.mutate,
    markAllRead: markAllReadMutation.mutate,
  };
};

export default useNotifications;

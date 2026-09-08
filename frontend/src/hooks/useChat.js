import { useEffect, useState } from 'react';
import { useQueryClient, useInfiniteQuery, useMutation } from '@tanstack/react-query';
import chatService from '../services/chatService';
import { useAuth } from '../contexts/AuthContext';

export const useChat = (conversationId, socket) => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [typingUser, setTypingUser] = useState(null);

  // 1. Paginated Message History via REST
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery({
    queryKey: ['chat', 'messages', conversationId],
    queryFn: ({ pageParam = 1 }) => chatService.getMessages(conversationId, pageParam),
    getNextPageParam: (lastPage) => {
      if (lastPage?.next) {
        try {
          const url = new URL(lastPage.next);
          return url.searchParams.get('page');
        } catch {
          return undefined;
        }
      }
      return undefined;
    },
    enabled: !!conversationId,
    staleTime: Infinity, // Rely on realtime socket updates
  });

  // 2. Realtime Socket Listeners
  useEffect(() => {
    if (!conversationId || !socket) return;

    // Join room
    socket.emit('conversation:join', { conversationId });

    // Mark messages read on join
    chatService.markRead(conversationId).catch(() => {});
    socket.emit('message:read', { conversationId });

    // Handle incoming messages
    const handleNewMessage = (newMsg) => {
      if (newMsg.conversation !== conversationId && String(newMsg.conversation) !== String(conversationId)) {
        return;
      }

      queryClient.setQueryData(['chat', 'messages', conversationId], (oldData) => {
        if (!oldData) return oldData;

        // Reconcile optimistic temp message if matching
        let replaced = false;
        const newPages = oldData.pages.map((page, idx) => {
          if (idx === 0) {
            const results = (page.results || []).map((m) => {
              if (m.tempId && (m.tempId === newMsg.tempId || m.id === newMsg.tempId)) {
                replaced = true;
                return newMsg;
              }
              return m;
            });

            if (!replaced && !results.some((m) => m.id === newMsg.id)) {
              return {
                ...page,
                results: [newMsg, ...results],
              };
            }
            return { ...page, results };
          }
          return page;
        });

        return { ...oldData, pages: newPages };
      });

      // Update conversations list latest message
      queryClient.invalidateQueries({ queryKey: ['chat', 'conversations'] });

      // Automatically mark as read if conversation is open
      if (newMsg.sender !== user?.id) {
        chatService.markRead(conversationId).catch(() => {});
        socket.emit('message:read', { conversationId });
      }
    };

    const handleTypingStart = ({ userId }) => {
      if (userId !== user?.id) {
        setTypingUser(userId);
      }
    };

    const handleTypingStop = ({ userId }) => {
      if (userId !== user?.id) {
        setTypingUser(null);
      }
    };

    const handleMessagesRead = () => {
      // Refresh messages or conversations if other party read
      queryClient.invalidateQueries({ queryKey: ['chat', 'conversations'] });
    };

    socket.on('message:new', handleNewMessage);
    socket.on('typing:start', handleTypingStart);
    socket.on('typing:stop', handleTypingStop);
    socket.on('messages:read', handleMessagesRead);

    return () => {
      socket.off('message:new', handleNewMessage);
      socket.off('typing:start', handleTypingStart);
      socket.off('typing:stop', handleTypingStop);
      socket.off('messages:read', handleMessagesRead);
    };
  }, [conversationId, socket, queryClient, user]);

  // 3. Optimistic Send Message Mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (text) => {
      const tempId = `temp-${Date.now()}`;
      if (socket && socket.connected) {
        socket.emit('message:send', {
          conversationId,
          body: text,
          tempId,
        });
        return { tempId, body: text };
      } else {
        // Fallback to REST API
        return await chatService.sendMessage(conversationId, text);
      }
    },
    onMutate: async (text) => {
      await queryClient.cancelQueries({ queryKey: ['chat', 'messages', conversationId] });
      const previousData = queryClient.getQueryData(['chat', 'messages', conversationId]);

      const tempId = `temp-${Date.now()}`;
      const optimisticMsg = {
        id: tempId,
        tempId,
        conversation: conversationId,
        sender: user?.id,
        sender_name: `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || user?.email,
        sender_role: user?.role,
        body: text,
        created_at: new Date().toISOString(),
        pending: true,
      };

      queryClient.setQueryData(['chat', 'messages', conversationId], (old) => {
        if (!old) {
          return {
            pageParams: [1],
            pages: [{ count: 1, results: [optimisticMsg] }],
          };
        }
        return {
          ...old,
          pages: old.pages.map((page, i) =>
            i === 0 ? { ...page, results: [optimisticMsg, ...(page.results || [])] } : page
          ),
        };
      });

      return { previousData };
    },
    onError: (err, text, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['chat', 'messages', conversationId], context.previousData);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['chat', 'conversations'] });
    },
  });

  const emitTyping = (isTyping) => {
    if (socket && socket.connected && conversationId) {
      socket.emit(isTyping ? 'typing:start' : 'typing:stop', { conversationId });
    }
  };

  const allMessages = data?.pages?.flatMap((p) => p.results || []) || [];

  return {
    messages: allMessages,
    sendMessage: sendMessageMutation.mutate,
    isSending: sendMessageMutation.isPending,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    typingUser,
    emitTyping,
  };
};

export default useChat;

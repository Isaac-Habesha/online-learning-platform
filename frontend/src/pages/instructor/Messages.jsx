import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  MessageSquare,
  Search,
  Send,
  Loader2,
  Sparkles,
  BookOpen,
  User,
  Megaphone,
  CheckCheck,
  Clock,
  ArrowLeft,
  Circle,
  Wifi,
  WifiOff,
  Filter,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import chatService from '../../services/chatService';
import courseService from '../../services/courseService';
import useSocket from '../../hooks/useSocket';
import { useChat } from '../../hooks/useChat';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Loader from '../../components/common/Loader';
import CreateAnnouncementModal from '../../components/notifications/CreateAnnouncementModal';

export const InstructorMessages = () => {
  const { user } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  const { socket, isConnected } = useSocket();

  // URL search params support: ?conversationId=X or ?courseId=Y&studentId=Z
  const initialConvId = searchParams.get('conversationId');
  const paramCourseId = searchParams.get('courseId');
  const paramStudentId = searchParams.get('studentId');

  const [selectedConversation, setSelectedConversation] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourseFilter, setSelectedCourseFilter] = useState('ALL');
  const [announcementModalOpen, setAnnouncementModalOpen] = useState(false);
  const [mobileThreadOpen, setMobileThreadOpen] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const [inputText, setInputText] = useState('');
  const typingTimerRef = useRef(null);

  // 1. Fetch instructor's conversations list
  const {
    data: conversations = [],
    isLoading: loadingConversations,
    refetch: refetchConversations,
  } = useQuery({
    queryKey: ['chat', 'conversations'],
    queryFn: chatService.getConversations,
    refetchInterval: 15000,
  });

  // 2. Fetch instructor's courses for the filter dropdown
  const { data: instructorCourses = [] } = useQuery({
    queryKey: ['instructor', 'courses'],
    queryFn: async () => {
      const res = await courseService.getCourses();
      const list = Array.isArray(res) ? res : res.results || [];
      return list.filter((c) => c.instructor === user?.id || !c.instructor || c.instructor_name === user?.full_name);
    },
  });

  // 3. Auto-select or create conversation from query params
  useEffect(() => {
    if (paramCourseId && paramStudentId) {
      chatService
        .createOrGetConversation(Number(paramCourseId), Number(paramStudentId))
        .then((conv) => {
          setSelectedConversation(conv);
          setMobileThreadOpen(true);
          queryClient.invalidateQueries({ queryKey: ['chat', 'conversations'] });
        })
        .catch(() => {
          toast.error('Failed to open chat thread with student.', 'Error');
        });
    } else if (initialConvId && conversations.length > 0) {
      const found = conversations.find((c) => String(c.id) === String(initialConvId));
      if (found) {
        setSelectedConversation(found);
        setMobileThreadOpen(true);
      }
    } else if (!selectedConversation && conversations.length > 0 && !mobileThreadOpen) {
      setSelectedConversation(conversations[0]);
    }
  }, [paramCourseId, paramStudentId, initialConvId, conversations]);

  // 4. Hook for active conversation messages and socket events
  const {
    messages,
    isLoading: loadingMessages,
    sendMessage,
    isSending,
    typingUser,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useChat(selectedConversation?.id, socket);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, typingUser]);

  // Handle typing indicator
  const handleInputChange = (e) => {
    setInputText(e.target.value);
    if (!socket || !selectedConversation) return;

    socket.emit('typing:start', {
      conversationId: selectedConversation.id,
      userId: user?.id,
    });

    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      socket.emit('typing:stop', {
        conversationId: selectedConversation.id,
        userId: user?.id,
      });
    }, 1500);
  };

  const handleSendMessage = (e) => {
    e?.preventDefault();
    if (!inputText.trim() || isSending || !selectedConversation) return;

    const text = inputText.trim();
    setInputText('');

    if (socket && selectedConversation) {
      socket.emit('typing:stop', {
        conversationId: selectedConversation.id,
        userId: user?.id,
      });
    }

    sendMessage(text);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Filter conversations by query and course
  const filteredConversations = conversations.filter((c) => {
    const matchesCourse =
      selectedCourseFilter === 'ALL' || String(c.course) === String(selectedCourseFilter);
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !searchQuery ||
      c.student_name?.toLowerCase().includes(q) ||
      c.course_title?.toLowerCase().includes(q) ||
      c.last_message?.body?.toLowerCase().includes(q);
    return matchesCourse && matchesSearch;
  });

  const totalUnread = conversations.reduce((acc, c) => acc + (c.unread_count || 0), 0);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 text-xs font-bold text-sky-400 uppercase tracking-wider">
            <MessageSquare className="w-4 h-4" />
            <span>Learner Support Center</span>
            <span className="text-slate-600">•</span>
            <span className="inline-flex items-center gap-1">
              {isConnected ? (
                <>
                  <Circle className="w-2 h-2 fill-emerald-400 text-emerald-400" />
                  <span className="text-emerald-400 font-semibold normal-case">Realtime Active</span>
                </>
              ) : (
                <>
                  <Circle className="w-2 h-2 fill-amber-400 text-amber-400" />
                  <span className="text-amber-400 font-semibold normal-case">Reconnecting...</span>
                </>
              )}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-3">
            <span>Student Messages</span>
            {totalUnread > 0 && (
              <span className="text-xs font-bold bg-sky-500 text-white px-2.5 py-0.5 rounded-full">
                {totalUnread} new
              </span>
            )}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            size="md"
            onClick={() => setAnnouncementModalOpen(true)}
            leftIcon={<Megaphone className="w-4 h-4" />}
          >
            Broadcast Announcement
          </Button>
        </div>
      </div>

      {/* Main Inbox Container */}
      <div className="glass-panel border border-slate-800 rounded-3xl overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[640px] max-h-[820px] shadow-2xl">
        {/* Left Column: Conversation Directory */}
        <div
          className={`md:col-span-4 border-r border-slate-800 flex flex-col bg-slate-900/40 ${
            mobileThreadOpen ? 'hidden md:flex' : 'flex'
          }`}
        >
          {/* Search & Course Filter */}
          <div className="p-4 border-b border-slate-800 space-y-3 bg-slate-950/40">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search students or courses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-900/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all"
              />
            </div>

            {instructorCourses.length > 1 && (
              <div className="flex items-center gap-2">
                <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <select
                  value={selectedCourseFilter}
                  onChange={(e) => setSelectedCourseFilter(e.target.value)}
                  className="w-full py-1.5 px-2.5 bg-slate-900/80 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-sky-500 cursor-pointer"
                >
                  <option value="ALL">All Courses ({instructorCourses.length})</option>
                  {instructorCourses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60">
            {loadingConversations ? (
              <div className="p-12 flex justify-center">
                <Loader message="Loading messages..." />
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-8 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-sky-500/10 text-sky-400 flex items-center justify-center mx-auto border border-sky-500/20">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-white">No Conversations Found</h4>
                  <p className="text-xs text-slate-400 max-w-xs mx-auto">
                    {searchQuery
                      ? 'No conversations match your search filter.'
                      : 'When enrolled students start chatting in classroom player, their threads will appear here!'}
                  </p>
                </div>
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const isSelected = selectedConversation?.id === conv.id;
                const unread = conv.unread_count || 0;
                const lastMsg = conv.last_message;

                return (
                  <button
                    key={conv.id}
                    type="button"
                    onClick={() => {
                      setSelectedConversation(conv);
                      setMobileThreadOpen(true);
                    }}
                    className={`w-full p-4 text-left flex items-start gap-3.5 transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-sky-500/10 border-l-4 border-sky-500'
                        : 'hover:bg-slate-800/40 border-l-4 border-transparent'
                    }`}
                  >
                    {/* Student Avatar */}
                    <div className="relative shrink-0">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-md">
                        {conv.student_name?.charAt(0)?.toUpperCase() || 'S'}
                      </div>
                      {unread > 0 && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-sky-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-slate-900">
                          {unread}
                        </span>
                      )}
                    </div>

                    {/* Meta info */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <h4
                          className={`text-sm truncate ${
                            unread > 0 ? 'font-black text-white' : 'font-semibold text-slate-200'
                          }`}
                        >
                          {conv.student_name}
                        </h4>
                        {lastMsg?.created_at && (
                          <span className="text-[10px] text-slate-500 shrink-0">
                            {new Date(lastMsg.created_at).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-sky-400/90 truncate uppercase tracking-wider">
                          {conv.course_title}
                        </span>
                      </div>

                      <p
                        className={`text-xs truncate ${
                          unread > 0 ? 'text-slate-100 font-semibold' : 'text-slate-400'
                        }`}
                      >
                        {lastMsg?.body || 'Conversation started'}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Chat Feed & Active Conversation */}
        <div
          className={`md:col-span-8 flex flex-col bg-slate-950/70 ${
            !mobileThreadOpen ? 'hidden md:flex' : 'flex'
          }`}
        >
          {selectedConversation ? (
            <>
              {/* Active Conversation Header */}
              <div className="p-4 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    type="button"
                    onClick={() => setMobileThreadOpen(false)}
                    className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>

                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-md shrink-0">
                    {selectedConversation.student_name?.charAt(0)?.toUpperCase() || 'S'}
                  </div>

                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-white truncate flex items-center gap-2">
                      <span>{selectedConversation.student_name}</span>
                      <Badge variant="info">Student</Badge>
                    </h3>
                    <p className="text-xs text-sky-400 font-medium truncate flex items-center gap-1.5">
                      <BookOpen className="w-3 h-3" />
                      <span>{selectedConversation.course_title}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setAnnouncementModalOpen(true)}
                    leftIcon={<Megaphone className="w-3.5 h-3.5 text-sky-400" />}
                    className="hidden sm:inline-flex text-xs"
                  >
                    Post Course Notice
                  </Button>
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                {/* Infinite Pagination Trigger */}
                {hasNextPage && (
                  <div className="text-center pt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => fetchNextPage()}
                      disabled={isFetchingNextPage}
                      className="text-xs text-slate-400"
                    >
                      {isFetchingNextPage ? (
                        <span className="flex items-center gap-1.5">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Loading earlier messages...
                        </span>
                      ) : (
                        'Load earlier messages'
                      )}
                    </Button>
                  </div>
                )}

                {loadingMessages ? (
                  <div className="py-20 flex justify-center">
                    <Loader message="Loading discussion..." />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="py-20 text-center space-y-2">
                    <div className="w-12 h-12 rounded-2xl bg-sky-500/10 text-sky-400 flex items-center justify-center mx-auto border border-sky-500/20">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <h4 className="text-sm font-bold text-white">Start the conversation</h4>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto">
                      Send a warm reply or study tip to help {selectedConversation.student_name} succeed in their course!
                    </p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isInstructorSender = msg.sender === user?.id;
                    const isTemp = !!msg.tempId;

                    return (
                      <div
                        key={msg.id || msg.tempId}
                        className={`flex flex-col ${isInstructorSender ? 'items-end' : 'items-start'}`}
                      >
                        <div className="flex items-end gap-2 max-w-[85%] sm:max-w-[75%]">
                          {!isInstructorSender && (
                            <div className="w-7 h-7 rounded-lg bg-slate-800 text-sky-400 font-bold flex items-center justify-center text-xs shrink-0 mb-1 border border-slate-700">
                              {msg.sender_name?.charAt(0)?.toUpperCase() || 'S'}
                            </div>
                          )}

                          <div
                            className={`rounded-2xl px-4 py-2.5 text-sm shadow-md leading-relaxed whitespace-pre-wrap break-words ${
                              isInstructorSender
                                ? 'bg-gradient-to-r from-sky-500 to-indigo-600 text-white rounded-br-sm'
                                : 'bg-slate-800 text-slate-100 border border-slate-700/80 rounded-bl-sm'
                            } ${isTemp ? 'opacity-70' : ''}`}
                          >
                            {!isInstructorSender && (
                              <div className="text-[10px] font-bold text-sky-400 mb-0.5">
                                {msg.sender_name}
                              </div>
                            )}
                            <p>{msg.body}</p>
                          </div>
                        </div>

                        {/* Timestamp & status */}
                        <div
                          className={`flex items-center gap-1.5 text-[10px] text-slate-500 mt-1 px-1 ${
                            isInstructorSender ? 'mr-1' : 'ml-9'
                          }`}
                        >
                          {isTemp ? (
                            <span className="flex items-center gap-1 text-slate-400">
                              <Loader2 className="w-3 h-3 animate-spin" /> Sending...
                            </span>
                          ) : (
                            <>
                              <span>
                                {msg.created_at
                                  ? new Date(msg.created_at).toLocaleTimeString([], {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })
                                  : 'Just now'}
                              </span>
                              {isInstructorSender && (
                                <CheckCheck className="w-3.5 h-3.5 text-sky-400" />
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}

                {/* Typing Indicator */}
                {typingUser && (
                  <div className="flex items-center gap-2 text-xs text-sky-400 italic py-1">
                    <div className="flex gap-1 items-center px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700">
                      <span className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-bounce" />
                      <span className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                      <span className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                      <span className="ml-1.5 text-[11px] font-medium not-italic text-slate-300">
                        {selectedConversation.student_name} is typing...
                      </span>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Message Composer */}
              <div className="p-4 border-t border-slate-800 bg-slate-900/80">
                <form onSubmit={handleSendMessage} className="flex items-end gap-3">
                  <div className="flex-1 bg-slate-950 border border-slate-800 rounded-2xl p-2 focus-within:border-sky-500 focus-within:ring-1 focus-within:ring-sky-500 transition-all">
                    <textarea
                      ref={inputRef}
                      value={inputText}
                      onChange={handleInputChange}
                      onKeyDown={handleKeyDown}
                      placeholder={`Reply to ${selectedConversation.student_name}... (Enter to send)`}
                      rows={2}
                      className="w-full bg-transparent text-sm text-white placeholder-slate-500 resize-none focus:outline-none px-2 py-1 leading-relaxed"
                    />
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    disabled={!inputText.trim() || isSending}
                    isLoading={isSending}
                    className="h-12 w-12 !p-0 rounded-2xl shrink-0 flex items-center justify-center shadow-lg"
                  >
                    <Send className="w-5 h-5" />
                  </Button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-3">
              <div className="w-16 h-16 rounded-3xl bg-sky-500/10 text-sky-400 flex items-center justify-center border border-sky-500/20">
                <MessageSquare className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-white">Select a Student Conversation</h3>
              <p className="text-xs text-slate-400 max-w-sm">
                Choose a conversation from the left to view questions and give direct mentorship.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Announcement Modal */}
      <CreateAnnouncementModal
        isOpen={announcementModalOpen}
        onClose={() => setAnnouncementModalOpen(false)}
        preselectedCourse={
          selectedConversation
            ? { id: selectedConversation.course, title: selectedConversation.course_title }
            : null
        }
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['notifications'] });
        }}
      />
    </div>
  );
};

export default InstructorMessages;

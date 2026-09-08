import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, User, Loader2, Check, Clock, ChevronDown } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import chatService from '../../services/chatService';
import useSocket from '../../hooks/useSocket';
import useChat from '../../hooks/useChat';
import { useAuth } from '../../contexts/AuthContext';

export const SupportChatDrawer = ({ courseId = null, courseTitle = 'Course Support' }) => {
  const { user } = useAuth();
  const { socket, isConnected } = useSocket();
  const queryClient = useQueryClient();

  const [isOpen, setIsOpen] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Fetch user conversations
  const { data: conversations = [], isLoading: loadingConversations } = useQuery({
    queryKey: ['chat', 'conversations'],
    queryFn: () => chatService.getConversations(),
    enabled: isOpen && !!user,
  });

  // Calculate total unread count across conversations
  const totalUnread = conversations.reduce((sum, c) => sum + (c.unread_count || 0), 0);

  // Auto-select or create conversation when in a specific course
  useEffect(() => {
    if (isOpen && courseId && user) {
      chatService
        .createOrGetConversation(courseId)
        .then((conv) => {
          if (conv?.id) {
            setActiveConversationId(conv.id);
          }
        })
        .catch((err) => console.warn('Could not auto-open course conversation', err));
    } else if (isOpen && !activeConversationId && conversations.length > 0) {
      setActiveConversationId(conversations[0].id);
    }
  }, [isOpen, courseId, user, conversations.length]);

  const {
    messages,
    sendMessage,
    isSending,
    typingUser,
    emitTyping,
  } = useChat(activeConversationId, socket);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleInputChange = (e) => {
    setInputMessage(e.target.value);
    emitTyping(true);

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      emitTyping(false);
    }, 2000);
  };

  const handleSend = (e) => {
    e.preventDefault();
    const clean = inputMessage.trim();
    if (!clean || !activeConversationId) return;

    sendMessage(clean);
    setInputMessage('');
    emitTyping(false);
  };

  if (!user) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="relative group p-4 bg-gradient-to-tr from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white rounded-2xl shadow-xl shadow-sky-500/25 transition-all transform hover:-translate-y-1 active:translate-y-0 flex items-center gap-2 font-medium"
        >
          <MessageSquare className="w-6 h-6" />
          <span className="hidden sm:inline text-sm font-semibold">
            {user.role === 'INSTRUCTOR' ? 'Student Support' : 'Instructor Chat'}
          </span>
          {totalUnread > 0 && (
            <span className="absolute -top-1.5 -right-1.5 px-2 py-0.5 bg-rose-500 text-white text-[10px] font-black rounded-full border-2 border-slate-950 animate-bounce">
              {totalUnread}
            </span>
          )}
        </button>
      )}

      {/* Collapsible Chat Window */}
      {isOpen && (
        <div className="w-[360px] sm:w-[420px] h-[540px] bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <div className="px-4 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-9 h-9 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold text-sm">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <span
                  className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-slate-950 ${
                    isConnected ? 'bg-emerald-500' : 'bg-slate-500'
                  }`}
                  title={isConnected ? 'Realtime Connected' : 'Connecting/Offline'}
                />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white leading-none">
                  {courseTitle || 'Live Support Chat'}
                </h3>
                <p className="text-[11px] text-slate-400 mt-1">
                  {isConnected ? 'Realtime connected' : 'Connecting...'}
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Conversations Selector (if multiple exist) */}
          {conversations.length > 1 && (
            <div className="px-3 py-1.5 bg-slate-950/60 border-b border-slate-800 flex gap-1 overflow-x-auto text-xs">
              {conversations.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setActiveConversationId(c.id)}
                  className={`px-2.5 py-1 rounded-lg shrink-0 transition flex items-center gap-1.5 ${
                    activeConversationId === c.id
                      ? 'bg-sky-500 text-white font-semibold'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <span>{user.role === 'INSTRUCTOR' ? c.student_name : c.course_title?.slice(0, 16)}</span>
                  {c.unread_count > 0 && activeConversationId !== c.id && (
                    <span className="px-1.5 py-0.2 bg-rose-500 text-white text-[9px] font-bold rounded-full">
                      {c.unread_count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                <MessageSquare className="w-10 h-10 text-slate-600 mb-2" />
                <p className="text-xs font-semibold text-slate-300">No messages yet</p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Ask a question about this course or request support directly from your instructor.
                </p>
              </div>
            ) : (
              messages
                .slice()
                .reverse()
                .map((msg) => {
                  const isMe = msg.sender === user?.id;
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                    >
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mb-0.5 px-1">
                        <span>{isMe ? 'You' : msg.sender_name}</span>
                        {msg.sender_role === 'INSTRUCTOR' && (
                          <span className="px-1.5 py-0.2 bg-amber-500/20 text-amber-300 font-bold rounded">
                            Instructor
                          </span>
                        )}
                      </div>
                      <div
                        className={`max-w-[82%] px-3.5 py-2 rounded-2xl text-xs leading-relaxed ${
                          isMe
                            ? 'bg-sky-500 text-white rounded-tr-sm shadow-md'
                            : 'bg-slate-800 text-slate-100 rounded-tl-sm border border-slate-700/80'
                        }`}
                      >
                        <p>{msg.body}</p>
                      </div>
                      <div className="flex items-center gap-1 text-[9px] text-slate-500 mt-0.5 px-1">
                        <span>
                          {new Date(msg.created_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        {isMe && msg.pending && <Clock className="w-2.5 h-2.5 text-slate-400" />}
                        {isMe && !msg.pending && <Check className="w-2.5 h-2.5 text-sky-400" />}
                      </div>
                    </div>
                  );
                })
            )}
            {typingUser && (
              <div className="flex items-center gap-1.5 text-xs text-slate-400 italic px-2">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
                <span>Instructor is typing...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input Footer */}
          <form
            onSubmit={handleSend}
            className="p-3 bg-slate-950 border-t border-slate-800 flex items-center gap-2"
          >
            <input
              type="text"
              placeholder="Type your message..."
              value={inputMessage}
              onChange={handleInputChange}
              className="flex-1 px-3.5 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || isSending}
              className="p-2 bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white rounded-xl transition flex items-center justify-center shadow-md"
            >
              {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default SupportChatDrawer;

import React, { useState, useRef, useEffect } from 'react';
import { Bell, CheckCheck, BookOpen, MessageSquare, AlertCircle, X, ExternalLink } from 'lucide-react';
import useSocket from '../../hooks/useSocket';
import useNotifications from '../../hooks/useNotifications';
import { useAuth } from '../../contexts/AuthContext';

export const NotificationBell = () => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const {
    notifications,
    unreadCount,
    isLoading,
    markRead,
    markAllRead,
  } = useNotifications(socket);

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition"
        title="Notifications & Announcements"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-sky-500 text-white text-[10px] font-black rounded-full flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in duration-150">
          {/* Header */}
          <div className="px-4 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Announcements & Notices
              </span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 bg-sky-500/20 text-sky-400 font-bold text-[10px] rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                onClick={() => markAllRead()}
                className="text-[11px] text-slate-400 hover:text-sky-400 flex items-center gap-1 transition"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-800/60">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                <Bell className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                <p>No announcements or messages yet.</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => !n.is_read && markRead(n.id)}
                  className={`p-3.5 transition cursor-pointer flex gap-3 ${
                    n.is_read
                      ? 'bg-slate-900/60 opacity-80 hover:bg-slate-800/40'
                      : 'bg-sky-500/5 hover:bg-sky-500/10 border-l-2 border-sky-500'
                  }`}
                >
                  <div className="shrink-0 mt-0.5">
                    {n.type === 'INSTRUCTOR_MESSAGE' ? (
                      <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                        <MessageSquare className="w-4 h-4" />
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center">
                        <BookOpen className="w-4 h-4" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <h4 className="text-xs font-semibold text-white truncate">
                        {n.title}
                      </h4>
                      <span className="text-[10px] text-slate-500 shrink-0">
                        {new Date(n.created_at).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>

                    {n.course_title && (
                      <span className="text-[10px] font-medium text-sky-400 block mb-1">
                        Course: {n.course_title}
                      </span>
                    )}

                    <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                      {n.body}
                    </p>

                    <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400">
                      <span>By: {n.sender_name}</span>
                      {!n.is_read && (
                        <span className="text-sky-400 font-bold">• New</span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;

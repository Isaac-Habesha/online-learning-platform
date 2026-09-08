import api from './api';

export const chatService = {
  getConversations: async () => {
    const res = await api.get('/chat/conversations/');
    return res.data;
  },

  createOrGetConversation: async (courseId, studentId = null) => {
    const payload = { course_id: courseId };
    if (studentId) payload.student_id = studentId;
    const res = await api.post('/chat/conversations/', payload);
    return res.data;
  },

  getMessages: async (conversationId, page = 1) => {
    const res = await api.get(`/chat/conversations/${conversationId}/messages/?page=${page}`);
    return res.data;
  },

  sendMessage: async (conversationId, body) => {
    const res = await api.post(`/chat/conversations/${conversationId}/messages/`, { body });
    return res.data;
  },

  markRead: async (conversationId) => {
    const res = await api.post(`/chat/conversations/${conversationId}/read/`);
    return res.data;
  },
};

export default chatService;

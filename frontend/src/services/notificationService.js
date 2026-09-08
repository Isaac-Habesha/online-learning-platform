import api from './api';

export const notificationService = {
  getNotifications: async () => {
    const res = await api.get('/notifications/');
    return res.data;
  },

  createNotification: async ({ title, body, courseId, recipientId, type }) => {
    const payload = { title, body };
    if (courseId) payload.course_id = courseId;
    if (recipientId) payload.recipient_id = recipientId;
    if (type) payload.type = type;

    const res = await api.post('/notifications/', payload);
    return res.data;
  },

  markRead: async (notificationId) => {
    const res = await api.post(`/notifications/${notificationId}/read/`);
    return res.data;
  },

  markAllRead: async () => {
    const res = await api.post('/notifications/read-all/');
    return res.data;
  },
};

export default notificationService;

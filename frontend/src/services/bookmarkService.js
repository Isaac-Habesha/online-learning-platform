import api from './api';

export const bookmarkService = {
  getBookmarks: async () => {
    const res = await api.get('/courses/bookmarks/');
    return res.data;
  },

  addBookmark: async (courseId) => {
    const res = await api.post(`/courses/${courseId}/bookmark/`);
    return res.data;
  },

  removeBookmark: async (courseId) => {
    const res = await api.delete(`/courses/${courseId}/bookmark/`);
    return res.data;
  },
};

export default bookmarkService;
